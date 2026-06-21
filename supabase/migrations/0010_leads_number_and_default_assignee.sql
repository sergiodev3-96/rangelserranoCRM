-- 1. Añadir columna auto-incremental 'lead_number' a la tabla leads
ALTER TABLE public.leads ADD COLUMN lead_number SERIAL UNIQUE;

-- 2. Establecer el valor por defecto de 'assigned_to' a la cuenta info@rangelyserrano.com (UUID: e0db4f49-4ce2-4acd-80a9-c0addd6ade21)
ALTER TABLE public.leads ALTER COLUMN assigned_to SET DEFAULT 'e0db4f49-4ce2-4acd-80a9-c0addd6ade21'::uuid;

-- 3. Actualizar leads existentes que no tengan asignación para que queden asignados a este usuario
UPDATE public.leads
SET assigned_to = 'e0db4f49-4ce2-4acd-80a9-c0addd6ade21'::uuid
WHERE assigned_to IS NULL;
