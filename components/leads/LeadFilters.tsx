"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LeadCreateModal from "./LeadCreateModal";
import type { LeadStatus } from "@/types/leads";
import { LEAD_STATUS_CONFIG } from "@/types/leads";

export default function LeadFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL searchParams states
  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentUnassigned = searchParams.get("unassigned") === "true";

  // Local input state for search input to prevent lag
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync input value with URL when url changes
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const updateFilters = (updates: {
    search?: string;
    status?: string;
    unassigned?: boolean;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset page when filters change
    params.delete("page");

    if (updates.search !== undefined) {
      if (updates.search) {
        params.set("search", updates.search);
      } else {
        params.delete("search");
      }
    }

    if (updates.status !== undefined) {
      if (updates.status) {
        params.set("status", updates.status);
      } else {
        params.delete("status");
      }
    }

    if (updates.unassigned !== undefined) {
      if (updates.unassigned) {
        params.set("unassigned", "true");
      } else {
        params.delete("unassigned");
      }
    }

    router.push(`/leads?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters({ status: e.target.value });
  };

  const handleUnassignedToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ unassigned: e.target.checked });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-surface border border-border-default rounded-xl p-4 glow-effect">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-bg-input text-text-primary placeholder:text-text-disabled border border-border-default rounded-lg pl-10 pr-4 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary"
          />
        </form>

        {/* Status Select */}
        <div className="w-full sm:max-w-[200px]">
          <select
            value={currentStatus}
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
            checked={currentUnassigned}
            onChange={handleUnassignedToggle}
            className="w-4 h-4 rounded bg-bg-input border-border-default text-primary focus:ring-primary focus:ring-offset-bg-base cursor-pointer"
          />
          <span className="font-body-sm text-[13px] text-text-primary">
            Sin asignar
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center">
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
    </div>
  );
}
