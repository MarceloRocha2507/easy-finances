

# Incluir despesas de cartao nos graficos e relatorios

## Problema

Os hooks `useTransactionStats`, `useExpensesByCategory` e `useMonthlyData` consultam apenas a tabela `transactions`, ignorando completamente as parcelas de cartao de credito (`parcelas_cartao`). Isso faz com que o grafico de pizza, o grafico de barras mensal e os cards de totais no Dashboard e nos Relatorios nao reflitam os gastos reais do usuario.

O hook `useAnaliseGastos` (tela Economia) ja faz essa integracao corretamente e serve como referencia.

## Solucao

Alterar os 3 hooks em `src/hooks/useTransactions.ts` para buscar e somar as parcelas de cartao do periodo, seguindo o mesmo padrao ja usado em `useEconomia.ts`.

---

### 1. `useTransactionStats` (cards de Receitas/Despesas/Resultado)

Apos buscar as transacoes, fazer uma query adicional em `parcelas_cartao` com join em `compras_cartao` para obter `categoria_id`. Somar o valor de cada parcela ativa ao `totalExpense`, excluindo categorias de meta. Evitar dupla contagem verificando que a parcela nao corresponde a uma transacao ja contabilizada (o sistema atual nao cria transacoes duplicadas para cartoes, entao basta somar).

### 2. `useExpensesByCategory` (grafico de pizza)

Apos agrupar as transacoes por categoria, buscar `parcelas_cartao` com join em `compras_cartao(categoria_id, categoria:categories(id, name, icon, color))` no mesmo periodo. Somar cada parcela ativa ao mapa de categorias existente, criando a entrada se necessario.

### 3. `useMonthlyData` (grafico de barras anual)

Apos agrupar as transacoes por mes, buscar `parcelas_cartao` do ano inteiro com `mes_referencia` entre janeiro e dezembro. Para cada parcela ativa, somar o valor ao mes correspondente como despesa.

---

### Detalhes tecnicos

- Filtro de parcelas: `ativo = true` (exclui parcelas estornadas)
- Periodo: usar `mes_referencia` (nao `created_at`) para parcelas, alinhado ao ciclo de faturamento
- Categoria: via join `compra:compras_cartao(categoria_id, categoria:categories(...))`
- Sem dupla contagem: o sistema nao cria `transactions` automaticamente para compras de cartao, entao somar parcelas diretamente e seguro

### Arquivo alterado

`src/hooks/useTransactions.ts` -- funcoes `useTransactionStats`, `useExpensesByCategory`, `useMonthlyData`

