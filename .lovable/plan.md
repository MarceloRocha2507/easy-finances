

## Plano: Histórico de Saldo por Transação

### O que será implementado
Uma nova funcionalidade que mostra o **saldo disponível após cada transação**, permitindo que você veja exatamente quanto tinha na conta depois de registrar cada receita ou despesa.

### Como vai funcionar
- Na lista de transações, cada transação mostrará o **saldo resultante** após aquela operação
- Você poderá ver a evolução do seu saldo ao longo do tempo
- O cálculo considera: saldo inicial + receitas pagas - despesas pagas (em ordem cronológica)

### Visualização
Cada transação na lista mostrará:
```
📦 Supermercado                     -R$ 150,00
   Alimentação • Hoje, 14:30        Saldo: R$ 2.350,00
```

---

## Mudanças Planejadas

### 1. Adicionar Cálculo de Saldo Progressivo
Criar uma função que calcula o saldo após cada transação, ordenando por data/hora de criação.

### 2. Atualizar Lista de Transações
Modificar o componente `TransactionRow` para exibir o saldo resultante após cada transação.

### 3. Criar Componente de Histórico de Saldo
Opcionalmente, criar um componente separado que mostra a evolução do saldo de forma visual (timeline).

---

## Seção Técnica

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useTransactions.ts` | Adicionar função para calcular saldo progressivo |
| `src/pages/Transactions.tsx` | Modificar `TransactionRow` para exibir saldo resultante |

### Lógica de Cálculo do Saldo Progressivo

```typescript
// Calcular saldo após cada transação (apenas transações completed)
function calcularSaldoProgressivo(
  transactions: Transaction[],
  saldoInicial: number
): Map<string, number> {
  const saldoMap = new Map<string, number>();
  
  // Ordenar por data de criação (mais antiga primeiro)
  const sorted = [...transactions]
    .filter(t => t.status === 'completed')
    .sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  
  let saldoAtual = saldoInicial;
  
  for (const t of sorted) {
    if (t.type === 'income') {
      saldoAtual += Number(t.amount);
    } else {
      saldoAtual -= Number(t.amount);
    }
    saldoMap.set(t.id, saldoAtual);
  }
  
  return saldoMap;
}
```

### Modificação no TransactionRow

```tsx
interface TransactionRowProps {
  transaction: Transaction;
  saldoApos?: number; // Novo prop
  // ... outros props
}

function TransactionRow({ transaction, saldoApos, ... }: TransactionRowProps) {
  return (
    <div className="...">
      {/* ... conteúdo existente ... */}
      
      {/* Novo: Saldo após a transação */}
      {saldoApos !== undefined && transaction.status === 'completed' && (
        <div className="text-xs text-muted-foreground">
          <span className={saldoApos >= 0 ? 'text-income' : 'text-expense'}>
            Saldo: {formatCurrency(saldoApos)}
          </span>
        </div>
      )}
    </div>
  );
}
```

### Hook Atualizado

Adicionar ao `useTransactions.ts`:

```typescript
export function useTransactionsWithBalance(filters?: TransactionFilters) {
  const { user } = useAuth();
  const { saldoInicial } = useSaldoInicial();

  return useQuery({
    queryKey: ['transactions-with-balance', user?.id, filters, saldoInicial],
    queryFn: async () => {
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
        saldoMap.set(t.id, saldo);
      }

      // Buscar transações filtradas para exibição
      let query = supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .order('created_at', { ascending: false });

      // Aplicar filtros...
      
      const { data, error } = await query;
      if (error) throw error;

      return {
        transactions: data,
        saldoMap,
      };
    },
    enabled: !!user,
  });
}
```

### Integração na Página de Transações

```tsx
// Em Transactions.tsx
const { data, isLoading } = useTransactionsWithBalance({ startDate, endDate });

// No render do TransactionRow
{data?.transactions.map((transaction) => (
  <TransactionRow
    key={transaction.id}
    transaction={transaction}
    saldoApos={data.saldoMap.get(transaction.id)}
    // ... outros props
  />
))}
```

---

## Critérios de Aceite

1. Cada transação "completa" (paga/recebida) mostra o saldo após aquela operação
2. Transações pendentes não mostram saldo (pois ainda não afetaram o saldo real)
3. O cálculo considera a ordem de criação (created_at)
4. O saldo é mostrado em verde se positivo, vermelho se negativo
5. O saldo inicial do usuário é considerado como ponto de partida

---

## Considerações de Performance

- O cálculo do saldo progressivo será feito apenas para transações "completed"
- O mapa de saldos é calculado uma vez e reutilizado para todas as transações
- Se houver muitas transações, pode-se considerar cache ou paginação futura

