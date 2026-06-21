import { createClient } from "../supabase/server";
import { WHATSAPP_TEMPLATES } from "./templates";
import type { WhatsAppTemplateName } from "./templates";

type SendWhatsAppParams = {
  leadId: string;
  templateName: WhatsAppTemplateName;
  customBody?: string;
};

export async function sendWhatsAppMessage(params: SendWhatsAppParams) {
  const provider = process.env.WHATSAPP_PROVIDER || "mock";

  switch (provider) {
    case "mock":
    default:
      return sendWhatsAppMessageMock(params);
  }
}

async function sendWhatsAppMessageMock(params: SendWhatsAppParams) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("No autorizado");
  }

  // 1. Obtener datos del lead
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("full_name, vehicle_interest")
    .eq("id", params.leadId)
    .single();

  if (leadError || !lead) {
    throw new Error(leadError?.message || "Lead no encontrado");
  }

  // 2. Formular cuerpo del mensaje reemplazando variables
  let body = params.customBody || "";

  if (!body) {
    const template = WHATSAPP_TEMPLATES.find((t) => t.name === params.templateName);
    if (!template) {
      throw new Error("Plantilla no encontrada");
    }

    body = template.body
      .replace(/{name}/g, lead.full_name)
      .replace(/{vehicle}/g, lead.vehicle_interest || "vehículo");
  }

  // 3. Insertar registro en whatsapp_messages
  const { data: msg, error: msgError } = await supabase
    .from("whatsapp_messages")
    .insert({
      lead_id: params.leadId,
      sent_by: user.id,
      template_name: params.templateName,
      message_body: body,
      provider: "mock",
      status: "simulated",
    })
    .select()
    .single();

  if (msgError) {
    throw new Error(msgError.message);
  }

  // 4. Crear lead_event
  await supabase.from("lead_events").insert({
    lead_id: params.leadId,
    author_id: user.id,
    event_type: "whatsapp_sent",
    content: body,
  });

  return msg;
}
