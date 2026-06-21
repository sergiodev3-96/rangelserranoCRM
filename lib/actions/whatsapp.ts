"use server";

import type { ActionResult } from "@/types/database";
import type { WhatsAppTemplateName } from "@/lib/whatsapp/templates";
import { sendWhatsAppMessage } from "@/lib/whatsapp/provider";
import { revalidatePath } from "next/cache";

export async function sendTemplateMessageAction(params: {
  leadId: string;
  templateName: WhatsAppTemplateName;
  customBody?: string;
}): Promise<ActionResult<void>> {
  try {
    await sendWhatsAppMessage(params);
    revalidatePath(`/leads/${params.leadId}`);
    return { success: true, data: undefined, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al enviar mensaje de WhatsApp",
    };
  }
}
