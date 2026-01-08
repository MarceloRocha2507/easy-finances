-- Adicionar campos para tipo de lançamento e parcelamento nas transações
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS tipo_lancamento TEXT DEFAULT 'unica',
ADD COLUMN IF NOT EXISTS total_parcelas INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS numero_parcela INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;

-- Criar índice para buscar parcelas por parent_id
CREATE INDEX IF NOT EXISTS idx_transactions_parent_id ON public.transactions(parent_id);

-- Atualizar transações existentes recorrentes para tipo 'fixa'
UPDATE public.transactions 
SET tipo_lancamento = 'fixa' 
WHERE is_recurring = true AND tipo_lancamento = 'unica';