-- Migración 0020: Índices compuestos para acelerar la navegación y ordenación en Leads, Tareas y Detalle de Lead

-- 1. Acelerar ordenación de tareas (due_date ASC, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_tasks_due_created 
  ON public.tasks (due_date ASC NULLS LAST, created_at DESC);

-- 2. Acelerar tareas por lead (due_date ASC)
CREATE INDEX IF NOT EXISTS idx_tasks_lead_due 
  ON public.tasks (lead_id, due_date ASC NULLS LAST);

-- 3. Acelerar listado de leads activos ordenados por fecha de creación (archived = false, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_leads_archived_created 
  ON public.leads (archived, created_at DESC);

-- 4. Acelerar filtrado de leads por estado y archivado
CREATE INDEX IF NOT EXISTS idx_leads_status_archived 
  ON public.leads (status, archived, created_at DESC);

-- 5. Acelerar panel de leads sin asignar
CREATE INDEX IF NOT EXISTS idx_leads_unassigned 
  ON public.leads (assigned_to, archived) 
  WHERE assigned_to IS NULL AND archived = false;

-- 6. Acelerar timeline de eventos del lead
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_created 
  ON public.lead_events (lead_id, created_at DESC);

-- 7. Acelerar simulaciones por lead
CREATE INDEX IF NOT EXISTS idx_simulations_lead_created 
  ON public.simulations (lead_id, created_at DESC);
