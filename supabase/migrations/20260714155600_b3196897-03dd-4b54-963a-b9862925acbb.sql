
ALTER TABLE public.transactions DROP COLUMN IF EXISTS recorrencia_id;
ALTER TABLE public.compras_cartao DROP COLUMN IF EXISTS recorrencia_id;
DROP TABLE IF EXISTS public.despesas_recorrentes CASCADE;
