-- Normalizar mes_referencia para sempre ser o primeiro dia do mês
UPDATE public.parcelas_cartao
SET mes_referencia = date_trunc('month', mes_referencia)::date
WHERE mes_referencia != date_trunc('month', mes_referencia)::date;

-- Normalizar mes_inicio nas compras também
UPDATE public.compras_cartao
SET mes_inicio = date_trunc('month', mes_inicio)::date
WHERE mes_inicio != date_trunc('month', mes_inicio)::date;