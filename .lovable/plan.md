

# Corrigir faturas desaparecidas -- join ambiguo com categories

## Causa raiz

Ao adicionar a coluna `subcategoria_id` (que tambem referencia `categories`), a tabela `compras_cartao` passou a ter **dois foreign keys** para `categories`. Quando o codigo faz `categoria:categories(...)` sem especificar qual FK usar, o PostgREST retorna **HTTP 300** (ambiguidade) em vez dos dados. Isso faz com que todas as listagens de parcelas retornem vazio.

## Correcao

Alterar todos os joins `categoria:categories(...)` em `compras_cartao` para usar o FK explicito: `categoria:categories!compras_cartao_categoria_id_fkey(...)`.

### Arquivos afetados

1. **`src/services/compras-cartao.ts`** (linha 176) -- `listarParcelasDaFatura`
   - De: `categoria:categories(id, name, color, icon)`
   - Para: `categoria:categories!compras_cartao_categoria_id_fkey(id, name, color, icon)`

2. **`src/hooks/useTransactions.ts`** (linha 305) -- `useExpensesByCategory`
   - De: `categoria:categories(id, name, icon, color)`
   - Para: `categoria:categories!compras_cartao_categoria_id_fkey(id, name, icon, color)`

3. **`src/hooks/useEconomia.ts`** (linha 286) -- `useAnaliseGastos`
   - De: `categoria:categories(id, name, icon, color)`
   - Para: `categoria:categories!compras_cartao_categoria_id_fkey(id, name, icon, color)`

Sao 3 alteracoes de uma unica linha cada, sem mudanca de logica. As faturas voltarao a aparecer imediatamente.
