"use server";

import type { ActionResult } from "@/types/database";
import type { LeadNote } from "@/types/lead-notes";
import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "./auth";

// Obtener la nota asociada a un lead
export async function getLeadNote(
  leadId: string
): Promise<ActionResult<LeadNote>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lead_notes")
      .select("lead_id, content, updated_at, updated_by, author:profiles!lead_notes_updated_by_fkey(id, full_name)")
      .eq("lead_id", leadId)
      .maybeSingle();

    if (error) {
      // Si la tabla aún no existe en Supabase, devolver contenido vacío sin fallar
      if (error.message?.includes("relation \"public.lead_notes\" does not exist") ||
          error.message?.includes("lead_notes") ||
          error.message?.includes("schema cache")) {
        return {
          success: true,
          data: {
            lead_id: leadId,
            content: "",
            updated_at: null,
            updated_by: null,
            author: null,
          },
          error: null,
        };
      }
      return { success: false, data: null, error: error.message };
    }

    if (!data) {
      return {
        success: true,
        data: {
          lead_id: leadId,
          content: "",
          updated_at: null,
          updated_by: null,
          author: null,
        },
        error: null,
      };
    }

    const note = {
      lead_id: data.lead_id,
      content: data.content || "",
      updated_at: data.updated_at,
      updated_by: data.updated_by,
      author: Array.isArray(data.author) ? data.author[0] : data.author,
    };

    return {
      success: true,
      data: note,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al obtener la nota del lead",
    };
  }
}

// Guardar/Actualizar la nota única del lead
export async function saveLeadNote(
  leadId: string,
  content: string
): Promise<ActionResult<LeadNote>> {
  try {
    const supabase = await createClient();
    const userId = await getCurrentUserId();

    if (!userId) {
      return { success: false, data: null, error: "No autorizado" };
    }

    const payload = {
      lead_id: leadId,
      content,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    };

    const { data, error } = await supabase
      .from("lead_notes")
      .upsert(payload, { onConflict: "lead_id" })
      .select("lead_id, content, updated_at, updated_by, author:profiles!lead_notes_updated_by_fkey(id, full_name)")
      .single();

    if (error) {
      if (error.message?.includes("relation \"public.lead_notes\" does not exist") ||
          error.message?.includes("schema cache") ||
          error.message?.includes("lead_notes")) {
        return {
          success: false,
          data: null,
          error: "Para guardar notas, ejecuta la migración 0018_lead_notes.sql en Supabase SQL Editor.",
        };
      }
      return { success: false, data: null, error: error.message };
    }

    revalidatePath(`/leads/${leadId}`);

    const savedNote = {
      lead_id: data.lead_id,
      content: data.content || "",
      updated_at: data.updated_at,
      updated_by: data.updated_by,
      author: Array.isArray(data.author) ? data.author[0] : data.author,
    };

    return { success: true, data: savedNote, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al guardar la nota",
    };
  }
}
