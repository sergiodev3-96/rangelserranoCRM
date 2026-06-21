import React from "react";
import Link from "next/link";
import type { LeadWithAssignee } from "@/types/leads";
import LeadStatusBadge from "./LeadStatusBadge";

type LeadTableProps = {
  leads: LeadWithAssignee[];
};

export default function LeadTable({ leads }: LeadTableProps) {
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

  return (
    <div className="w-full overflow-x-auto border border-border-default rounded-xl bg-surface">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border-default bg-surface-container-low select-none">
            <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
              Nombre Cliente
            </th>
            <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
              Estado Solicitud
            </th>
            <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
              Teléfono
            </th>
            <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
              Interés Vehículo
            </th>
            <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
              Origen (Canal)
            </th>
            <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
              Asignado A
            </th>
            <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
              Fecha Registro
            </th>
            <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider text-right">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle font-body-sm text-[13px]">
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="hover:bg-surface-container-high/40 transition-colors"
            >
              {/* Name */}
              <td className="px-6 py-4">
                <Link
                  href={`/leads/${lead.id}`}
                  className="font-medium text-text-primary hover:text-primary transition-colors hover:underline block font-body-md"
                >
                  {lead.full_name}
                </Link>
                {lead.email && (
                  <span className="text-[11px] text-text-secondary block">
                    {lead.email}
                  </span>
                )}
              </td>

              {/* Status */}
              <td className="px-6 py-4">
                <LeadStatusBadge status={lead.status} />
              </td>

              {/* Phone */}
              <td className="px-6 py-4 text-text-primary">
                {lead.phone || <span className="text-text-disabled">—</span>}
              </td>

              {/* Vehicle */}
              <td className="px-6 py-4 text-text-primary font-medium">
                {lead.vehicle_interest || (
                  <span className="text-text-disabled font-normal">—</span>
                )}
              </td>

              {/* Source */}
              <td className="px-6 py-4">
                <span className="text-text-secondary">
                  {formatSource(lead.source)}
                </span>
                {lead.campaign_name && (
                  <span className="text-[10px] text-primary block">
                    {lead.campaign_name}
                  </span>
                )}
              </td>

              {/* Assigned To */}
              <td className="px-6 py-4 text-text-primary">
                {lead.assignee ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-border-strong flex items-center justify-center text-[10px] font-bold select-none">
                      {lead.assignee.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span>{lead.assignee.full_name}</span>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-warning bg-warning/5 border border-warning/10 px-2 py-0.5 rounded">
                    <span className="w-1 h-1 rounded-full bg-warning animate-pulse" />
                    Sin asignar
                  </span>
                )}
              </td>

              {/* Date */}
              <td className="px-6 py-4 text-text-secondary">
                {formatDate(lead.created_at)}
              </td>

              {/* Actions */}
              <td className="px-6 py-4 text-right">
                <Link
                  href={`/leads/${lead.id}`}
                  className="inline-flex items-center justify-center text-primary hover:text-on-primary hover:bg-primary border border-primary/20 px-3 py-1.5 rounded-lg transition-all font-medium gap-1 text-[12px]"
                >
                  Ver Ficha
                  <span className="material-symbols-outlined text-[14px]">
                    arrow_forward
                  </span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
