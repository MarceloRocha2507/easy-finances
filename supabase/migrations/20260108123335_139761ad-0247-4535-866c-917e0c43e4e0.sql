-- Adicionar campos de controle de acesso na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_expiracao date DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS motivo_desativacao text DEFAULT NULL;