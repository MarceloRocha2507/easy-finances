## Correção: cálculo do Total Estimado

A fórmula atual mistura **Saldo Real acumulado** com pendências, o que faz o card ficar positivo mesmo quando as despesas pendentes superam as receitas. Vou ajustar para usar **apenas pendências do mês selecionado**.

### Nova fórmula

```
Total Estimado do mês =
    Receitas pendentes do mês (titular)
  − Despesas pendentes do mês (titular)
  − Faturas em aberto do mês (parte do titular)
  + Ajuste manual
```

Regras:
- Ignora `desconsiderada = true` (já é feito hoje).
- Faturas pagas não entram (a categoria "Fatura do Cartão" pendente já cobre o caso de fatura em aberto registrada como transação; somamos a parte do titular das parcelas em aberto sem duplicar — pega-se o **maior** entre `faturaCartaoTitular` via parcelas e o lançamento manual, como já é feito para Despesas).
- Apenas o mês selecionado.

### Mudança técnica

Arquivo único: `src/hooks/useTransactions.ts` (`useCompleteStats`), linha 1442.

Substituir:
```ts
const estimatedBalance =
  realBalance + stats.pendingIncome - stats.pendingExpense
  - faturaCartaoTitular + ajusteEstimadoManual;
```
Por:
```ts
const estimatedBalance =
  stats.pendingIncome - stats.pendingExpense
  - faturaCartaoTitular + ajusteEstimadoManual;
```

Subtítulo do card em `Transactions.tsx` muda de "previsto p/ MMM/yy" para "saldo previsto do mês (pendências)" para deixar claro o escopo.

### Validação dos cenários

| Cenário | Resultado |
|---|---|
| Receita 1.542 e despesas pendentes 734,27 + 921,50 | 1.542 − 1.655,77 = **−113,77** ✅ |
| Pagar fatura | Fatura sai das pendências e a despesa de pagamento entra em "completed" → não impacta o estimado (que olha só pendências). |
| Estornar pagamento | Fatura volta para pendentes → estimado recalcula automaticamente. |
| Editar/excluir despesa pendente | Invalidação já existente refaz o cálculo. |
| Mudar mês | Hook re-busca pendentes do mês selecionado. |
| `desconsiderada` | Continua excluída. |

### Fora do escopo
- Saldo Real, Despesas, Receitas e demais cards permanecem inalterados.
- Sem mudanças de schema, sem mudanças no Dashboard.

Após implementar, atualizo a memória `mem://features/transactions/total-estimado-mes` com a nova fórmula.
