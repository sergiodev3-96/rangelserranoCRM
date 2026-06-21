"use client";

import React from "react";
import type { LeadEventWithAuthor } from "@/types/lead-events";
import { LEAD_STATUS_CONFIG } from "@/types/leads";
import type { LeadStatus } from "@/types/leads";

type LeadTimelineProps = {
  events: LeadEventWithAuthor[];
};

export default function LeadTimeline({ events }: LeadTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-text-disabled bg-surface-container/20 border border-dashed border-border-default rounded-xl select-none">
        <span className="material-symbols-outlined text-3xl mb-2">history</span>
        <p className="font-body-sm text-[13px]">
          No hay eventos registrados para este lead.
        </p>
      </div>
    );
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "note":
        return "sticky_note_2";
      case "status_change":
        return "history_toggle_off";
      case "whatsapp_sent":
        return "chat";
      case "call_logged":
        return "phone_in_talk";
      default:
        return "event";
    }
  };

  const getEventIconColor = (type: string) => {
    switch (type) {
      case "note":
        return "text-primary bg-primary/10 border-primary/20";
      case "status_change":
        return "text-warning bg-warning/10 border-warning/20";
      case "whatsapp_sent":
        return "text-success bg-success/10 border-success/20";
      case "call_logged":
        return "text-info bg-info/10 border-info/20";
      default:
        return "text-text-secondary bg-surface-container-highest border-border-strong";
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-border-default">
      {events.map((event) => {
        type EventMetadata = {
          from_status?: string;
          to_status?: string;
        };
        const isStatusChange = event.event_type === "status_change";
        const metadata = event.metadata as EventMetadata | null;

        return (
          <div key={event.id} className="relative flex flex-col gap-1 text-left">
            {/* Event dot / icon */}
            <span
              className={`absolute -left-[27px] top-0 w-6.5 h-6.5 rounded-full flex items-center justify-center border text-[14px] select-none ${getEventIconColor(
                event.event_type
              )}`}
            >
              <span className="material-symbols-outlined text-[15px]">
                {getEventIcon(event.event_type)}
              </span>
            </span>

            {/* Event header */}
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-[13px] font-semibold text-text-primary">
                {event.author.full_name}
              </span>
              <span className="font-label-xs text-[11px] text-text-disabled">
                {formatTime(event.created_at)}
              </span>
            </div>

            {/* Event content */}
            <div className="font-body-sm text-[13px] text-text-secondary pl-0.5 mt-0.5">
              {isStatusChange &&
              metadata?.from_status &&
              metadata?.to_status ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Cambió el estado de</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                      LEAD_STATUS_CONFIG[metadata.from_status as LeadStatus]
                        ?.bgClass
                    } ${
                      LEAD_STATUS_CONFIG[metadata.from_status as LeadStatus]
                        ?.textClass
                    }`}
                  >
                    {
                      LEAD_STATUS_CONFIG[metadata.from_status as LeadStatus]
                        ?.label
                    }
                  </span>
                  <span className="material-symbols-outlined text-[14px]">
                    arrow_right_alt
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                      LEAD_STATUS_CONFIG[metadata.to_status as LeadStatus]
                        ?.bgClass
                    } ${
                      LEAD_STATUS_CONFIG[metadata.to_status as LeadStatus]
                        ?.textClass
                    }`}
                  >
                    {
                      LEAD_STATUS_CONFIG[metadata.to_status as LeadStatus]
                        ?.label
                    }
                  </span>
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">
                  {event.content}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
