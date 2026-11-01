-- Migración 0021: Añadir estado 'posponer' a leads y columna 'is_default' a financial_entities

-- 1. Actualizar restricción de estados en leads para incluir 'posponer'
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
  'ocupado',
  'posponer'
));

-- 2. Añadir columna 'is_default' a financial_entities
ALTER TABLE public.financial_entities 
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

-- 3. Marcar una entidad como por defecto si ninguna está marcada
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_entities') THEN
    IF NOT EXISTS (SELECT 1 FROM public.financial_entities WHERE is_default = true) THEN
      UPDATE public.financial_entities
      SET is_default = true
      WHERE id = (
        SELECT id FROM public.financial_entities 
        WHERE is_active = true 
        ORDER BY sort_order ASC, name ASC 
        LIMIT 1
      );
    END IF;
  END IF;
END $$;

