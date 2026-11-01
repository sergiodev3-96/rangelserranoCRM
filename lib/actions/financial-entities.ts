"use server";

import type { ActionResult } from "@/types/database";
import type { FinancialEntity } from "@/types/financial-entities";
import { createClient } from "../supabase/server";
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

// Obtener entidades financieras (Cualquier usuario autenticado)
export async function getFinancialEntities(onlyActive = false): Promise<ActionResult<FinancialEntity[]>> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("financial_entities")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (onlyActive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return {
      success: true,
      data: ((data || []).map((item) => ({
        ...item,
        tin: Number(item.tin),
        sort_order: Number(item.sort_order),
        is_default: Boolean(item.is_default),
      }))) as FinancialEntity[],
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al obtener entidades financieras",
    };
  }
}

// Crear entidad financiera (solo Admin)
export async function createFinancialEntity(params: {
  name: string;
  tin: number;
  is_active?: boolean;
  sort_order?: number;
  is_default?: boolean;
}): Promise<ActionResult<FinancialEntity>> {
  try {
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.success) {
      return { success: false, data: null, error: adminCheck.error };
    }

    const supabase = await createClient();

    if (params.is_default) {
      await supabase.from("financial_entities").update({ is_default: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    }

    const { data, error } = await supabase
      .from("financial_entities")
      .insert({
        name: params.name.trim(),
        tin: params.tin,
        is_active: params.is_active ?? true,
        sort_order: params.sort_order ?? 0,
        is_default: params.is_default ?? false,
      })
      .select()
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    revalidatePath("/admin/entidades-financieras");
    revalidatePath("/simulaciones");
    return {
      success: true,
      data: {
        ...data,
        tin: Number(data.tin),
        sort_order: Number(data.sort_order),
        is_default: Boolean(data.is_default),
      } as FinancialEntity,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al crear la entidad financiera",
    };
  }
}

// Actualizar entidad financiera (solo Admin)
export async function updateFinancialEntity(params: {
  id: string;
  name: string;
  tin: number;
  is_active?: boolean;
  sort_order?: number;
  is_default?: boolean;
}): Promise<ActionResult<FinancialEntity>> {
  try {
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.success) {
      return { success: false, data: null, error: adminCheck.error };
    }

    const supabase = await createClient();

    if (params.is_default) {
      await supabase.from("financial_entities").update({ is_default: false }).neq("id", params.id);
    }

    const { data, error } = await supabase
      .from("financial_entities")
      .update({
        name: params.name.trim(),
        tin: params.tin,
        ...(typeof params.is_active === "boolean" ? { is_active: params.is_active } : {}),
        ...(typeof params.sort_order === "number" ? { sort_order: params.sort_order } : {}),
        ...(typeof params.is_default === "boolean" ? { is_default: params.is_default } : {}),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    revalidatePath("/admin/entidades-financieras");
    revalidatePath("/simulaciones");
    return {
      success: true,
      data: {
        ...data,
        tin: Number(data.tin),
        sort_order: Number(data.sort_order),
        is_default: Boolean(data.is_default),
      } as FinancialEntity,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al actualizar la entidad financiera",
    };
  }
}

// Cambiar estado activo/inactivo (solo Admin)
export async function toggleFinancialEntityStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<void>> {
  try {
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.success) {
      return { success: false, data: null, error: adminCheck.error };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("financial_entities")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    revalidatePath("/admin/entidades-financieras");
    revalidatePath("/simulaciones");
    return { success: true, data: undefined, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al modificar estado de la entidad",
    };
  }
}

// Eliminar entidad financiera (solo Admin)
export async function deleteFinancialEntity(id: string): Promise<ActionResult<void>> {
  try {
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.success) {
      return { success: false, data: null, error: adminCheck.error };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("financial_entities")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    revalidatePath("/admin/entidades-financieras");
    revalidatePath("/simulaciones");
    return { success: true, data: undefined, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al eliminar la entidad financiera",
    };
  }
}

// Establecer entidad por defecto para las simulaciones (solo Admin)
export async function setDefaultFinancialEntity(id: string): Promise<ActionResult<void>> {
  try {
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.success) {
      return { success: false, data: null, error: adminCheck.error };
    }

    const supabase = await createClient();

    // 1. Desmarcar las demás entidades
    await supabase
      .from("financial_entities")
      .update({ is_default: false })
      .neq("id", id);

    // 2. Marcar la seleccionada como por defecto y asegurarse de que esté activa
    const { error } = await supabase
      .from("financial_entities")
      .update({ is_default: true, is_active: true })
      .eq("id", id);

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    revalidatePath("/admin/entidades-financieras");
    revalidatePath("/simulaciones");
    return { success: true, data: undefined, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al establecer la entidad por defecto",
    };
  }
}
