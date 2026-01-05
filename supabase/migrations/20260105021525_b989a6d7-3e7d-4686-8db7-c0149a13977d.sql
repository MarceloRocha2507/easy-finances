-- Adicionar colunas na tabela compras_cartao
ALTER TABLE public.compras_cartao 
ADD COLUMN IF NOT EXISTS tipo_lancamento text NOT NULL DEFAULT 'unica',
ADD COLUMN IF NOT EXISTS mes_inicio date NOT NULL DEFAULT (date_trunc('month', now())::date),
ADD COLUMN IF NOT EXISTS parcela_inicial integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS categoria_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Adicionar colunas na tabela parcelas_cartao
ALTER TABLE public.parcelas_cartao 
ADD COLUMN IF NOT EXISTS tipo_recorrencia text NOT NULL DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- Criar indices para performance
CREATE INDEX IF NOT EXISTS idx_compras_cartao_tipo ON public.compras_cartao(tipo_lancamento);
CREATE INDEX IF NOT EXISTS idx_compras_cartao_ativo ON public.compras_cartao(ativo);
CREATE INDEX IF NOT EXISTS idx_compras_cartao_mes_inicio ON public.compras_cartao(mes_inicio);
CREATE INDEX IF NOT EXISTS idx_parcelas_cartao_ativo ON public.parcelas_cartao(ativo);
CREATE INDEX IF NOT EXISTS idx_parcelas_cartao_tipo_recorrencia ON public.parcelas_cartao(tipo_recorrencia);

-- Adicionar constraint para tipos validos
ALTER TABLE public.compras_cartao 
ADD CONSTRAINT chk_tipo_lancamento CHECK (tipo_lancamento IN ('unica', 'parcelada', 'fixa'));

ALTER TABLE public.parcelas_cartao 
ADD CONSTRAINT chk_tipo_recorrencia CHECK (tipo_recorrencia IN ('normal', 'fixa'));