
-- Criar tabela movimentacoes_meta
CREATE TABLE public.movimentacoes_meta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meta_id UUID NOT NULL REFERENCES public.metas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('deposito', 'retirada')),
  valor NUMERIC NOT NULL,
  saldo_resultante NUMERIC NOT NULL,
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.movimentacoes_meta ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own movimentacoes"
ON public.movimentacoes_meta FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own movimentacoes"
ON public.movimentacoes_meta FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own movimentacoes"
ON public.movimentacoes_meta FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movimentacoes"
ON public.movimentacoes_meta FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_movimentacoes_meta_meta_id ON public.movimentacoes_meta(meta_id);
CREATE INDEX idx_movimentacoes_meta_user_id ON public.movimentacoes_meta(user_id);
