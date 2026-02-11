

# Corrigir e Melhorar Despesas Recorrentes

## Problemas Identificados

1. Ao criar uma despesa "Fixa", o sistema sempre cria exatamente 12 meses (hardcoded na linha 332 de `useTransactions.ts`)
2. Nao ha campo para o usuario escolher quantos meses a despesa deve se repetir
3. Ao deletar, so existe a opcao de remover uma unica transacao - nao ha opcao de deletar "esta e todas as futuras"

## Mudancas Necessarias

### 1. Formulario de criacao - permitir escolher numero de repeticoes

**Arquivo**: `src/pages/Transactions.tsx`

- Quando o usuario selecionar "Fixa", exibir um campo "Quantas vezes?" (similar ao campo de parcelas que ja existe para "Parcelada")
- Valores sugeridos: 3, 6, 12, 24 meses, ou campo livre
- O valor padrao sera 12
- Renomear internamente: usar `totalParcelas` para ambos os casos (parcelada e fixa)

### 2. Logica de criacao - usar o numero escolhido

**Arquivo**: `src/hooks/useTransactions.ts`

- Remover o hardcode `tipoLancamento === 'fixa' ? 12 : totalParcelas` (linha 332)
- Usar `totalParcelas` diretamente para ambos os tipos
- Manter a diferenca: "parcelada" divide o valor total, "fixa" repete o valor cheio

### 3. Dialog de exclusao com opcoes

**Arquivo**: `src/pages/transactions/Recorrentes.tsx`

- Substituir o AlertDialog simples por um com duas opcoes:
  - "Excluir apenas este mes" - deleta so a transacao selecionada
  - "Excluir este e todos os meses seguintes" - deleta a transacao selecionada + todas com mesmo `parent_id` (ou que sao filhas dela) com `date >= date da selecionada`

### 4. Hook de exclusao em lote

**Arquivo**: `src/hooks/useTransactions.ts`

- Criar `useDeleteRecurringTransactions` que aceita um `transactionId` e um modo (`single` ou `future`)
- Modo `single`: deleta apenas a transacao com aquele ID
- Modo `future`: busca a transacao para obter `parent_id` e `date`, depois deleta todas as transacoes do mesmo grupo (mesmo `parent_id` ou onde `parent_id` = transacao selecionada) com data >= data da selecionada

## Detalhes Tecnicos

### Logica de agrupamento para exclusao em lote

As transacoes recorrentes ja usam `parent_id` para vincular filhas a mae. Para deletar "este e futuros":

```text
1. Buscar a transacao selecionada (obter parent_id e date)
2. Se tem parent_id: grupo = parent_id
   Se nao tem (e a mae): grupo = proprio id
3. Deletar todas do grupo com date >= date da selecionada
```

### Campo de repeticoes no formulario

O campo de parcelas ja existe para tipo "parcelada". A mudanca e mostrar um campo similar para "fixa", com label "Quantos meses?" em vez de "Numero de parcelas".

### Nenhuma mudanca no banco de dados

A estrutura atual (campos `parent_id`, `tipo_lancamento`, `total_parcelas`, `numero_parcela`) ja suporta tudo que precisamos. Nenhuma migracao necessaria.

### Arquivos modificados

1. `src/hooks/useTransactions.ts` - Remover hardcode de 12 meses, criar hook `useDeleteRecurringTransactions`
2. `src/pages/Transactions.tsx` - Mostrar campo "Quantos meses?" quando tipo = "fixa"
3. `src/pages/transactions/Recorrentes.tsx` - Dialog de exclusao com duas opcoes

