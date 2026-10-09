import { z } from "zod";

export const financialEntitySchema = z.object({
  name: z.string().trim().min(1, "El nombre de la entidad es obligatorio"),
  tin: z.number().min(0, "El TIN debe ser un número positivo").max(100, "El TIN no puede superar el 100%"),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export type FinancialEntityInput = z.infer<typeof financialEntitySchema>;
