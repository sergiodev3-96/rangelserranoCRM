import React from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getWhatsAppTemplates } from "@/lib/actions/whatsapp-templates";
import WhatsAppTemplatesListClient from "@/components/admin/WhatsAppTemplatesListClient";

export default async function PlantillasAdminPage() {
  // 1. Obtener perfil de la sesión actual y validar rol admin
  const profileResult = await getCurrentProfile();
  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }

  const currentUserProfile = profileResult.data;
  if (currentUserProfile.role !== "admin") {
    redirect("/leads");
  }

  // 2. Obtener lista de plantillas de la base de datos
  const templatesResult = await getWhatsAppTemplates();
  const templates = templatesResult.success && templatesResult.data ? templatesResult.data : [];

  return (
    <WhatsAppTemplatesListClient
      initialTemplates={templates}
    />
  );
}
