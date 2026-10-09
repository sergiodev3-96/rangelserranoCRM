"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { WhatsAppTemplate, WhatsAppTemplateCategory } from "@/types/whatsapp";
import {
  createWhatsAppTemplate,
  updateWhatsAppTemplate,
  deleteWhatsAppTemplate,
} from "@/lib/actions/whatsapp-templates";
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
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [label, setLabel] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<WhatsAppTemplateCategory>("primary");
  const [sortOrder, setSortOrder] = useState<string>("1");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedTemplate(null);
    setLabel("");
    setBody("");
    setCategory("primary");
    setSortOrder((initialTemplates.length + 1).toString());
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (template: WhatsAppTemplate) => {
    setModalMode("edit");
    setSelectedTemplate(template);
    setLabel(template.label);
    setBody(template.body);
    setCategory(template.category);
    setSortOrder((template.sort_order ?? 0).toString());
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

    const parsedOrder = parseInt(sortOrder) || 0;

    setErrorMsg(null);
    startTransition(async () => {
      let result;
      if (modalMode === "create") {
        result = await createWhatsAppTemplate({
          label: label.trim(),
          body: body.trim(),
          category,
          sort_order: parsedOrder,
        });
      } else {
        if (!selectedTemplate) return;
        result = await updateWhatsAppTemplate({
          id: selectedTemplate.id,
          label: label.trim(),
          body: body.trim(),
          category,
          sort_order: parsedOrder,
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

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "success":
        return "Inicial / Saludo";
      case "warning":
        return "Seguimiento";
      case "error":
        return "Rechazo";
      case "info":
        return "Informativo";
      case "secondary":
        return "Neutro";
      case "primary":
      default:
        return "General";
    }
  };

  const filteredTemplates = initialTemplates
    .filter(
      (tmpl) =>
        tmpl.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tmpl.body.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <div className="p-6 space-y-6 text-left bg-bg-base text-text-primary">
      {/* Header & Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="font-headline-lg text-[28px] text-primary tracking-tight leading-tight mb-1">
            Plantillas de WhatsApp
          </h1>
          <p className="font-body-sm text-[13px] text-text-secondary mt-1">
            Crea y edita mensajes predefinidos utilizando las variables dinámicas{" "}
            <code className="text-primary font-semibold font-data-mono">{`{name}`}</code> y{" "}
            <code className="text-primary font-semibold font-data-mono">{`{vehicle}`}</code>.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] transition-all duration-300 rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer select-none self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_comment</span>
          Nueva Plantilla
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface border border-border-default rounded-xl p-4">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar plantilla o contenido..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-input border border-border-default rounded-lg py-2 pl-9 pr-4 text-[13px] text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 text-text-secondary text-[13px] self-end sm:self-auto">
          <span>Total plantillas:</span>
          <span className="font-semibold text-text-primary">{initialTemplates.length}</span>
        </div>
      </div>

      {/* Table / Rows List */}
      <div className="w-full border border-border-default rounded-xl bg-surface overflow-x-auto shadow-sm">
        <table className="w-full border-collapse text-left min-w-[760px]">
          <thead>
            <tr className="border-b border-border-default bg-surface-container-low select-none">
              <th className="px-5 py-3.5 font-field-label text-[11px] text-text-secondary uppercase tracking-wider w-16 text-center">
                Orden
              </th>
              <th className="px-5 py-3.5 font-field-label text-[11px] text-text-secondary uppercase tracking-wider w-40">
                Categoría
              </th>
              <th className="px-5 py-3.5 font-field-label text-[11px] text-text-secondary uppercase tracking-wider w-48">
                Nombre de Plantilla
              </th>
              <th className="px-5 py-3.5 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                Mensaje
              </th>
              <th className="px-5 py-3.5 font-field-label text-[11px] text-text-secondary uppercase tracking-wider text-right w-32">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle font-body-sm text-[13px]">
            {filteredTemplates.map((template) => (
              <tr
                key={template.id}
                className="hover:bg-surface-container-high/40 transition-colors"
              >
                {/* Order */}
                <td className="px-5 py-4 text-center font-data-mono text-text-tertiary text-[13px]">
                  #{template.sort_order ?? 0}
                </td>

                {/* Category */}
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center text-[10px] px-2.5 py-1 rounded-md border font-bold uppercase tracking-wider select-none ${getCategoryClass(
                      template.category
                    )}`}
                  >
                    {getCategoryLabel(template.category)}
                  </span>
                </td>

                {/* Label */}
                <td className="px-5 py-4 font-semibold text-text-primary text-[14px]">
                  {template.label}
                </td>

                {/* Body Preview */}
                <td className="px-5 py-4">
                  <p className="text-[12px] text-text-secondary leading-relaxed line-clamp-2 bg-bg-input/60 rounded-lg p-2.5 border border-border-default/40">
                    {template.body}
                  </p>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(template)}
                      disabled={isPending}
                      className="p-1.5 text-text-secondary hover:text-primary rounded-lg hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1 text-[12px] px-2.5 font-medium"
                      title="Editar plantilla"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(template.id, template.label)}
                      disabled={isPending}
                      className="p-1.5 text-text-secondary hover:text-danger rounded-lg hover:bg-danger/10 transition-colors cursor-pointer flex items-center gap-1 text-[12px] px-2.5 font-medium"
                      title="Eliminar plantilla"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredTemplates.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-text-secondary">
                  <span className="material-symbols-outlined text-4xl mb-2 text-text-tertiary block">
                    sms_failed
                  </span>
                  <p className="font-semibold text-text-primary text-[14px]">
                    No se encontraron plantillas
                  </p>
                  <p className="text-[12px] text-text-tertiary mt-1">
                    Prueba con otro término de búsqueda o crea una nueva plantilla.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isPending) setIsModalOpen(false);
        }}
        title={
          modalMode === "create"
            ? "Nueva Plantilla de WhatsApp"
            : "Editar Plantilla de WhatsApp"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {errorMsg && (
            <div className="bg-error-container/20 border border-error/20 text-danger rounded-lg p-3 font-body-sm text-[13px]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Label input */}
            <div className="space-y-1 md:col-span-1">
              <label className="font-field-label text-[11px] text-text-secondary uppercase block select-none">
                Nombre de la Plantilla *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Saludo Inicial"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={isPending}
                className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary"
              />
            </div>

            {/* Category Select */}
            <div className="space-y-1 md:col-span-1">
              <label className="font-field-label text-[11px] text-text-secondary uppercase block select-none">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as WhatsAppTemplateCategory)
                }
                disabled={isPending}
                className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="success">Inicial / Saludo (Verde)</option>
                <option value="primary">General (Violeta)</option>
                <option value="warning">Seguimiento (Naranja)</option>
                <option value="error">Rechazo (Rojo)</option>
                <option value="info">Informativo (Azul)</option>
                <option value="secondary">Neutro (Gris)</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="space-y-1 md:col-span-1">
              <label className="font-field-label text-[11px] text-text-secondary uppercase block select-none">
                Orden de Posición (#)
              </label>
              <input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                disabled={isPending}
                className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-data-mono text-[14px] focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Body Textarea */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-field-label text-[11px] text-text-secondary uppercase block select-none">
                Mensaje de la Plantilla *
              </label>
              <span className="text-[10px] text-text-secondary font-medium">
                Variables:{" "}
                <code className="text-primary font-bold font-data-mono">{`{name}`}</code>
                ,{" "}
                <code className="text-primary font-bold font-data-mono">{`{vehicle}`}</code>
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
              disabled={isPending}
              className="bg-primary text-on-primary hover:bg-primary-hover transition-colors rounded-lg py-2 px-4 text-[13px] font-medium shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isPending
                ? "Guardando..."
                : modalMode === "create"
                ? "Crear Plantilla"
                : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
