
# Corrigir calculo do Ajustar Saldo Real

## Problema

O "Ajustar Saldo Real" usa a formula errada para calcular o novo saldo inicial. O saldo real e calculado com receitas e despesas de **todo o historico**, mas o dialog recebe apenas receitas e despesas **do mes atual**. Isso causa uma diferenca enorme no resultado.

Formula atual (errada):
```text
novoSaldoInicial = valorInformado - receitasDoMes + despesasDoMes
```

Formula correta:
```text
novoSaldoInicial = valorInformado - receitasAcumuladas + despesasAcumuladas
```

No seu caso: voce informou R$ 0,00 mas a formula subtraiu apenas as receitas do mes e somou apenas as despesas do mes, em vez de usar os totais acumulados. Isso gerou o saldo inicial errado, fazendo o saldo real pular para R$ 2.368,61.

## Alteracoes

### 1. `src/pages/Transactions.tsx`

Passar `allCompletedIncome` e `allCompletedExpense` (acumulados) em vez de `completedIncome` e `completedExpense` (do mes):

```text
<AjustarSaldoDialog 
  ...
  totalReceitas={stats?.allCompletedIncome || 0}
  totalDespesas={stats?.allCompletedExpense || 0}
/>
```

### 2. Verificar se `allCompletedIncome` e `allCompletedExpense` estao expostos no retorno do hook

O hook `useCompleteStats` ja calcula e retorna esses valores no objeto `stats`, entao basta referencia-los corretamente.

## Resultado

Quando voce informar R$ 0,00 como saldo real, o sistema vai calcular:
- novoSaldoInicial = 0 - todasReceitas + todasDespesas
- Que e exatamente o inverso de: saldoReal = saldoInicial + todasReceitas - todasDespesas = 0
