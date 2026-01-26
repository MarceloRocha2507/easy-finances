

## Diagnóstico: Cartões Duplicados no Sistema

### Problema Identificado

O sistema possui **cartões duplicados** com o mesmo nome, causando confusão na visualização:

| Cartão | Limite | Banco Vinculado | Criado Em | Status |
|--------|--------|-----------------|-----------|--------|
| Inter | R$ 1.400 | Inter | 04/01/2026 | **Original** (com compras) |
| Inter | R$ 5.000 | Nenhum | 26/01/2026 | Duplicado (sem compras) |
| Nubank | R$ 3.500 | Nubank | 04/01/2026 | **Original** (sem compras) |
| Nubank | R$ 8.000 | Nenhum | 26/01/2026 | Duplicado (com compras) |

### Causa Provável

Os cartões duplicados foram criados em 26/01/2026 às 00:00 (horário UTC), possivelmente durante:
1. Uma migração de dados anterior
2. Criação manual acidental
3. Importação de dados

### Por que os valores parecem "alterados"

Na verdade, os valores **não mudaram**. O que acontece é que:
- Ao vincular o cartão "Inter (R$ 1.400)" ao banco Inter, ele aparece com suas compras reais (R$ 1.442,93 usado)
- O cartão "Inter (R$ 5.000)" duplicado não tem compras vinculadas
- A interface mostra ambos, causando a impressão de inconsistência

### Solução Proposta

**Opção 1: Limpar Cartões Duplicados (Recomendado)**

Excluir os cartões duplicados que não têm compras vinculadas:

```sql
-- Verificar antes de excluir
SELECT c.id, c.nome, c.limite, COUNT(comp.id) as compras
FROM cartoes c
LEFT JOIN compras_cartao comp ON comp.cartao_id = c.id
WHERE c.nome IN ('Nubank', 'Inter')
GROUP BY c.id, c.nome, c.limite;

-- Excluir cartões sem compras (após confirmar)
DELETE FROM cartoes WHERE id IN (
  'a192f332-3fa2-4ba2-ba98-6300b1784f3e', -- Inter R$ 5.000 (duplicado)
  'a0938e60-31de-4e5c-a954-6bb4f1b28c2c'  -- Nubank R$ 8.000 (duplicado - MAS TEM COMPRAS!)
);
```

**Atenção**: O cartão Nubank R$ 8.000 tem **5 compras no valor de R$ 3.040**. Antes de excluir, essas compras precisariam ser transferidas para o cartão Nubank R$ 3.500.

**Opção 2: Renomear para Diferenciar**

Renomear os cartões para evitar confusão:
- "Nubank (R$ 3.500)" → "Nubank Principal"
- "Nubank (R$ 8.000)" → "Nubank Adicional"
- "Inter (R$ 1.400)" → "Inter Principal"
- "Inter (R$ 5.000)" → "Inter Adicional"

**Opção 3: Transferir Compras e Consolidar**

1. Transferir todas as compras para os cartões principais
2. Ajustar os limites se necessário
3. Excluir os cartões duplicados

### Implementação Recomendada

**Fase 1: Diagnóstico Completo**
1. Verificar todas as compras de cada cartão duplicado
2. Identificar qual cartão deve ser mantido
3. Confirmar com o usuário

**Fase 2: Migração de Compras**
```sql
-- Transferir compras do Nubank R$ 8.000 para o Nubank R$ 3.500
UPDATE compras_cartao 
SET cartao_id = '8607c9f1-ccdc-42df-ad2a-d2669c7b347c'
WHERE cartao_id = 'a0938e60-31de-4e5c-a954-6bb4f1b28c2c';
```

**Fase 3: Limpeza**
```sql
-- Excluir cartões duplicados após migração
DELETE FROM cartoes 
WHERE id IN (
  'a192f332-3fa2-4ba2-ba98-6300b1784f3e',
  'a0938e60-31de-4e5c-a954-6bb4f1b28c2c'
);
```

### Prevenção Futura

Implementar validação no cadastro de cartões:
1. Alertar quando um cartão com mesmo nome já existe
2. Sugerir editar o existente em vez de criar novo
3. Adicionar constraint única opcional (nome + user_id)

### Próximos Passos

Você gostaria que eu:
1. **Execute a limpeza automaticamente** (transferir compras + excluir duplicados)?
2. **Apenas renomeie os cartões** para diferenciá-los?
3. **Mostre um diálogo de confirmação** para você escolher quais manter?

