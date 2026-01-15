-- Criar tabela de investimentos
CREATE TABLE public.investimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'poupanca',
  instituicao text,
  valor_inicial numeric NOT NULL DEFAULT 0,
  valor_atual numeric NOT NULL DEFAULT 0,
  rentabilidade_anual numeric,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento date,
  cor text NOT NULL DEFAULT '#22c55e',
  icone text NOT NULL DEFAULT 'piggy-bank',
  ativo boolean NOT NULL DEFAULT true,
  observacao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela de movimentações
CREATE TABLE public.movimentacoes_investimento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investimento_id uuid NOT NULL REFERENCES public.investimentos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  tipo text NOT NULL DEFAULT 'aporte',
  valor numeric NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  observacao text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.investimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_investimento ENABLE ROW LEVEL SECURITY;

-- Políticas para investimentos
CREATE POLICY "Users can view their own investments"
ON public.investimentos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments"
ON public.investimentos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments"
ON public.investimentos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments"
ON public.investimentos FOR DELETE
USING (auth.uid() = user_id);

-- Políticas para movimentações
CREATE POLICY "Users can view their own movements"
ON public.movimentacoes_investimento FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own movements"
ON public.movimentacoes_investimento FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own movements"
ON public.movimentacoes_investimento FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movements"
ON public.movimentacoes_investimento FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_investimentos_updated_at
BEFORE UPDATE ON public.investimentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();