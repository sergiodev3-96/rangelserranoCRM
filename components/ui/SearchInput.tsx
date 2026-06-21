"use client";

import React from "react";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
}: SearchInputProps) {
  return (
    <div className="relative w-full max-w-xs">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg-input text-text-primary placeholder:text-text-disabled border border-border-default rounded-lg pl-10 pr-4 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
      />
    </div>
  );
}
