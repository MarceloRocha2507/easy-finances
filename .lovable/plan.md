
# Corrigir Categorias Duplicadas nos Dialogs de Compra do Cartao

## Problema

Os dialogs `NovaCompraCartaoDialog.tsx` e `EditarCompraDialog.tsx` carregam todas as categorias do banco sem filtrar por tipo (`expense`). Como existem categorias com o mesmo nome para tipos diferentes (ex: "Acerto de Fatura" para receita e despesa), elas aparecem duplicadas.

## Solucao

Aplicar o mesmo tratamento ja feito em `DespesasCartao.tsx`: filtrar por `type = 'expense'` na query e deduplicar por nome.

## Mudancas tecnicas

### 1. `src/components/cartoes/NovaCompraCartaoDialog.tsx` (~linha 96-99)

Adicionar filtro `.eq('type', 'expense')` na query de categorias e deduplicar por nome antes de salvar no estado:

```typescript
const { data } = await supabase
  .from("categories")
  .select("id, name, color, icon")
  .eq("type", "expense")
  .order("name");

if (data) {
  const unique = data.filter((cat, i, arr) => arr.findIndex(c => c.name === cat.name) === i);
  setCategorias(unique);
}
```

### 2. `src/components/cartoes/EditarCompraDialog.tsx` (~linha 182-196)

Mesma correcao: adicionar `.eq('type', 'expense')` e deduplicar por nome:

```typescript
const { data: cats } = await supabase
  .from("categories")
  .select("id, name, color, icon")
  .eq("type", "expense")
  .order("name");

if (cats) {
  const unique = cats.filter((c, i, arr) => arr.findIndex(x => x.name === c.name) === i);
  setCategorias(
    unique.map((c: any) => ({
      id: c.id,
      nome: c.name,
      cor: c.color || "#6366f1",
      icone: c.icon,
    }))
  );
}
```

## Arquivos modificados

- `src/components/cartoes/NovaCompraCartaoDialog.tsx` - Filtrar categorias por tipo expense e deduplicar
- `src/components/cartoes/EditarCompraDialog.tsx` - Filtrar categorias por tipo expense e deduplicar
