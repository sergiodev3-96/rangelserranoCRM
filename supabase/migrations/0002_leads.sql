CREATE TABLE public.leads (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name            text NOT NULL,
  phone                text,
  email                text,
  status               text NOT NULL DEFAULT 'cliente_potencial'
                       CHECK (status IN (
                         'no_responde', 'cliente_potencial', 'cuarentena',
                         'realizando_pedido', 'pedido', 'asnef',
                         'esperando_docs', 'rechazado'
                       )),
  source               text NOT NULL DEFAULT 'manual'
                       CHECK (source IN (
                         'tiktok_lead_ads', 'meta_lead_ads', 'manual',
                         'referral', 'organic_web', 'newsletter'
                       )),
  campaign_name        text,
  vehicle_interest     text,
  assigned_to          uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  archived             boolean NOT NULL DEFAULT false,
  raw_webhook_payload  jsonb,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Trigger: updated_at
CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_archived ON public.leads(archived);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_select_authenticated"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "leads_insert_authenticated"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Un comercial solo puede editar leads asignados a sí mismo o si es Admin.
CREATE POLICY "leads_update_own_or_admin"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR public.is_admin()
  );
