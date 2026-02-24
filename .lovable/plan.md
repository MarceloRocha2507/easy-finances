

# Adicionar valor da fatura em cada linha de cartao

## O que muda

Cada linha de fatura de cartao na listagem de Transacoes voltara a exibir o valor individual, posicionado a direita da linha (apos a descricao e status), como e padrao nas linhas de transacao comum.

## Alteracao

**Arquivo**: `src/pages/Transactions.tsx`

No componente `FaturaCartaoRow`, adicionar o valor da fatura de volta, posicionado apos o bloco de descricao (antes do fechamento do div principal):

```text
<span className="font-semibold tabular-nums ml-2 sm:ml-4 text-sm sm:text-base text-muted-foreground">
  {formatCurrency(fatura.amount)}
</span>
```

Diferencas em relacao a versao anterior:
- Cor: `text-muted-foreground` em vez de `text-red-600`, para manter o visual limpo e discreto (nao vermelho gritante)
- Sem o prefixo "-" no valor, ja que o `formatCurrency` formata como "R$ 1.753,42"

O componente ficara:
- Icone de cartao roxo
- Nome da fatura + badge de status
- Data de vencimento + nome do cartao
- **Valor da fatura (a direita)**

