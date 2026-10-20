import React from "react";
import { redirect } from "next/navigation";
import { getLeadById } from "@/lib/actions/leads";
import { getLeadEvents } from "@/lib/actions/lead-events";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getActiveComerciales } from "@/lib/actions/users";
import { getTasksByLeadId } from "@/lib/actions/tasks";
import { getSimulationsByLeadId } from "@/lib/actions/simulations";
import { getLeadNote } from "@/lib/actions/lead-notes";
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

  // 1. Obtener perfil, datos del lead, eventos, tareas, simulaciones, comerciales y notas en paralelo
  // (Las plantillas de documentos se cargan bajo demanda si el usuario entra a esa pestaña)
  const [
    profileResult,
    leadResult,
    eventsResult,
    tasksResult,
    simulationsResult,
    comercialesResult,
    leadNoteResult,
  ] = await Promise.all([
    getCurrentProfile(),
    getLeadById(leadId),
    getLeadEvents(leadId),
    getTasksByLeadId(leadId),
    getSimulationsByLeadId(leadId),
    getActiveComerciales(),
    getLeadNote(leadId),
  ]);

  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }
  const currentUser = {
    id: profileResult.data.id,
    role: profileResult.data.role as "admin" | "comercial",
  };

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

  const events = eventsResult.success && eventsResult.data ? eventsResult.data : [];
  const tasks = tasksResult.success && tasksResult.data ? tasksResult.data : [];
  const simulations = simulationsResult.success && simulationsResult.data ? simulationsResult.data : [];
  const comerciales = comercialesResult.success && comercialesResult.data ? comercialesResult.data : [];
  const leadNote = leadNoteResult.success && leadNoteResult.data ? leadNoteResult.data : null;

  return (
    <LeadDetailClient
      lead={leadResult.data}
      currentUser={currentUser}
      comerciales={comerciales}
      events={events}
      tasks={tasks}
      simulations={simulations}
      leadNote={leadNote}
    />
  );
}