"use server";

import type { ActionResult } from "@/types/database";
import type { Profile, ProfileSummary, UserRole } from "@/types/profiles";
import { createClient, createServiceClient } from "../supabase/server";
import { getCurrentProfile } from "./auth";
import { revalidatePath } from "next/cache";

// Helper checking admin role
async function checkAdminAuth(): Promise<ActionResult<void>> {
  const profileRes = await getCurrentProfile();
  if (!profileRes.success || !profileRes.data) {
    return { success: false, data: null, error: "Usuario no autenticado." };
  }
  if (profileRes.data.role !== "admin") {
    return { success: false, data: null, error: "No autorizado. Se requieren permisos de administrador." };
  }
  return { success: true, data: undefined, error: null };
}

// Obtener comerciales activos (para dropdowns de asignación)
export async function getActiveComerciales(): Promise<
  ActionResult<ProfileSummary[]>
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, active")
      .eq("active", true);

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: (data || []) as ProfileSummary[], error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Error al obtener comerciales activos",
    };
  }
}

// Obtener todos los perfiles de usuario (solo Admin)
export async function getAllProfiles(): Promise<ActionResult<Profile[]>> {
  try {
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.success) {
      return { success: false, data: null, error: adminCheck.error };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: (data || []) as Profile[], error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al obtener usuarios",
    };
  }
}

// Actualizar rol de un usuario (solo Admin)
export async function updateProfileRole(
  profileId: string,
  role: UserRole
): Promise<ActionResult<Profile>> {
  try {
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.success) {
      return { success: false, data: null, error: adminCheck.error };
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", profileId)
      .select()
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    revalidatePath("/admin/usuarios");
    return { success: true, data: data as Profile, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al actualizar rol del usuario",
    };
  }
}

// Activar o desactivar cuenta de usuario (solo Admin)
export async function toggleProfileActive(
  profileId: string,
  active: boolean
): Promise<ActionResult<Profile>> {
  try {
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.success) {
      return { success: false, data: null, error: adminCheck.error };
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ active, updated_at: new Date().toISOString() })
      .eq("id", profileId)
      .select()
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    revalidatePath("/admin/usuarios");
    return { success: true, data: data as Profile, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al cambiar estado del usuario",
    };
  }
}

// Invitar comercial nuevo (solo Admin)
export async function inviteNewUser(
  email: string,
  fullName: string
): Promise<ActionResult<void>> {
  try {
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.success) {
      return { success: false, data: null, error: adminCheck.error };
    }

    const supabase = createServiceClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${appUrl}/login`,
        data: {
          full_name: fullName,
        }
      }
    );

    if (inviteError) {
      return { success: false, data: null, error: inviteError.message };
    }

    revalidatePath("/admin/usuarios");
    return { success: true, data: undefined, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al invitar al usuario",
    };
  }
}
