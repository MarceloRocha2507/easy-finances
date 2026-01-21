-- Gerar parcelas faltantes para todas as compras que não possuem parcelas
-- Esta migration corrige o problema de compras criadas sem parcelas associadas

INSERT INTO public.parcelas_cartao (compra_id, valor, numero_parcela, total_parcelas, mes_referencia, paga, ativo, tipo_recorrencia)
SELECT 
  c.id as compra_id,
  ROUND((c.valor_total / c.parcelas)::numeric, 2) as valor,
  (c.parcela_inicial - 1 + gs.n) as numero_parcela,
  c.parcelas as total_parcelas,
  (c.mes_inicio + ((gs.n - 1) || ' months')::interval)::date as mes_referencia,
  false as paga,
  true as ativo,
  CASE 
    WHEN c.tipo_lancamento = 'fixa' THEN 'fixa'
    ELSE 'normal'
  END as tipo_recorrencia
FROM public.compras_cartao c
CROSS JOIN generate_series(1, c.parcelas) as gs(n)
WHERE c.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.parcelas_cartao p WHERE p.compra_id = c.id
  );