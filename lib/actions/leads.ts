"use server";

import type { ActionResult } from "@/types/database";
import type { Lead, LeadWithAssignee } from "@/types/leads";
import type {
  CreateLeadInput,
  UpdateLeadStatusInput,
  AssignLeadInput,
} from "@/lib/validations/leads";
import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "./auth";

// Obtener leads paginados con filtros
export async function getLeads(params: {
  page?: number; // default 1
  pageSize?: number; // default 20
  status?: string | null;
  unassignedOnly?: boolean;
  search?: string;
}): Promise<ActionResult<{ leads: LeadWithAssignee[]; total: number }>> {
  try {
    const supabase = await createClient();
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("leads")
      .select("*, assignee:profiles(id, full_name)", { count: "exact" })
      .eq("archived", false);

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.unassignedOnly) {
      query = query.is("assigned_to", null);
    }

    if (params.search) {
      query = query.ilike("full_name", `%${params.search}%`);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return {
      success: true,
      data: {
        leads: (data || []) as LeadWithAssignee[],
        total: count || 0,
      },
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al obtener leads",
    };
  }
}

// Obtener un lead por ID con datos enriquecidos
export async function getLeadById(
  leadId: string
): Promise<ActionResult<LeadWithAssignee>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*, assignee:profiles(id, full_name)")
      .eq("id", leadId)
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data as LeadWithAssignee, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error:
        err instanceof Error ? err.message : "Error al obtener detalle del lead",
    };
  }
}

// Crear un lead manualmente
export async function createLead(
  input: CreateLeadInput
): Promise<ActionResult<Lead>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    const leadData = {
      full_name: input.full_name,
      phone: input.phone || null,
      email: input.email || null,
      source: input.source,
      campaign_name: input.campaign_name || null,
      vehicle_interest: input.vehicle_interest || null,
      assigned_to: input.assigned_to || null,
      status: "cliente_potencial",
      archived: false,
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    // Registrar evento de creación
    await supabase.from("lead_events").insert({
      lead_id: data.id,
      author_id: user.id,
      event_type: "note",
      content: "Lead creado manualmente en el sistema.",
    });

    revalidatePath("/leads");
    return { success: true, data: data as Lead, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al crear lead",
    };
  }
}

// Actualizar estado de un lead (crea evento automáticamente)
export async function updateLeadStatus(
  input: UpdateLeadStatusInput
): Promise<ActionResult<Lead>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    // Obtener estado anterior para registrar en metadatos
    const { data: oldLead, error: fetchError } = await supabase
      .from("leads")
      .select("status")
      .eq("id", input.lead_id)
      .single();

    if (fetchError || !oldLead) {
      return {
        success: false,
        data: null,
        error: fetchError?.message || "Lead no encontrado",
      };
    }

    const { data, error } = await supabase
      .from("leads")
      .update({ status: input.status })
      .eq("id", input.lead_id)
      .select()
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    // Registrar evento de cambio de estado
    await supabase.from("lead_events").insert({
      lead_id: input.lead_id,
      author_id: user.id,
      event_type: "status_change",
      content: `Estado actualizado de "${oldLead.status}" a "${input.status}".`,
      metadata: {
        from_status: oldLead.status,
        to_status: input.status,
      },
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${input.lead_id}`);
    return { success: true, data: data as Lead, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Error al actualizar estado del lead",
    };
  }
}

// Asignar un lead sin asignar (solo Admin)
export async function assignLead(
  input: AssignLeadInput
): Promise<ActionResult<Lead>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    // Verificar que el usuario que asigna es admin
    const profileResult = await getCurrentProfile();
    if (!profileResult.success || profileResult.data.role !== "admin") {
      return {
        success: false,
        data: null,
        error: "Solo los administradores pueden asignar leads.",
      };
    }

    // Obtener nombre del comercial asignado para la nota de evento
    const { data: assigneeProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", input.assigned_to)
      .single();

    const { data, error } = await supabase
      .from("leads")
      .update({ assigned_to: input.assigned_to })
      .eq("id", input.lead_id)
      .select()
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    // Registrar evento de asignación
    await supabase.from("lead_events").insert({
      lead_id: input.lead_id,
      author_id: user.id,
      event_type: "note",
      content: `Lead asignado a ${assigneeProfile?.full_name || "Comercial"}.`,
    });

    revalidatePath("/leads");
    revalidatePath(`/leads/${input.lead_id}`);
    return { success: true, data: data as Lead, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al asignar lead",
    };
  }
}

// Archivar un lead (soft-delete, solo Admin)
export async function archiveLead(
  leadId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    // Verificar que el usuario es admin
    const profileResult = await getCurrentProfile();
    if (!profileResult.success || profileResult.data.role !== "admin") {
      return {
        success: false,
        data: null,
        error: "Solo los administradores pueden archivar leads.",
      };
    }

    const { error } = await supabase
      .from("leads")
      .update({ archived: true })
      .eq("id", leadId);

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    // Registrar evento de archivado
    await supabase.from("lead_events").insert({
      lead_id: leadId,
      author_id: user.id,
      event_type: "note",
      content: "Lead archivado por el administrador.",
    });

    revalidatePath("/leads");
    return { success: true, data: undefined, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al archivar lead",
    };
  }
}

// Convertir lead a cliente (crea order, cambia status a 'pedido')
export async function convertLeadToClient(
  leadId: string
): Promise<
  ActionResult<{ lead: Lead; order: import("@/types/orders").Order }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    // 1. Obtener datos del lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return {
        success: false,
        data: null,
        error: leadError?.message || "Lead no encontrado",
      };
    }

    // Obtener la simulación más reciente no-draft asociada a este lead
    const { data: simulation } = await supabase
      .from("simulations")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Transacción secuencial:
    // a. Actualizar leads.status -> 'pedido'
    const { data: updatedLead, error: updateError } = await supabase
      .from("leads")
      .update({ status: "pedido" })
      .eq("id", leadId)
      .select()
      .single();

    if (updateError) {
      return { success: false, data: null, error: updateError.message };
    }

    // b. Crear lead_event
    await supabase.from("lead_events").insert({
      lead_id: leadId,
      author_id: user.id,
      event_type: "status_change",
      content: `Cliente convertido. Estado cambiado de "${lead.status}" a "pedido".`,
      metadata: {
        from_status: lead.status,
        to_status: "pedido",
      },
    });

    // c. Crear order en 'en_revision'
    const orderData = {
      lead_id: leadId,
      simulation_id: simulation?.id || null,
      client_name: lead.full_name,
      vehicle: simulation ? null : lead.vehicle_interest,
      price: simulation?.vehicle_price || null,
      bank_entity: simulation?.entity_name || null,
      monthly_payment: simulation?.monthly_payment || null,
      status: "en_revision",
      closed_at: null,
      closed_by: null,
    };

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      return {
        success: false,
        data: null,
        error: `Error al crear pedido finalizado: ${orderError.message}`,
      };
    }

    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/pedidos");
    return {
      success: true,
      data: { lead: updatedLead as Lead, order },
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error:
        err instanceof Error ? err.message : "Error al convertir lead a cliente",
    };
  }
}
