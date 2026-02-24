

# Remover valor (saldo) das faturas de cartão na listagem de Transações

## O que muda

Na tela `/transactions`, as linhas de fatura de cartão (FaturaCartaoRow) atualmente mostram o valor individual à direita (ex: `-R$ 500,00`). O plano é remover essa exibição de valor, já que o subtotal do grupo "Faturas de Cartão" no cabeçalho já mostra o total.

## Alteração

**Arquivo**: `src/pages/Transactions.tsx`

Remover o bloco de valor (linhas 1430-1433) do componente `FaturaCartaoRow`:

```text
// REMOVER:
<span className="font-semibold tabular-nums ml-2 sm:ml-4 text-sm sm:text-base text-red-600">
  -{formatCurrency(fatura.amount)}
</span>
```

O componente manterá:
- Ícone de cartão roxo
- Nome da fatura + badge de status
- Data de vencimento + nome do cartão

Sem o valor individual, a linha fica mais limpa e o subtotal no cabeçalho do grupo já cobre essa informação.
