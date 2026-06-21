"use server";

import type { ActionResult } from "@/types/database";
import type { Task, TaskWithDetails } from "@/types/tasks";
import type { CreateTaskInput, UpdateTaskStatusInput } from "@/lib/validations/tasks";
import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "./auth";

// Obtener todas las tareas
export async function getTasks(): Promise<ActionResult<TaskWithDetails[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*, lead:leads(id, full_name), assignee:profiles(id, full_name)")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: (data || []) as TaskWithDetails[], error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al obtener tareas",
    };
  }
}

// Obtener tareas asociadas a un lead específico
export async function getTasksByLeadId(
  leadId: string
): Promise<ActionResult<TaskWithDetails[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*, lead:leads(id, full_name), assignee:profiles(id, full_name)")
      .eq("lead_id", leadId)
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: (data || []) as TaskWithDetails[], error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al obtener tareas del lead",
    };
  }
}

// Crear una tarea
export async function createTask(input: CreateTaskInput): Promise<ActionResult<Task>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    const taskData = {
      title: input.title,
      description: input.description || null,
      lead_id: input.lead_id || null,
      assigned_to: input.assigned_to,
      status: input.status || "pendiente",
      priority: input.priority || "media",
      due_date: input.due_date || null,
      due_time: input.due_time || null,
      completed_at: input.status === "completada" ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(taskData)
      .select()
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    // Si la tarea está vinculada a un lead, registrar evento
    if (input.lead_id) {
      await supabase.from("lead_events").insert({
        lead_id: input.lead_id,
        author_id: user.id,
        event_type: "note",
        content: `Tarea creada: "${input.title}". Asignada a comercial.`,
      });
      revalidatePath(`/leads/${input.lead_id}`);
    }

    revalidatePath("/tareas");
    return { success: true, data: data as Task, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al crear tarea",
    };
  }
}

// Actualizar estado de una tarea (mover en el Kanban)
export async function updateTaskStatus(
  input: UpdateTaskStatusInput
): Promise<ActionResult<Task>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    // 1. Obtener la tarea para verificar quién es el asignado
    const { data: currentTask } = await supabase
      .from("tasks")
      .select("assigned_to, lead_id, title")
      .eq("id", input.task_id)
      .single();

    // 2. Verificar permisos: es Admin o es el Comercial asignado
    const profileResult = await getCurrentProfile();
    const isAdmin = profileResult.success && profileResult.data.role === "admin";
    const isAssigned = currentTask && currentTask.assigned_to === user.id;

    if (!isAdmin && !isAssigned) {
      return {
        success: false,
        data: null,
        error: "No tienes permiso para modificar esta tarea.",
      };
    }

    const completed_at = input.status === "completada" ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from("tasks")
      .update({
        status: input.status,
        completed_at,
      })
      .eq("id", input.task_id)
      .select()
      .single();

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    // Si la tarea está vinculada a un lead, registrar evento
    if (data.lead_id) {
      await supabase.from("lead_events").insert({
        lead_id: data.lead_id,
        author_id: user.id,
        event_type: "note",
        content: `Estado de la tarea "${data.title}" cambiado a "${input.status}".`,
      });
      revalidatePath(`/leads/${data.lead_id}`);
    }

    revalidatePath("/tareas");
    return { success: true, data: data as Task, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al actualizar estado de la tarea",
    };
  }
}

// Eliminar una tarea
export async function deleteTask(taskId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, data: null, error: "No autorizado" };
    }

    // Verificar permisos
    const { data: currentTask } = await supabase
      .from("tasks")
      .select("assigned_to, lead_id, title")
      .eq("id", taskId)
      .single();

    const profileResult = await getCurrentProfile();
    const isAdmin = profileResult.success && profileResult.data.role === "admin";
    const isAssigned = currentTask && currentTask.assigned_to === user.id;

    if (!isAdmin && !isAssigned) {
      return {
        success: false,
        data: null,
        error: "No tienes permiso para eliminar esta tarea.",
      };
    }

    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (error) {
      return { success: false, data: null, error: error.message };
    }

    if (currentTask && currentTask.lead_id) {
      await supabase.from("lead_events").insert({
        lead_id: currentTask.lead_id,
        author_id: user.id,
        event_type: "note",
        content: `Tarea eliminada: "${currentTask.title}".`,
      });
      revalidatePath(`/leads/${currentTask.lead_id}`);
    }

    revalidatePath("/tareas");
    return { success: true, data: undefined, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al eliminar tarea",
    };
  }
}
