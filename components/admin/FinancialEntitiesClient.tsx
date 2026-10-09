"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FinancialEntity } from "@/types/financial-entities";
import {
  createFinancialEntity,
  updateFinancialEntity,
  deleteFinancialEntity,
  toggleFinancialEntityStatus,
} from "@/lib/actions/financial-entities";
import Modal from "../ui/Modal";

type FinancialEntitiesClientProps = {
  initialEntities: FinancialEntity[];
};

export default function FinancialEntitiesClient({
  initialEntities,
}: FinancialEntitiesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEntity, setSelectedEntity] = useState<FinancialEntity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [tin, setTin] = useState<string>("6.00");
  const [sortOrder, setSortOrder] = useState<string>("1");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedEntity(null);
    setName("");
    setTin("6.00");
    setSortOrder((initialEntities.length + 1).toString());
    setIsActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (entity: FinancialEntity) => {
    setModalMode("edit");
    setSelectedEntity(entity);
    setName(entity.name);
    setTin(entity.tin.toString());
    setSortOrder(entity.sort_order.toString());
    setIsActive(entity.is_active);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (entity: FinancialEntity) => {
    startTransition(async () => {
      const result = await toggleFinancialEntityStatus(entity.id, !entity.is_active);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "No se pudo actualizar el estado de la entidad.");
      }
    });
  };

  const handleDelete = (id: string, entityName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la entidad "${entityName}"?`)) return;

    startTransition(async () => {
      const result = await deleteFinancialEntity(id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "No se pudo eliminar la entidad.");
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("El nombre de la entidad es obligatorio.");
      return;
    }

    const parsedTin = parseFloat(tin);
    if (isNaN(parsedTin) || parsedTin < 0 || parsedTin > 100) {
      setErrorMsg("Por favor, introduce un porcentaje de TIN válido (0 - 100).");
      return;
    }

    const parsedOrder = parseInt(sortOrder) || 0;

    setErrorMsg(null);
    startTransition(async () => {
      let result;
      if (modalMode === "create") {
        result = await createFinancialEntity({
          name: name.trim(),
          tin: parsedTin,
          is_active: isActive,
          sort_order: parsedOrder,
        });
      } else {
        if (!selectedEntity) return;
        result = await updateFinancialEntity({
          id: selectedEntity.id,
          name: name.trim(),
          tin: parsedTin,
          is_active: isActive,
          sort_order: parsedOrder,
        });
      }

      if (result.success) {
        setIsModalOpen(false);
        router.refresh();
      } else {
        setErrorMsg(result.error || "Ocurrió un error al guardar la entidad financiera.");
      }
    });
  };

  const filteredEntities = initialEntities.filter((ent) =>
    ent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 text-left bg-bg-base text-text-primary">
      {/* Header & Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="font-headline-lg text-[28px] text-primary tracking-tight leading-tight mb-1">
            Entidades Financieras
          </h1>
          <p className="font-body-md text-text-secondary text-[14px]">
            Configuración de bancos, entidades y tasas de interés (TIN predeterminado) para las simulaciones.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-primary text-on-primary hover:bg-primary-hover transition-colors rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 font-body-sm font-medium text-[13px] shadow-sm cursor-pointer self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          Nueva Entidad
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
            placeholder="Buscar entidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-input border border-border-default rounded-lg py-2 pl-9 pr-4 text-[13px] text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 text-text-secondary text-[13px] self-end sm:self-auto">
          <span>Total entidades:</span>
          <span className="font-semibold text-text-primary">{initialEntities.length}</span>
          <span className="mx-1">•</span>
          <span>Activas:</span>
          <span className="font-semibold text-success">
            {initialEntities.filter((e) => e.is_active).length}
          </span>
        </div>
      </div>

      {/* Table / Rows of entities */}
      <div className="w-full border border-border-default rounded-xl bg-surface overflow-x-auto shadow-sm">
        <table className="w-full border-collapse text-left min-w-[700px]">
          <thead>
            <tr className="border-b border-border-default bg-surface-container-low select-none">
              <th className="px-5 py-3.5 font-field-label text-[11px] text-text-secondary uppercase tracking-wider w-16 text-center">
                Orden
              </th>
              <th className="px-5 py-3.5 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                Entidad Financiera / Banco
              </th>
              <th className="px-5 py-3.5 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                TIN Predeterminado
              </th>
              <th className="px-5 py-3.5 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                Estado
              </th>
              <th className="px-5 py-3.5 font-field-label text-[11px] text-text-secondary uppercase tracking-wider text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle font-body-sm text-[13px]">
            {filteredEntities.map((entity) => (
              <tr
                key={entity.id}
                className={`hover:bg-surface-container-high/40 transition-colors ${
                  !entity.is_active ? "opacity-60 bg-surface/30" : ""
                }`}
              >
                {/* Orden */}
                <td className="px-5 py-4 text-center font-data-mono text-text-tertiary text-[13px]">
                  #{entity.sort_order}
                </td>

                {/* Name */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-container/20 border border-primary/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        account_balance
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary text-[14px]">
                        {entity.name}
                      </span>
                    </div>
                  </div>
                </td>

                {/* TIN */}
                <td className="px-5 py-4">
                  <span className="font-bold font-data-mono text-primary text-[15px] bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10">
                    {entity.tin.toFixed(2)}%
                  </span>
                </td>

                {/* Status Badge */}
                <td className="px-5 py-4">
                  <button
                    onClick={() => handleToggleStatus(entity)}
                    disabled={isPending}
                    title={entity.is_active ? "Desactivar entidad" : "Activar entidad"}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1.5 cursor-pointer transition-colors w-fit ${
                      entity.is_active
                        ? "bg-success/10 text-success border-success/20 hover:bg-success/20"
                        : "bg-surface-container-highest text-text-secondary border-border-default hover:bg-surface-container"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        entity.is_active ? "bg-success" : "bg-text-tertiary"
                      }`}
                    />
                    {entity.is_active ? "Activo" : "Inactivo"}
                  </button>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEditModal(entity)}
                      className="p-1.5 text-text-secondary hover:text-primary rounded-lg hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1 text-[12px] px-2.5 font-medium"
                      title="Editar entidad"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(entity.id, entity.name)}
                      disabled={isPending}
                      className="p-1.5 text-text-secondary hover:text-danger rounded-lg hover:bg-danger/10 transition-colors cursor-pointer flex items-center gap-1 text-[12px] px-2.5 font-medium"
                      title="Eliminar entidad"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredEntities.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">
                  <span className="material-symbols-outlined text-[36px] text-text-tertiary mb-1">
                    search_off
                  </span>
                  <p className="font-medium text-[14px] text-text-primary">
                    No se encontraron entidades financieras
                  </p>
                  <p className="text-[12px] text-text-tertiary mt-0.5">
                    Prueba con otro término de búsqueda o crea una nueva entidad.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "create" ? "Nueva Entidad Financiera" : "Editar Entidad Financiera"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-[13px]">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-[12px] font-medium text-text-secondary">
              Nombre de la Entidad / Banco *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Santander Consumer, BBVA, CaixaBank..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-input border border-border-default rounded-lg py-2 px-3 text-[13px] text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[12px] font-medium text-text-secondary">
                TIN Predeterminado (%) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="6.49"
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  className="w-full bg-bg-input border border-border-default rounded-lg py-2 pl-3 pr-8 font-data-mono text-[14px] text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-[13px] font-medium pointer-events-none">
                  %
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[12px] font-medium text-text-secondary">
                Orden de aparición
              </label>
              <input
                type="number"
                min="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-bg-input border border-border-default rounded-lg py-2 px-3 font-data-mono text-[14px] text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border-default"
              />
              <span className="text-[13px] font-medium text-text-primary">
                Entidad activa (visible en el desplegable de simulaciones)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-[13px] text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-primary text-on-primary hover:bg-primary-hover transition-colors rounded-lg py-2 px-4 text-[13px] font-medium shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Guardando..." : modalMode === "create" ? "Crear Entidad" : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
