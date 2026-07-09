"use server";

import { createClient } from "@/lib/supabase/server";

export async function getTikTokVerifyToken() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, error: "No autorizado" };
  }

  return { 
    success: true, 
    data: process.env.TIKTOK_WEBHOOK_VERIFY_TOKEN || "token_no_configurado_en_env" 
  };
}
