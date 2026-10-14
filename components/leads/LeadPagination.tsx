"use client";

import { useRouter } from "next/navigation";
import Pagination from "../ui/Pagination";
import { saveLeadState } from "@/lib/utils/lead-state";

type LeadPaginationProps = {
  totalItems: number;
  pageSize: number;
  activePage?: number;
  activeStatus?: string;
  activeSearch?: string;
  activeUnassigned?: boolean;
};

export default function LeadPagination({
  totalItems,
  pageSize,
  activePage = 1,
  activeStatus = "",
  activeSearch = "",
  activeUnassigned = false,
}: LeadPaginationProps) {
  const router = useRouter();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();

    // Preservar siempre el status, search y unassigned activos
    if (activeStatus) {
      params.set("status", activeStatus);
    }
    if (activeSearch) {
      params.set("search", activeSearch);
    }
    if (activeUnassigned) {
      params.set("unassigned", "true");
    }

    params.set("page", page.toString());

    saveLeadState({
      status: activeStatus || null,
      page: page,
      search: activeSearch || "",
      unassigned: activeUnassigned,
    });

    router.push(`/leads?${params.toString()}`);
  };

  return (
    <Pagination
      currentPage={activePage}
      totalItems={totalItems}
      pageSize={pageSize}
      onPageChange={handlePageChange}
    />
  );
}
