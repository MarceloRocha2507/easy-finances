
-- Move all transactions from "Fatura de Cartão" to "Fatura do Cartão"
UPDATE transactions SET category_id = '7739c67a-d560-4ef0-83bc-b2dbb938ecfd'
WHERE category_id = '8aaed579-cef0-48a2-9829-d10c70c213da';

-- Move all compras_cartao subcategoria references
UPDATE compras_cartao SET subcategoria_id = '7739c67a-d560-4ef0-83bc-b2dbb938ecfd'
WHERE subcategoria_id = '8aaed579-cef0-48a2-9829-d10c70c213da';

-- Move all compras_cartao categoria references
UPDATE compras_cartao SET categoria_id = '7739c67a-d560-4ef0-83bc-b2dbb938ecfd'
WHERE categoria_id = '8aaed579-cef0-48a2-9829-d10c70c213da';

-- Move any assinaturas references
UPDATE assinaturas SET category_id = '7739c67a-d560-4ef0-83bc-b2dbb938ecfd'
WHERE category_id = '8aaed579-cef0-48a2-9829-d10c70c213da';

-- Move any orcamentos references
UPDATE orcamentos SET category_id = '7739c67a-d560-4ef0-83bc-b2dbb938ecfd'
WHERE category_id = '8aaed579-cef0-48a2-9829-d10c70c213da';

-- Move any category_rules references
UPDATE category_rules SET category_id = '7739c67a-d560-4ef0-83bc-b2dbb938ecfd'
WHERE category_id = '8aaed579-cef0-48a2-9829-d10c70c213da';

-- Move any simulacoes_compra references
UPDATE simulacoes_compra SET category_id = '7739c67a-d560-4ef0-83bc-b2dbb938ecfd'
WHERE category_id = '8aaed579-cef0-48a2-9829-d10c70c213da';

-- Delete the duplicate "Fatura de Cartão"
DELETE FROM categories WHERE id = '8aaed579-cef0-48a2-9829-d10c70c213da';
