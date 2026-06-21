"use client";

import React, { useState, useTransition } from "react";
import { createNote } from "@/lib/actions/lead-events";

type LeadNoteInputProps = {
  leadId: string;
  onSuccess: () => void;
};

export default function LeadNoteInput({
  leadId,
  onSuccess,
}: LeadNoteInputProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setError(null);
    startTransition(async () => {
      const result = await createNote({
        lead_id: leadId,
        content: content.trim(),
      });

      if (!result.success) {
        setError(result.error || "No se pudo guardar la nota.");
      } else {
        setContent("");
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-error-container/20 border border-error/20 text-danger rounded-lg p-2.5 font-body-sm text-[13px]">
          {error}
        </div>
      )}
      <div className="relative">
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escriba una nota interna sobre el seguimiento de este cliente..."
          className="w-full bg-bg-input text-text-primary placeholder:text-text-disabled border border-border-default rounded-lg px-4 py-3 font-body-sm text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 resize-none"
          disabled={isPending}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="bg-primary text-on-primary hover:shadow-[0_0_10px_rgba(108,99,255,0.3)] disabled:opacity-50 disabled:hover:shadow-none transition-all duration-300 rounded-lg py-2 px-4 flex items-center justify-center gap-1.5 font-body-sm font-medium text-[13px] cursor-pointer"
        >
          <span
            className={`material-symbols-outlined text-[16px] ${
              isPending ? "animate-spin" : ""
            }`}
          >
            {isPending ? "sync" : "send"}
          </span>
          <span>{isPending ? "Añadiendo..." : "Añadir Nota"}</span>
        </button>
      </div>
    </form>
  );
}
