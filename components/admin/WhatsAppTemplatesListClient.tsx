"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { WhatsAppTemplate, WhatsAppTemplateCategory } from "@/types/whatsapp";
import { createWhatsAppTemplate, updateWhatsAppTemplate, deleteWhatsAppTemplate } from "@/lib/actions/whatsapp-templates";
import Modal from "../ui/Modal";

type WhatsAppTemplatesListClientProps = {
  initialTemplates: WhatsAppTemplate[];
};

export default function WhatsAppTemplatesListClient({
  initialTemplates,
}: WhatsAppTemplatesListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);

  // Form states
  const [label, setLabel] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<WhatsAppTemplateCategory>("primary");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedTemplate(null);
    setLabel("");
    setBody("");
    setCategory("primary");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (template: WhatsAppTemplate) => {
    setModalMode("edit");
    setSelectedTemplate(template);
    setLabel(template.label);
    setBody(template.body);
    setCategory(template.category);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, label: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la plantilla "${label}"?`)) return;

    startTransition(async () => {
      const result = await deleteWhatsAppTemplate(id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "No se pudo eliminar la plantilla.");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !body.trim()) {
      setErrorMsg("Todos los campos son obligatorios.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      let result;
      if (modalMode === "create") {
        result = await createWhatsAppTemplate({
          label: label.trim(),
          body: body.trim(),
          category,
        });
      } else {
        if (!selectedTemplate) return;
        result = await updateWhatsAppTemplate({
          id: selectedTemplate.id,
          label: label.trim(),
          body: body.trim(),
          category,
        });
      }

      if (result.success) {
        setIsModalOpen(false);
        router.refresh();
      } else {
        setErrorMsg(result.error || "Ocurrió un error al guardar la plantilla.");
      }
    });
  };

  const getCategoryClass = (cat: string) => {
    switch (cat) {
      case "success":
        return "bg-success/10 text-success border-success/20";
      case "warning":
        return "bg-warning/10 text-warning border-warning/20";
      case "error":
        return "bg-danger/10 text-danger border-danger/20";
      case "info":
        return "bg-info/10 text-info border-info/20";
      case "secondary":
        return "bg-surface-container-highest text-text-secondary border-border-default";
      case "primary":
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <div className="p-6 space-y-6 text-left bg-bg-base text-text-primary">
      {/* Header & Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="font-headline-lg text-[28px] text-primary tracking-tight leading-tight mb-1">
            Plantillas de WhatsApp
          </h1>
          <p className="font-body-sm text-[13px] text-text-secondary mt-1">
            Crea y edita mensajes predefinidos utilizando las variables dinámicas <code className="text-primary font-semibold font-data-mono">{`{name}`}</code> y <code className="text-primary font-semibold font-data-mono">{`{vehicle}`}</code>.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] transition-all duration-300 rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer select-none"
        >
          <span className="material-symbols-outlined text-[18px]">add_comment</span>
          Nueva Plantilla
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialTemplates.map((template) => (
          <div
            key={template.id}
            className="glass-card-lead border border-border-default rounded-xl p-5 flex flex-col justify-between hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-300 group"
          >
            <div className="space-y-3.5">
              {/* Card Title & Category */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-text-primary font-body-md text-[15px] group-hover:text-primary transition-colors">
                  {template.label}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider select-none shrink-0 ${getCategoryClass(template.category)}`}>
                  {template.category}
                </span>
              </div>

              {/* Message Body Preview */}
              <div className="bg-bg-input/60 rounded-lg p-3.5 border border-border-default/40">
                <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap font-body-sm">
                  {template.body}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 mt-5 pt-3.5 border-t border-border-default/30 select-none">
              <button
                type="button"
                onClick={() => openEditModal(template)}
                disabled={isPending}
                className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Editar
              </button>
              <span className="text-border-default text-[10px]">|</span>
              <button
                type="button"
                onClick={() => handleDelete(template.id, template.label)}
                disabled={isPending}
                className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-danger transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Eliminar
              </button>
            </div>
          </div>
        ))}

        {initialTemplates.length === 0 && (
          <div className="col-span-full py-16 border border-dashed border-border-default rounded-xl text-center text-text-disabled/40 select-none">
            <span className="material-symbols-outlined text-5xl mb-2">sms_failed</span>
            <p className="font-body-md font-semibold text-text-secondary">No hay plantillas creadas</p>
            <p className="font-body-sm text-[12px] mt-1">Crea tu primera plantilla utilizando el botón &quot;Nueva Plantilla&quot;.</p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isPending) setIsModalOpen(false);
        }}
        title={modalMode === "create" ? "Nueva Plantilla de WhatsApp" : "Editar Plantilla de WhatsApp"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {errorMsg && (
            <div className="bg-error-container/20 border border-error/20 text-danger rounded-lg p-3 font-body-sm text-[13px]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Label input */}
            <div className="space-y-1">
              <label className="font-field-label text-[11px] text-text-secondary uppercase block select-none">
                Nombre de la Plantilla
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Recordatorio de cita"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={isPending}
                className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-4 py-2.5 font-body-sm text-[13px] focus:outline-none focus:border-primary"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-1">
              <label className="font-field-label text-[11px] text-text-secondary uppercase block select-none">
                Categoría (Estilo Visual)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WhatsAppTemplateCategory)}
                disabled={isPending}
                className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-4 py-2.5 font-body-sm text-[13px] focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="primary">General (Violeta)</option>
                <option value="success">Inicial (Verde)</option>
                <option value="warning">Seguimiento (Naranja)</option>
                <option value="error">Rechazo (Rojo)</option>
                <option value="info">Informativo (Azul)</option>
                <option value="secondary">Neutro (Gris)</option>
              </select>
            </div>
          </div>

          {/* Body Textarea */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-field-label text-[11px] text-text-secondary uppercase block select-none">
                Mensaje de la Plantilla
              </label>
              <span className="text-[10px] text-text-secondary font-medium">
                Variables: <code className="text-primary font-bold font-data-mono">{`{name}`}</code>, <code className="text-primary font-bold font-data-mono">{`{vehicle}`}</code>
              </span>
            </div>
            <textarea
              rows={5}
              required
              placeholder="Hola {name}, le contactamos por su interés en el {vehicle}..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={isPending}
              className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-4 py-3 font-body-sm text-[13px] focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-default mt-6 select-none">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-border-default text-text-secondary hover:text-text-primary rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
              disabled={isPending}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={isPending || !label.trim() || !body.trim()}
              className="px-5 py-2 bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] disabled:opacity-50 disabled:hover:shadow-none transition-all rounded-lg text-[13px] font-medium cursor-pointer flex items-center gap-1.5"
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Guardar Plantilla
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
