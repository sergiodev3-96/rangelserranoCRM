import React from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getDocumentTemplates } from "@/lib/actions/document-templates";
import DocumentTemplatesClient from "@/components/admin/DocumentTemplatesClient";

export default async function PlantillasDocumentosAdminPage() {
  const profileResult = await getCurrentProfile();
  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }

  const currentUserProfile = profileResult.data;
  if (currentUserProfile.role !== "admin") {
    redirect("/leads");
  }

  const templates = await getDocumentTemplates();

  return <DocumentTemplatesClient initialTemplates={templates} />;
}
