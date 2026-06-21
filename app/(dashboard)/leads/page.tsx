import React, { Suspense } from "react";
import { getLeads } from "@/lib/actions/leads";
import LeadTable from "@/components/leads/LeadTable";
import LeadFilters from "@/components/leads/LeadFilters";
import LeadPagination from "@/components/leads/LeadPagination";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const page =
    typeof resolvedSearchParams.page === "string"
      ? parseInt(resolvedSearchParams.page)
      : 1;
  const status =
    typeof resolvedSearchParams.status === "string"
      ? resolvedSearchParams.status
      : null;
  const unassigned = resolvedSearchParams.unassigned === "true";
  const search =
    typeof resolvedSearchParams.search === "string"
      ? resolvedSearchParams.search
      : "";

  const pageSize = 20;

  const result = await getLeads({
    page,
    pageSize,
    status,
    unassignedOnly: unassigned,
    search,
  });

  const leads = result.success && result.data ? result.data.leads : [];
  const total = result.success && result.data ? result.data.total : 0;
  const error = !result.success ? result.error : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 space-y-6">
      {/* Page Title */}
      <div className="shrink-0">
        <h1 className="font-headline-lg text-[28px] text-primary tracking-tight leading-tight mb-1">
          Pipeline de Leads
        </h1>
        <p className="font-body-sm text-[13px] text-text-secondary">
          Gestiona y asigna las solicitudes entrantes y realiza simulaciones de
          financiación
        </p>
      </div>

      {/* Filters Area */}
      <div className="shrink-0">
        <Suspense
          fallback={
            <div className="h-16 bg-surface border border-border-default rounded-xl animate-pulse" />
          }
        >
          <LeadFilters />
        </Suspense>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-error-container/20 border border-error/20 text-danger rounded-lg p-4 font-body-sm text-[13px] shrink-0">
          Error al cargar los leads de la base de datos: {error}. Asegúrate de
          haber ejecutado las migraciones SQL `0002_leads.sql` en tu panel de
          Supabase.
        </div>
      )}

      {/* Leads Table Container */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <LeadTable leads={leads} />
      </div>

      {/* Pagination Footer */}
      <div className="shrink-0">
        <Suspense
          fallback={
            <div className="h-12 bg-surface border-t border-border-default animate-pulse" />
          }
        >
          <LeadPagination totalItems={total} pageSize={pageSize} />
        </Suspense>
      </div>
    </div>
  );
}
