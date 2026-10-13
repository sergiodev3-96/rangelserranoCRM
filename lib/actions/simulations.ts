"use server";

import type { ActionResult } from "@/types/database";
import type { Simulation } from "@/types/simulations";
import type { CreateSimulationInput } from "@/lib/validations/simulations";
import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "./auth";

// Obtener todas las simulaciones a las que el usuario tiene acceso
export async function getSimulations(): Promise<ActionResult<Simulation[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    const { data, error } = await supabase
      .from("simulations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: (data || []) as Simulation[], error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al obtener simulaciones",
    };
  }
}

// Obtener las simulaciones de un lead
export async function getSimulationsByLeadId(
  leadId: string
): Promise<ActionResult<Simulation[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("simulations")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: (data || []) as Simulation[], error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al obtener simulaciones del lead",
    };
  }
}

// Obtener una simulación por ID
export async function getSimulationById(
  id: string
): Promise<ActionResult<Simulation>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    const { data, error } = await supabase
      .from("simulations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data as Simulation, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al obtener la simulación",
    };
  }
}

// Guardar una simulación
export async function createSimulation(
  input: CreateSimulationInput
): Promise<ActionResult<Simulation>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    const simData = {
      lead_id: input.lead_id || null,
      created_by: user.id,
      vehicle_price: input.vehicle_price,
      down_payment: input.down_payment,
      financed_capital: input.financed_capital,
      entity_name: input.entity_name,
      tin_rate: input.tin_rate,
      tae_rate: input.tae_rate,
      term_months: input.term_months,
      monthly_payment: input.monthly_payment,
      total_interest: input.total_interest,
      total_payable: input.total_payable,
      is_draft: input.is_draft,
    };

    const { data, error } = await supabase
      .from("simulations")
      .insert(simData)
      .select()
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    // Registrar evento en el lead si está asociado
    if (input.lead_id) {
      await supabase.from("lead_events").insert({
        lead_id: input.lead_id,
        author_id: user.id,
        event_type: "note",
        content: `Simulación guardada para este lead: cuota de ${input.monthly_payment} €/mes a ${input.term_months} meses con ${input.entity_name}.`,
      });
      revalidatePath(`/leads/${input.lead_id}`);
    }

    revalidatePath("/simulaciones");
    return { success: true, data: data as Simulation, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al guardar simulación",
    };
  }
}

// Actualizar una simulación existente
export async function updateSimulation(
  id: string,
  input: Partial<CreateSimulationInput>
): Promise<ActionResult<Simulation>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    // Comprobar existencia
    const { data: existingSim, error: fetchError } = await supabase
      .from("simulations")
      .select("id, created_by, lead_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingSim) {
      return { success: false, data: null, error: "Simulación no encontrada" };
    }

    const simData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.lead_id !== undefined) simData.lead_id = input.lead_id || null;
    if (input.vehicle_price !== undefined) simData.vehicle_price = input.vehicle_price;
    if (input.down_payment !== undefined) simData.down_payment = input.down_payment;
    if (input.financed_capital !== undefined) simData.financed_capital = input.financed_capital;
    if (input.entity_name !== undefined) simData.entity_name = input.entity_name;
    if (input.tin_rate !== undefined) simData.tin_rate = input.tin_rate;
    if (input.tae_rate !== undefined) simData.tae_rate = input.tae_rate;
    if (input.term_months !== undefined) simData.term_months = input.term_months;
    if (input.monthly_payment !== undefined) simData.monthly_payment = input.monthly_payment;
    if (input.total_interest !== undefined) simData.total_interest = input.total_interest;
    if (input.total_payable !== undefined) simData.total_payable = input.total_payable;
    if (input.is_draft !== undefined) simData.is_draft = input.is_draft;

    const { data, error } = await supabase
      .from("simulations")
      .update(simData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    const targetLeadId = input.lead_id !== undefined ? input.lead_id : existingSim.lead_id;
    if (targetLeadId) {
      await supabase.from("lead_events").insert({
        lead_id: targetLeadId,
        author_id: user.id,
        event_type: "note",
        content: `Simulación modificada para este lead: cuota de ${data.monthly_payment} €/mes a ${data.term_months} meses con ${data.entity_name}.`,
      });
      revalidatePath(`/leads/${targetLeadId}`);
    }

    if (existingSim.lead_id && existingSim.lead_id !== targetLeadId) {
      revalidatePath(`/leads/${existingSim.lead_id}`);
    }

    revalidatePath("/simulaciones");
    return { success: true, data: data as Simulation, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al actualizar simulación",
    };
  }
}

// Eliminar una simulación
export async function deleteSimulation(
  simulationId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    // Validar permisos
    const { data: currentSim } = await supabase
      .from("simulations")
      .select("created_by, lead_id")
      .eq("id", simulationId)
      .single();

    const profileResult = await getCurrentProfile();
    const isAdmin = profileResult.success && profileResult.data.role === "admin";
    const isOwner = currentSim && currentSim.created_by === user.id;

    if (!isAdmin && !isOwner) {
      return {
        success: false,
        data: null,
        error: "No tienes permiso para eliminar esta simulación.",
      };
    }

    const { error } = await supabase.from("simulations").delete().eq("id", simulationId);

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    if (currentSim && currentSim.lead_id) {
      await supabase.from("lead_events").insert({
        lead_id: currentSim.lead_id,
        author_id: user.id,
        event_type: "note",
        content: `Simulación eliminada.`,
      });
      revalidatePath(`/leads/${currentSim.lead_id}`);
    }

    revalidatePath("/simulaciones");
    return { success: true, data: undefined, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al eliminar simulación",
    };
  }
}
