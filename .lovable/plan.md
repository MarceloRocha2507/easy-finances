
# Plano: Corrigir Atualização Automática ao Registrar Transações

## Resumo do Problema

Quando você registra uma receita ou despesa, ela só aparece no Dashboard após recarregar a página. Isso acontece porque o sistema não está atualizando automaticamente os dados do Dashboard quando uma nova transação é criada.

## Causa Identificada

O hook que cria transações (`useCreateTransaction`) atualiza apenas algumas partes do cache:
- Transações
- Estatísticas básicas
- Despesas por categoria
- Dados mensais

**Porém, não atualiza:**
- `complete-stats` (usado para mostrar saldo, receitas e despesas no Dashboard)
- `dashboard-completo` (usado para cartões, alertas e outros componentes do Dashboard)

## Solução

Adicionar a invalidação das queryKeys faltantes em **todos os hooks de mutação de transações**:

### Arquivos Afetados

| Hook | Arquivo |
|------|---------|
| `useCreateTransaction` | `src/hooks/useTransactions.ts` |
| `useCreateInstallmentTransaction` | `src/hooks/useTransactions.ts` |
| `useUpdateTransaction` | `src/hooks/useTransactions.ts` |
| `useDeleteTransaction` | `src/hooks/useTransactions.ts` |
| `useMarkAsPaid` | `src/hooks/useTransactions.ts` |

### QueryKeys a Adicionar

Em cada um dos hooks acima, adicionar no `onSuccess`:

```text
queryClient.invalidateQueries({ queryKey: ['complete-stats'] });
queryClient.invalidateQueries({ queryKey: ['dashboard-completo'] });
```

## Detalhes Técnicos

### Modificações em `useCreateTransaction` (linha 252-268)

Adicionar duas novas linhas de invalidação após as existentes:

```javascript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
  queryClient.invalidateQueries({ queryKey: ['expenses-by-category'] });
  queryClient.invalidateQueries({ queryKey: ['monthly-data'] });
  // ADICIONAR:
  queryClient.invalidateQueries({ queryKey: ['complete-stats'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-completo'] });
  // ...resto do código
}
```

### Modificações nos Demais Hooks

Aplicar o mesmo padrão para:
- `useCreateInstallmentTransaction` (linha 365-389)
- `useUpdateTransaction` (linha 408-425)
- `useDeleteTransaction` (linha 441-458)
- `useMarkAsPaid` (linha 481-496)

## Resultado Esperado

Após a implementação:
- Ao criar uma receita ou despesa, o Dashboard atualizará automaticamente
- Os valores de saldo, receitas e despesas refletirão a nova transação imediatamente
- Não será mais necessário recarregar a página

## Impacto

- **Baixo risco**: Apenas adiciona invalidações de cache
- **Melhora experiência**: Feedback visual instantâneo
- **Consistência**: Segue o mesmo padrão já usado nos hooks de metas e investimentos
