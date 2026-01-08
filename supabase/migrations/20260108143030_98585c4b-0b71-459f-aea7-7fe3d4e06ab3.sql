-- Create table for notification preferences
CREATE TABLE public.preferencias_notificacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tipo_alerta TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tipo_alerta)
);

-- Enable RLS
ALTER TABLE public.preferencias_notificacao ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own preferences"
  ON public.preferencias_notificacao
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.preferencias_notificacao
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.preferencias_notificacao
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.preferencias_notificacao
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_preferencias_notificacao_updated_at
  BEFORE UPDATE ON public.preferencias_notificacao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();