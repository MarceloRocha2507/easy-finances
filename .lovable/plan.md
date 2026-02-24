

# Filtrar Faturas de Cartao pelo Mes Selecionado

## Problema

As faturas virtuais de cartao sempre mostram o mes atual + proximos 3, independente do filtro de data selecionado na tela de Transacoes. O usuario espera ver apenas as faturas correspondentes ao mes/periodo filtrado.

## Solucao

Filtrar as faturas virtuais pela data de vencimento (`date`) com base no intervalo de datas selecionado (`dataInicial` / `dataFinal`), antes de mescla-las com as transacoes reais.

## Arquivo modificado

### `src/pages/Transactions.tsx`

Alterar o `expenseTransactions` (e o `activeTransactions` na tab "all") para filtrar `faturasVirtuais` pelo periodo selecionado:

```text
const expenseTransactions = useMemo(() => {
  const expenses = searchedTransactions.filter(t => t.type === 'expense');
  
  // Filtrar faturas virtuais pelo período selecionado
  const faturasFiltradas = (faturasVirtuais || []).filter(f => {
    const faturaDate = f.date; // yyyy-MM-dd
    if (startDate && faturaDate < startDate) return false;
    if (endDate && faturaDate > endDate) return false;
    return true;
  });
  
  const combinadas = [...expenses, ...faturasFiltradas];
  return combinadas;
}, [searchedTransactions, faturasVirtuais, startDate, endDate]);
```

A mesma filtragem sera aplicada na tab "all" (`activeTransactions`), usando `faturasFiltradas` ao inves de `faturasVirtuais` diretamente.

## Detalhes tecnicos

- Criar uma variavel `faturasFiltradas` via `useMemo` que aplica o filtro de `startDate`/`endDate` sobre `faturasVirtuais`
- Usar essa variavel filtrada em `expenseTransactions` e em `activeTransactions` (tab "all")
- A comparacao de strings `yyyy-MM-dd` funciona corretamente para ordenacao/filtragem cronologica
- Nenhuma mudanca no hook `useFaturasNaListagem` e necessaria - ele continua buscando os dados brutos e a filtragem e feita no componente

