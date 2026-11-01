import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Helper to create a service client to bypass RLS and cookies
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET Handshake for Webhook Verification (Meta Ads / Generic)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Meta standard verification parameters: hub.mode, hub.verify_token, hub.challenge
  const mode = searchParams.get("hub.mode");
  const verifyToken = searchParams.get("hub.verify_token") || searchParams.get("verify_token");
  const challenge = searchParams.get("hub.challenge") || searchParams.get("challenge");

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.TIKTOK_WEBHOOK_VERIFY_TOKEN;

  if (verifyToken && expectedToken && verifyToken === expectedToken) {
    return new Response(challenge || "verification_success", { status: 200 });
  }

  // If no token configured or testing connection
  if (!verifyToken && !challenge) {
    return NextResponse.json({ message: "Meta Leads Webhook Endpoint active" }, { status: 200 });
  }

  return new Response("Invalid verify token", { status: 403 });
}

interface LeadField {
  name?: string;
  key?: string;
  field_name?: string;
  field_key?: string;
  value?: unknown;
  values?: unknown[];
}

interface WebhookPayload {
  [key: string]: unknown;
  fields?: LeadField[];
  user_answers?: LeadField[];
  field_data?: LeadField[];
}

// POST Webhook Meta / Google Sheets Leads processing
export async function POST(request: Request) {
  const supabase = createServiceClient();
  let payload: WebhookPayload | null = null;
  let logId: string | null = null;

  try {
    // 1. Read raw body payload
    const text = await request.text();
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw_body_text: text };
    }

    // 2. Insert raw webhook log (processed = false)
    const { data: logData, error: logError } = await supabase
      .from("webhook_logs")
      .insert({
        source: "meta_lead_ads",
        payload: payload,
        processed: false,
      })
      .select("id")
      .single();

    if (logError) {
      console.error("Error creating webhook log for meta:", logError);
    } else {
      logId = logData.id;
    }

    // 3. Parse fields dynamically (from Google Sheets, Make, Zapier, or direct Meta Webhook)
    const fullName =
      getFieldValue(payload, ["full_name", "name", "nombre", "nombre_completo", "first_name"]) ||
      "Meta Lead";
    const phone = getFieldValue(payload, [
      "phone",
      "phone_number",
      "mobile",
      "telefono",
      "teléfono",
      "numero_de_telefono",
    ]);
    const email = getFieldValue(payload, ["email", "email_address", "correo", "correo_electronico"]);
    const vehicleInterest = getFieldValue(payload, [
      "vehicle_interest",
      "vehicle",
      "model",
      "vehiculo",
      "vehículo",
      "interes",
      "vehiculo_de_interes",
    ]);
    const campaignName =
      getFieldValue(payload, ["campaign_name", "campaign", "campaña", "campana"]) ||
      "Meta Lead Ads";

    // 4. Create new lead (assigned by default to info@rangelyserrano.com, source = 'meta_lead_ads')
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        full_name: fullName,
        phone: phone || null,
        email: email || null,
        status: "nuevo",
        source: "meta_lead_ads",
        campaign_name: campaignName,
        vehicle_interest: vehicleInterest || null,
        assigned_to: "e0db4f49-4ce2-4acd-80a9-c0addd6ade21",
        archived: false,
        raw_webhook_payload: payload,
      })
      .select("id")
      .single();

    if (leadError) {
      throw new Error(`Error creating lead: ${leadError.message}`);
    }

    // 5. Update webhook log to processed = true with lead_id
    if (logId) {
      await supabase
        .from("webhook_logs")
        .update({
          processed: true,
          lead_id: lead.id,
          error: null,
        })
        .eq("id", logId);
    }

    return NextResponse.json({ success: true, lead_id: lead.id }, { status: 201 });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown webhook error";
    console.error("Webhook processing error (meta):", errMsg);

    // Update log with error if possible
    if (logId) {
      await supabase
        .from("webhook_logs")
        .update({
          processed: false,
          error: errMsg,
        })
        .eq("id", logId);
    }

    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}

// Helper to look up values inside the payload properties or nested arrays
function getFieldValue(payload: WebhookPayload | null | undefined, keys: string[]): string | null {
  if (!payload) return null;

  // Direct check at root level (e.g. sent from Google Sheets or standard webhook)
  for (const key of keys) {
    if (payload[key] !== undefined && payload[key] !== null && payload[key] !== "") {
      return String(payload[key]).trim();
    }
  }

  // Check inside "field_data" (Meta Lead Ads standard payload format)
  if (Array.isArray(payload.field_data)) {
    for (const f of payload.field_data) {
      if (f.name && keys.includes(f.name.toLowerCase())) {
        const val = Array.isArray(f.values) ? f.values[0] : f.value;
        if (val) return String(val).trim();
      }
    }
  }

  // Check inside "fields" or "user_answers"
  const alternateArrays = [payload.fields, payload.user_answers];
  for (const arr of alternateArrays) {
    if (Array.isArray(arr)) {
      for (const item of arr) {
        const nameOrKey = (item.name || item.key || item.field_name || item.field_key || "")
          .toString()
          .toLowerCase();
        if (nameOrKey && keys.includes(nameOrKey)) {
          if (item.value) return String(item.value).trim();
          if (Array.isArray(item.values) && item.values.length > 0) return String(item.values[0]).trim();
        }
      }
    }
  }

  return null;
}
