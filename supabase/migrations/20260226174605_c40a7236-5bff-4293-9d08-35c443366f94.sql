
CREATE TABLE public.assinaturas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  nome text NOT NULL,
  categoria text NOT NULL DEFAULT 'outros',
  valor numeric NOT NULL,
  moeda text NOT NULL DEFAULT 'BRL',
  frequencia text NOT NULL DEFAULT 'mensal',
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  proxima_cobranca date NOT NULL,
  metodo_pagamento text NOT NULL DEFAULT 'cartao_credito',
  status text NOT NULL DEFAULT 'ativa',
  observacoes text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  data_cancelamento date,
  data_pausa date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assinaturas" ON public.assinaturas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own assinaturas" ON public.assinaturas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assinaturas" ON public.assinaturas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assinaturas" ON public.assinaturas FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_assinaturas_updated_at BEFORE UPDATE ON public.assinaturas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
