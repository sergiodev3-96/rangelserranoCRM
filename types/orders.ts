export type OrderStatus = "aprobado" | "denegado" | "en_revision";

export type Order = {
  id: string;
  lead_id: string;
  simulation_id: string | null;
  client_name: string;
  vehicle: string | null;
  price: number | null;
  bank_entity: string | null;
  monthly_payment: number | null;
  status: OrderStatus;
  closed_at: string | null; // ISO date string
  closed_by: string | null;
  created_at: string;
  updated_at: string;
};

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  aprobado: {
    label: "Aprobado",
    bgClass: "bg-lead-ordered-bg",
    textClass: "text-lead-ordered-text",
    borderClass: "border-lead-ordered-text/20",
  },
  denegado: {
    label: "Denegado",
    bgClass: "bg-lead-rejected-bg",
    textClass: "text-lead-rejected-text",
    borderClass: "border-lead-rejected-text/20",
  },
  en_revision: {
    label: "En revisión",
    bgClass: "bg-lead-waiting-bg",
    textClass: "text-lead-waiting-text",
    borderClass: "border-lead-waiting-text/20",
  },
} as const;
