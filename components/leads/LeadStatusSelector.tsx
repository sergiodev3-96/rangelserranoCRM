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

  const handleChangeValue = (nextStatus: LeadStatus) => {
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
    <div className="flex flex-col gap-2 w-full select-none">
      {isPending && (
        <div className="flex items-center gap-1.5 text-[11px] text-primary animate-pulse mb-1 font-semibold">
          <span className="material-symbols-outlined animate-spin text-[14px]">sync</span>
          Actualizando estado...
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
        {Object.keys(LEAD_STATUS_CONFIG).map((statusKey) => {
          const status = statusKey as LeadStatus;
          const config = LEAD_STATUS_CONFIG[status];
          const isActive = currentStatus === status;

          return (
            <button
              key={statusKey}
              type="button"
              disabled={isPending || disabled}
              onClick={() => {
                if (isActive) return;
                handleChangeValue(status);
              }}
              className={`text-left px-3 py-2 rounded-lg border text-[12px] font-semibold transition-all duration-200 flex items-center justify-between cursor-pointer ${
                isActive
                  ? `${config.bgClass} ${config.textClass} ${config.borderClass} shadow-[0_2px_8px_rgba(0,0,0,0.05)] scale-[1.01]`
                  : "bg-surface hover:bg-surface-container-high text-text-secondary border-border-default/50 hover:border-border-default"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isActive ? config.dotClass : "bg-text-disabled/40"}`} />
                <span>{config.label}</span>
              </div>
              {isActive && (
                <span className="material-symbols-outlined text-[15px] text-current font-bold">
                  check
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
