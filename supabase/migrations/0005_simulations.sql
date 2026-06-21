CREATE TABLE public.simulations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  created_by       uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  vehicle_price    numeric(10,2) NOT NULL,
  down_payment     numeric(10,2) NOT NULL DEFAULT 0.00,
  financed_capital numeric(10,2) NOT NULL,
  entity_name      text NOT NULL,
  tin_rate         numeric(5,2) NOT NULL,
  tae_rate         numeric(5,2) NOT NULL,
  term_months      integer NOT NULL,
  monthly_payment  numeric(10,2) NOT NULL,
  total_interest   numeric(10,2) NOT NULL,
  total_payable    numeric(10,2) NOT NULL,
  is_draft         boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Trigger: updated_at
CREATE TRIGGER simulations_set_updated_at
  BEFORE UPDATE ON public.simulations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX idx_simulations_lead_id ON public.simulations(lead_id);
CREATE INDEX idx_simulations_created_by ON public.simulations(created_by);
CREATE INDEX idx_simulations_created_at ON public.simulations(created_at DESC);

-- RLS
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simulations_select_rules"
  ON public.simulations FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_admin()
    OR lead_id IS NOT NULL
  );

CREATE POLICY "simulations_insert_rules"
  ON public.simulations FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "simulations_update_rules"
  ON public.simulations FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "simulations_delete_rules"
  ON public.simulations FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_admin()
  );
