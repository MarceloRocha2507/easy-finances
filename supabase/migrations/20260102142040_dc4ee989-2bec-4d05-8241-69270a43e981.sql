-- Create cartoes table with color field
CREATE TABLE public.cartoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  bandeira TEXT,
  limite DECIMAL(12,2) NOT NULL DEFAULT 0,
  dia_fechamento INTEGER NOT NULL DEFAULT 1,
  dia_vencimento INTEGER NOT NULL DEFAULT 10,
  cor TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create compras_cartao table
CREATE TABLE public.compras_cartao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cartao_id UUID NOT NULL REFERENCES public.cartoes(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  parcelas INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create parcelas_cartao table
CREATE TABLE public.parcelas_cartao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id UUID NOT NULL REFERENCES public.compras_cartao(id) ON DELETE CASCADE,
  valor DECIMAL(12,2) NOT NULL,
  numero_parcela INTEGER NOT NULL,
  total_parcelas INTEGER NOT NULL,
  mes_referencia DATE NOT NULL,
  paga BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_cartao ENABLE ROW LEVEL SECURITY;

-- RLS policies for cartoes
CREATE POLICY "Users can view their own cards" ON public.cartoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own cards" ON public.cartoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cards" ON public.cartoes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cards" ON public.cartoes FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for compras_cartao
CREATE POLICY "Users can view their own purchases" ON public.compras_cartao FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own purchases" ON public.compras_cartao FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own purchases" ON public.compras_cartao FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own purchases" ON public.compras_cartao FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for parcelas_cartao (via compra relationship)
CREATE POLICY "Users can view their own installments" ON public.parcelas_cartao FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.compras_cartao c WHERE c.id = compra_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can create their own installments" ON public.parcelas_cartao FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.compras_cartao c WHERE c.id = compra_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can update their own installments" ON public.parcelas_cartao FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.compras_cartao c WHERE c.id = compra_id AND c.user_id = auth.uid()));
CREATE POLICY "Users can delete their own installments" ON public.parcelas_cartao FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.compras_cartao c WHERE c.id = compra_id AND c.user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_cartoes_updated_at BEFORE UPDATE ON public.cartoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();