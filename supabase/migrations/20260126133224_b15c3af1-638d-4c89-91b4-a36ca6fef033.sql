-- Adicionar coluna updated_at nas tabelas parcelas_cartao e compras_cartao
ALTER TABLE public.parcelas_cartao 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.compras_cartao 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Criar triggers para atualização automática
CREATE TRIGGER update_parcelas_cartao_updated_at
  BEFORE UPDATE ON public.parcelas_cartao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compras_cartao_updated_at
  BEFORE UPDATE ON public.compras_cartao
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inicializar com created_at para registros existentes
UPDATE public.parcelas_cartao SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE public.compras_cartao SET updated_at = created_at WHERE updated_at IS NULL;