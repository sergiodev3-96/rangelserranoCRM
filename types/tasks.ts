import type { Profile } from "./profiles";
import type { Lead } from "./leads";

export type TaskStatus = "pendiente" | "en_proceso" | "revision" | "completada";
export type TaskPriority = "baja" | "media" | "alta";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  lead_id: string | null;
  assigned_to: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  due_time: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskWithDetails = Task & {
  lead: Pick<Lead, "id" | "full_name"> | null;
  assignee: Pick<Profile, "id" | "full_name"> | null;
};
