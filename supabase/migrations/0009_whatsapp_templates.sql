CREATE TABLE public.whatsapp_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label       text NOT NULL,
  body        text NOT NULL,
  category    text NOT NULL DEFAULT 'primary'
              CHECK (category IN ('primary', 'success', 'warning', 'error', 'info', 'secondary')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Trigger: updated_at
CREATE TRIGGER whatsapp_templates_set_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_templates_select_authenticated"
  ON public.whatsapp_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "whatsapp_templates_write_admin"
  ON public.whatsapp_templates FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Insert initial templates
INSERT INTO public.whatsapp_templates (label, category, body)
VALUES
  (
    'Contacto Inicial',
    'success',
    'Hola {name}, le contactamos desde HOMA - Rangel & Serrano por su interés en el {vehicle}. ¿Podemos hablar 5 minutos?'
  ),
  (
    'Seguimiento Financiación',
    'warning',
    '¿Sigue interesado en financiar su próximo vehículo? Tenemos una oferta especial para el {vehicle} que le puede interesar.'
  ),
  (
    'Cita Confirmada',
    'primary',
    'Confirmamos su cita para mañana a las 11:30h en nuestra exposición de Calle Mayor. ¡Le esperamos!'
  ),
  (
    'Operación Rechazada',
    'error',
    'Sentimos comunicarle que por el momento no podemos avanzar con la financiación solicitada. Quedamos a su disposición.'
  );
