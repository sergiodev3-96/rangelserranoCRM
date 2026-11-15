-- Migración 0022: Añadir campos de cotitular a la tabla leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS cotitular_full_name text,
ADD COLUMN IF NOT EXISTS cotitular_first_surname text,
ADD COLUMN IF NOT EXISTS cotitular_second_surname text,
ADD COLUMN IF NOT EXISTS cotitular_dni_nie text,
ADD COLUMN IF NOT EXISTS cotitular_nationality text,
ADD COLUMN IF NOT EXISTS cotitular_birth_country text,
ADD COLUMN IF NOT EXISTS cotitular_phone text,
ADD COLUMN IF NOT EXISTS cotitular_email text,
ADD COLUMN IF NOT EXISTS cotitular_address text,
ADD COLUMN IF NOT EXISTS cotitular_postal_code text,
ADD COLUMN IF NOT EXISTS cotitular_city text,
ADD COLUMN IF NOT EXISTS cotitular_province text;

