-- 1. Criar tabela de responsáveis
CREATE TABLE public.responsaveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  apelido TEXT,
  telefone TEXT,
  is_titular BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para responsaveis
ALTER TABLE public.responsaveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own responsaveis"
ON public.responsaveis FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own responsaveis"
ON public.responsaveis FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responsaveis"
ON public.responsaveis FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responsaveis"
ON public.responsaveis FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_responsaveis_updated_at
BEFORE UPDATE ON public.responsaveis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Adicionar colunas faltantes em compras_cartao
ALTER TABLE public.compras_cartao 
ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES public.responsaveis(id),
ADD COLUMN IF NOT EXISTS data_compra DATE DEFAULT CURRENT_DATE;

-- 3. Criar tabela de acertos de fatura
CREATE TABLE public.acertos_fatura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cartao_id UUID NOT NULL REFERENCES public.cartoes(id) ON DELETE CASCADE,
  responsavel_id UUID NOT NULL REFERENCES public.responsaveis(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  valor_devido NUMERIC NOT NULL DEFAULT 0,
  valor_pago NUMERIC NOT NULL DEFAULT 0,
  data_acerto TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cartao_id, responsavel_id, mes_referencia)
);

-- RLS para acertos_fatura
ALTER TABLE public.acertos_fatura ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own acertos"
ON public.acertos_fatura FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own acertos"
ON public.acertos_fatura FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own acertos"
ON public.acertos_fatura FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own acertos"
ON public.acertos_fatura FOR DELETE
USING (auth.uid() = user_id);