---
name: Total Estimado do Mês
description: Fórmula do card "Total Estimado" em Transações — considera apenas pendências do mês.
type: feature
---

Fórmula:
Total Estimado = Receitas pendentes (titular) − Despesas pendentes (titular) − Fatura do Cartão em aberto (parte titular) + Ajuste manual.

Regras:
- Apenas o mês selecionado; não soma Saldo Real acumulado.
- Ignora transações `desconsiderada = true`.
- Faturas pagas não entram (saem das pendências); estorno reincluí automaticamente.
- Implementação em `useCompleteStats` (src/hooks/useTransactions.ts).
