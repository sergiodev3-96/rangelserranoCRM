"use server";

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

// Obtener perfil del usuario actual
export async function getCurrentProfile(): Promise<ActionResult<Profile>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        data: null,
        error: userError?.message || "Usuario no autenticado",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
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
}
