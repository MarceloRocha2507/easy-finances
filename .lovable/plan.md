

## Plano: Corrigir Cálculo do Saldo nas Transações

### Problema Identificado
A busca de transações na função `useTransactionsWithBalance` não está filtrando por `user_id`, fazendo com que o cálculo inclua transações de **todos os usuários** do sistema.

### Dados do seu usuário (Marcelo):
| Campo | Valor |
|-------|-------|
| Saldo Inicial | R$ 5,44 |
| Receitas (completed) | R$ 4.430,05 |
| Despesas (completed) | R$ 3.254,60 |
| Total em Metas | R$ 1.169,30 |

### Cálculo correto:
```
Saldo Base = 5,44 + 4.430,05 - 3.254,60 = R$ 1.180,89
Saldo Disponível = 1.180,89 - 1.169,30 = R$ 11,59
```

### O que está acontecendo:
A query busca transações **sem filtrar por usuário**, somando dados de todos os usuários do sistema:
- Total receitas (todos): R$ 22.130,05
- Total despesas (todos): R$ 13.784,60

---

## Correção Técnica

### Arquivo: `src/hooks/useTransactions.ts`

Adicionar filtro `.eq('user_id', user!.id)` na query de transações:

**Linha 580-584 (atual):**
```typescript
const { data: allCompleted, error: allError } = await supabase
  .from('transactions')
  .select('id, type, amount, status, created_at')
  .eq('status', 'completed')
  .order('created_at', { ascending: true });
```

**Correção:**
```typescript
const { data: allCompleted, error: allError } = await supabase
  .from('transactions')
  .select('id, type, amount, status, created_at')
  .eq('user_id', user!.id)  // ← ADICIONAR ESTE FILTRO
  .eq('status', 'completed')
  .order('created_at', { ascending: true });
```

---

## Comportamento Esperado

| Antes (bug) | Depois (corrigido) |
|-------------|-------------------|
| Saldo: R$ 8.350,89 (errado) | Saldo: R$ 11,59 ✓ |
| Soma transações de todos | Soma apenas suas transações |

O saldo exibido será consistente com o "Saldo Disponível" do Dashboard.

