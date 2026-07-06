import React from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getLeads } from "@/lib/actions/leads";
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

  // 1. Obtener perfil del usuario actual y validar sesión
  const profileResult = await getCurrentProfile();
  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }
  // 2. Obtener lista de leads para el selector
  const leadsResult = await getLeads({ pageSize: 150 });
  const leads = leadsResult.success && leadsResult.data ? leadsResult.data.leads : [];

  // Mapear leads a la estructura esperada por el selector
  const mappedLeads = leads.map((l) => ({
    id: l.id,
    full_name: l.full_name,
  }));

  // 3. Si se pasa id de simulación, obtener sus datos
  let initialSimulation = null;
  if (simulationId) {
    const simResult = await getSimulationById(simulationId);
    if (simResult.success && simResult.data) {
      initialSimulation = simResult.data;
    }
  }

  return (
    <SimulationClient
      leads={mappedLeads}
      initialLeadId={leadId}
      initialSimulation={initialSimulation}
    />
  );
}
