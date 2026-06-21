"use client";

import React from "react";

type PaginationProps = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className="flex items-center justify-between py-3 border-t border-border-default bg-surface px-6 mt-auto">
      {/* Total Text */}
      <span className="font-body-sm text-[13px] text-text-secondary">
        Mostrando{" "}
        <span className="text-text-primary font-medium">
          {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}
        </span>{" "}
        a{" "}
        <span className="text-text-primary font-medium">
          {Math.min(currentPage * pageSize, totalItems)}
        </span>{" "}
        de <span className="text-text-primary font-medium">{totalItems}</span>{" "}
        registros
      </span>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="text-text-secondary hover:text-text-primary hover:bg-surface-container border border-border-default disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-lg p-1.5 flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">
            chevron_left
          </span>
        </button>

        <span className="font-body-sm text-[13px] text-text-primary px-3 py-1 bg-surface-container border border-border-default rounded-lg">
          Página {currentPage} de {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="text-text-secondary hover:text-text-primary hover:bg-surface-container border border-border-default disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-lg p-1.5 flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  );
}
