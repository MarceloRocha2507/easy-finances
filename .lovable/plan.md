

# Correção: Receitas/Despesas Infladas por Movimentações de Metas

## Problema

Quando o usuário deposita e retira valores de metas, o sistema cria transações internas ("Depósito em Meta" como despesa, "Retirada de Meta" como receita). Essas transações sao necessarias para o calculo do saldo, mas estao sendo contabilizadas nos cards de **Receitas** e **Despesas** do Dashboard, inflando os valores exibidos.

**Exemplo concreto:**
- Depositar R$20 na meta -> cria expense R$20
- Retirar R$20 da meta -> cria income R$20
- Depositar R$20 -> cria expense R$20
- Retirar R$20 -> cria income R$20

O card "Receitas" mostra R$40 (2 retiradas), mas o usuario nao recebeu nenhum dinheiro real.

## Solucao

Filtrar transacoes das categorias "Deposito em Meta" e "Retirada de Meta" dos calculos de receitas/despesas **exibidas**, mantendo-as no calculo do **saldo disponivel** (que precisa delas para ficar correto).

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useTransactions.ts` | Filtrar categorias de meta nos calculos de `completedIncome` e `completedExpense` do `useCompleteStats` |

## Detalhes Tecnicos

### `useCompleteStats` (src/hooks/useTransactions.ts)

**Consulta do mes** (linhas 751-757): Adicionar join com `categories` para identificar o nome da categoria, e excluir "Deposito em Meta" / "Retirada de Meta" dos totais de receitas/despesas mensais.

Alternativa mais simples: buscar os IDs das categorias de meta do usuario e filtrar no calculo client-side.

```text
Antes:
  completedDoMes -> soma TODAS income como completedIncome
                 -> soma TODAS expense como completedExpense

Depois:
  completedDoMes -> soma income EXCETO "Retirada de Meta" como completedIncome
                 -> soma expense EXCETO "Deposito em Meta" como completedExpense
```

**O calculo do saldo (allCompletedIncome/allCompletedExpense) continua incluindo tudo**, pois as movimentacoes de meta precisam afetar o saldo disponivel.

### Implementacao

1. Na query `completedDoMes`, incluir `category_id` no select
2. Buscar IDs das categorias "Deposito em Meta" e "Retirada de Meta" do usuario
3. No loop que calcula `stats.completedIncome` e `stats.completedExpense`, pular transacoes cujo `category_id` corresponde a essas categorias

### Resultado Esperado

- Card "Receitas": mostra apenas receitas reais (salario, vendas, etc.)
- Card "Despesas": mostra apenas despesas reais (compras, contas, etc.)
- Saldo Disponivel: continua correto (inclui movimentacoes de meta no calculo)
- Patrimonio Total: inalterado

