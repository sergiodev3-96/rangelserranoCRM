"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import Modal from "../ui/Modal";
import type { WhatsAppTemplate } from "@/types/whatsapp";
import { getWhatsAppTemplates } from "@/lib/actions/whatsapp-templates";
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
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [customBody, setCustomBody] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isPending, startTransition] = useTransition();

  const vehicleName = leadVehicle || "vehículo";

  // Pre-compile template preview
  const compileTemplate = useCallback((template: WhatsAppTemplate) => {
    return template.body
      .replace(/{name}/g, leadName)
      .replace(/{vehicle}/g, vehicleName);
  }, [leadName, vehicleName]);

  // Fetch templates from database when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingTemplates(true);
      setErrorMessage(null);
      getWhatsAppTemplates().then((res) => {
        setIsLoadingTemplates(false);
        if (res.success && res.data) {
          setTemplates(res.data);
          if (res.data.length > 0) {
            setSelectedTemplate(res.data[0]);
          } else {
            setSelectedTemplate(null);
            setCustomBody("");
          }
        } else {
          setErrorMessage(res.error || "No se pudieron cargar las plantillas.");
        }
      });
    }
  }, [isOpen]);

  // Sync preview when template selection changes
  useEffect(() => {
    if (selectedTemplate) {
      setCustomBody(compileTemplate(selectedTemplate));
      setErrorMessage(null);
    }
  }, [selectedTemplate, compileTemplate]);

  const handleSend = () => {
    if (!customBody.trim()) {
      setErrorMessage("El cuerpo del mensaje no puede estar vacío.");
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const result = await sendTemplateMessageAction({
        leadId,
        templateName: selectedTemplate ? selectedTemplate.label : "Mensaje Personalizado",
        customBody: customBody.trim(),
      });

      if (result.success && result.data) {
        onSuccess();
        onClose();
        
        // Abrir el Deep Link de WhatsApp generado automáticamente
        window.open(result.data.deepLinkUrl, "_blank");
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

        {/* Loading Indicator */}
        {isLoadingTemplates && (
          <div className="py-8 flex flex-col items-center justify-center text-text-secondary gap-2">
            <span className="material-symbols-outlined animate-spin text-2xl">sync</span>
            <span className="text-[12px]">Cargando plantillas...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingTemplates && templates.length === 0 && (
          <div className="py-6 border border-dashed border-border-default rounded-xl text-center text-text-disabled">
            <span className="material-symbols-outlined text-3xl mb-1 block">chat_bubble_outline</span>
            <span className="text-[12px]">No hay plantillas de WhatsApp creadas en el sistema.</span>
          </div>
        )}

        {/* Template Selectors */}
        {!isLoadingTemplates && templates.length > 0 && (
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {templates.map((tmpl) => {
              const isSelected = selectedTemplate?.id === tmpl.id;
              const borderClass = getCategoryBorderColor(tmpl.category);
              const textBadgeClass = getCategoryBadgeClass(tmpl.category);

              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tmpl)}
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
        )}

        {/* Message Editor / Custom Body */}
        <div className="space-y-1 pt-2">
          <label className="font-field-label text-[11px] text-text-secondary uppercase block select-none">
            Vista Previa / Personalizar Mensaje
          </label>
          <textarea
            rows={4}
            value={customBody}
            onChange={(e) => setCustomBody(e.target.value)}
            disabled={isPending || isLoadingTemplates}
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
            disabled={isPending || isLoadingTemplates || !customBody.trim()}
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
