CREATE TABLE IF NOT EXISTS public.financial_entities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  tin         numeric(5,2) NOT NULL DEFAULT 0.00,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Trigger: updated_at
CREATE TRIGGER financial_entities_set_updated_at
  BEFORE UPDATE ON public.financial_entities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.financial_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_entities_select_authenticated"
  ON public.financial_entities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "financial_entities_write_admin"
  ON public.financial_entities FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Insert initial entities
INSERT INTO public.financial_entities (name, tin, is_active, sort_order)
VALUES
  ('Santander Consumer', 6.49, true, 1),
  ('BBVA', 5.99, true, 2),
  ('Cetelem Auto', 7.15, true, 3)
ON CONFLICT DO NOTHING;
