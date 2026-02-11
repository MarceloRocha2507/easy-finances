
# Corrigir tipo de transacao dos acertos de fatura: receita -> despesa

## Problema

As transacoes de acerto de fatura (ex: "Acerto fatura Nubank - Mae") estao sendo registradas como **receita** (income), mas devem ser registradas como **despesa** (expense).

## Alteracoes em `src/services/compras-cartao.ts`

Na funcao `pagarFaturaComTransacao`, no bloco que cria transacoes para cada acerto recebido (linhas ~901-957):

1. Alterar a busca de categoria de `type: "income"` para `type: "expense"`
2. Alterar a criacao de categoria (caso nao exista) de `type: "income"` para `type: "expense"`
3. Alterar o insert da transacao de `type: "income"` para `type: "expense"`
4. Renomear variaveis internas para refletir a mudanca (ex: `incomeCategoryId` -> `expenseCategoryId`)

Resultado: o "Acerto fatura Nubank - Mae" aparecera como despesa (vermelho) ao inves de receita (verde).
