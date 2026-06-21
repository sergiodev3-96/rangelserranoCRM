import { z } from "zod";

export const createNoteSchema = z.object({
  lead_id: z.string().uuid(),
  content: z.string().min(1, "La nota no puede estar vacía"),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
