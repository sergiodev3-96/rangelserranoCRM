import { z } from "zod";

export const createSimulationSchema = z.object({
  lead_id: z.string().uuid().optional().nullable(),
  vehicle_price: z.number().positive("El precio debe ser mayor a 0"),
  down_payment: z.number().nonnegative("La entrada no puede ser negativa").default(0),
  financed_capital: z.number().positive(),
  entity_name: z.string().min(1, "Debe ingresar una entidad financiera"),
  tin_rate: z.number().nonnegative("El TIN no puede ser negativo"),
  tae_rate: z.number().nonnegative("El TAE no puede ser negativo"),
  term_months: z.number().int().positive("El plazo debe ser mayor a 0"),
  monthly_payment: z.number().positive(),
  total_interest: z.number().nonnegative(),
  total_payable: z.number().positive(),
  is_draft: z.boolean().default(true),
});

export type CreateSimulationInput = z.infer<typeof createSimulationSchema>;
