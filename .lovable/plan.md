
# Corrigir filtragem por periodo na tela de Transacoes

## Problema

O hook `useCompleteStats()` e chamado na linha 146 de `Transactions.tsx` **sem nenhum parametro de data**. Isso faz com que ele sempre use `new Date()` (mes atual) como referencia, independente do periodo selecionado pelo usuario nos filtros. Resultado: os cards de Receitas, Despesas, A Receber, A Pagar, Saldo Real e Estimado nunca mudam ao navegar entre meses.

## Solucao

Passar o mes selecionado pelo usuario como parametro para `useCompleteStats`.

### Arquivo: `src/pages/Transactions.tsx`

**Linha 146** - Passar a data inicial selecionada como referencia de mes:

```typescript
// De:
const { data: stats } = useCompleteStats();

// Para:
const { data: stats } = useCompleteStats(dataInicial);
```

Isso e suficiente porque `useCompleteStats` ja aceita um parametro `mesReferencia?: Date` (linha 884 do hook) e calcula `inicioMes` e `fimMes` a partir dele. O `queryKey` ja inclui `inicioMes`, entao o React Query automaticamente refaz a consulta quando o mes muda.

### Por que isso resolve tudo

1. **Receitas/Despesas**: o hook busca `completedDoMes` filtrado por `inicioMes`/`fimMes` (linhas 961-967)
2. **A Receber/A Pagar**: busca `pendingDoMes` filtrado por `inicioMes`/`fimMes` (linhas 972-978)
3. **Saldo Estimado**: calculado a partir dos pendentes do mes (linha 1062)
4. **Saldo Real**: acumulado historico, nao muda com o mes (correto)
5. **Lista de transacoes**: ja esta filtrada corretamente via `useTransactionsWithBalance` com `startDate`/`endDate`

A correcao e de **1 linha** apenas.
