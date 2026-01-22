-- 1. Deletar parcelas duplicadas (mantendo a mais antiga por created_at)
WITH duplicatas AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY compra_id, numero_parcela, mes_referencia 
      ORDER BY created_at
    ) as rn
  FROM parcelas_cartao
  WHERE ativo = true
)
DELETE FROM parcelas_cartao 
WHERE id IN (SELECT id FROM duplicatas WHERE rn > 1);

-- 2. Criar índice único para prevenir parcelas duplicadas no futuro
CREATE UNIQUE INDEX IF NOT EXISTS idx_parcelas_unique 
ON parcelas_cartao (compra_id, numero_parcela, mes_referencia)
WHERE ativo = true;