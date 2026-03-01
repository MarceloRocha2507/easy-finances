

# Cadastrar compras de cartao com categoria "Fatura do Cartao" e subcategorias

## Resumo

Todas as compras de cartao de credito passarao a ser automaticamente classificadas na categoria "Fatura do Cartao". Alem disso, o usuario podera informar uma subcategoria opcional para detalhar o tipo de gasto (ex: Alimentacao, Transporte). Nos graficos, as despesas de cartao aparecerao agrupadas sob "Fatura do Cartao".

---

## O que muda para o usuario

1. No formulario de nova compra e edicao de compra, o campo "Categoria" sera renomeado para "Subcategoria (opcional)" -- o usuario pode detalhar o gasto se quiser
2. Nos graficos de pizza e totais, todas as despesas de cartao aparecerao agrupadas como "Fatura do Cartao" com icone de cartao de credito e cor roxa
3. Nenhuma tela nova sera criada

---

## Detalhes tecnicos

### 1. Adicionar coluna `subcategoria_id` na tabela `compras_cartao`

Migracacao SQL para adicionar a nova coluna e copiar os dados existentes de `categoria_id` para `subcategoria_id`:

```sql
ALTER TABLE compras_cartao ADD COLUMN subcategoria_id uuid REFERENCES categories(id);
UPDATE compras_cartao SET subcategoria_id = categoria_id WHERE categoria_id IS NOT NULL;
```

### 2. Criar categoria "Fatura do Cartao" para todos os usuarios

- Adicionar ao trigger `create_default_categories` para novos usuarios
- Executar INSERT para usuarios existentes que ainda nao possuem essa categoria

```sql
INSERT INTO categories (user_id, name, icon, color, type, is_default)
SELECT DISTINCT user_id, 'Fatura do Cartão', 'credit-card', '#8b5cf6', 'expense', true
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.user_id = profiles.user_id AND c.name = 'Fatura do Cartão'
);
```

### 3. Atualizar `criarCompraCartao` (`src/services/compras-cartao.ts`)

- Ao criar uma compra, buscar a categoria "Fatura do Cartao" do usuario e setar como `categoria_id`
- Salvar a categoria selecionada pelo usuario como `subcategoria_id`

### 4. Atualizar `NovaCompraCartaoDialog` (`src/components/cartoes/NovaCompraCartaoDialog.tsx`)

- Renomear o campo de categoria para "Subcategoria (opcional)"
- Internamente, o campo `categoriaId` do form passa a ser a subcategoria
- A categoria principal "Fatura do Cartao" sera setada automaticamente no service

### 5. Atualizar `EditarCompraDialog` (`src/components/cartoes/EditarCompraDialog.tsx`)

- Mesma mudanca: renomear campo para "Subcategoria" e mapear para `subcategoria_id`

### 6. Atualizar hooks de graficos (`src/hooks/useTransactions.ts`)

- Em `useExpensesByCategory`: agrupar parcelas de cartao sob a categoria "Fatura do Cartao" (usar `categoria_id` da compra, que agora sempre sera "Fatura do Cartao")
- A subcategoria podera ser usada futuramente para drill-down, mas nao altera o agrupamento principal

### 7. Atualizar listagem de parcelas (`src/services/compras-cartao.ts`)

- Incluir `subcategoria_id` no select e no mapeamento de `ParcelaFatura`
- Adicionar campos de subcategoria ao tipo `ParcelaFatura`

### Arquivos alterados

- `src/services/compras-cartao.ts` -- tipos e funcao de criar/listar
- `src/components/cartoes/NovaCompraCartaoDialog.tsx` -- campo subcategoria
- `src/components/cartoes/EditarCompraDialog.tsx` -- campo subcategoria  
- `src/hooks/useTransactions.ts` -- agrupamento nos graficos
- Migracao SQL para nova coluna e categoria padrao

