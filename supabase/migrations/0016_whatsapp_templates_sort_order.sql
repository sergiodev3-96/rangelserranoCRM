-- Migration 0016: Add sort_order to whatsapp_templates
ALTER TABLE public.whatsapp_templates
ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Set initial default sort order based on category / label
UPDATE public.whatsapp_templates
SET sort_order = 1
WHERE label ILIKE '%saludo%' OR label ILIKE '%contacto%' OR category = 'success';

UPDATE public.whatsapp_templates
SET sort_order = 2
WHERE (label ILIKE '%seguimiento%' OR category = 'warning') AND sort_order = 0;

UPDATE public.whatsapp_templates
SET sort_order = 3
WHERE (label ILIKE '%cita%' OR category = 'primary') AND sort_order = 0;

UPDATE public.whatsapp_templates
SET sort_order = 4
WHERE (label ILIKE '%rechazo%' OR label ILIKE '%rechazada%' OR category = 'error') AND sort_order = 0;
