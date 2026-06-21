"use client";

import React, { useTransition } from "react";
import { updateLeadStatus } from "@/lib/actions/leads";
import type { LeadStatus } from "@/types/leads";
import { LEAD_STATUS_CONFIG } from "@/types/leads";

type LeadStatusSelectorProps = {
  leadId: string;
  currentStatus: LeadStatus;
  disabled?: boolean;
  onSuccess: () => void;
};

export default function LeadStatusSelector({
  leadId,
  currentStatus,
  disabled = false,
  onSuccess,
}: LeadStatusSelectorProps) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as LeadStatus;

    startTransition(async () => {
      const result = await updateLeadStatus({
        lead_id: leadId,
        status: nextStatus,
      });

      if (result.success) {
        onSuccess();
      } else {
        alert(result.error || "No se pudo actualizar el estado.");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-text-secondary text-[18px]">
        sync_alt
      </span>
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending || disabled}
        className="bg-bg-input text-text-primary border border-border-default rounded-lg px-2.5 py-1.5 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer font-medium"
      >
        {Object.keys(LEAD_STATUS_CONFIG).map((statusKey) => (
          <option key={statusKey} value={statusKey}>
            {LEAD_STATUS_CONFIG[statusKey as LeadStatus].label}
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
