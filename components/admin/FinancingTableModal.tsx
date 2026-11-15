"use client";

import React, { useState, useTransition } from "react";
import type { FinancialEntity, FinancingTableConfig, FinancingTableRow } from "@/types/financial-entities";
import { DEFAULT_COMMERCIAL_TABLE, DEFAULT_BBVA_COMMERCIAL_TABLE } from "@/lib/finance/calculator";
import { updateFinancialEntityFinancingTable } from "@/lib/actions/financial-entities";

type FinancingTableModalProps = {
  isOpen: boolean;
  onClose: () => void;
  entity: FinancialEntity;
  onSaved: () => void;
};

export default function FinancingTableModal({
  isOpen,
  onClose,
  entity,
  onSaved,
}: FinancingTableModalProps) {
  const [isPending, startTransition] = useTransition();

  // Inicializar tabla: si la entidad tiene tabla la usamos, si no cargamos la plantilla por defecto según banco
  const [table, setTable] = useState<FinancingTableConfig>(() => {
    if (entity.financing_table && entity.financing_table.rows && entity.financing_table.rows.length > 0) {
      return JSON.parse(JSON.stringify(entity.financing_table));
    }
    if (entity.name && entity.name.toUpperCase().includes("BBVA")) {
      return JSON.parse(JSON.stringify(DEFAULT_BBVA_COMMERCIAL_TABLE));
    }
    return JSON.parse(JSON.stringify(DEFAULT_COMMERCIAL_TABLE));
  });

  const [newTermInput, setNewTermInput] = useState<string>("");
  const [showAddTerm, setShowAddTerm] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  if (!isOpen) return null;

  // Añadir un nuevo plazo (columna)
  const handleAddTerm = (termValue?: number) => {
    const val = termValue || parseInt(newTermInput, 10);
    if (!val || val <= 0) return;
    if (table.terms.includes(val)) {
      alert(`El plazo de ${val} meses ya existe en la tabla.`);
      return;
    }
    if (table.terms.length >= 15) {
      alert("Se permite un máximo de 15 columnas de plazos.");
      return;
    }

    const updatedTerms = [...table.terms, val].sort((a, b) => a - b);
    setTable({ ...table, terms: updatedTerms });
    setNewTermInput("");
    setShowAddTerm(false);
  };

  // Eliminar un plazo (columna)
  const handleRemoveTerm = (termToRemove: number) => {
    if (table.terms.length <= 1) {
      alert("La tabla debe tener al menos una columna de plazo.");
      return;
    }
    if (!confirm(`¿Eliminar la columna de plazo de ${termToRemove} meses?`)) return;

    const updatedTerms = table.terms.filter((t) => t !== termToRemove);
    const updatedRows = table.rows.map((row) => {
      const newCoeffs = { ...row.coefficients };
      delete newCoeffs[String(termToRemove)];
      return { ...row, coefficients: newCoeffs };
    });

    setTable({ terms: updatedTerms, rows: updatedRows });
  };

  // Añadir una nueva fila de TIN
  const handleAddRow = () => {
    if (table.rows.length >= 25) {
      alert("Se permite un máximo de 25 filas de T.I.N.");
      return;
    }

    // Sugerir un TIN incremental
    const lastTin = table.rows.length > 0 ? table.rows[table.rows.length - 1].tin : 8.5;
    const nextTin = parseFloat((lastTin + 0.5).toFixed(2));

    const newRow: FinancingTableRow = {
      tin: nextTin,
      coefficients: {},
    };

    setTable({ ...table, rows: [...table.rows, newRow] });
  };

  // Eliminar una fila de TIN
  const handleRemoveRow = (index: number) => {
    if (table.rows.length <= 1) {
      alert("La tabla debe tener al menos una fila de T.I.N.");
      return;
    }
    const updatedRows = table.rows.filter((_, idx) => idx !== index);
    setTable({ ...table, rows: updatedRows });
  };

  // Modificar el TIN de una fila
  const handleTinChange = (index: number, valStr: string) => {
    const cleanStr = valStr.replace(",", ".");
    const val = cleanStr === "" ? 0 : parseFloat(cleanStr);
    const updatedRows = [...table.rows];
    updatedRows[index] = { ...updatedRows[index], tin: isNaN(val) ? 0 : val };
    setTable({ ...table, rows: updatedRows });
  };

  // Modificar un coeficiente de una celda
  const handleCellChange = (
    rowIndex: number,
    term: number,
    field: "without_insurance" | "with_insurance",
    valStr: string
  ) => {
    const cleanStr = valStr.trim().replace(",", ".");
    const val = cleanStr === "" ? null : parseFloat(cleanStr);

    const updatedRows = [...table.rows];
    const row = { ...updatedRows[rowIndex] };
    const coeffs = { ...row.coefficients };
    const termKey = String(term);
    const currentCell = { ...(coeffs[termKey] || {}) };

    if (val === null || isNaN(val)) {
      currentCell[field] = null;
    } else {
      currentCell[field] = val;
    }

    // Si ambos son null, limpiamos la clave
    if (currentCell.without_insurance === null && currentCell.with_insurance === null) {
      delete coeffs[termKey];
    } else {
      coeffs[termKey] = currentCell;
    }

    row.coefficients = coeffs;
    updatedRows[rowIndex] = row;
    setTable({ ...table, rows: updatedRows });
  };

  // Guardar tabla
  const handleSave = () => {
    setStatusMsg(null);
    startTransition(async () => {
      const result = await updateFinancialEntityFinancingTable(entity.id, table);
      if (result.success) {
        setStatusMsg({ text: "Tabla de financiación guardada con éxito.", type: "success" });
        onSaved();
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setStatusMsg({ text: result.error || "No se pudo guardar la tabla.", type: "error" });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-[95vw] xl:max-w-7xl max-h-[92vh] flex flex-col bg-surface border border-border-default rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-surface-container-low shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">table_chart</span>
            </div>
            <div>
              <h2 className="font-section-subtitle text-[18px] text-text-primary flex items-center gap-2">
                Tabla Comercial de Financiación: <span className="text-primary font-bold">{entity.name}</span>
              </h2>
              <p className="text-[12px] text-text-secondary">
                Configura los coeficientes sin seguro y con seguro PPP por plazo y T.I.N. (Hasta 25 filas de TIN y 15 columnas de plazos).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Toolbar / Actions Bar */}
        <div className="px-6 py-3 border-b border-border-default/60 bg-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-surface-container-high border border-border-default font-semibold text-text-primary">
              {table.rows.length} / 25 Filas TIN
            </span>
            <span className="px-2.5 py-1 rounded-full bg-surface-container-high border border-border-default font-semibold text-text-primary">
              {table.terms.length} / 15 Columnas de Plazo
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botón Añadir Plazo */}
            <div className="relative">
              {showAddTerm ? (
                <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-lg border border-primary">
                  <input
                    type="number"
                    min="1"
                    max="240"
                    placeholder="Meses..."
                    value={newTermInput}
                    onChange={(e) => setNewTermInput(e.target.value)}
                    className="w-20 px-2 py-1 bg-bg-input text-xs font-data-mono text-text-primary border-none rounded focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTerm();
                      if (e.key === "Escape") setShowAddTerm(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTerm()}
                    className="px-2 py-1 bg-primary text-white rounded text-xs font-bold hover:bg-primary-hover cursor-pointer"
                  >
                    Añadir
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTerm(false)}
                    className="px-1.5 py-1 text-text-secondary hover:text-text-primary text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddTerm(true)}
                  disabled={table.terms.length >= 15}
                  className="px-3 py-1.5 rounded-lg border border-border-default hover:border-primary/50 text-text-secondary hover:text-text-primary hover:bg-surface-container text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Añadir una nueva columna de plazo en meses"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">view_column</span>
                  + Plazo (meses)
                </button>
              )}
            </div>

            {/* Botón Añadir Fila TIN */}
            <button
              type="button"
              onClick={handleAddRow}
              disabled={table.rows.length >= 25}
              className="px-3 py-1.5 rounded-lg border border-border-default hover:border-primary/50 text-text-secondary hover:text-text-primary hover:bg-surface-container text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Añadir una nueva fila de T.I.N."
            >
              <span className="material-symbols-outlined text-[16px] text-primary">add_row_below</span>
              + Fila T.I.N.
            </button>
          </div>
        </div>

        {/* Feedback message */}
        {statusMsg && (
          <div
            className={`mx-6 mt-3 px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
              statusMsg.type === "success"
                ? "bg-success/15 border border-success/30 text-success"
                : "bg-danger/15 border border-danger/30 text-danger"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {statusMsg.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Table Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="inline-block min-w-full align-middle border border-border-default rounded-xl overflow-hidden shadow-sm bg-surface">
            <table className="min-w-full border-collapse text-left text-xs">
              {/* Header: Plazo en meses */}
              <thead>
                <tr className="bg-[#0c3150] text-white">
                  <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-xs border-r border-[#1a4a75] w-52 min-w-[210px] sticky left-0 z-20 bg-[#0c3150]">
                    Plazo en meses
                  </th>
                  {table.terms.map((term) => (
                    <th
                      key={term}
                      className="py-2.5 px-2 font-bold text-center border-r border-[#1a4a75] min-w-[96px] relative group"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{term}</span>
                        {table.terms.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTerm(term)}
                            className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-red-300 transition-opacity p-0.5 rounded cursor-pointer"
                            title={`Eliminar columna ${term} meses`}
                          >
                            <span className="material-symbols-outlined text-[13px]">close</span>
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rows: Each TIN block */}
              <tbody className="divide-y divide-border-default/40">
                {table.rows.map((row, rowIdx) => {
                  return (
                    <React.Fragment key={`row-${rowIdx}`}>
                      {/* Sub-row 1: TIN Banner (Exact structure from photo) */}
                      <tr className="bg-[#38a3c4]/15 border-t-2 border-primary/30">
                        {/* Left TIN label & input */}
                        <td className="py-2 px-3 border-r border-border-default/60 sticky left-0 z-10 bg-surface-container-high/90">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded bg-[#0c3150] text-white text-[10px] font-bold flex items-center justify-center">
                                {rowIdx + 1}
                              </span>
                              <span className="font-bold text-[#0c3150] dark:text-cyan-300">T.I.N.</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={row.tin}
                                onChange={(e) => handleTinChange(rowIdx, e.target.value)}
                                className="w-14 px-1.5 py-0.5 font-bold font-data-mono text-center text-xs bg-bg-input border border-primary/40 rounded text-primary focus:outline-none focus:border-primary"
                                placeholder="8.50"
                              />
                              <span className="font-bold text-primary text-[11px]">%</span>
                            </div>
                            {table.rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(rowIdx)}
                                className="text-text-tertiary hover:text-danger p-0.5 rounded transition-colors cursor-pointer"
                                title="Eliminar este grupo de TIN"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Across term columns: Repeated TIN % in blue banner as in photo */}
                        {table.terms.map((term) => (
                          <td
                            key={`tin-${rowIdx}-${term}`}
                            className="py-1 px-2 text-center font-bold text-xs font-data-mono text-[#0c3150] dark:text-cyan-300 border-r border-border-default/30 bg-[#38a3c4]/20 select-none"
                          >
                            {row.tin > 0 ? `${row.tin.toFixed(2).replace(".", ",")}%` : "-"}
                          </td>
                        ))}
                      </tr>

                      {/* Sub-row 2: Coef. sin Seguros */}
                      <tr className="hover:bg-surface-container-high/20 transition-colors">
                        <td className="py-1.5 px-4 font-medium text-text-secondary text-[11px] border-r border-border-default/60 sticky left-0 z-10 bg-surface">
                          Coef. sin Seguros
                        </td>
                        {table.terms.map((term) => {
                          const cell = row.coefficients[String(term)];
                          const val = cell?.without_insurance;
                          const displayVal = val !== null && val !== undefined ? String(val) : "";

                          return (
                            <td key={`sin-${rowIdx}-${term}`} className="p-1 border-r border-border-default/30 text-center">
                              <input
                                type="text"
                                value={displayVal}
                                onChange={(e) =>
                                  handleCellChange(rowIdx, term, "without_insurance", e.target.value)
                                }
                                placeholder="0.000000"
                                className="w-full text-center font-data-mono text-[11px] bg-bg-input/60 border border-border-default/60 hover:border-primary/40 focus:border-primary rounded py-1 px-1 text-text-primary focus:outline-none"
                              />
                            </td>
                          );
                        })}
                      </tr>

                      {/* Sub-row 3: Coef. con Seg. PPP */}
                      <tr className="hover:bg-surface-container-high/20 transition-colors bg-surface-container-lowest/40">
                        <td className="py-1.5 px-4 font-medium text-text-secondary text-[11px] border-r border-border-default/60 sticky left-0 z-10 bg-surface">
                          Coef. con Seg. PPP
                        </td>
                        {table.terms.map((term) => {
                          const cell = row.coefficients[String(term)];
                          const val = cell?.with_insurance;
                          const displayVal = val !== null && val !== undefined ? String(val) : "";

                          return (
                            <td key={`con-${rowIdx}-${term}`} className="p-1 border-r border-border-default/30 text-center">
                              <input
                                type="text"
                                value={displayVal}
                                onChange={(e) =>
                                  handleCellChange(rowIdx, term, "with_insurance", e.target.value)
                                }
                                placeholder="0.000000"
                                className="w-full text-center font-data-mono text-[11px] bg-bg-input/60 border border-border-default/60 hover:border-primary/40 focus:border-primary rounded py-1 px-1 text-text-primary focus:outline-none"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-default bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-text-secondary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">info</span>
            <span>
              Deja en blanco las celdas de plazos que esta entidad no financie para un T.I.N. específico.
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary rounded-lg border border-border-default hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="px-5 py-2 text-xs font-bold bg-primary text-white hover:bg-primary-hover rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              {isPending ? "Guardando..." : "Guardar Tabla de Financiación"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

