

# Atualizar .lovable/plan.md

O plano atual descreve a tarefa de adicionar o valor da fatura como pendente. Como a implementacao ja foi concluida com sucesso, o arquivo sera atualizado para refletir o status atual.

## Alteracao

**Arquivo**: `.lovable/plan.md`

Atualizar o conteudo para indicar que a tarefa foi concluida, adicionando uma secao de status e marcando como implementado. O conteudo ficara:

```text
# Adicionar valor da fatura em cada linha de cartao

## Status: Concluido

## O que foi feito

No componente `FaturaCartaoRow` em `src/pages/Transactions.tsx`, o valor da fatura foi re-adicionado a direita de cada linha de cartao de credito na listagem de Transacoes.

Detalhes da implementacao:
- Cor: `text-muted-foreground` (discreto, sem vermelho)
- Sem prefixo "-", usando apenas `formatCurrency`
- Posicionado apos o bloco de descricao/status

Cada linha de fatura exibe:
- Icone de cartao roxo
- Nome da fatura + badge de status
- Data de vencimento + nome do cartao
- Valor da fatura (a direita)
```

