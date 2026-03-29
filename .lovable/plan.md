
Objetivo: corrigir a divergência onde “Despesas pagas” continua em R$ 1.147,09 mesmo com faturas pagas, e alinhar Dashboard + Transações para refletirem a saída de caixa real.

1) Causa raiz identificada
- Hoje o card depende principalmente de `transactions` do mês.
- Parte dos pagamentos de cartão foi marcada diretamente em `parcelas_cartao.paga` (fluxo manual), sem criar transação de “Fatura”.
- Resultado: existe valor pago nas parcelas (ex.: R$ 1.427,50), mas não totalmente em `transactions`, então o card fica menor.

2) Ajuste no cálculo central (`src/hooks/useTransactions.ts` – `useCompleteStats`)
- Manter `completedExpense` como está (sem fatura) para não quebrar “Resultado do Mês”/estimado.
- Recalcular `completedExpenseWithFatura` com lógica de conciliação:
  - `despesasBase` = despesas completed do mês sem categorias de meta e sem categoria de fatura.
  - `faturaViaTransacao` = soma de despesas completed de fatura no mês.
  - `faturaViaParcelasPagas` = soma de `parcelas_cartao` do titular com `paga = true`, `ativo = true`, e `updated_at` dentro do mês selecionado.
  - `faturaConsolidada = max(faturaViaTransacao, faturaViaParcelasPagas)` (evita subcontagem e evita dupla em cenários mistos).
  - `completedExpenseWithFatura = despesasBase + faturaConsolidada`.
- Incluir compatibilidade com categorias legadas:
  - considerar “Fatura do Cartão” e “Fatura de Cartão”.

3) Alinhamento visual de cards
- `src/pages/Transactions.tsx`
  - Confirmar uso de `stats?.completedExpenseWithFatura` no card “Despesas” (já está, manter).
  - Ajustar subtítulo para deixar explícito: “pagas (inclui fatura)”.
- `src/pages/Dashboard.tsx`
  - Trocar card “Despesas” para `completeStats?.completedExpenseWithFatura`.
  - Manter “Resultado do Mês” e “Estimado” com a lógica atual (sem alteração de fórmula).

4) Validação pós-implementação
- Cenário A: pagamento via “Pagar Fatura” (com transação criada) → valor correto sem duplicar.
- Cenário B: marcação manual de parcelas pagas (sem transação) → card passa a refletir valor pago.
- Cenário C: mês sem fatura paga → números permanecem iguais ao comportamento atual.
- Cenário D: Dashboard e Transações mostram o mesmo total de “Despesas pagas” (saída de caixa), enquanto “Resultado do Mês” continua consistente.

Arquivos previstos
- `src/hooks/useTransactions.ts`
- `src/pages/Dashboard.tsx`
- `src/pages/Transactions.tsx` (texto/subinfo)
