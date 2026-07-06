ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS first_surname text,
ADD COLUMN IF NOT EXISTS second_surname text,
ADD COLUMN IF NOT EXISTS dni_nie text,
ADD COLUMN IF NOT EXISTS nationality text,
ADD COLUMN IF NOT EXISTS birth_country text,
ADD COLUMN IF NOT EXISTS vehicle_brand text,
ADD COLUMN IF NOT EXISTS vehicle_model text,
ADD COLUMN IF NOT EXISTS vehicle_year integer,
ADD COLUMN IF NOT EXISTS vehicle_plate text,
ADD COLUMN IF NOT EXISTS vehicle_price numeric(10,2),
ADD COLUMN IF NOT EXISTS down_payment numeric(10,2);
