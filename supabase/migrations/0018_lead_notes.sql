-- Migración 0018: Tabla de Notas asociadas al Lead (1 única nota editable por lead)

CREATE TABLE IF NOT EXISTS public.lead_notes (
  lead_id     uuid PRIMARY KEY REFERENCES public.leads(id) ON DELETE CASCADE,
  content     text NOT NULL DEFAULT '',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);

-- RLS
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_notes_select_authenticated"
  ON public.lead_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "lead_notes_insert_authenticated"
  ON public.lead_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "lead_notes_update_authenticated"
  ON public.lead_notes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "lead_notes_delete_authenticated"
  ON public.lead_notes FOR DELETE
  TO authenticated
  USING (true);
