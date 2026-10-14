import React, { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLeads } from "@/lib/actions/leads";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getActiveComerciales } from "@/lib/actions/users";
import LeadTable from "@/components/leads/LeadTable";
import LeadFilters from "@/components/leads/LeadFilters";
import LeadPagination from "@/components/leads/LeadPagination";
import UnassignedLeadsPanel from "@/components/leads/UnassignedLeadsPanel";
import { LEADS_STATE_COOKIE, LeadFilterState } from "@/lib/utils/lead-state";

import type { LeadWithAssignee } from "@/types/leads";
import type { ProfileSummary } from "@/types/profiles";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;

  const cookieStore = await cookies();
  const savedCookie = cookieStore.get(LEADS_STATE_COOKIE)?.value;
  let saved: LeadFilterState | null = null;
  if (savedCookie) {
    try {
      const decoded = savedCookie.includes("%") ? decodeURIComponent(savedCookie) : savedCookie;
      saved = JSON.parse(decoded);
    } catch {
      try {
        saved = JSON.parse(savedCookie);
      } catch {}
    }
  }

  const hasPage = typeof resolvedSearchParams.page === "string";
  const hasStatus = typeof resolvedSearchParams.status === "string";
  const hasSearch = typeof resolvedSearchParams.search === "string";
  const hasUnassigned = typeof resolvedSearchParams.unassigned === "string";

  // Si se accede a /leads limpiamente sin ningún query param (menú lateral, volver de lead, etc.):
  const isDirectAccessWithoutParams = !hasPage && !hasStatus && !hasSearch && !hasUnassigned;

  if (isDirectAccessWithoutParams && saved) {
    const redirectParams = new URLSearchParams();
    if (saved.status) redirectParams.set("status", saved.status);
    if (saved.page && saved.page > 1) redirectParams.set("page", saved.page.toString());
    if (saved.search) redirectParams.set("search", saved.search);
    if (saved.unassigned) redirectParams.set("unassigned", "true");

    const q = redirectParams.toString();
    if (q) {
      redirect(`/leads?${q}`);
    }
  }

  // Determinar los valores activos: si vienen en URL se usan; si falta el status pero viene página, se usa el guardado
  const page = hasPage ? parseInt(resolvedSearchParams.page as string, 10) : 1;
  const status = hasStatus ? (resolvedSearchParams.status as string) : (saved?.status || null);
  const unassigned = hasUnassigned ? resolvedSearchParams.unassigned === "true" : (saved?.unassigned || false);
  const search = hasSearch ? (resolvedSearchParams.search as string) : (saved?.search || "");

  const pageSize = 20;

  // 1. Obtener lista de leads y perfil del usuario en paralelo
  const [result, profileResult] = await Promise.all([
    getLeads({
      page,
      pageSize,
      status,
      unassignedOnly: unassigned,
      search,
    }),
    getCurrentProfile(),
  ]);

  const leads = result.success && result.data ? result.data.leads : [];
  const total = result.success && result.data ? result.data.total : 0;
  const error = !result.success ? result.error : null;

  const isAdmin = profileResult.success && profileResult.data?.role === "admin";

  let unassignedLeads: LeadWithAssignee[] = [];
  let comerciales: ProfileSummary[] = [];

  if (isAdmin) {
    const [unassignedRes, comercialesRes] = await Promise.all([
      getLeads({ unassignedOnly: true, pageSize: 20 }),
      getActiveComerciales(),
    ]);
    if (unassignedRes.success && unassignedRes.data) {
      unassignedLeads = unassignedRes.data.leads;
    }
    if (comercialesRes.success && comercialesRes.data) {
      comerciales = comercialesRes.data;
    }
  }

  return (
    <div className="flex-1 flex flex-col md:h-full md:overflow-hidden p-6 space-y-6">
      {/* Unassigned Leads Quick Assignment Panel (Only for Admin) */}
      {isAdmin && unassignedLeads.length > 0 && (
        <UnassignedLeadsPanel
          unassignedLeads={unassignedLeads}
          comerciales={comerciales}
        />
      )}

      {/* Filters Area */}
      <div className="shrink-0">
        <Suspense
          fallback={
            <div className="h-16 bg-surface border border-border-default rounded-xl animate-pulse" />
          }
        >
          <LeadFilters
            activeStatus={status || ""}
            activeSearch={search}
            activeUnassigned={unassigned}
          />
        </Suspense>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-error-container/20 border border-error/20 text-danger rounded-lg p-4 font-body-sm text-[13px] shrink-0">
          Error al cargar los leads de la base de datos: {error}. Asegúrate de haber ejecutado las migraciones SQL `0002_leads.sql` en tu panel de Supabase.
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
          <LeadPagination
            totalItems={total}
            pageSize={pageSize}
            activePage={page}
            activeStatus={status || ""}
            activeSearch={search}
            activeUnassigned={unassigned}
          />
        </Suspense>
      </div>
    </div>
  );
}
