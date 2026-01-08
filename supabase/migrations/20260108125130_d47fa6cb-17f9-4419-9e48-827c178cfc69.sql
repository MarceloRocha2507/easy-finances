-- Adicionar campo tipo_plano na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tipo_plano text DEFAULT 'mensal';

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.profiles.tipo_plano IS 'Tipo de plano: teste (7 dias), mensal (30 dias), anual (365 dias), ilimitado';