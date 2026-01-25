

## Plano: Descontar Metas do Saldo nas Transações

### Problema Identificado
O saldo exibido na lista de transações está mostrando o **patrimônio total** (R$ 1.180,89), quando deveria mostrar o **saldo disponível** (R$ 11,59) que já desconta o valor guardado em metas.

| Dashboard | Transações (atual) | Correto |
|-----------|-------------------|---------|
| Saldo Disponível: R$ 11,59 | Saldo: R$ 1.180,89 | Saldo: R$ 11,59 |
| Em Metas: R$ 1.169,30 | (não desconta) | (deve descontar) |

### Solução
Modificar o hook `useTransactionsWithBalance` para buscar também o total das metas e descontar do saldo progressivo.

---

## Mudanças Técnicas

### Arquivo: `src/hooks/useTransactions.ts`

Modificar a função `useTransactionsWithBalance` (linhas 540-607):

```typescript
export function useTransactionsWithBalance(filters?: TransactionFilters) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions-with-balance', user?.id, filters],
    queryFn: async () => {
      // Buscar saldo inicial do profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('saldo_inicial')
        .eq('user_id', user!.id)
        .single();

      const saldoInicial = Number(profile?.saldo_inicial) || 0;

      // NOVO: Buscar total de metas não concluídas
      const { data: metas } = await supabase
        .from('metas')
        .select('valor_atual')
        .eq('user_id', user!.id)
        .eq('concluida', false);

      const totalMetas = (metas || []).reduce(
        (sum, meta) => sum + Number(meta.valor_atual), 0
      );

      // NOVO: Buscar total de investimentos ativos
      const { data: investimentos } = await supabase
        .from('investimentos')
        .select('valor_atual')
        .eq('user_id', user!.id)
        .eq('ativo', true);

      const totalInvestido = (investimentos || []).reduce(
        (sum, inv) => sum + Number(inv.valor_atual), 0
      );

      // Total guardado = Metas + Investimentos
      const totalGuardado = totalMetas + totalInvestido;

      // Buscar TODAS as transações completed para calcular saldo progressivo
      const { data: allCompleted, error: allError } = await supabase
        .from('transactions')
        .select('id, type, amount, status, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      if (allError) throw allError;

      // Calcular saldo progressivo
      let saldo = saldoInicial;
      const saldoMap = new Map<string, number>();
      
      for (const t of allCompleted || []) {
        saldo += t.type === 'income' ? Number(t.amount) : -Number(t.amount);
        // MODIFICADO: Descontar total guardado do saldo
        saldoMap.set(t.id, saldo - totalGuardado);
      }

      // ... resto do código permanece igual
    },
    enabled: !!user,
  });
}
```

### Lógica da Correção

1. **Antes**: `saldoExibido = saldoInicial + receitas - despesas`
2. **Depois**: `saldoExibido = (saldoInicial + receitas - despesas) - totalMetas - totalInvestimentos`

Isso garante que o saldo exibido nas transações seja sempre igual ao **Saldo Disponível** do Dashboard.

---

## Comportamento Esperado

| Transação | Saldo Anterior | Operação | Saldo Após (sem metas) | Saldo Após (com metas descontadas) |
|-----------|----------------|----------|------------------------|-----------------------------------|
| Outros | R$ 1.180,89 | ... | R$ 1.180,89 | **R$ 11,59** ✓ |

O valor mostrado passará a ser consistente com o "Saldo Disponível" do Dashboard.

