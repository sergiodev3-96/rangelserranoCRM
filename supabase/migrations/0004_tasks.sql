CREATE TABLE public.tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text,
  lead_id      uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pendiente'
               CHECK (status IN ('pendiente', 'en_proceso', 'revision', 'completada')),
  priority     text NOT NULL DEFAULT 'media'
               CHECK (priority IN ('baja', 'media', 'alta')),
  due_date     date,
  due_time     time,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Trigger: updated_at
CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_lead_id ON public.tasks(lead_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_authenticated"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "tasks_insert_authenticated"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "tasks_update_own_or_admin"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "tasks_delete_own_or_admin"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR public.is_admin()
  );
