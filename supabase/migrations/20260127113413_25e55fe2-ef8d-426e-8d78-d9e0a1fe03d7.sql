-- Índice para filtros por mês de referência (acelera queries de fatura)
CREATE INDEX IF NOT EXISTS idx_parcelas_mes_referencia 
ON parcelas_cartao (mes_referencia);

-- Índice para filtros por cartão (acelera joins)
CREATE INDEX IF NOT EXISTS idx_compras_cartao_id 
ON compras_cartao (cartao_id);

-- Índice composto para queries mais frequentes
CREATE INDEX IF NOT EXISTS idx_parcelas_compra_mes 
ON parcelas_cartao (compra_id, mes_referencia);