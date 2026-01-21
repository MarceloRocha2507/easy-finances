-- Adicionar coluna para vincular estorno à compra original
ALTER TABLE public.compras_cartao 
ADD COLUMN compra_estornada_id uuid REFERENCES public.compras_cartao(id);