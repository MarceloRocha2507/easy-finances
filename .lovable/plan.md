
# Incluir assinaturas nos gráficos e relatórios

## Resumo

Assinaturas ativas cujo vencimento (`proxima_cobranca`) cai dentro do período filtrado serão contabilizadas automaticamente nos totais de despesas, gráficos de pizza e análises econômicas -- sem necessidade de clicar "marcar como paga".

## O que muda para o usuário

- Assinaturas ativas aparecem nos gráficos de categorias e totais de despesas
- Evita dupla contagem: se a assinatura já foi marcada como paga (gerando uma transação), ela não será somada novamente porque o `proxima_cobranca` já terá avançado para o próximo período
- A categoria usada será a `category_id` da assinatura

## Detalhes técnicos

### Lógica de inclusão

Consultar assinaturas com `status = 'ativa'` e `proxima_cobranca` dentro do intervalo de datas do filtro. Cada assinatura encontrada será somada como despesa no valor de `assinatura.valor`, agrupada pela sua `category_id`.

### Arquivos alterados

#### 1. `src/hooks/useTransactions.ts` -- `useTransactionStats`

Após somar parcelas de cartão (~linha 227), adicionar query:

```typescript
const { data: assinaturas } = await supabase
  .from('assinaturas')
  .select('valor, category_id')
  .eq('user_id', user!.id)
  .eq('status', 'ativa')
  .gte('proxima_cobranca', filters.startDate)
  .lte('proxima_cobranca', filters.endDate);

(assinaturas || []).forEach((a: any) => {
  const catId = a.category_id;
  if (metaCategoryIds.length > 0 && catId && metaCategoryIds.includes(catId)) return;
  stats.totalExpense += Number(a.valor) || 0;
});
```

#### 2. `src/hooks/useTransactions.ts` -- `useExpensesByCategory`

Após somar parcelas de cartão (~linha 344), adicionar query similar com join na categoria para pegar nome/ícone/cor, e agregar no `categoryMap`.

#### 3. `src/hooks/useEconomia.ts` -- `useAnaliseGastos`

Após somar parcelas de cartão (~linha 318), adicionar a mesma lógica para incluir assinaturas ativas no `totalGasto` e `gastosPorCategoria`.

### Prevenção de dupla contagem

Não há dupla contagem porque:
- Quando o usuário marca como paga, `proxima_cobranca` avança para o próximo ciclo (ex: mês seguinte)
- Portanto, no período atual, ou a assinatura está pendente (contada via esta query) ou já foi paga (contada via transactions) -- nunca ambos
