
-- 1. Tabela despesas_recorrentes
CREATE TABLE IF NOT EXISTS public.despesas_recorrentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC(12,2) NOT NULL,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategoria_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  frequencia TEXT NOT NULL DEFAULT 'mensal'
    CHECK (frequencia IN ('diaria','semanal','quinzenal','mensal','bimestral','trimestral','semestral','anual')),
  intervalo INTEGER NOT NULL DEFAULT 1,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  metodo_pagamento TEXT NOT NULL DEFAULT 'conta'
    CHECK (metodo_pagamento IN ('dinheiro','pix','debito','conta','cartao_credito')),
  banco_id UUID REFERENCES public.bancos(id) ON DELETE SET NULL,
  cartao_id UUID REFERENCES public.cartoes(id) ON DELETE SET NULL,
  responsavel_id UUID REFERENCES public.responsaveis(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'ativa'
    CHECK (status IN ('ativa','pausada','cancelada')),
  dia_lembrete INTEGER,
  observacoes TEXT,
  link_cancelamento TEXT,
  vinculo_automatico BOOLEAN NOT NULL DEFAULT true,
  horizonte_geracao_meses INTEGER NOT NULL DEFAULT 12,
  origem_migracao TEXT NOT NULL DEFAULT 'manual'
    CHECK (origem_migracao IN ('manual','assinatura','transaction_recorrente')),
  ultima_geracao_ate DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.despesas_recorrentes TO authenticated;
GRANT ALL ON public.despesas_recorrentes TO service_role;

ALTER TABLE public.despesas_recorrentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own recorrentes" ON public.despesas_recorrentes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own recorrentes" ON public.despesas_recorrentes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own recorrentes" ON public.despesas_recorrentes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own recorrentes" ON public.despesas_recorrentes
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_despesas_recorrentes_updated_at
  BEFORE UPDATE ON public.despesas_recorrentes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_despesas_recorrentes_user ON public.despesas_recorrentes(user_id);
CREATE INDEX IF NOT EXISTS idx_despesas_recorrentes_status ON public.despesas_recorrentes(status);

-- 2. Vínculo em transactions e compras_cartao
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS recorrencia_id UUID REFERENCES public.despesas_recorrentes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_recorrencia ON public.transactions(recorrencia_id);

ALTER TABLE public.compras_cartao
  ADD COLUMN IF NOT EXISTS recorrencia_id UUID REFERENCES public.despesas_recorrentes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_compras_cartao_recorrencia ON public.compras_cartao(recorrencia_id);

-- 3. Backfill: migrar assinaturas para despesas_recorrentes
INSERT INTO public.despesas_recorrentes (
  id, user_id, nome, valor, moeda, category_id, frequencia,
  data_inicio, metodo_pagamento, banco_id, cartao_id,
  status, observacoes, link_cancelamento, vinculo_automatico, origem_migracao,
  created_at, updated_at
)
SELECT
  gen_random_uuid(),
  a.user_id,
  a.nome,
  a.valor,
  COALESCE(a.moeda,'BRL'),
  a.category_id,
  CASE WHEN a.frequencia IN ('diaria','semanal','quinzenal','mensal','bimestral','trimestral','semestral','anual')
       THEN a.frequencia ELSE 'mensal' END,
  a.data_inicio,
  CASE
    WHEN a.metodo_pagamento IN ('dinheiro','pix','debito','conta','cartao_credito') THEN a.metodo_pagamento
    WHEN a.cartao_id_pagamento IS NOT NULL THEN 'cartao_credito'
    ELSE 'conta'
  END,
  NULL,
  a.cartao_id_pagamento,
  CASE WHEN a.status IN ('ativa','pausada','cancelada') THEN a.status ELSE 'ativa' END,
  a.observacoes,
  a.link_cancelamento,
  COALESCE(a.vinculo_automatico, true),
  'assinatura',
  a.created_at,
  a.updated_at
FROM public.assinaturas a
WHERE NOT EXISTS (
  SELECT 1 FROM public.despesas_recorrentes dr
  WHERE dr.user_id = a.user_id AND dr.nome = a.nome AND dr.origem_migracao = 'assinatura'
);

-- 4. Backfill: migrar pais de transactions recorrentes
WITH pais AS (
  SELECT t.* FROM public.transactions t
  WHERE t.tipo_lancamento = 'recorrente'
    AND t.parent_id IS NULL
    AND t.deleted_at IS NULL
), inserted AS (
  INSERT INTO public.despesas_recorrentes (
    user_id, nome, valor, category_id, frequencia,
    data_inicio, metodo_pagamento, banco_id, status, origem_migracao,
    created_at, updated_at
  )
  SELECT
    p.user_id,
    COALESCE(NULLIF(p.description,''), 'Recorrência'),
    p.amount,
    p.category_id,
    'mensal',
    COALESCE(p.date, CURRENT_DATE),
    'conta',
    p.banco_id,
    'ativa',
    'transaction_recorrente',
    p.created_at,
    p.updated_at
  FROM pais p
  RETURNING id, user_id, nome, created_at
)
UPDATE public.transactions t
SET recorrencia_id = i.id
FROM inserted i, pais p
WHERE (t.id = p.id OR t.parent_id = p.id)
  AND i.user_id = p.user_id
  AND i.nome = COALESCE(NULLIF(p.description,''), 'Recorrência')
  AND i.created_at = p.created_at
  AND t.recorrencia_id IS NULL;
