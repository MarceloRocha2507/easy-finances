
ALTER TABLE public.assinaturas
  ADD COLUMN compra_cartao_id uuid REFERENCES public.compras_cartao(id) ON DELETE SET NULL,
  ADD COLUMN cartao_id_pagamento uuid REFERENCES public.cartoes(id) ON DELETE SET NULL,
  ADD COLUMN data_pagamento date,
  ADD COLUMN valor_cobrado numeric,
  ADD COLUMN vinculo_automatico boolean NOT NULL DEFAULT false;
