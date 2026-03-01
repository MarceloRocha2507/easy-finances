

# Filtrar relatórios para mostrar apenas compras do titular ("EU")

## Resumo

Atualmente, todas as compras de cartão (incluindo de outros responsáveis) são somadas nos relatórios e gráficos. A mudança fará com que apenas as compras onde o responsável é o titular ("EU" / `is_titular = true`) sejam contabilizadas.

## O que muda para o usuário

- Nos gráficos de pizza, barras e totais, apenas as compras do titular serão contabilizadas
- Compras de outros responsáveis (dependentes) não afetarão os valores dos relatórios
- A listagem de compras dentro dos cartões permanece inalterada (mostra tudo)

## Detalhes técnicos

### Arquivos alterados

#### 1. `src/hooks/useTransactions.ts` -- `useExpensesByCategory`

Na query de `parcelas_cartao` (linha ~301), adicionar o join com `responsaveis` via `compras_cartao` e filtrar apenas `is_titular = true`:

```text
De:
  compra:compras_cartao(categoria_id, categoria:categories!...(...))

Para:
  compra:compras_cartao!inner(
    categoria_id, 
    categoria:categories!compras_cartao_categoria_id_fkey(id, name, icon, color),
    responsavel:responsaveis!inner(is_titular)
  )
```

E adicionar filtro: `.eq('compra.responsavel.is_titular', true)`

Alternativamente, filtrar no forEach client-side verificando `p.compra?.responsavel?.is_titular === true`.

#### 2. `src/hooks/useEconomia.ts` -- `useAnaliseGastos`

Mesma mudança na query de `parcelas_cartao` (linha ~281): incluir join com responsaveis e filtrar por `is_titular = true`.

#### 3. `src/pages/Reports.tsx` (se necessário)

Os relatórios usam `useExpensesByCategory` e `useTransactions`, então a correção nos hooks já cobre os gráficos. Se houver alguma query adicional direta, será ajustada.

### Abordagem

Filtrar no lado do cliente (forEach) em vez de complicar a query do Supabase, verificando `p.compra?.responsavel?.is_titular !== false`. Compras sem responsável definido (null) continuam contando normalmente. Apenas compras explicitamente atribuídas a não-titulares serão excluídas.

Para isso, basta incluir `responsavel:responsaveis(is_titular)` no select e checar no forEach.
