"use server";

import type { ActionResult } from "@/types/database";
import { sendWhatsAppMessage } from "@/lib/whatsapp/provider";
import { revalidatePath } from "next/cache";

export async function sendTemplateMessageAction(params: {
  leadId: string;
  templateName: string;
  customBody?: string;
}): Promise<ActionResult<{ deepLinkUrl: string }>> {
  try {
    const result = await sendWhatsAppMessage(params);
    revalidatePath(`/leads/${params.leadId}`);
    return { success: true, data: { deepLinkUrl: result.deepLinkUrl }, error: null };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Error al enviar mensaje de WhatsApp",
    };
  }
}
