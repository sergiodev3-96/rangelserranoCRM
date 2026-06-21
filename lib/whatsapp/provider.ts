import { createClient } from "../supabase/server";

type SendWhatsAppParams = {
  leadId: string;
  templateName: string; // Dynamic label or name
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

  // 1. Obtener datos del lead (incluido el teléfono)
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("full_name, vehicle_interest, phone")
    .eq("id", params.leadId)
    .single();

  if (leadError || !lead) {
    throw new Error(leadError?.message || "Lead no encontrado");
  }

  if (!lead.phone) {
    throw new Error("El lead no tiene un número de teléfono registrado para enviar WhatsApp.");
  }

  // 2. Formular cuerpo del mensaje reemplazando variables
  let body = params.customBody || "";

  if (!body) {
    const { data: template, error: tmplError } = await supabase
      .from("whatsapp_templates")
      .select("body")
      .eq("label", params.templateName)
      .single();

    if (tmplError || !template) {
      throw new Error("Plantilla no encontrada en la base de datos");
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

  // 5. Generar enlace de WhatsApp (Deep Link)
  // Limpiar caracteres no numéricos del teléfono
  const cleanPhone = lead.phone.replace(/\D/g, "");
  // Asegurar que comience con código de país si es necesario (ej. de España 34 si tiene 9 dígitos)
  let formattedPhone = cleanPhone;
  if (cleanPhone.length === 9 && (cleanPhone.startsWith("6") || cleanPhone.startsWith("7") || cleanPhone.startsWith("9"))) {
    formattedPhone = "34" + cleanPhone;
  }
  
  const deepLinkUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(body)}`;

  return {
    ...msg,
    deepLinkUrl,
  };
}
