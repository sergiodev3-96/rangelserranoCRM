import React from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getDocumentTemplates, checkDocumentTemplatesTable } from "@/lib/actions/document-templates";
import DocumentTemplatesClient from "@/components/admin/DocumentTemplatesClient";

export default async function PlantillasDocumentosAdminPage() {
  const [profileResult, templates, dbStatus] = await Promise.all([
    getCurrentProfile(),
    getDocumentTemplates(),
    checkDocumentTemplatesTable(),
  ]);

  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }

  const currentUserProfile = profileResult.data;
  if (currentUserProfile.role !== "admin") {
    redirect("/leads");
  }

  return (
    <DocumentTemplatesClient
      initialTemplates={templates}
      isDbReady={dbStatus.exists}
    />
  );
}
