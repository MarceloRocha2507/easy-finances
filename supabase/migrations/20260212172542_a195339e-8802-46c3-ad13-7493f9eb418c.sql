
-- Tabela de configuração do Telegram
CREATE TABLE public.telegram_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  telegram_chat_id TEXT NOT NULL,
  codigo_vinculacao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.telegram_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own telegram config"
  ON public.telegram_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own telegram config"
  ON public.telegram_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own telegram config"
  ON public.telegram_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own telegram config"
  ON public.telegram_config FOR DELETE
  USING (auth.uid() = user_id);

-- Tabela de preferências de notificação do Telegram
CREATE TABLE public.preferencias_telegram (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo_alerta TEXT NOT NULL,
  ativo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tipo_alerta)
);

ALTER TABLE public.preferencias_telegram ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own telegram prefs"
  ON public.preferencias_telegram FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own telegram prefs"
  ON public.preferencias_telegram FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own telegram prefs"
  ON public.preferencias_telegram FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own telegram prefs"
  ON public.preferencias_telegram FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers de updated_at
CREATE TRIGGER update_telegram_config_updated_at
  BEFORE UPDATE ON public.telegram_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_preferencias_telegram_updated_at
  BEFORE UPDATE ON public.preferencias_telegram
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
