"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Pagination from "../ui/Pagination";

type LeadPaginationProps = {
  totalItems: number;
  pageSize: number;
};

export default function LeadPagination({
  totalItems,
  pageSize,
}: LeadPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage =
    typeof searchParams.get("page") === "string"
      ? parseInt(searchParams.get("page")!)
      : 1;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/leads?${params.toString()}`);
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalItems={totalItems}
      pageSize={pageSize}
      onPageChange={handlePageChange}
    />
  );
}
