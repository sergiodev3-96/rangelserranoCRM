-- Migración 0019: Ajuste de restricciones para eliminación limpia de usuarios
-- Permitir que author_id en lead_events sea NULL si se elimina el perfil de usuario, conservando el historial

ALTER TABLE public.lead_events ALTER COLUMN author_id DROP NOT NULL;

ALTER TABLE public.lead_events DROP CONSTRAINT IF EXISTS lead_events_author_id_fkey;

ALTER TABLE public.lead_events ADD CONSTRAINT lead_events_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
