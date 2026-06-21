CREATE TABLE public.orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  simulation_id    uuid REFERENCES public.simulations(id) ON DELETE SET NULL,
  client_name      text NOT NULL,
  vehicle          text,
  price            numeric(10,2),
  bank_entity      text,
  monthly_payment  numeric(10,2),
  status           text NOT NULL DEFAULT 'en_revision'
                   CHECK (status IN ('aprobado', 'denegado', 'en_revision')),
  closed_at        timestamptz,
  closed_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Trigger: updated_at
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Índices
CREATE INDEX idx_orders_lead_id ON public.orders(lead_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_closed_by ON public.orders(closed_by);

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_authenticated"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "orders_insert_authenticated"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "orders_update_own_or_admin"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (
    closed_by = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.leads
      WHERE id = lead_id AND assigned_to = auth.uid()
    )
  );

CREATE POLICY "orders_delete_admin"
  ON public.orders FOR DELETE
  TO authenticated
  USING (public.is_admin());
