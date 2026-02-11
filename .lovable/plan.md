
# Corrigir: Acerto de Fatura nao deve afetar o Saldo Real

## Problema

A ultima alteracao excluiu "Acerto de Fatura" dos totais acumulados (allCompletedIncome / allCompletedExpense), o que mudou o calculo do Saldo Real. O usuario queria apenas que essas transacoes nao aparecessem nos cards de "Despesas do mes", sem alterar o saldo.

## Causa

Na linha 810 do `useTransactions.ts`, a exclusao das categorias especiais (metaCategoryIds) foi aplicada tanto nos totais acumulados (que calculam o Saldo Real) quanto nos totais mensais. O correto e excluir apenas dos totais mensais.

## Alteracao

### `src/hooks/useTransactions.ts` (linha 810)

Remover a linha que exclui categorias especiais do calculo acumulado:

**Antes:**
```
(allCompleted || []).forEach((t) => {
  const amount = Number(t.amount);
  if (t.category_id && metaCategoryIds.has(t.category_id)) return;  // <-- remover
  if (t.type === 'income') allCompletedIncome += amount;
  else allCompletedExpense += amount;
});
```

**Depois:**
```
(allCompleted || []).forEach((t) => {
  const amount = Number(t.amount);
  if (t.type === 'income') allCompletedIncome += amount;
  else allCompletedExpense += amount;
});
```

Os totais mensais (linhas 832-838) ja fazem a exclusao corretamente, entao os cards de Receitas/Despesas do mes continuarao sem contar "Acerto de Fatura".

## Resultado

- Cards de Receitas/Despesas do mes: continuam sem contar Acerto de Fatura
- Saldo Real: volta ao normal, pois o calculo acumulado inclui todas as transacoes
- Saldo Disponivel e Patrimonio: tambem voltam ao normal
