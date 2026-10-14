-- Migración 0017: Nuevos estados de leads (Seguir insistiendo, Ocupado) y columna archived en tasks

-- 1. Actualizar restricción de estados en leads
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE public.leads ADD CONSTRAINT leads_status_check CHECK (status IN (
  'nuevo',
  'no_responde',
  'cliente_potencial',
  'cuarentena',
  'realizando_pedido',
  'pedido',
  'asnef',
  'esperando_docs',
  'rechazado',
  'seguir_insistiendo',
  'ocupado'
));

-- 2. Añadir columna archived a tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- 3. Índice para acelerar filtros de tareas archivadas
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON public.tasks(archived);
