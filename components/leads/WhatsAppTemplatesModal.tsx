"use client";

import React, { useState, useTransition, useEffect } from "react";
import Modal from "../ui/Modal";
import { WHATSAPP_TEMPLATES } from "@/lib/whatsapp/templates";
import type { WhatsAppTemplateName, WhatsAppTemplate } from "@/lib/whatsapp/templates";
import { sendTemplateMessageAction } from "@/lib/actions/whatsapp";

type WhatsAppTemplatesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leadId: string;
  leadName: string;
  leadVehicle: string | null;
};

export default function WhatsAppTemplatesModal({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  leadName,
  leadVehicle,
}: WhatsAppTemplatesModalProps) {
  const [selectedTemplateName, setSelectedTemplateName] = useState<WhatsAppTemplateName>("contacto_inicial");
  const [customBody, setCustomBody] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const vehicleName = leadVehicle || "vehículo";

  // Pre-compile template preview
  const compileTemplate = (template: WhatsAppTemplate) => {
    return template.body
      .replace(/{name}/g, leadName)
      .replace(/{vehicle}/g, vehicleName);
  };

  // Sync preview when template selection changes
  useEffect(() => {
    if (isOpen) {
      const template = WHATSAPP_TEMPLATES.find((t) => t.name === selectedTemplateName);
      if (template) {
        setCustomBody(compileTemplate(template));
      }
      setErrorMessage(null);
    }
  }, [isOpen, selectedTemplateName, leadName, vehicleName]);

  const handleSend = () => {
    if (!customBody.trim()) {
      setErrorMessage("El cuerpo del mensaje no puede estar vacío.");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const result = await sendTemplateMessageAction({
        leadId,
        templateName: selectedTemplateName,
        customBody: customBody.trim(),
      });

      if (result.success) {
        onSuccess();
        onClose();
        alert("Mensaje de WhatsApp simulado enviado y registrado en el historial.");
      } else {
        setErrorMessage(result.error || "Error al enviar WhatsApp.");
      }
    });
  };

  const getCategoryBorderColor = (category: string) => {
    switch (category) {
      case "success":
        return "hover:border-success/50 border-border-default";
      case "warning":
        return "hover:border-warning/50 border-border-default";
      case "primary":
        return "hover:border-primary/50 border-border-default";
      case "error":
        return "hover:border-danger/50 border-border-default";
      default:
        return "hover:border-border-strong border-border-default";
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "primary":
        return "text-primary";
      case "error":
        return "text-danger";
      default:
        return "text-text-secondary";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Plantillas de WhatsApp">
      <div className="space-y-4 text-left">
        {errorMessage && (
          <div className="bg-error-container/20 border border-error/20 text-danger rounded-lg p-3 font-body-sm text-[13px]">
            {errorMessage}
          </div>
        )}

        <div className="text-[11px] text-text-secondary uppercase tracking-widest font-semibold pb-1 select-none">
          Cliente: <span className="text-text-primary">{leadName}</span>
        </div>

        {/* Template Selectors */}
        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
          {WHATSAPP_TEMPLATES.map((tmpl) => {
            const isSelected = selectedTemplateName === tmpl.name;
            const borderClass = getCategoryBorderColor(tmpl.category);
            const textBadgeClass = getCategoryBadgeClass(tmpl.category);

            return (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => setSelectedTemplateName(tmpl.name)}
                disabled={isPending}
                className={`w-full text-left p-3.5 bg-bg-input rounded-xl border transition-all cursor-pointer ${borderClass} ${
                  isSelected ? "ring-1 ring-primary border-primary bg-surface-container-high/40" : ""
                }`}
              >
                <p className={`text-[10px] font-bold uppercase mb-1.5 ${textBadgeClass}`}>
                  {tmpl.label}
                </p>
                <p className="text-[12px] text-text-primary leading-normal line-clamp-2">
                  {compileTemplate(tmpl)}
                </p>
              </button>
            );
          })}
        </div>

        {/* Message Editor / Custom Body */}
        <div className="space-y-1 pt-2">
          <label className="font-field-label text-[11px] text-text-secondary uppercase block select-none">
            Vista Previa / Personalizar Mensaje
          </label>
          <textarea
            rows={4}
            value={customBody}
            onChange={(e) => setCustomBody(e.target.value)}
            disabled={isPending}
            className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-4 py-3 font-body-sm text-[13px] focus:outline-none focus:border-primary resize-none"
          />
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-default mt-6 select-none">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border-default text-text-secondary hover:text-text-primary rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
            disabled={isPending}
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSend}
            disabled={isPending || !customBody.trim()}
            className="px-5 py-2 bg-success text-inverse-on-surface hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] disabled:opacity-50 disabled:hover:shadow-none transition-all rounded-lg text-[13px] font-medium cursor-pointer flex items-center gap-1.5"
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                Enviando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">send</span>
                Enviar WhatsApp
              </>
            )}
          </button>
        </div>

      </div>
    </Modal>
  );
}
