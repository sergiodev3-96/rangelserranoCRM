import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Helper to create a service client to bypass RLS and cookies
function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET Handshake for Webhook Verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const verifyToken = searchParams.get("verify_token");
  const challenge = searchParams.get("challenge");

  const expectedToken = process.env.TIKTOK_WEBHOOK_VERIFY_TOKEN;

  if (verifyToken === expectedToken) {
    // If challenge is present, return it (standard handshake)
    return new Response(challenge || "verification_success", { status: 200 });
  }

  return new Response("Invalid verify token", { status: 403 });
}

// POST Webhook Lead Ads processing
export async function POST(request: Request) {
  const supabase = createServiceClient();
  let payload: any = null;
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
        source: "tiktok_lead_ads",
        payload: payload,
        processed: false,
      })
      .select("id")
      .single();

    if (logError) {
      console.error("Error creating webhook log:", logError);
    } else {
      logId = logData.id;
    }

    // 3. Parse fields dynamically
    const fullName = getFieldValue(payload, ["full_name", "name", "username", "nombre"]) || "TikTok Lead";
    const phone = getFieldValue(payload, ["phone", "phone_number", "mobile", "telefono"]);
    const email = getFieldValue(payload, ["email", "email_address", "correo"]);
    const vehicleInterest = getFieldValue(payload, ["vehicle_interest", "vehicle", "model", "vehiculo"]);
    const campaignName = getFieldValue(payload, ["campaign_name", "campaign", "campaña"]) || "TikTok Lead Ads";

    // 4. Create new lead (assigned_to = null, source = 'tiktok_lead_ads')
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        full_name: fullName,
        phone: phone || null,
        email: email || null,
        status: "cliente_potencial",
        source: "tiktok_lead_ads",
        campaign_name: campaignName,
        vehicle_interest: vehicleInterest || null,
        assigned_to: null, // Lead sin asignar
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
    console.error("Webhook processing error:", errMsg);

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

// Helper to look up values inside the payload properties or arrays
function getFieldValue(payload: any, keys: string[]): string | null {
  if (!payload) return null;

  // Direct check
  for (const key of keys) {
    if (payload[key]) return String(payload[key]);
  }

  // Check inside "fields" array (TikTok layout)
  if (Array.isArray(payload.fields)) {
    for (const f of payload.fields) {
      if (keys.includes(f.name) || keys.includes(f.key)) {
        return String(f.value);
      }
    }
  }

  // Check inside "user_answers" array (Ad leads API layout)
  if (Array.isArray(payload.user_answers)) {
    for (const ans of payload.user_answers) {
      if (keys.includes(ans.field_key) || keys.includes(ans.field_name)) {
        return String(ans.value);
      }
    }
  }

  return null;
}
