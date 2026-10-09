import React from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getFinancialEntities } from "@/lib/actions/financial-entities";
import FinancialEntitiesClient from "@/components/admin/FinancialEntitiesClient";

export default async function EntidadesFinancierasAdminPage() {
  const [profileResult, entitiesResult] = await Promise.all([
    getCurrentProfile(),
    getFinancialEntities(false),
  ]);

  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }

  const currentUserProfile = profileResult.data;
  if (currentUserProfile.role !== "admin") {
    redirect("/leads");
  }

  const entities = entitiesResult.success && entitiesResult.data ? entitiesResult.data : [];

  return <FinancialEntitiesClient initialEntities={entities} />;
}
