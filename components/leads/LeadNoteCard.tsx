"use client";

import React, { useState, useEffect, useTransition } from "react";
import type { LeadNote } from "@/types/lead-notes";
import { saveLeadNote } from "@/lib/actions/lead-notes";

type LeadNoteCardProps = {
  leadId: string;
  initialNote: LeadNote | null;
  canEdit: boolean;
};

export default function LeadNoteCard({
  leadId,
  initialNote,
  canEdit,
}: LeadNoteCardProps) {
  const [content, setContent] = useState(initialNote?.content || "");
  const [lastSavedContent, setLastSavedContent] = useState(initialNote?.content || "");
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialNote?.updated_at || null);
  const [authorName, setAuthorName] = useState<string | null>(
    initialNote?.author?.full_name || null
  );
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setContent(initialNote?.content || "");
    setLastSavedContent(initialNote?.content || "");
    setUpdatedAt(initialNote?.updated_at || null);
    setAuthorName(initialNote?.author?.full_name || null);
  }, [initialNote]);

  const hasChanges = content !== lastSavedContent;

  const handleSave = () => {
    if (!canEdit || isPending) return;

    setErrorMessage(null);
    setSavedSuccess(false);

    startTransition(async () => {
      const result = await saveLeadNote(leadId, content);
      if (result.success && result.data) {
        setLastSavedContent(result.data.content);
        setUpdatedAt(result.data.updated_at);
        setAuthorName(result.data.author?.full_name || null);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      } else {
        setErrorMessage(result.error || "No se pudo guardar la nota.");
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  const formatLastUpdated = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="glass-card-lead rounded-xl p-5 border border-border-default space-y-4 bg-surface flex flex-col h-full min-h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-default pb-3 select-none shrink-0">
        <h2 className="font-section-subtitle text-[18px] text-text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[22px]">
            sticky_note_2
          </span>
          Notas
        </h2>
        {/* Status indicator */}
        <div className="flex items-center gap-2 text-[11px]">
          {hasChanges ? (
            <span className="text-warning font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              Sin guardar
            </span>
          ) : savedSuccess ? (
            <span className="text-success font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check</span>
              Guardado
            </span>
          ) : updatedAt ? (
            <span className="text-text-secondary font-data-mono hidden sm:inline">
              Modif.: {formatLastUpdated(updatedAt)}
              {authorName ? ` (${authorName})` : ""}
            </span>
          ) : null}
        </div>
      </div>

      {errorMessage && (
        <div className="bg-error-container/20 border border-error/20 text-danger rounded-lg p-2.5 font-body-sm text-[12px] shrink-0">
          {errorMessage}
        </div>
      )}

      {/* Single editable textarea */}
      <div className="flex-1 flex flex-col min-h-[380px] relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!canEdit || isPending}
          placeholder={
            canEdit
              ? "Escribe aquí las observaciones, acuerdos o información relevante sobre este cliente..."
              : "No hay notas registradas para este lead."
          }
          className="w-full flex-1 min-h-[360px] bg-bg-input text-text-primary placeholder:text-text-disabled border border-border-default rounded-xl p-4 font-body-sm text-[13px] leading-relaxed focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 resize-none disabled:opacity-75 disabled:cursor-not-allowed"
        />
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border-default/40 shrink-0">
        <span className="text-[11px] text-text-secondary select-none hidden sm:inline">
          Presiona <kbd className="px-1.5 py-0.5 rounded bg-surface-container-high border border-border-default font-data-mono text-[10px]">Ctrl+Enter</kbd> para guardar
        </span>

        {canEdit && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            className="ml-auto bg-primary text-on-primary hover:shadow-[0_0_12px_rgba(108,99,255,0.35)] disabled:opacity-40 disabled:hover:shadow-none transition-all duration-300 rounded-lg py-2 px-4 flex items-center justify-center gap-2 font-body-sm font-semibold text-[13px] cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-[16px] ${
                isPending ? "animate-spin" : ""
              }`}
            >
              {isPending ? "sync" : "save"}
            </span>
            <span>{isPending ? "Guardando..." : "Guardar Notas"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
