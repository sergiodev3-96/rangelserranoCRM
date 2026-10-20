"use server";

import { getCurrentUserId } from "@/lib/actions/auth";

export async function getTikTokVerifyToken() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return { success: false, error: "No autorizado" };
  }

  return { 
    success: true, 
    data: process.env.TIKTOK_WEBHOOK_VERIFY_TOKEN || "token_no_configurado_en_env" 
  };
}
