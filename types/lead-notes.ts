export type LeadNote = {
  lead_id: string;
  content: string;
  updated_at: string | null;
  updated_by: string | null;
  author?: {
    id: string;
    full_name: string;
  } | null;
};
