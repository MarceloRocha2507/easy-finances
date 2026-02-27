
CREATE TABLE public.simulacoes_compra (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  nome text NOT NULL,
  valor_total numeric NOT NULL,
  forma_pagamento text NOT NULL,
  parcelas integer NOT NULL DEFAULT 1,
  cartao_id uuid REFERENCES public.cartoes(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  data_prevista date NOT NULL,
  valor_seguranca numeric NOT NULL DEFAULT 0,
  veredicto text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.simulacoes_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own simulations"
  ON public.simulacoes_compra FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own simulations"
  ON public.simulacoes_compra FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own simulations"
  ON public.simulacoes_compra FOR DELETE
  USING (auth.uid() = user_id);
