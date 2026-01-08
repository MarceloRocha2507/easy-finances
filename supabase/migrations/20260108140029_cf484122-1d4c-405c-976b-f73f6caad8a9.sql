-- Tabela para armazenar alertas lidos
CREATE TABLE public.notificacoes_lidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alerta_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, alerta_id)
);

-- Habilitar RLS
ALTER TABLE public.notificacoes_lidas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own read notifications"
  ON public.notificacoes_lidas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own read notifications"
  ON public.notificacoes_lidas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own read notifications"
  ON public.notificacoes_lidas FOR DELETE
  USING (auth.uid() = user_id);