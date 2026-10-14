export interface LeadFilterState {
  status?: string | null;
  page?: number;
  search?: string;
  unassigned?: boolean;
}

export const LEADS_STATE_COOKIE = "crm_leads_state";

/**
 * Guarda el estado de filtros y paginación de la página de leads en una cookie
 * y en localStorage para que persista al cambiar de página o cerrar sesión.
 */
export function saveLeadState(state: LeadFilterState) {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(state);
    // Cookie con 30 días de duración
    document.cookie = `${LEADS_STATE_COOKIE}=${encodeURIComponent(
      json
    )}; path=/; max-age=2592000; SameSite=Lax`;
    localStorage.setItem(LEADS_STATE_COOKIE, json);
  } catch {
    // Manejar entornos donde localStorage o cookies estén deshabilitados
  }
}

/**
 * Recupera el estado guardado en cliente desde localStorage
 */
export function getSavedLeadState(): LeadFilterState | null {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem(LEADS_STATE_COOKIE);
    if (item) {
      return JSON.parse(item) as LeadFilterState;
    }
  } catch {
    // Ignorar errores de parseo
  }
  return null;
}
