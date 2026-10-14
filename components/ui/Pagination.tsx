"use client";

import React, { useState, useEffect } from "react";

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
  const [pageInput, setPageInput] = useState(currentPage.toString());

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handleJumpToPage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      if (parsed !== currentPage) {
        onPageChange(parsed);
      }
    } else {
      setPageInput(currentPage.toString());
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 border-t border-border-default bg-surface px-6 mt-auto">
      {/* Total Text */}
      <span className="font-body-sm text-[13px] text-text-secondary select-none">
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

      {/* Navigation Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* First Page Button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="text-text-secondary hover:text-text-primary hover:bg-surface-container border border-border-default disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-lg p-1.5 flex items-center justify-center cursor-pointer transition-colors"
          title="Primera página"
        >
          <span className="material-symbols-outlined text-[18px]">
            first_page
          </span>
        </button>

        {/* Previous Page Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="text-text-secondary hover:text-text-primary hover:bg-surface-container border border-border-default disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-lg p-1.5 flex items-center justify-center cursor-pointer transition-colors"
          title="Página anterior"
        >
          <span className="material-symbols-outlined text-[18px]">
            chevron_left
          </span>
        </button>

        {/* Exact Page Number Input */}
        <form
          onSubmit={handleJumpToPage}
          className="flex items-center gap-1.5 font-body-sm text-[13px] text-text-primary px-3 py-1 bg-surface-container border border-border-default rounded-lg"
        >
          <span className="text-text-secondary select-none">Página</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={() => handleJumpToPage()}
            className="w-12 text-center bg-bg-input text-text-primary border border-border-default rounded px-1.5 py-0.5 text-[13px] font-semibold focus:outline-none focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            title="Escribe un número de página y presiona Enter"
          />
          <span className="text-text-secondary select-none">de {totalPages}</span>
        </form>

        {/* Next Page Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="text-text-secondary hover:text-text-primary hover:bg-surface-container border border-border-default disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-lg p-1.5 flex items-center justify-center cursor-pointer transition-colors"
          title="Página siguiente"
        >
          <span className="material-symbols-outlined text-[18px]">
            chevron_right
          </span>
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="text-text-secondary hover:text-text-primary hover:bg-surface-container border border-border-default disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent rounded-lg p-1.5 flex items-center justify-center cursor-pointer transition-colors"
          title="Última página"
        >
          <span className="material-symbols-outlined text-[18px]">
            last_page
          </span>
        </button>
      </div>
    </div>
  );
}
