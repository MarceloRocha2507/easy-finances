-- Remover constraint antiga que não inclui 'ajuste' e 'estorno'
ALTER TABLE compras_cartao DROP CONSTRAINT IF EXISTS chk_tipo_lancamento;

-- Adicionar constraint atualizada com todos os tipos permitidos
ALTER TABLE compras_cartao 
ADD CONSTRAINT chk_tipo_lancamento 
CHECK (tipo_lancamento = ANY (ARRAY['unica', 'parcelada', 'fixa', 'ajuste', 'estorno']));