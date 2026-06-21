CREATE TABLE public.lead_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_id  uuid NOT NULL REFERENCES public.profiles(id),
  event_type text NOT NULL
             CHECK (event_type IN ('note', 'status_change', 'whatsapp_sent', 'call_logged')),
  content    text,
  metadata   jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_lead_events_lead_id ON public.lead_events(lead_id);
CREATE INDEX idx_lead_events_created_at ON public.lead_events(created_at DESC);

-- RLS
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_events_select_authenticated"
  ON public.lead_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "lead_events_insert_own_lead_or_admin"
  ON public.lead_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE id = lead_id AND assigned_to = auth.uid()
    )
  );
