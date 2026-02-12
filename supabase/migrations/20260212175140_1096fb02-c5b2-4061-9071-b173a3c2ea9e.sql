
-- Drop unique constraint on user_id to allow multiple pending configs
ALTER TABLE public.telegram_config DROP CONSTRAINT telegram_config_user_id_key;

-- Make user_id nullable for pending (not yet linked) configs
ALTER TABLE public.telegram_config ALTER COLUMN user_id DROP NOT NULL;

-- Add unique constraint only for active configs (user_id when not null)
CREATE UNIQUE INDEX telegram_config_user_id_active_idx ON public.telegram_config (user_id) WHERE user_id IS NOT NULL AND ativo = true;
