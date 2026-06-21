export type WhatsAppTemplateCategory =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "secondary";

export type WhatsAppTemplate = {
  id: string;
  label: string;
  body: string;
  category: WhatsAppTemplateCategory;
  created_at: string;
  updated_at: string;
};
