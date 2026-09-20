"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DocumentTemplate,
  TemplateId,
  ReservaContent,
  GarantiaContent,
  ContratoContent,
} from "@/types/document-templates";
import {
  updateDocumentTemplate,
  resetDocumentTemplate,
} from "@/lib/actions/document-templates";

type Props = {
  initialTemplates: DocumentTemplate[];
};

export default function DocumentTemplatesClient({ initialTemplates }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<TemplateId>("reserva_venta");
  const [templates, setTemplates] = useState<DocumentTemplate[]>(initialTemplates);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const activeTemplate = templates.find((t) => t.id === selectedId) || templates[0];

  const updateActiveContent = (newContent: ReservaContent | GarantiaContent | ContratoContent) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === selectedId ? { ...t, content: newContent } : t))
    );
  };

  const handleSave = () => {
    setStatusMessage(null);
    startTransition(async () => {
      const res = await updateDocumentTemplate(activeTemplate.id, activeTemplate.content);
      if (res.success) {
        setStatusMessage({ text: "Plantilla guardada correctamente", type: "success" });
        router.refresh();
      } else {
        setStatusMessage({ text: res.error || "Error al guardar la plantilla", type: "error" });
      }
    });
  };

  const handleReset = () => {
    if (!confirm("¿Deseas restaurar los textos por defecto de esta plantilla? Se perderán las modificaciones no guardadas.")) {
      return;
    }
    setStatusMessage(null);
    startTransition(async () => {
      const res = await resetDocumentTemplate(activeTemplate.id);
      if (res.success) {
        setStatusMessage({ text: "Plantilla restaurada a los valores originales", type: "success" });
        router.refresh();
      } else {
        setStatusMessage({ text: res.error || "Error al restaurar plantilla", type: "error" });
      }
    });
  };

  const copyVariable = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setStatusMessage({ text: `Variable ${tag} copiada al portapapeles`, type: "success" });
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const variablesList = [
    { tag: "{nombre_cliente}", desc: "Nombre y apellidos del comprador" },
    { tag: "{dni_nie}", desc: "DNI o NIE del cliente" },
    { tag: "{direccion_cliente}", desc: "Domicilio completo del cliente" },
    { tag: "{codigo_postal}", desc: "Código postal" },
    { tag: "{ciudad}", desc: "Municipio o localidad" },
    { tag: "{provincia}", desc: "Provincia" },
    { tag: "{telefono}", desc: "Teléfono de contacto" },
    { tag: "{email}", desc: "Correo electrónico" },
    { tag: "{vehiculo_marca_modelo}", desc: "Marca y modelo del vehículo" },
    { tag: "{vehiculo_matricula}", desc: "Matrícula" },
    { tag: "{vehiculo_vin}", desc: "Número de chasis / VIN" },
    { tag: "{vehiculo_kms}", desc: "Kilometraje actual" },
    { tag: "{vehiculo_precio}", desc: "Precio pactado (€)" },
    { tag: "{importe_reserva}", desc: "Importe de la reserva (€)" },
    { tag: "{importe_pendiente}", desc: "Importe pendiente de abonar (€)" },
    { tag: "{combustible}", desc: "Tipo de combustible" },
    { tag: "{fecha_documento}", desc: "Fecha de emisión del documento" },
    { tag: "{fecha_proxima_itv}", desc: "Fecha de próxima ITV" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-base">
      {/* Header */}
      <div className="border-b border-border-default bg-surface px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">
              article
            </span>
            <h1 className="font-page-title text-[20px] text-text-primary font-bold">
              Plantillas de Documentos
            </h1>
          </div>
          <p className="font-body-sm text-[13px] text-text-secondary mt-0.5">
            Personaliza los textos legales, cláusulas, datos de vendedor y exclusiones de los contratos y reservas.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-text-secondary hover:text-danger border border-border-default rounded-lg font-body-sm text-[13px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            title="Restaurar a valores originales"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>Restaurar original</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2 bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(79,70,229,0.35)] rounded-lg font-body-sm text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isPending ? "sync" : "save"}
            </span>
            <span>{isPending ? "Guardando..." : "Guardar Plantilla"}</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between transition-all ${
            statusMessage.type === "success"
              ? "bg-success/15 text-success border-b border-success/20"
              : "bg-danger/15 text-danger border-b border-danger/20"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">
              {statusMessage.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-text-secondary hover:text-text-primary text-[14px]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border-default bg-surface px-6 flex gap-3 overflow-x-auto select-none shrink-0">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => setSelectedId(tpl.id)}
            className={`py-3 px-4 font-body-md text-[13px] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              selectedId === tpl.id
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {tpl.id === "reserva_venta"
                ? "bookmark"
                : tpl.id === "garantia_delegada"
                ? "verified_user"
                : "history_edu"}
            </span>
            <span>{tpl.name}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Box: Datos Generales y Empresa */}
            <div className="glass-card rounded-xl p-5 border border-border-default space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border-default">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  business
                </span>
                <h2 className="font-section-subtitle text-[16px] text-text-primary font-bold">
                  Datos de la Empresa Vendedora / Garante
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Título del Documento
                  </label>
                  <input
                    type="text"
                    value={activeTemplate.content.title || ""}
                    onChange={(e) =>
                      updateActiveContent({ ...activeTemplate.content, title: e.target.value })
                    }
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>

                {"city" in activeTemplate.content && (
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Ciudad de Firma por Defecto
                    </label>
                    <input
                      type="text"
                      value={(activeTemplate.content as GarantiaContent | ContratoContent).city || ""}
                      onChange={(e) =>
                        updateActiveContent({ ...activeTemplate.content, city: e.target.value })
                      }
                      className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    value={activeTemplate.content.seller_name || ""}
                    onChange={(e) =>
                      updateActiveContent({ ...activeTemplate.content, seller_name: e.target.value })
                    }
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    CIF / NIF
                  </label>
                  <input
                    type="text"
                    value={activeTemplate.content.seller_cif || ""}
                    onChange={(e) =>
                      updateActiveContent({ ...activeTemplate.content, seller_cif: e.target.value })
                    }
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                    Domicilio Social
                  </label>
                  <input
                    type="text"
                    value={activeTemplate.content.seller_address || ""}
                    onChange={(e) =>
                      updateActiveContent({ ...activeTemplate.content, seller_address: e.target.value })
                    }
                    className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                  />
                </div>

                {"seller_iban" in activeTemplate.content && (
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      IBAN para ingreso de reserva
                    </label>
                    <input
                      type="text"
                      value={(activeTemplate.content as ReservaContent).seller_iban || ""}
                      onChange={(e) =>
                        updateActiveContent({
                          ...activeTemplate.content,
                          seller_iban: e.target.value,
                        })
                      }
                      className="w-full bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] font-mono focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Box: Cláusulas / Condiciones de Reserva */}
            {selectedId === "reserva_venta" && (
              <div className="glass-card rounded-xl p-5 border border-border-default space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border-default">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      gavel
                    </span>
                    <h2 className="font-section-subtitle text-[16px] text-text-primary font-bold">
                      Condiciones de la Reserva
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const c = (activeTemplate.content as ReservaContent).conditions || [];
                      updateActiveContent({
                        ...activeTemplate.content,
                        conditions: [...c, "Nueva cláusula de reserva..."],
                      });
                    }}
                    className="text-primary hover:text-primary-focus text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Añadir condición
                  </button>
                </div>

                <div className="space-y-3">
                  {(activeTemplate.content as ReservaContent).conditions.map((cond, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-xs font-bold text-text-tertiary mt-2.5 w-6 text-right shrink-0">
                        {idx + 1}.
                      </span>
                      <textarea
                        rows={3}
                        value={cond}
                        onChange={(e) => {
                          const c = [...(activeTemplate.content as ReservaContent).conditions];
                          c[idx] = e.target.value;
                          updateActiveContent({ ...activeTemplate.content, conditions: c });
                        }}
                        className="flex-1 bg-bg-input border border-border-default rounded-lg p-2.5 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const c = (activeTemplate.content as ReservaContent).conditions.filter(
                            (_, i) => i !== idx
                          );
                          updateActiveContent({ ...activeTemplate.content, conditions: c });
                        }}
                        className="text-text-tertiary hover:text-danger p-1 mt-2 transition-colors cursor-pointer"
                        title="Eliminar condición"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Box: Condiciones Generales (Garantía Delegada) */}
            {selectedId === "garantia_delegada" && (
              <div className="glass-card rounded-xl p-5 border border-border-default space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border-default">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      verified_user
                    </span>
                    <h2 className="font-section-subtitle text-[16px] text-text-primary font-bold">
                      Condiciones Generales de la Garantía
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const c = (activeTemplate.content as GarantiaContent).general_conditions || [];
                      updateActiveContent({
                        ...activeTemplate.content,
                        general_conditions: [...c, "Nueva condición de garantía..."],
                      });
                    }}
                    className="text-primary hover:text-primary-focus text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Añadir condición
                  </button>
                </div>

                <div className="space-y-3">
                  {(activeTemplate.content as GarantiaContent).general_conditions.map((cond, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-xs font-bold text-text-tertiary mt-2.5 w-6 text-right shrink-0">
                        {idx + 1}.
                      </span>
                      <textarea
                        rows={3}
                        value={cond}
                        onChange={(e) => {
                          const c = [...(activeTemplate.content as GarantiaContent).general_conditions];
                          c[idx] = e.target.value;
                          updateActiveContent({ ...activeTemplate.content, general_conditions: c });
                        }}
                        className="flex-1 bg-bg-input border border-border-default rounded-lg p-2.5 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const c = (
                            activeTemplate.content as GarantiaContent
                          ).general_conditions.filter((_, i) => i !== idx);
                          updateActiveContent({ ...activeTemplate.content, general_conditions: c });
                        }}
                        className="text-text-tertiary hover:text-danger p-1 mt-2 transition-colors cursor-pointer"
                        title="Eliminar condición"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Box: Cláusulas del Contrato de Compraventa */}
            {selectedId === "contrato_compraventa" && (
              <div className="glass-card rounded-xl p-5 border border-border-default space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border-default">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      gavel
                    </span>
                    <h2 className="font-section-subtitle text-[16px] text-text-primary font-bold">
                      Cláusulas del Contrato
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const c = (activeTemplate.content as ContratoContent).clauses || [];
                      updateActiveContent({
                        ...activeTemplate.content,
                        clauses: [...c, "Nueva cláusula del contrato..."],
                      });
                    }}
                    className="text-primary hover:text-primary-focus text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Añadir cláusula
                  </button>
                </div>

                <div className="space-y-3">
                  {(activeTemplate.content as ContratoContent).clauses.map((clause, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-xs font-bold text-text-tertiary mt-2.5 w-6 text-right shrink-0">
                        {idx + 1}.
                      </span>
                      <textarea
                        rows={3}
                        value={clause}
                        onChange={(e) => {
                          const c = [...(activeTemplate.content as ContratoContent).clauses];
                          c[idx] = e.target.value;
                          updateActiveContent({ ...activeTemplate.content, clauses: c });
                        }}
                        className="flex-1 bg-bg-input border border-border-default rounded-lg p-2.5 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const c = (activeTemplate.content as ContratoContent).clauses.filter(
                            (_, i) => i !== idx
                          );
                          updateActiveContent({ ...activeTemplate.content, clauses: c });
                        }}
                        className="text-text-tertiary hover:text-danger p-1 mt-2 transition-colors cursor-pointer"
                        title="Eliminar cláusula"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Box: Exclusiones de Garantía (para Garantía Delegada y Contrato) */}
            {"exclusions" in activeTemplate.content && (
              <div className="glass-card rounded-xl p-5 border border-border-default space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border-default">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-warning text-[20px]">
                      warning
                    </span>
                    <h2 className="font-section-subtitle text-[16px] text-text-primary font-bold">
                      Exclusiones de Garantía / Falta de Conformidad
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const ex = (activeTemplate.content as GarantiaContent | ContratoContent).exclusions || [];
                      updateActiveContent({
                        ...activeTemplate.content,
                        exclusions: [...ex, "Nueva exclusión..."],
                      });
                    }}
                    className="text-primary hover:text-primary-focus text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                    Añadir exclusión
                  </button>
                </div>

                <div className="space-y-2">
                  {((activeTemplate.content as GarantiaContent | ContratoContent).exclusions || []).map((exc: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <input
                        type="text"
                        value={exc}
                        onChange={(e) => {
                          const ex = [...(activeTemplate.content as GarantiaContent | ContratoContent).exclusions];
                          ex[idx] = e.target.value;
                          updateActiveContent({ ...activeTemplate.content, exclusions: ex });
                        }}
                        className="flex-1 bg-bg-input border border-border-default rounded-lg px-3 py-2 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const ex = (activeTemplate.content as GarantiaContent | ContratoContent).exclusions.filter(
                            (_: string, i: number) => i !== idx
                          );
                          updateActiveContent({ ...activeTemplate.content, exclusions: ex });
                        }}
                        className="text-text-tertiary hover:text-danger p-1 mt-1 transition-colors cursor-pointer"
                        title="Eliminar exclusión"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Box: RGPD y Jurisdicción (para Contrato) */}
            {selectedId === "contrato_compraventa" && (
              <div className="glass-card rounded-xl p-5 border border-border-default space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border-default">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    privacy_tip
                  </span>
                  <h2 className="font-section-subtitle text-[16px] text-text-primary font-bold">
                    Protección de Datos (RGPD) y Jurisdicción
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Cláusula Informativa RGPD
                    </label>
                    <textarea
                      rows={4}
                      value={(activeTemplate.content as ContratoContent).gdpr_clause || ""}
                      onChange={(e) =>
                        updateActiveContent({
                          ...activeTemplate.content,
                          gdpr_clause: e.target.value,
                        })
                      }
                      className="w-full bg-bg-input border border-border-default rounded-lg p-2.5 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-1">
                      Fuero y Jurisdicción
                    </label>
                    <textarea
                      rows={2}
                      value={(activeTemplate.content as ContratoContent).jurisdiction || ""}
                      onChange={(e) =>
                        updateActiveContent({
                          ...activeTemplate.content,
                          jurisdiction: e.target.value,
                        })
                      }
                      className="w-full bg-bg-input border border-border-default rounded-lg p-2.5 text-text-primary text-[13px] focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Variables Cheat Sheet Column (1 col) */}
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-5 border border-border-default sticky top-6">
              <div className="flex items-center gap-2 pb-2 border-b border-border-default mb-3">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  code
                </span>
                <h3 className="font-section-subtitle text-[15px] text-text-primary font-bold">
                  Variables Dinámicas
                </h3>
              </div>
              <p className="text-[12px] text-text-secondary mb-4 leading-relaxed">
                Haz clic en cualquier variable para copiarla e incluirla en cualquier cláusula o texto.
                Se rellenará automáticamente con los datos del Lead.
              </p>

              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {variablesList.map((v) => (
                  <div
                    key={v.tag}
                    onClick={() => copyVariable(v.tag)}
                    className="p-2.5 rounded-lg bg-surface-container hover:bg-primary/10 border border-border-default hover:border-primary/30 transition-all cursor-pointer group select-none"
                  >
                    <div className="flex items-center justify-between">
                      <code className="text-xs font-mono font-bold text-primary group-hover:underline">
                        {v.tag}
                      </code>
                      <span className="material-symbols-outlined text-[14px] text-text-tertiary group-hover:text-primary">
                        content_copy
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
