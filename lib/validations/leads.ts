import { z } from "zod";

export const createLeadSchema = z.object({
  full_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  phone: z.string().optional().default(""),
  email: z.string().email("Email no válido").optional().or(z.literal("")),
  source: z
    .enum([
      "tiktok_lead_ads",
      "meta_lead_ads",
      "manual",
      "referral",
      "organic_web",
      "newsletter",
    ])
    .default("manual"),
  campaign_name: z.string().optional().default(""),
  vehicle_interest: z.string().optional().default(""),
  assigned_to: z.string().uuid().optional().nullable(),
});

export const updateLeadStatusSchema = z.object({
  lead_id: z.string().uuid(),
  status: z.enum([
    "no_responde",
    "cliente_potencial",
    "cuarentena",
    "realizando_pedido",
    "pedido",
    "asnef",
    "esperando_docs",
    "rechazado",
  ]),
});

export const assignLeadSchema = z.object({
  lead_id: z.string().uuid(),
  assigned_to: z.string().uuid(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
