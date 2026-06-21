import React from "react";
import type { LeadStatus } from "@/types/leads";
import { LEAD_STATUS_CONFIG } from "@/types/leads";
import Badge from "@/components/ui/Badge";

type LeadStatusBadgeProps = {
  status: LeadStatus;
};

export default function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const config = LEAD_STATUS_CONFIG[status];

  if (!config) return null;

  return (
    <Badge
      className={`${config.bgClass} ${config.textClass} ${config.borderClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      <span>{config.label}</span>
    </Badge>
  );
}
