

# Correção: Saldo Incorreto Exibido nas Transações

## Problema Identificado

O usuário relata que ao cadastrar uma despesa ("intera" de R$ 10,00), o sistema mostra um saldo de **-R$ 1.294,43** quando deveria ser **R$ 0,00**.

## Análise Técnica

### Dados no Banco de Dados (confirmados)
| Campo | Valor |
|-------|-------|
| Saldo Inicial (profile) | -R$ 1.175,45 |
| Total Receitas (completed) | R$ 4.699,18 |
| Total Despesas (completed) | R$ 3.523,73 |
| Saldo Calculado Correto | -1.175,45 + 4.699,18 - 3.523,73 = **R$ 0,00** |

### Problemas Encontrados no Código

**1. Falta de filtro `user_id` no `useCompleteStats`** (linhas 742-765)

```text
src/hooks/useTransactions.ts

Linha 742-745:
  const { data: allCompleted } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('status', 'completed');  // FALTA: .eq('user_id', user!.id)

Linha 750-755:
  const { data: completedDoMes } = await supabase
    .from('transactions')
    .eq('status', 'completed')
    .gte('date', inicioMes)
    .lte('date', fimMes);  // FALTA: .eq('user_id', user!.id)

Linha 760-765:
  const { data: pendingDoMes } = await supabase
    .from('transactions')
    .eq('status', 'pending')
    .gte('due_date', inicioMes)
    .lte('due_date', fimMes);  // FALTA: .eq('user_id', user!.id)
```

Embora o RLS esteja habilitado e deva filtrar automaticamente, é uma boa prática incluir o filtro explícito para:
- Clareza do código
- Performance (índice pode ser usado)
- Segurança em camadas

**2. Possível inconsistência de cache**

O valor **-R$ 1.294,43** pode estar vindo de um cache desatualizado do React Query que foi gerado antes do ajuste de saldo inicial.

**3. Transação não presente no `saldoMap`**

Se a transação foi filtrada por data na query de exibição mas não está no `saldoMap`, pode retornar `undefined` e não exibir saldo.

## Solução Proposta

### 1. Adicionar filtros `user_id` no `useCompleteStats`

Corrigir as 3 queries que não filtram por `user_id`:

```typescript
// Linha 742-746
const { data: allCompleted } = await supabase
  .from('transactions')
  .select('type, amount')
  .eq('user_id', user!.id)  // ADICIONAR
  .eq('status', 'completed');

// Linha 750-756
const { data: completedDoMes } = await supabase
  .from('transactions')
  .select('type, amount')
  .eq('user_id', user!.id)  // ADICIONAR
  .eq('status', 'completed')
  .gte('date', inicioMes)
  .lte('date', fimMes);

// Linha 760-766
const { data: pendingDoMes } = await supabase
  .from('transactions')
  .select('type, amount, due_date')
  .eq('user_id', user!.id)  // ADICIONAR
  .eq('status', 'pending')
  .gte('due_date', inicioMes)
  .lte('due_date', fimMes);
```

### 2. Garantir invalidação de cache após ajustes

Após um ajuste de saldo inicial, garantir que todos os caches relevantes sejam invalidados:
- `transactions-with-balance`
- `complete-stats`
- `dashboard-completo`

Isso já está sendo feito no `useSaldoInicial`, mas pode haver um delay.

### 3. Verificar tratamento de valores nulos/undefined

Garantir que `Number(profile?.saldo_inicial) || 0` trata corretamente valores negativos (não há problema, pois `-1175.45 || 0` retorna `-1175.45`).

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useTransactions.ts` | Adicionar `.eq('user_id', user!.id)` nas linhas 743, 752 e 762 |

## Resultado Esperado

Após a correção:
- O saldo progressivo exibido deve refletir corretamente: **R$ 0,00**
- Todas as queries do usuário serão explicitamente filtradas por `user_id`
- Maior clareza e manutenibilidade do código

## Teste de Validação

1. Verificar se a transação "intera" mostra "Saldo: R$ 0,00"
2. Verificar se os cards de resumo (Receitas, Despesas, Saldo Real) mostram valores corretos
3. Adicionar uma nova transação e verificar se o saldo atualiza corretamente

