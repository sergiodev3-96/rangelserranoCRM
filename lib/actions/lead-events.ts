"use server";

import type { ActionResult } from "@/types/database";
import type { LeadEventWithAuthor } from "@/types/lead-events";
import type { CreateNoteInput } from "@/lib/validations/notes";
import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";

// Obtener eventos de un lead (timeline)
export async function getLeadEvents(
  leadId: string
): Promise<ActionResult<LeadEventWithAuthor[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lead_events")
      .select("*, author:profiles(id, full_name)")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return {
      success: true,
      data: (data || []) as LeadEventWithAuthor[],
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error:
        err instanceof Error ? err.message : "Error al obtener eventos del lead",
    };
  }
}

// Crear una nota en un lead
export async function createNote(
  input: CreateNoteInput
): Promise<ActionResult<LeadEventWithAuthor>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    const eventData = {
      lead_id: input.lead_id,
      author_id: user.id,
      event_type: "note",
      content: input.content,
    };

    const { data, error } = await supabase
      .from("lead_events")
      .insert(eventData)
      .select("*, author:profiles(id, full_name)")
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    revalidatePath(`/leads/${input.lead_id}`);
    return { success: true, data: data as LeadEventWithAuthor, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al guardar la nota",
    };
  }
}
