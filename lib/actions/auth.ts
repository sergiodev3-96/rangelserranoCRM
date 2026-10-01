"use server";

import { cache } from "react";
import type { ActionResult } from "@/types/database";
import type { Profile } from "@/types/profiles";
import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";

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

import { cookies } from "next/headers";

// Cached internal fetcher to deduplicate queries across layout and pages in the same request
const getCachedCurrentProfile = cache(async (): Promise<ActionResult<Profile>> => {
  try {
    const supabase = await createClient();
    let userId: string | null = null;

    // 1. Try to get user from Supabase Auth
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!userError && user) {
        userId = user.id;
      } else if (
        userError?.message?.includes("rate limit") ||
        (userError as unknown as { status?: number })?.status === 429
      ) {
        console.warn("Supabase Auth rate limit reached on getUser(), using session/cookie fallback.");
      }
    } catch (authErr) {
      console.warn("Error calling auth.getUser():", authErr);
    }

    // 2. If getUser was rate limited or failed, fallback to getSession
    if (!userId) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          userId = sessionData.session.user.id;
        }
      } catch (sessionErr) {
        console.warn("Error calling auth.getSession():", sessionErr);
      }
    }

    // 3. Fallback: Parse user ID directly from session cookie if rate limited
    if (!userId) {
      try {
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();
        for (const c of allCookies) {
          if (c.name.includes("-auth-token")) {
            let val = c.value;
            if (val.startsWith("base64-")) {
              val = Buffer.from(val.slice(7), "base64").toString("utf-8");
            }
            try {
              const parsed = JSON.parse(val);
              if (parsed?.user?.id) {
                userId = parsed.user.id;
                break;
              }
              if (Array.isArray(parsed) && parsed[0]?.user?.id) {
                userId = parsed[0].user.id;
                break;
              }
              const token = parsed?.access_token || (Array.isArray(parsed) ? parsed[0] : null);
              if (typeof token === "string" && token.includes(".")) {
                const payloadPart = token.split(".")[1];
                const decoded = JSON.parse(Buffer.from(payloadPart, "base64").toString("utf-8"));
                if (decoded?.sub) {
                  userId = decoded.sub;
                  break;
                }
              }
            } catch {}
          }
        }
      } catch (cookieErr) {
        console.warn("Error parsing session cookie:", cookieErr);
      }
    }

    if (!userId) {
      return {
        success: false,
        data: null,
        error: "Usuario no autenticado",
      };
    }

    // Query profile from database (uses PostgREST, unaffected by Auth API rate limit)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

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
