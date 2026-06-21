CREATE TABLE public.webhook_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source      text NOT NULL,
  payload     jsonb NOT NULL,
  processed   boolean NOT NULL DEFAULT false,
  lead_id     uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  error       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_processed ON public.webhook_logs(processed);

-- RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_logs_select_admin"
  ON public.webhook_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());
