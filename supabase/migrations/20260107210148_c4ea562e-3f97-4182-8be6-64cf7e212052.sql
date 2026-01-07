-- Adicionar campo saldo_inicial na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS saldo_inicial numeric NOT NULL DEFAULT 0;