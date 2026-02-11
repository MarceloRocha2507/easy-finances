
# Excluir "Acerto de Fatura" dos totais de Despesas

## Problema

As transacoes de "Acerto de Fatura" (criadas ao pagar faturas com divisao entre responsaveis) estao sendo contabilizadas como despesas nos cards de Despesas do mes e no calculo do saldo. Essas transacoes representam dinheiro recebido de terceiros e nao devem inflar o total de despesas exibido.

## Solucao

Filtrar as transacoes da categoria "Acerto de Fatura" da mesma forma que ja e feito com as categorias de meta ("Deposito em Meta" / "Retirada de Meta"). Elas continuarao existindo no banco e aparecendo na lista de transacoes, mas nao serao somadas nos cards de Receitas/Despesas.

## Alteracoes

### `src/hooks/useTransactions.ts`

1. Na busca de categorias para filtro (linha ~751), adicionar "Acerto de Fatura" a lista de categorias excluidas:

```text
.in('name', ['Depósito em Meta', 'Retirada de Meta', 'Acerto de Fatura']);
```

2. A logica existente (linhas 833-837) ja exclui categorias do set `metaCategoryIds` dos totais de receitas/despesas do mes. Como "Acerto de Fatura" sera adicionada ao mesmo set, ela sera automaticamente excluida dos cards.

3. Para o calculo acumulado (allCompletedIncome / allCompletedExpense nas linhas 805-812), tambem e necessario excluir essas transacoes. A query de allCompleted (linha 742) precisara incluir `category_id` no select e o loop precisara verificar se a categoria esta no set de exclusao:

```text
// Query: adicionar category_id ao select
.select('type, amount, category_id')

// Loop: excluir categorias especiais
(allCompleted || []).forEach((t) => {
  const amount = Number(t.amount);
  if (t.category_id && metaCategoryIds.has(t.category_id)) return;
  if (t.type === 'income') allCompletedIncome += amount;
  else allCompletedExpense += amount;
});
```

**Importante**: a query de `metaCategories` precisa rodar ANTES do loop de `allCompleted`, o que ja acontece na ordem atual do codigo.

### Resultado

- Cards de "Despesas" no Dashboard e Transacoes: nao incluirao valores de "Acerto de Fatura"
- Saldo disponivel: nao sera afetado por acertos (eles nao somam nem subtraem)
- Lista de transacoes: os acertos continuam visiveis normalmente
- Saldo real/ajuste de saldo: tambem nao sera impactado pelos acertos
