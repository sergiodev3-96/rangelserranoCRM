export type WhatsAppTemplateName =
  | "contacto_inicial"
  | "seguimiento_financiacion"
  | "cita_confirmada"
  | "operacion_rechazada"
  | "custom";

export type WhatsAppTemplate = {
  name: WhatsAppTemplateName;
  label: string;
  category: "success" | "warning" | "primary" | "error" | "secondary";
  body: string;
  variables: string[];
};

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    name: "contacto_inicial",
    label: "Contacto Inicial",
    category: "success",
    body: "Hola {name}, le contactamos desde HOMA - Rangel & Serrano por su interés en el {vehicle}. ¿Podemos hablar 5 minutos?",
    variables: ["name", "vehicle"],
  },
  {
    name: "seguimiento_financiacion",
    label: "Seguimiento Financiación",
    category: "warning",
    body: "¿Sigue interesado en financiar su próximo vehículo? Tenemos una oferta especial para el {vehicle} que le puede interesar.",
    variables: ["vehicle"],
  },
  {
    name: "cita_confirmada",
    label: "Cita Confirmada",
    category: "primary",
    body: "Confirmamos su cita para mañana a las 11:30h en nuestra exposición de Calle Mayor. ¡Le esperamos!",
    variables: [],
  },
  {
    name: "operacion_rechazada",
    label: "Operación Rechazada",
    category: "error",
    body: "Sentimos comunicarle que por el momento no podemos avanzar con la financiación solicitada. Quedamos a su disposición.",
    variables: [],
  },
];
