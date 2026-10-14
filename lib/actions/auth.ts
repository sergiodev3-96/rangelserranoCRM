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

    // 2. Concatenate chunk values
    let raw = tokenCookies.map((c) => c.value).join("");
    if (raw.startsWith("base64-")) {
      raw = Buffer.from(raw.slice(7), "base64").toString("utf-8");
    }

    let parsed: Record<string, unknown> | unknown[] | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // not JSON directly
    }

    // 3. Check direct user object in session JSON
    if (parsed && typeof parsed === "object") {
      const userObj = (parsed as { user?: { id?: string } }).user;
      if (userObj?.id) {
        return userObj.id;
      }
      if (Array.isArray(parsed)) {
        const first = parsed[0] as { user?: { id?: string } } | undefined;
        if (typeof first === "object" && first?.user?.id) {
          return first.user.id;
        }
      }
    }

    // 4. Check JWT access_token
    let token: string | undefined = undefined;
    if (parsed && typeof parsed === "object") {
      if ("access_token" in parsed && typeof (parsed as { access_token?: unknown }).access_token === "string") {
        token = (parsed as { access_token: string }).access_token;
      } else if (Array.isArray(parsed) && typeof parsed[0] === "string") {
        token = parsed[0];
      }
    }
    if (!token && typeof raw === "string" && raw.includes(".")) {
      token = raw;
    }

    if (typeof token === "string" && token.includes(".")) {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
        const payload = JSON.parse(jsonPayload);
        if (payload?.sub) {
          const now = Math.floor(Date.now() / 1000);
          if (!payload.exp || payload.exp > now) {
            return payload.sub;
          }
        }
      }
    }
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

  // 3. Fallback to Supabase Auth getUser (makes network call, guarded against rate limit)
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!userError && user?.id) {
      return user.id;
    }
  } catch {}

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
