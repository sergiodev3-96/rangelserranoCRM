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
  leadPhone?: string | null;
  leadVehicle: string | null;
};

export default function WhatsAppTemplatesModal({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  leadName,
  leadPhone,
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
          // Ordenar plantillas por numeración (sort_order) y fallback a prioridad
          const getTemplatePriority = (tmpl: WhatsAppTemplate): number => {
            const lbl = tmpl.label.toLowerCase();
            if (lbl.includes("saludo")) return 1;
            if (lbl.includes("contacto") || lbl.includes("bienvenida") || lbl.includes("inicial")) return 2;
            if (tmpl.category === "success") return 3;
            if (tmpl.category === "primary") return 4;
            if (tmpl.category === "warning" || lbl.includes("seguimiento")) return 5;
            if (tmpl.category === "error" || lbl.includes("rechazad")) return 10;
            return 6;
          };

          const sorted = [...res.data].sort((a, b) => {
            const orderA = Number(a.sort_order ?? 0);
            const orderB = Number(b.sort_order ?? 0);
            if (orderA !== orderB && orderA > 0 && orderB > 0) {
              return orderA - orderB;
            }
            if (orderA > 0 && orderB === 0) return -1;
            if (orderA === 0 && orderB > 0) return 1;
            return getTemplatePriority(a) - getTemplatePriority(b);
          });

          setTemplates(sorted);
          if (sorted.length > 0) {
            setSelectedTemplate(sorted[0]);
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

  const handleOpenConversation = () => {
    if (!leadPhone) {
      setErrorMessage("El cliente no tiene un número de teléfono registrado.");
      return;
    }
    const cleanPhone = leadPhone.replace(/\D/g, "");
    let formattedPhone = cleanPhone;
    if (cleanPhone.length === 9 && (cleanPhone.startsWith("6") || cleanPhone.startsWith("7") || cleanPhone.startsWith("9"))) {
      formattedPhone = "34" + cleanPhone;
    }
    window.open(`https://web.whatsapp.com/send?phone=${formattedPhone}`, "_blank");
  };

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
                  className={`w-full text-left p-3.5 bg-bg-input rounded-xl border transition-all cursor-pointer ${borderClass} ${isSelected ? "ring-1 ring-primary border-primary bg-surface-container-high/40" : ""
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-border-default mt-6 select-none">
            <button
              type="button"
              onClick={handleOpenConversation}
              disabled={!leadPhone}
              title={!leadPhone ? "No hay teléfono registrado" : "Abrir chat en WhatsApp Web sin enviar mensaje"}
              className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest text-text-primary border border-border-default hover:border-success/40 hover:text-success rounded-lg text-[13px] font-medium transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                className="w-4 h-4 fill-[#25D366]"
              >
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
              </svg>
              <span>Ver conversación</span>
            </button>

            <div className="flex items-center justify-end gap-3">
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

        </div>
    </Modal>
  );
}
