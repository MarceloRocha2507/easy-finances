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
- Créditos/adiantamentos de cartão com parcela negativa reduzem a fatura em aberto, mesmo quando a compra de ajuste não tem `responsavel_id`.
- Implementação em `useCompleteStats` (src/hooks/useTransactions.ts).
