-- Adicionar colunas para saldo e tipo de conta na tabela bancos
ALTER TABLE public.bancos 
ADD COLUMN IF NOT EXISTS saldo_inicial NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS tipo_conta TEXT DEFAULT 'corrente',
ADD COLUMN IF NOT EXISTS agencia TEXT,
ADD COLUMN IF NOT EXISTS conta TEXT;

-- Adicionar coluna banco_id na tabela transactions (opcional, para vincular transações a bancos)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS banco_id UUID REFERENCES public.bancos(id) ON DELETE SET NULL;

-- Índice para performance em transactions
CREATE INDEX IF NOT EXISTS idx_transactions_banco_id ON public.transactions(banco_id);

-- Migrar saldo existente do profiles para um banco padrão para usuários que têm saldo_inicial
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT user_id, saldo_inicial 
    FROM profiles 
    WHERE saldo_inicial != 0
  LOOP
    -- Verificar se usuário já tem banco cadastrado
    IF NOT EXISTS (SELECT 1 FROM bancos WHERE user_id = profile_record.user_id) THEN
      INSERT INTO bancos (user_id, nome, saldo_inicial, cor, tipo_conta)
      VALUES (
        profile_record.user_id,
        'Conta Principal',
        profile_record.saldo_inicial,
        '#6366f1',
        'digital'
      );
    ELSE
      -- Se já tem banco, atualizar o primeiro banco com o saldo_inicial do profile
      UPDATE bancos 
      SET saldo_inicial = profile_record.saldo_inicial
      WHERE id = (
        SELECT id FROM bancos 
        WHERE user_id = profile_record.user_id 
        ORDER BY created_at 
        LIMIT 1
      );
    END IF;
  END LOOP;
END $$;