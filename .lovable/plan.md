
# Plano: Simplificar Lógica de Saldo - Metas Subtraem do Disponível

## Objetivo

Simplificar a lógica para que:
1. **Patrimônio Total** = Saldo Inicial + Receitas - Despesas (valor bruto)
2. **Saldo Disponível** = Patrimônio Total - Valor em Metas (dinheiro "livre")
3. **Remover** o campo "Saldo Inicial Guardado" (não é mais necessário)

## Nova Lógica

```text
┌──────────────────────────────────────────────────────────┐
│                    PATRIMÔNIO TOTAL                       │
│         (Saldo Inicial + Receitas - Despesas)            │
│                      R$ 1.361,30                          │
├──────────────────────────────────────────────────────────┤
│  SALDO DISPONÍVEL    │      GUARDADO EM METAS            │
│     R$ 96,00         │         R$ 1.265,30               │
│ (dinheiro "livre")   │    (reserva intocável)            │
└──────────────────────────────────────────────────────────┘
```

## Mudanças Necessárias

### 1. Banco de Dados
- Remover a coluna `saldo_inicial_guardado` da tabela `profiles`
- O campo não será mais necessário pois metas automaticamente "reservam" o valor

### 2. Hook `useTransactions.ts` - Função `useCompleteStats`
Simplificar o cálculo:

**Antes:**
```typescript
const saldoBase = saldoInicial + saldoInicialGuardado + receitas - despesas;
const saldoDisponivel = Math.max(0, saldoBase - totalGuardado);
```

**Depois:**
```typescript
const patrimonioTotal = saldoInicial + receitas - despesas;
const saldoDisponivel = Math.max(0, patrimonioTotal - totalMetas);
```

### 3. Interface - Remover Campo de Saldo Guardado
- `PreferenciasTab.tsx`: Remover seção "Saldo Inicial Guardado"
- `Transactions.tsx`: Remover breakdown do saldo guardado no card

### 4. Dashboard e Cards de Saldo
Atualizar para mostrar:
- **Saldo Disponível**: Patrimônio - Metas
- **Patrimônio Total**: Valor bruto
- **Em Metas**: Valor reservado

### 5. Hook `useSaldoInicial.ts`
Remover referências ao `saldo_inicial_guardado`

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `profiles` (banco) | Remover coluna `saldo_inicial_guardado` |
| `src/hooks/useTransactions.ts` | Simplificar cálculo em `useCompleteStats` |
| `src/hooks/useSaldoInicial.ts` | Remover `saldoInicialGuardado` e `atualizarSaldoGuardado` |
| `src/components/profile/PreferenciasTab.tsx` | Remover campo "Saldo Inicial Guardado" |
| `src/pages/Transactions.tsx` | Simplificar card de saldo inicial |
| `src/hooks/useProfileStats.ts` | Atualizar se necessário |

## Detalhes Técnicos

### Migration SQL (Remover coluna)
```sql
ALTER TABLE profiles DROP COLUMN IF EXISTS saldo_inicial_guardado;
```

### `useCompleteStats` - Nova Lógica
```typescript
// Patrimônio Total = Saldo Inicial + Receitas - Despesas
const patrimonioTotal = saldoInicial + stats.completedIncome - stats.completedExpense;

// Saldo Disponível = Patrimônio Total - Valor em Metas (mínimo 0)
const saldoDisponivel = Math.max(0, patrimonioTotal - totalMetas);

// Saldo Real = Patrimônio Bruto
const realBalance = patrimonioTotal;

// Saldo Estimado = Patrimônio + Pendentes - Fatura
const estimatedBalance = patrimonioTotal + stats.pendingIncome - stats.pendingExpense - faturaCartaoTitular;

return {
  ...stats,
  realBalance,
  saldoDisponivel,
  patrimonioTotal,
  estimatedBalance,
  totalMetas,
  totalInvestido,
  totalGuardado: totalMetas + totalInvestido,
};
```

### Card de Saldo no Dashboard
```tsx
<Card>
  <p>Saldo Disponível</p>
  <p>{formatCurrency(completeStats?.saldoDisponivel)}</p>
  <div>
    <p>Patrimônio: {formatCurrency(completeStats?.patrimonioTotal)}</p>
    <p>Em Metas: {formatCurrency(completeStats?.totalMetas)}</p>
  </div>
</Card>
```

## Resultado Esperado

Com suas transações atuais:

| Campo | Valor |
|-------|-------|
| Patrimônio Total | R$ 1.361,30 (saldo inicial + receitas - despesas) |
| Em Metas | R$ 1.265,30 |
| **Saldo Disponível** | **R$ 96,00** (patrimônio - metas) |

O usuário não precisa mais configurar nada manualmente. As metas automaticamente "reservam" dinheiro do patrimônio, mostrando quanto está realmente disponível para gastar.

## Fluxo Visual

```text
ANTES (complexo):
┌────────────────────────────────────────────────────────┐
│ Saldo Inicial + Saldo Guardado + Receitas - Despesas  │
│        ↓              ↓                               │
│   -R$1.175,45    R$1.265,30 (config manual!)          │
└────────────────────────────────────────────────────────┘

DEPOIS (simples):
┌────────────────────────────────────────────────────────┐
│       Saldo Inicial + Receitas - Despesas             │
│                    = Patrimônio                        │
│                    - Valor em Metas                    │
│                    = Saldo Disponível                  │
└────────────────────────────────────────────────────────┘
```

O sistema agora é autocontido: o valor das metas é considerado automaticamente sem configuração extra.
