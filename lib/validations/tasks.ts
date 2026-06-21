import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional().default(""),
  lead_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid("Comercial asignado no válido"),
  status: z.enum(["pendiente", "en_proceso", "revision", "completada"]).default("pendiente"),
  priority: z.enum(["baja", "media", "alta"]).default("media"),
  due_date: z.string().optional().nullable(),
  due_time: z.string().optional().nullable(),
});

export const updateTaskStatusSchema = z.object({
  task_id: z.string().uuid(),
  status: z.enum(["pendiente", "en_proceso", "revision", "completada"]),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
