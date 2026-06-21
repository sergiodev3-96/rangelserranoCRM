"use server";

import type { ActionResult } from "@/types/database";
import type { WhatsAppTemplate, WhatsAppTemplateCategory } from "@/types/whatsapp";
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

// Obtener todas las plantillas (Cualquier usuario autenticado)
export async function getWhatsAppTemplates(): Promise<ActionResult<WhatsAppTemplate[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("whatsapp_templates")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: (data || []) as WhatsAppTemplate[], error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al obtener plantillas de WhatsApp",
    };
  }
}

// Crear plantilla (solo Admin)
export async function createWhatsAppTemplate(params: {
  label: string;
  body: string;
  category: WhatsAppTemplateCategory;
}): Promise<ActionResult<WhatsAppTemplate>> {
  try {
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.success) {
      return { success: false, data: null, error: adminCheck.error };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("whatsapp_templates")
      .insert({
        label: params.label,
        body: params.body,
        category: params.category,
      })
      .select()
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    revalidatePath("/admin/plantillas");
    revalidatePath("/leads");
    return { success: true, data: data as WhatsAppTemplate, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al crear plantilla de WhatsApp",
    };
  }
}

// Actualizar plantilla (solo Admin)
export async function updateWhatsAppTemplate(params: {
  id: string;
  label: string;
  body: string;
  category: WhatsAppTemplateCategory;
}): Promise<ActionResult<WhatsAppTemplate>> {
  try {
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.success) {
      return { success: false, data: null, error: adminCheck.error };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("whatsapp_templates")
      .update({
        label: params.label,
        body: params.body,
        category: params.category,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    revalidatePath("/admin/plantillas");
    revalidatePath("/leads");
    return { success: true, data: data as WhatsAppTemplate, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al actualizar plantilla de WhatsApp",
    };
  }
}

// Eliminar plantilla (solo Admin)
export async function deleteWhatsAppTemplate(id: string): Promise<ActionResult<void>> {
  try {
    const adminCheck = await checkAdminAuth();
    if (!adminCheck.success) {
      return { success: false, data: null, error: adminCheck.error };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("whatsapp_templates")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    revalidatePath("/admin/plantillas");
    revalidatePath("/leads");
    return { success: true, data: undefined, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al eliminar plantilla de WhatsApp",
    };
  }
}
