"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeadWithAssignee } from "@/types/leads";
import type { ProfileSummary } from "@/types/profiles";
import LeadAssignDropdown from "./LeadAssignDropdown";

type UnassignedLeadsPanelProps = {
  unassignedLeads: LeadWithAssignee[];
  comerciales: ProfileSummary[];
};

export default function UnassignedLeadsPanel({
  unassignedLeads,
  comerciales,
}: UnassignedLeadsPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (unassignedLeads.length === 0) return null;

  const handleSuccess = () => {
    router.refresh();
  };

  const formatSource = (src: string) => {
    return src.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="bg-warning/5 border border-warning/20 rounded-xl p-5 shadow-sm space-y-3.5 text-left select-none shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse"></span>
          <h3 className="font-section-subtitle text-[15px] font-semibold text-text-primary">
            Leads Pendientes de Asignar ({unassignedLeads.length})
          </h3>
        </div>
        <span className="text-[10px] bg-warning/10 text-warning px-2 py-0.5 rounded border border-warning/20 font-bold uppercase tracking-wider">
          Acción Requerida
        </span>
      </div>

      <div className="divide-y divide-border-default/30 max-h-[220px] overflow-y-auto pr-1">
        {unassignedLeads.map((lead) => (
          <div
            key={lead.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="space-y-0.5">
              <span className="font-medium text-text-primary text-[14px]">
                {lead.full_name}
              </span>
              <div className="flex items-center gap-3 text-[11px] text-text-secondary flex-wrap">
                <span>Canal: <strong className="text-primary">{formatSource(lead.source)}</strong></span>
                {lead.vehicle_interest && (
                  <span>Interés: <strong className="text-text-primary">{lead.vehicle_interest}</strong></span>
                )}
                {lead.phone && <span>Tel: {lead.phone}</span>}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="text-[11px] text-text-secondary font-medium">Asignar a:</span>
              <LeadAssignDropdown
                leadId={lead.id}
                assignedTo={lead.assigned_to}
                isAdmin={true}
                comerciales={comerciales}
                onSuccess={handleSuccess}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
