"use client";

import React, { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import LeadCreateModal from "./LeadCreateModal";
import TikTokConfigModal from "./TikTokConfigModal";
import type { LeadStatus } from "@/types/leads";
import { LEAD_STATUS_CONFIG } from "@/types/leads";
import { saveLeadState } from "@/lib/utils/lead-state";

type LeadFiltersProps = {
  activeStatus?: string;
  activeSearch?: string;
  activeUnassigned?: boolean;
};

export default function LeadFilters({
  activeStatus = "",
  activeSearch = "",
  activeUnassigned = false,
}: LeadFiltersProps) {
  const router = useRouter();

  // Local state synced with active server props
  const [selectedStatus, setSelectedStatus] = useState(activeStatus);
  const [searchInput, setSearchInput] = useState(activeSearch);
  const [isUnassigned, setIsUnassigned] = useState(activeUnassigned);

  const isFocusedRef = useRef(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTikTokModalOpen, setIsTikTokModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Sincronizar estado cuando los props del servidor cambien (ej. al paginar o navegar)
  useEffect(() => {
    setSelectedStatus(activeStatus);
  }, [activeStatus]);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setSearchInput(activeSearch);
    }
  }, [activeSearch]);

  useEffect(() => {
    setIsUnassigned(activeUnassigned);
  }, [activeUnassigned]);

  const updateFilters = useCallback(
    (updates: {
      search?: string;
      status?: string;
      unassigned?: boolean;
    }) => {
      const nextStatus = updates.status !== undefined ? updates.status : selectedStatus;
      const nextSearch = updates.search !== undefined ? updates.search : searchInput;
      const nextUnassigned = updates.unassigned !== undefined ? updates.unassigned : isUnassigned;

      const params = new URLSearchParams();

      if (nextStatus) {
        params.set("status", nextStatus);
      }
      if (nextSearch.trim()) {
        params.set("search", nextSearch.trim());
      }
      if (nextUnassigned) {
        params.set("unassigned", "true");
      }

      // Guardar en cookie y localStorage para persistencia
      saveLeadState({
        status: nextStatus || null,
        page: 1,
        search: nextSearch.trim() || "",
        unassigned: nextUnassigned,
      });

      startTransition(() => {
        const q = params.toString();
        router.replace(q ? `/leads?${q}` : "/leads", { scroll: false });
      });
    },
    [router, selectedStatus, searchInput, isUnassigned]
  );

  // Filtrado reactivo conforme el usuario escribe (debounce 350ms)
  useEffect(() => {
    if (searchInput === activeSearch) return;

    const timer = setTimeout(() => {
      updateFilters({ search: searchInput });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, activeSearch, updateFilters]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [router]);

  const handleManualRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    updateFilters({ search: "" });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedStatus(val);
    updateFilters({ status: val });
  };

  const handleUnassignedToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsUnassigned(checked);
    updateFilters({ unassigned: checked });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-surface border border-border-default rounded-xl p-4 glow-effect">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-xs">
          <span
            className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] transition-colors ${
              isPending ? "text-primary animate-spin" : "text-text-secondary"
            }`}
          >
            {isPending ? "sync" : "search"}
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={searchInput}
            onFocus={() => {
              isFocusedRef.current = true;
            }}
            onBlur={() => {
              isFocusedRef.current = false;
            }}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-bg-input text-text-primary placeholder:text-text-disabled border border-border-default rounded-lg pl-10 pr-9 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary transition-colors"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1 rounded-md transition-colors cursor-pointer"
              title="Limpiar búsqueda"
            >
              <span className="material-symbols-outlined text-[16px] block">close</span>
            </button>
          )}
        </form>

        {/* Status Select */}
        <div className="w-full sm:max-w-[200px]">
          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="">Todos los estados</option>
            {Object.keys(LEAD_STATUS_CONFIG).map((statusKey) => (
              <option key={statusKey} value={statusKey}>
                {LEAD_STATUS_CONFIG[statusKey as LeadStatus].label}
              </option>
            ))}
          </select>
        </div>

        {/* Unassigned Checkbox */}
        <label className="flex items-center gap-2 px-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isUnassigned}
            onChange={handleUnassignedToggle}
            className="w-4 h-4 rounded bg-bg-input border-border-default text-primary focus:ring-primary focus:ring-offset-bg-base cursor-pointer"
          />
          <span className="font-body-sm text-[13px] text-text-primary">
            Sin asignar
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleManualRefresh}
          disabled={isPending}
          className="w-full sm:w-auto bg-surface hover:bg-bg-input text-text-primary border border-border-default transition-all duration-300 rounded-lg py-2 px-3.5 flex items-center justify-center gap-2 font-body-sm font-medium text-[13px] cursor-pointer disabled:opacity-50"
          title="Actualizar listado"
        >
          <span className={`material-symbols-outlined text-[18px] ${isPending ? "animate-spin" : ""}`}>
            refresh
          </span>
        </button>

        <button
          onClick={() => setIsTikTokModalOpen(true)}
          className="w-full sm:w-auto bg-surface hover:bg-bg-input text-text-primary border border-border-default transition-all duration-300 rounded-lg py-2 px-4 flex items-center justify-center gap-2 font-body-sm font-medium text-[13px] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">campaign</span>
          Configurar TikTok
        </button>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] transition-all duration-300 rounded-lg py-2 px-4 flex items-center justify-center gap-2 font-body-sm font-medium text-[13px] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Crear Lead Manual
        </button>
      </div>

      <LeadCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          // Refresca la ruta actual del servidor para mostrar el nuevo lead
          router.refresh();
        }}
      />

      <TikTokConfigModal 
        isOpen={isTikTokModalOpen}
        onClose={() => setIsTikTokModalOpen(false)}
      />
    </div>
  );
}
