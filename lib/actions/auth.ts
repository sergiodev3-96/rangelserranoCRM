"use server";

import { cache } from "react";
import type { ActionResult } from "@/types/database";
import type { Profile } from "@/types/profiles";
import { createClient, createServiceClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

// Login con email y password
export async function login(
  email: string,
  password: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true, data: undefined, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al iniciar sesión",
    };
  }
}

// Logout
export async function logout(): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true, data: undefined, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al cerrar sesión",
    };
  }
}

// Helper to extract chunk index from Supabase cookie name (e.g. sb-xxx-auth-token.0)
function getChunkIndex(name: string): number {
  const parts = name.split("-auth-token.");
  if (parts.length > 1) {
    const num = parseInt(parts[1], 10);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

function extractSubFromJwt(jwt: string): string | null {
  try {
    if (!jwt || !jwt.includes(".")) return null;
    const parts = jwt.split(".");
    if (parts.length >= 2) {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
      const payload = JSON.parse(jsonPayload);
      if (payload?.sub && typeof payload.sub === "string") {
        return payload.sub;
      }
    }
  } catch {}
  return null;
}

// Extract user ID from session cookies without making Auth API network requests
export async function getUserIdFromSessionCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // 1. Filter and sort token cookies by chunk index
    const tokenCookies = allCookies
      .filter((c) => c.name.includes("-auth-token"))
      .sort((a, b) => getChunkIndex(a.name) - getChunkIndex(b.name));

    if (tokenCookies.length === 0) {
      return null;
    }

    // 2. Concatenate chunk values and decode
    let raw = tokenCookies.map((c) => c.value).join("");
    if (raw.includes("%")) {
      try {
        raw = decodeURIComponent(raw);
      } catch {}
    }
    if (raw.startsWith('"') && raw.endsWith('"')) {
      raw = raw.slice(1, -1);
    }
    if (raw.startsWith("base64-")) {
      try {
        raw = Buffer.from(raw.slice(7), "base64").toString("utf-8");
      } catch {}
    }

    // 3. Try parsing as JSON
    let parsed: Record<string, unknown> | unknown[] | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {}

    // Check direct user object or token in session JSON
    if (parsed && typeof parsed === "object") {
      if (!Array.isArray(parsed) && "user" in parsed) {
        const userObj = parsed.user as { id?: string } | undefined;
        if (userObj?.id) {
          return userObj.id;
        }
      }
      if (Array.isArray(parsed)) {
        const first = parsed[0];
        if (typeof first === "object" && first !== null && "user" in first) {
          const userObj = (first as { user?: { id?: string } }).user;
          if (userObj?.id) return userObj.id;
        }
        if (typeof first === "string") {
          const sub = extractSubFromJwt(first);
          if (sub) return sub;
        }
      }
      if (!Array.isArray(parsed) && "access_token" in parsed && typeof parsed.access_token === "string") {
        const sub = extractSubFromJwt(parsed.access_token);
        if (sub) return sub;
      }
    }

    // 4. Try extracting from raw string if it contains JWT or regex
    const jwtSub = extractSubFromJwt(raw);
    if (jwtSub) return jwtSub;

    // Fast regex match for UUID in "sub" or "id"
    const subMatch = raw.match(/"sub"\s*:\s*"([a-f0-9\-]{36})"/i);
    if (subMatch) return subMatch[1];

    const idMatch = raw.match(/"id"\s*:\s*"([a-f0-9\-]{36})"/i);
    if (idMatch) return idMatch[1];
  } catch {
    // Cookie parsing fallback
  }

  return null;
}

// Get user ID with zero network calls whenever possible, avoiding Supabase Auth rate limits
export async function getCurrentUserId(): Promise<string | null> {
  // 1. Fast local cookie inspection (0ms, 0 network requests)
  const cookieUserId = await getUserIdFromSessionCookies();
  if (cookieUserId) {
    return cookieUserId;
  }

  // 2. Supabase client getSession (local storage check in @supabase/ssr)
  try {
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user?.id) {
      return sessionData.session.user.id;
    }
  } catch {}

  // If no user ID can be found locally from cookies/session, user is not authenticated.
  // We NEVER call supabase.auth.getUser() here to prevent hitting Supabase rate limit (429).
  return null;
}

// Cached internal fetcher to deduplicate queries across layout and pages in the same request
const getCachedCurrentProfile = cache(async (): Promise<ActionResult<Profile>> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        data: null,
        error: "Usuario no autenticado",
      };
    }

    const supabase = await createClient();

    // Query profile from database (uses PostgREST, unaffected by Auth API rate limit)
    let { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // If RLS blocked or profile not found with anon client, query via service client
    if (profileError || !profile) {
      const serviceClient = createServiceClient();
      const res = await serviceClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      profile = res.data;
      profileError = res.error;
    }

    if (profileError || !profile) {
      return {
        success: false,
        data: null,
        error: profileError?.message || "Perfil no encontrado en la base de datos",
      };
    }

    return { success: true, data: profile as Profile, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al obtener perfil",
    };
  }
});

// Obtener perfil del usuario actual (deduplicado por petición)
export async function getCurrentProfile(): Promise<ActionResult<Profile>> {
  return getCachedCurrentProfile();
}
