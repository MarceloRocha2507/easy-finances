
# Corrigir Categorias Duplicadas na Tela de Despesas do Cartao

## Problema

Na pagina `DespesasCartao.tsx`, o dropdown de filtro de categorias lista todas as categorias do usuario sem filtrar por tipo. Como existem categorias com o mesmo nome mas tipos diferentes (ex: "Outros" para receita e "Outros" para despesa), elas aparecem duplicadas na lista.

## Solucao

Filtrar as categorias para exibir apenas as do tipo `expense` no dropdown, ja que a tela de despesas do cartao lida exclusivamente com despesas. Isso elimina duplicatas como "Outros" (receita) e "Outros" (despesa).

## Mudanca tecnica

### Arquivo: `src/pages/DespesasCartao.tsx` (linha ~657)

Alterar de:

```typescript
{categories.map((cat) => (
```

Para:

```typescript
{categories.filter((cat) => cat.type === 'expense').map((cat) => (
```

Como medida adicional de seguranca, adicionar deduplicacao por nome para evitar categorias com nome repetido mesmo dentro do tipo `expense`:

```typescript
{categories
  .filter((cat) => cat.type === 'expense')
  .filter((cat, index, arr) => arr.findIndex(c => c.name === cat.name) === index)
  .map((cat) => (
```

## Arquivos modificados

- `src/pages/DespesasCartao.tsx` - Filtrar categorias por tipo expense e deduplicar por nome
