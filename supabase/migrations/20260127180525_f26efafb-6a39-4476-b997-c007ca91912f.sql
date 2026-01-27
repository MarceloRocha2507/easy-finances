-- Adicionar coluna saldo_inicial_guardado na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN saldo_inicial_guardado numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.saldo_inicial_guardado IS 
'Valor que o usuário já tinha guardado em metas antes de usar o sistema';