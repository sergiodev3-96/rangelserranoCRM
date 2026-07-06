import type { Profile } from "./profiles";

export type LeadStatus =
  | "nuevo"
  | "cliente_potencial"
  | "esperando_docs"
  | "realizando_pedido"
  | "pedido"
  | "no_responde"
  | "cuarentena"
  | "asnef"
  | "rechazado";

export type LeadSource =
  | "tiktok_lead_ads"
  | "meta_lead_ads"
  | "manual"
  | "referral"
  | "organic_web"
  | "newsletter";

export type Lead = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: LeadStatus;
  source: LeadSource;
  campaign_name: string | null;
  vehicle_interest: string | null;
  assigned_to: string | null;
  archived: boolean;
  lead_number?: number;
  raw_webhook_payload: Record<string, unknown> | null;
  first_surname?: string | null;
  second_surname?: string | null;
  dni_nie?: string | null;
  nationality?: string | null;
  birth_country?: string | null;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  vehicle_plate?: string | null;
  vehicle_price?: number | null;
  down_payment?: number | null;
  created_at: string;
  updated_at: string;
};

// Tipo enriquecido con join a profiles (para la tabla de leads)
export type LeadWithAssignee = Lead & {
  assignee: Pick<Profile, "id" | "full_name"> | null;
};

// Mapeo de estados a clases CSS del prototipo
export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    dotClass: string;
  }
> = {
  nuevo: {
    label: "Nuevo",
    bgClass: "bg-primary/10",
    textClass: "text-primary",
    borderClass: "border-primary/20",
    dotClass: "bg-primary",
  },
  cliente_potencial: {
    label: "Cliente potencial",
    bgClass: "bg-lead-potential-bg",
    textClass: "text-lead-potential-text",
    borderClass: "border-lead-potential-text/20",
    dotClass: "bg-lead-potential-text",
  },
  esperando_docs: {
    label: "Esperando docs",
    bgClass: "bg-lead-waiting-bg",
    textClass: "text-lead-waiting-text",
    borderClass: "border-lead-waiting-text/20",
    dotClass: "bg-lead-waiting-text",
  },
  realizando_pedido: {
    label: "Realizando pedido",
    bgClass: "bg-lead-ordering-bg",
    textClass: "text-lead-ordering-text",
    borderClass: "border-lead-ordering-text/20",
    dotClass: "bg-lead-ordering-text",
  },
  pedido: {
    label: "Pedido",
    bgClass: "bg-lead-ordered-bg",
    textClass: "text-lead-ordered-text",
    borderClass: "border-lead-ordered-text/20",
    dotClass: "bg-lead-ordered-text",
  },
  no_responde: {
    label: "No responde",
    bgClass: "bg-lead-no-reply-bg",
    textClass: "text-lead-no-reply-text",
    borderClass: "border-lead-no-reply-text/20",
    dotClass: "bg-lead-no-reply-text",
  },
  cuarentena: {
    label: "Cuarentena",
    bgClass: "bg-lead-quarantine-bg",
    textClass: "text-lead-quarantine-text",
    borderClass: "border-lead-quarantine-text/20",
    dotClass: "bg-lead-quarantine-text",
  },
  asnef: {
    label: "Asnef",
    bgClass: "bg-lead-asnef-bg",
    textClass: "text-lead-asnef-text",
    borderClass: "border-lead-asnef-text/20",
    dotClass: "bg-lead-asnef-text",
  },
  rechazado: {
    label: "Rechazado",
    bgClass: "bg-lead-rejected-bg",
    textClass: "text-lead-rejected-text",
    borderClass: "border-lead-rejected-text/20",
    dotClass: "bg-lead-rejected-text",
  },
} as const;
