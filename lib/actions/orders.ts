"use server";

import type { ActionResult } from "@/types/database";
import type { Order, OrderStatus } from "@/types/orders";
import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "./auth";

// Obtener pedidos finalizados
export async function getOrders(status?: string | null): Promise<ActionResult<Order[]>> {
  try {
    const supabase = await createClient();
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });

    if (status && status !== "Todos") {
      const dbStatus = status === "En revisión" ? "en_revision" : status.toLowerCase();
      query = query.eq("status", dbStatus);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: (data || []) as Order[], error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al obtener pedidos",
    };
  }
}

// Actualizar el estado de un pedido (ej. de En revisión a Aprobado/Denegado)
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<ActionResult<Order>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    // Obtener perfil actual del usuario
    const profileRes = await getCurrentProfile();
    if (!profileRes.success || !profileRes.data) {
      return { success: false, data: null, error: "Usuario no autenticado" };
    }

    const updateData: {
      status: OrderStatus;
      updated_at: string;
      closed_at: string | null;
      closed_by: string | null;
    } = {
      status,
      updated_at: new Date().toISOString(),
      closed_at: null,
      closed_by: null,
    };

    // Si se cierra (aprobado o denegado), registrar datos de cierre
    if (status === "aprobado" || status === "denegado") {
      updateData.closed_at = new Date().toISOString();
      updateData.closed_by = user.id;
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    // Registrar evento de cambio en el lead asociado
    await supabase.from("lead_events").insert({
      lead_id: data.lead_id,
      author_id: user.id,
      event_type: "status_change",
      content: `El pedido del cliente pasó a estado "${status}".`,
    });

    revalidatePath("/pedidos");
    revalidatePath(`/leads/${data.lead_id}`);
    return { success: true, data: data as Order, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al actualizar estado del pedido",
    };
  }
}
