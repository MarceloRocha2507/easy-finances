-- Adicionar campos para controle de transações pendentes
ALTER TABLE public.transactions 
ADD COLUMN status text NOT NULL DEFAULT 'completed',
ADD COLUMN due_date date,
ADD COLUMN paid_date date,
ADD COLUMN is_recurring boolean DEFAULT false,
ADD COLUMN recurrence_day integer;

-- Criar índices para consultas eficientes
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_due_date ON public.transactions(due_date);

-- Adicionar constraint para validar status
ALTER TABLE public.transactions 
ADD CONSTRAINT check_status CHECK (status IN ('pending', 'completed', 'cancelled'));