-- Remove the saldo_inicial_guardado column from profiles table
-- This field is no longer needed as goals automatically "reserve" money from total equity

ALTER TABLE public.profiles DROP COLUMN IF EXISTS saldo_inicial_guardado;