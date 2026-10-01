import React from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getLeadsForSelector } from "@/lib/actions/leads";
import { getSimulationById } from "@/lib/actions/simulations";
import SimulationClient from "@/components/simulations/SimulationClient";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function SimulacionesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const leadId =
    typeof resolvedSearchParams.leadId === "string" ? resolvedSearchParams.leadId : null;
  const simulationId =
    typeof resolvedSearchParams.id === "string" ? resolvedSearchParams.id : null;

  // 1. Obtener perfil, lista ligera de leads y datos de simulación en paralelo
  const [profileResult, leadsResult, simResult] = await Promise.all([
    getCurrentProfile(),
    getLeadsForSelector(),
    simulationId ? getSimulationById(simulationId) : Promise.resolve(null),
  ]);

  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }

  const mappedLeads = leadsResult.success && leadsResult.data ? leadsResult.data : [];
  const initialSimulation = simResult && simResult.success && simResult.data ? simResult.data : null;

  return (
    <SimulationClient
      leads={mappedLeads}
      initialLeadId={leadId}
      initialSimulation={initialSimulation}
    />
  );
}
