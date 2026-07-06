-- 1. Eliminar la restricción de verificación anterior
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- 2. Añadir la nueva restricción con 'nuevo' incluido
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check CHECK (status IN (
  'nuevo', 'no_responde', 'cliente_potencial', 'cuarentena',
  'realizando_pedido', 'pedido', 'asnef',
  'esperando_docs', 'rechazado'
));

-- 3. Establecer el valor por defecto de status a 'nuevo'
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'nuevo';
