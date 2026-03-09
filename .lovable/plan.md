

## Problema

Quando todas as compras de um cartão são estornadas, parcelas negativas (estorno) são criadas com `paga: false`. Na agrupação da fatura, o total líquido fica 0 ou negativo, mas `temPendente` continua `true` porque as parcelas de estorno também têm `paga: false`. Isso faz a fatura aparecer como pendente e descontar do saldo repetidamente.

## Correção

**Arquivo: `src/hooks/useFaturasNaListagem.ts`**

Na lógica de determinação de status (linhas 107-126), adicionar uma verificação: se o `total` do grupo for <= 0, tratar como `paga` independentemente de `temPendente`. Faturas com total <= 0 significam que os estornos cobriram ou excederam o valor original.

```typescript
// Linha 107 - Após calcular grupo.total e grupo.temPendente
const paga = !grupo.temPendente || grupo.total <= 0;
```

Além disso, excluir completamente faturas com total <= 0 da listagem (não faz sentido mostrar uma fatura de R$ 0,00 ou negativa):

```typescript
// Antes de criar a FaturaVirtual, pular grupos com total <= 0
if (grupo.total <= 0) continue;
```

Isso resolve o problema de forma limpa: faturas totalmente estornadas simplesmente não aparecem na lista, e não afetam o saldo.

