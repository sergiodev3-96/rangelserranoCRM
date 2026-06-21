import type { LeadStatus } from "./leads";
import type { Profile } from "./profiles";

export type LeadEventType =
  | "note"
  | "status_change"
  | "whatsapp_sent"
  | "call_logged";

export type StatusChangeMetadata = {
  from_status: LeadStatus;
  to_status: LeadStatus;
};

export type LeadEvent = {
  id: string;
  lead_id: string;
  author_id: string;
  event_type: LeadEventType;
  content: string | null;
  metadata: StatusChangeMetadata | Record<string, unknown> | null;
  created_at: string;
};

// Con join a profiles para mostrar nombre del autor
export type LeadEventWithAuthor = LeadEvent & {
  author: Pick<Profile, "id" | "full_name">;
};
