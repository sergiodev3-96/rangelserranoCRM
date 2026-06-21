import React from "react";
import { redirect } from "next/navigation";
import { getLeadById } from "@/lib/actions/leads";
import { getLeadEvents } from "@/lib/actions/lead-events";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getActiveComerciales } from "@/lib/actions/users";
import { getTasksByLeadId } from "@/lib/actions/tasks";
import { getSimulationsByLeadId } from "@/lib/actions/simulations";
import LeadDetailClient from "@/components/leads/LeadDetailClient";
import Link from "next/link";

type Params = Promise<{ id: string }>;

export default async function LeadDetailPage({
  params,
}: {
  params: Params;
}) {
  const resolvedParams = await params;
  const leadId = resolvedParams.id;

  // 1. Obtener perfil actual y validar sesión
  const profileResult = await getCurrentProfile();
  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }
  const currentUser = {
    id: profileResult.data.id,
    role: profileResult.data.role as "admin" | "comercial",
  };

  // 2. Obtener datos del lead
  const leadResult = await getLeadById(leadId);
  if (!leadResult.success || !leadResult.data) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-12 text-center bg-bg-base text-text-primary h-full">
        <span className="material-symbols-outlined text-text-disabled text-5xl mb-4">
          person_off
        </span>
        <h3 className="font-section-subtitle text-[17px] mb-1">
          Lead no encontrado
        </h3>
        <p className="font-body-sm text-[13px] text-text-secondary max-w-sm mb-6">
          El lead especificado no existe o no tiene los permisos suficientes para visualizarlo.
        </p>
        <Link
          href="/leads"
          className="inline-flex items-center justify-center bg-primary text-on-primary hover:shadow-[0_0_10px_rgba(108,99,255,0.3)] transition-all px-4 py-2 rounded-lg font-medium text-[13px]"
        >
          Volver a la lista
        </Link>
      </div>
    );
  }

  // 3. Obtener eventos, tareas, simulaciones y comerciales activos
  const eventsResult = await getLeadEvents(leadId);
  const events = eventsResult.success && eventsResult.data ? eventsResult.data : [];

  const tasksResult = await getTasksByLeadId(leadId);
  const tasks = tasksResult.success && tasksResult.data ? tasksResult.data : [];

  const simulationsResult = await getSimulationsByLeadId(leadId);
  const simulations = simulationsResult.success && simulationsResult.data ? simulationsResult.data : [];

  const comercialesResult = await getActiveComerciales();
  const comerciales = comercialesResult.success && comercialesResult.data ? comercialesResult.data : [];

  return (
    <LeadDetailClient
      lead={leadResult.data}
      currentUser={currentUser}
      comerciales={comerciales}
      events={events}
      tasks={tasks}
      simulations={simulations}
    />
  );
}