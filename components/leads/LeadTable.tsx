"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LeadWithAssignee } from "@/types/leads";
import LeadStatusBadge from "./LeadStatusBadge";
import { deleteLead } from "@/lib/actions/leads";

type LeadTableProps = {
  leads: LeadWithAssignee[];
};

export default function LeadTable({ leads }: LeadTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (leads.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center py-12 text-center bg-surface border border-border-default rounded-xl">
        <span className="material-symbols-outlined text-text-disabled text-5xl mb-4">
          person_search
        </span>
        <h3 className="font-section-subtitle text-[17px] text-text-primary mb-1">
          No se encontraron leads
        </h3>
        <p className="font-body-sm text-[13px] text-text-secondary max-w-sm">
          Intente cambiar los filtros o el término de búsqueda para ver más resultados.
        </p>
      </div>
    );
  }

  const formatSource = (src: string) => {
    return src.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteLead = (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el lead "${name}"?\n\nEsta acción borrará todos sus datos asociados y no se puede deshacer.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteLead(id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "No se pudo eliminar el lead.");
      }
    });
  };

  return (
    <div className="w-full overflow-x-auto border border-border-default rounded-xl bg-surface">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border-default bg-surface-container-low select-none">
            <th className="px-4 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider pl-6 w-[90px]">
              Nº
            </th>
            <th className="px-6 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
              Nombre Cliente
            </th>
            <th className="px-6 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
              Estado Solicitud
            </th>
            <th className="px-6 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
              Teléfono
            </th>
            <th className="px-6 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
              Interés Vehículo
            </th>
            <th className="px-6 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
              Origen (Canal)
            </th>
            <th className="px-6 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
              Asignado A
            </th>
            <th className="px-6 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
              Fecha Registro
            </th>
            <th className="py-3.5 pr-4 pl-1 text-right w-[44px]">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle font-body-sm text-[14px]">
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => router.push(`/leads/${lead.id}`)}
              className="hover:bg-surface-container-high/40 transition-colors cursor-pointer"
            >
              {/* Lead Number */}
              <td className="px-4 py-4 font-data-mono text-text-secondary font-bold pl-6 text-[13px]">
                #{lead.lead_number || "—"}
              </td>

              {/* Name */}
              <td className="px-6 py-4">
                <Link
                  href={`/leads/${lead.id}`}
                  className="font-bold text-[15px] text-text-primary hover:text-primary transition-colors hover:underline block font-body-md"
                >
                  {lead.full_name}
                </Link>
                {lead.email && (
                  <span className="text-[12px] text-text-secondary block mt-0.5">
                    {lead.email}
                  </span>
                )}
              </td>

              {/* Status */}
              <td className="px-6 py-4">
                <LeadStatusBadge status={lead.status} />
              </td>

              {/* Phone */}
              <td className="px-6 py-4 text-text-primary font-bold text-[15px] tracking-wide font-data-mono">
                {lead.phone || <span className="text-text-disabled font-normal">—</span>}
              </td>

              {/* Vehicle */}
              <td className="px-6 py-4 text-text-primary font-semibold text-[15px]">
                {lead.vehicle_interest ? (
                  <span className="text-primary font-bold">
                    {lead.vehicle_interest}
                  </span>
                ) : (
                  <span className="text-text-disabled font-normal">—</span>
                )}
              </td>

              {/* Source */}
              <td className="px-6 py-4 text-[14px]">
                <span className="text-text-secondary">
                  {formatSource(lead.source)}
                </span>
                {lead.campaign_name && (
                  <span className="text-[12px] text-primary font-medium block mt-0.5">
                    {lead.campaign_name}
                  </span>
                )}
              </td>

              {/* Assigned To */}
              <td className="px-6 py-4 text-text-primary text-[14px]">
                {lead.assignee ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-border-strong flex items-center justify-center text-[11px] font-bold select-none">
                      {lead.assignee.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{lead.assignee.full_name}</span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[12px] text-warning bg-warning/5 border border-warning/10 px-2.5 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                    Sin asignar
                  </span>
                )}
              </td>

              {/* Date */}
              <td className="px-6 py-4 text-text-secondary text-[13px] font-data-mono">
                {formatDate(lead.created_at)}
              </td>

              {/* Actions: Borrar Lead */}
              <td className="py-4 pr-4 pl-1 text-right w-[44px]" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleDeleteLead(lead.id, lead.full_name)}
                  disabled={isPending}
                  className="text-text-secondary hover:text-danger rounded-lg p-1.5 hover:bg-surface-container-high transition-all inline-flex items-center justify-center cursor-pointer disabled:opacity-50"
                  title={`Eliminar lead ${lead.full_name}`}
                >
                  <span className="material-symbols-outlined text-[19px]">delete</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
