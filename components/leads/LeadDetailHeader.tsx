"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LeadWithAssignee } from "@/types/leads";
import type { ProfileSummary } from "@/types/profiles";
import LeadAssignDropdown from "./LeadAssignDropdown";
import LeadStatusSelector from "./LeadStatusSelector";
import { convertLeadToClient, archiveLead } from "@/lib/actions/leads";

type LeadDetailHeaderProps = {
  lead: LeadWithAssignee;
  currentUser: { id: string; role: "admin" | "comercial" };
  comerciales: ProfileSummary[];
  onRefresh: () => void;
};

export default function LeadDetailHeader({
  lead,
  currentUser,
  comerciales,
  onRefresh,
}: LeadDetailHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isAdmin = currentUser.role === "admin";
  const isAssigned = lead.assigned_to === currentUser.id;
  const canEdit = isAdmin || isAssigned;

  const handleConvertToClient = () => {
    if (
      !confirm(
        "¿Desea convertir este lead en cliente? Esto cambiará su estado a 'Pedido' y creará un registro de Pedido Finalizado."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await convertLeadToClient(lead.id);
      if (result.success) {
        onRefresh();
        alert(
          "Cliente convertido con éxito. Se ha creado un borrador de pedido en 'Pedidos Finalizados'."
        );
      } else {
        alert(result.error || "No se pudo convertir el lead.");
      }
    });
  };

  const handleArchive = () => {
    if (
      !confirm(
        "¿Está seguro de que desea archivar este lead? Dejará de ser visible en el pipeline activo."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await archiveLead(lead.id);
      if (result.success) {
        router.push("/leads");
        router.refresh();
      } else {
        alert(result.error || "No se pudo archivar el lead.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border-default bg-surface p-6 shrink-0">
      {/* Title block */}
      <div className="space-y-1 text-left">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary font-body-sm text-[13px] transition-colors mb-1"
        >
          <span className="material-symbols-outlined text-[16px]">
            arrow_back
          </span>
          Volver a Leads
        </Link>
        <h1 className="font-headline-lg text-[24px] text-text-primary tracking-tight leading-none flex items-center gap-2">
          {lead.full_name}
          {lead.lead_number && (
            <span className="text-[13px] bg-surface-container-highest text-text-secondary border border-border-default px-2 py-0.5 rounded font-data-mono font-medium select-none">
              #{lead.lead_number}
            </span>
          )}
        </h1>
        <p className="font-body-sm text-[13px] text-text-secondary">
          Interés:{" "}
          <span className="text-primary font-medium font-body-md">
            {lead.vehicle_interest || "No especificado"}
          </span>
        </p>
      </div>

      {/* Selectors and Action Buttons */}
      <div className="flex flex-wrap items-center gap-3.5 md:ml-auto">
        {/* Assignee */}
        <LeadAssignDropdown
          leadId={lead.id}
          assignedTo={lead.assigned_to}
          isAdmin={isAdmin}
          comerciales={comerciales}
          onSuccess={onRefresh}
        />

        {/* Status */}
        <LeadStatusSelector
          leadId={lead.id}
          currentStatus={lead.status}
          disabled={!canEdit}
          onSuccess={onRefresh}
        />

        {/* Convert CTA */}
        {lead.status !== "pedido" && (
          <button
            onClick={handleConvertToClient}
            disabled={isPending || !canEdit}
            className="bg-success text-inverse-on-surface hover:shadow-[0_0_10px_rgba(52,211,153,0.3)] disabled:opacity-50 disabled:hover:shadow-none transition-all duration-300 rounded-lg py-2 px-3.5 flex items-center justify-center gap-1.5 font-body-sm font-semibold text-[13px] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              how_to_reg
            </span>
            Convertir Cliente
          </button>
        )}

        {/* Archive Action (Admin only) */}
        {isAdmin && (
          <button
            onClick={handleArchive}
            disabled={isPending}
            className="text-text-secondary hover:text-danger hover:bg-error-container/10 border border-border-default hover:border-danger/20 transition-all duration-200 rounded-lg p-2 flex items-center justify-center cursor-pointer"
            title="Archivar lead"
          >
            <span className="material-symbols-outlined text-[18px]">
              archive
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
