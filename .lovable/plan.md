

## Correção: Dupla contabilização ao pagar fatura do cartão

### Problema

Quando o usuário paga a fatura do cartão, o sistema cria uma transação "completed" com categoria "Fatura do Cartão". Essa transação entra no cálculo de `allCompletedExpense`, reduzindo o `saldoDisponivel`. Porém, se as parcelas do cartão ainda não foram marcadas como pagas (ou no período antes da sincronização), a `faturaCartaoTitular` continua subtraindo o mesmo valor. Resultado: o valor da fatura é subtraído **duas vezes** do Saldo Estimado.

### Solução

Excluir transações com categoria "Fatura do Cartão" do cálculo de `allCompletedExpense` e `allCompletedIncome`, pois o sistema de cartões já rastreia esses valores separadamente via `parcelas_cartao`. Também excluir do cálculo de `completedExpense` do mês (cards de Receitas/Despesas).

### Alterações em `src/hooks/useTransactions.ts`

**1. Loop de `allCompleted` (linhas 1158-1162):** Filtrar transações "Fatura do Cartão":

```typescript
(allCompleted || []).forEach((t) => {
  const amount = Number(t.amount);
  const isFaturaCartao = t.category_id && faturaCategoryIds.has(t.category_id);
  if (isFaturaCartao) return; // já rastreado pelo sistema de cartões
  if (t.type === 'income') allCompletedIncome += amount;
  else allCompletedExpense += amount;
});
```

**2. Loop de `completedDoMes` (linhas 1181-1188):** Adicionar mesma exclusão (além da de metas):

```typescript
(completedDoMes || []).forEach((t) => {
  const amount = Number(t.amount);
  const isMetaCategory = t.category_id && metaCategoryIds.has(t.category_id);
  const isFaturaCartao = t.category_id && faturaCategoryIds.has(t.category_id);
  if (!isMetaCategory && !isFaturaCartao) {
    if (t.type === 'income') stats.completedIncome += amount;
    else stats.completedExpense += amount;
  }
});
```

### Resultado

- Pagamento de fatura do cartão não reduz mais o saldo real/estimado (já coberto por `faturaCartaoTitular`)
- Quando parcelas são pagas, `faturaCartaoTitular` zera naturalmente
- Cards de Receitas/Despesas do mês não incluem pagamentos de fatura (evita inflar despesas)

