

# Corrigir gráfico "Despesas por Categoria" vazio

## Problema
O hook `useExpensesByCategory` filtra apenas transações com `status = 'completed'`. No início do mês, todas as despesas ainda estão pendentes, resultando em um gráfico vazio -- mesmo quando existem despesas cadastradas visíveis em outras partes do Dashboard.

## Causa raiz
Arquivo `src/hooks/useTransactions.ts`, linha 237:
```
.eq('status', 'completed')
```
Essa linha exclui todas as despesas pendentes da contagem por categoria.

## Solucao

### Arquivo: `src/hooks/useTransactions.ts`

Substituir o filtro `.eq('status', 'completed')` por `.in('status', ['completed', 'pending'])` na funcao `useExpensesByCategory`.

Isso inclui tanto despesas ja realizadas quanto as previstas para o mes, alinhando o grafico com o comportamento dos outros componentes do Dashboard que ja mostram ambos os status.

### Resultado esperado
- O grafico de pizza mostra todas as despesas do mes (realizadas + previstas)
- Consistencia visual com o restante do Dashboard
- Sem impacto nos modulos de Relatorios e Economia (que usam hooks diferentes)
