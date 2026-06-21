"use client";

import React, { useTransition } from "react";
import { assignLead } from "@/lib/actions/leads";
import type { ProfileSummary } from "@/types/profiles";

type LeadAssignDropdownProps = {
  leadId: string;
  assignedTo: string | null;
  isAdmin: boolean;
  comerciales: ProfileSummary[];
  onSuccess: () => void;
};

export default function LeadAssignDropdown({
  leadId,
  assignedTo,
  isAdmin,
  comerciales,
  onSuccess,
}: LeadAssignDropdownProps) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextAssignee = e.target.value;
    if (!nextAssignee) return;

    startTransition(async () => {
      const result = await assignLead({
        lead_id: leadId,
        assigned_to: nextAssignee,
      });

      if (result.success) {
        onSuccess();
      } else {
        alert(result.error || "No se pudo cambiar la asignación.");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-text-secondary text-[18px]">
        assignment_ind
      </span>
      <select
        value={assignedTo || ""}
        onChange={handleChange}
        disabled={isPending || !isAdmin}
        className="bg-bg-input text-text-primary border border-border-default rounded-lg px-2.5 py-1.5 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
      >
        <option value="" disabled>
          Sin asignar
        </option>
        {comerciales.map((c) => (
          <option key={c.id} value={c.id}>
            {c.full_name}
          </option>
        ))}
      </select>
      {isPending && (
        <span className="material-symbols-outlined animate-spin text-[16px] text-primary">
          sync
        </span>
      )}
    </div>
  );
}
