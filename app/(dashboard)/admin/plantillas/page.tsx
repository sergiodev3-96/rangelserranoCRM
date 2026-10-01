import React from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getWhatsAppTemplates } from "@/lib/actions/whatsapp-templates";
import WhatsAppTemplatesListClient from "@/components/admin/WhatsAppTemplatesListClient";

export default async function PlantillasAdminPage() {
  // 1. Obtener perfil y plantillas en paralelo
  const [profileResult, templatesResult] = await Promise.all([
    getCurrentProfile(),
    getWhatsAppTemplates(),
  ]);

  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }

  const currentUserProfile = profileResult.data;
  if (currentUserProfile.role !== "admin") {
    redirect("/leads");
  }

  const templates = templatesResult.success && templatesResult.data ? templatesResult.data : [];

  return (
    <WhatsAppTemplatesListClient
      initialTemplates={templates}
    />
  );
}
