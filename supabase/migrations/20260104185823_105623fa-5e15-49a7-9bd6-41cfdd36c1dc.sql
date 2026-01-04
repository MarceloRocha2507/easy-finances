-- Tabela metas
CREATE TABLE public.metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  valor_alvo numeric NOT NULL DEFAULT 0,
  valor_atual numeric NOT NULL DEFAULT 0,
  data_limite date NULL,
  cor text NOT NULL DEFAULT '#6366f1',
  icone text NOT NULL DEFAULT 'piggy-bank',
  concluida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own metas"
ON public.metas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own metas"
ON public.metas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metas"
ON public.metas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metas"
ON public.metas FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_metas_updated_at
BEFORE UPDATE ON public.metas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_metas_user_id ON public.metas(user_id);
CREATE INDEX idx_metas_user_concluida ON public.metas(user_id, concluida, data_limite);