
# Corrigir "Saldo Realizado" nos Relatorios

## Problema

O "Saldo Realizado" nos Relatorios mostra apenas `Receitas do mes - Despesas do mes`, sem considerar o saldo inicial nem transacoes de meses anteriores. Isso resulta em -R$ 639,48 quando as despesas do mes superam as receitas, mesmo que o usuario tenha saldo positivo na conta.

O Dashboard calcula corretamente: `Saldo Inicial + TODAS receitas historicas - TODAS despesas historicas`.

## Solucao

Renomear e ajustar o card para mostrar o **resultado do periodo** (diferenca entre receitas e despesas daquele mes), deixando claro que nao e o saldo da conta.

### Arquivo: `src/pages/Reports.tsx`

1. Trocar o titulo do card de "Saldo Realizado" para "Resultado do Periodo"
2. Mudar o tipo visual: se positivo, mostrar como "income" (verde); se negativo, como "expense" (vermelho)
3. Isso alinha a expectativa do usuario -- ele entende que e o resultado mensal, nao o saldo acumulado da conta

### Alternativa (mais completa)

Se o usuario preferir ver o saldo acumulado real igual ao Dashboard, a mudanca seria:

1. No `useTransactionStats`, alem do calculo por periodo, buscar tambem o saldo inicial e o total acumulado historico
2. Adicionar um novo campo `saldoAcumulado = saldoInicial + todasReceitasHistoricas - todasDespesasHistoricas`
3. Exibir esse valor no card "Saldo Disponivel"

**Recomendacao**: Implementar a alternativa simples (renomear para "Resultado do Periodo") pois o saldo acumulado ja esta no Dashboard e duplicar seria redundante. O relatorio deve focar na analise do periodo selecionado.

## Detalhes tecnicos

### `src/pages/Reports.tsx` (1 linha)

```typescript
// De:
<StatCardPrimary title="Saldo Realizado" value={stats?.balance || 0} icon={Wallet} type="neutral" delay={0} />

// Para:
<StatCardPrimary title="Resultado do Período" value={stats?.balance || 0} icon={Wallet} type={(stats?.balance || 0) >= 0 ? 'income' : 'expense'} delay={0} />
```

Essa mudanca deixa claro que o valor e o resultado (superavit ou deficit) do periodo filtrado, e a cor verde/vermelha indica visualmente se o mes foi positivo ou negativo.
