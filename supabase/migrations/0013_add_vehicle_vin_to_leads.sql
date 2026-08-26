ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS vehicle_vin text;
