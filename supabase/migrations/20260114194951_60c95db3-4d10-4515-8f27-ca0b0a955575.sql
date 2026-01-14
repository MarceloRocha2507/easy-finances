-- Create table for balance adjustment history
CREATE TABLE public.historico_ajustes_saldo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  saldo_anterior NUMERIC NOT NULL,
  saldo_novo NUMERIC NOT NULL,
  diferenca NUMERIC NOT NULL,
  saldo_inicial_anterior NUMERIC NOT NULL,
  saldo_inicial_novo NUMERIC NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.historico_ajustes_saldo ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own adjustment history"
ON public.historico_ajustes_saldo
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own adjustments"
ON public.historico_ajustes_saldo
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own adjustments"
ON public.historico_ajustes_saldo
FOR DELETE
USING (auth.uid() = user_id);