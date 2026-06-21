"use server";

import type { ActionResult } from "@/types/database";
import type { ProfileSummary } from "@/types/profiles";
import { createClient } from "../supabase/server";

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
