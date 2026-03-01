

# Mostrar contagem de transacoes no dialog de exclusao recorrente

## Problema
O dialog de exclusao recorrente nao informa quantas transacoes serao afetadas em cada opcao, deixando o usuario sem visibilidade do impacto.

## Solucao
Quando o dialog abrir, consultar o banco de dados para contar quantas transacoes pertencem ao mesmo grupo (via `parent_id`) e quantas sao futuras (com `date >= data da transacao selecionada`). Exibir esses numeros nos botoes.

## Alteracoes

### Arquivo: `src/pages/Transactions.tsx`

**1. Adicionar query para contar transacoes do grupo**

Usar `useQuery` que dispara quando `recurringDeleteTransaction` e definido. A query busca todas as transacoes com o mesmo `parent_id` (ou onde `id === parent_id` do grupo) e conta:
- Total do grupo (para informacao)
- Quantidade com `date >= data da transacao selecionada` (para o botao "este e todos os seguintes")

**2. Atualizar textos dos botoes**

- "Excluir apenas este mes (1 lancamento)" -- sempre 1
- "Excluir este e todos os seguintes (X lancamentos)" -- mostra a contagem real

**3. Atualizar descricao do dialog**

Incluir na descricao o total de lancamentos da serie para dar contexto ao usuario.

### Detalhes tecnicos

A query usara o `parent_id` da transacao selecionada (ou o proprio `id` se ela for a pai) para buscar o grupo:

```typescript
const groupId = recurringDeleteTransaction?.parent_id || recurringDeleteTransaction?.id;

// Contar futuros: transacoes no grupo com date >= data selecionada
const { data } = await supabase
  .from('transactions')
  .select('id, date')
  .or(`parent_id.eq.${groupId},id.eq.${groupId}`)
  .gte('date', recurringDeleteTransaction.date);
```

O `useQuery` tera `enabled: !!recurringDeleteTransaction` para so executar quando o dialog estiver aberto. Enquanto carrega, os botoes mostrarao "..." no lugar do numero.

