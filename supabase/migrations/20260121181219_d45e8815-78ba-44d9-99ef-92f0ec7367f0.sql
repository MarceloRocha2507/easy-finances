-- Inserir parcelas faltantes para compras que não têm nenhuma
INSERT INTO parcelas_cartao (compra_id, numero_parcela, total_parcelas, valor, mes_referencia, paga, ativo, tipo_recorrencia)
SELECT 
  cc.id,
  cc.parcela_inicial + gs.n,
  cc.parcelas,
  cc.valor_total / cc.parcelas,
  (cc.mes_inicio::date + (gs.n || ' months')::interval)::date,
  false,
  true,
  CASE WHEN cc.tipo_lancamento = 'fixa' THEN 'fixa' ELSE 'normal' END
FROM compras_cartao cc
CROSS JOIN generate_series(0, cc.parcelas - 1) AS gs(n)
WHERE NOT EXISTS (
  SELECT 1 FROM parcelas_cartao pc WHERE pc.compra_id = cc.id
)
AND cc.ativo = true;