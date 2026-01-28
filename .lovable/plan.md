

# Plano: Inverter Lógica de Saldo - Patrimônio = Disponível + Metas

## Diagnóstico

A lógica atual está invertida:

| Campo | Cálculo Atual | Resultado |
|-------|---------------|-----------|
| Patrimônio Total | saldoInicial + receitas - despesas | R$ 96,00 |
| Saldo Disponível | patrimônio - metas = 96 - 1169 | **R$ 0,00** (errado!) |

## Nova Lógica (Correta)

O dinheiro em metas **faz parte** do patrimônio, não é subtraído dele:

```text
┌──────────────────────────────────────────────────────────┐
│                    PATRIMÔNIO TOTAL                       │
│              R$ 1.265,30 (disponível + metas)            │
├──────────────────────────────────────────────────────────┤
│  SALDO DISPONÍVEL    │      GUARDADO EM METAS            │
│     R$ 96,00         │         R$ 1.169,30               │
│ (dinheiro "livre")   │    (reservado, mas seu)           │
└──────────────────────────────────────────────────────────┘
```

## Fórmulas Corretas

```typescript
// Saldo Disponível = Saldo Inicial + Receitas - Despesas
// (dinheiro "livre" que você pode gastar)
const saldoDisponivel = saldoInicial + receitas - despesas;

// Patrimônio Total = Saldo Disponível + Metas
// (toda sua riqueza, incluindo reservas)
const patrimonioTotal = saldoDisponivel + totalMetas + totalInvestido;
```

Com seus números:
- Saldo Disponível: R$ 96,00 (seu dinheiro livre)
- Em Metas: R$ 1.169,30
- **Patrimônio Total**: R$ 1.265,30 (96 + 1169)

## Alterações Necessárias

### 1. Hook `useTransactions.ts` - Função `useCompleteStats` (linhas 774-792)

**Antes:**
```typescript
const patrimonioTotal = saldoInicial + stats.completedIncome - stats.completedExpense;
const saldoDisponivel = Math.max(0, patrimonioTotal - totalMetas);
const realBalance = patrimonioTotal;
```

**Depois:**
```typescript
// Saldo Disponível = o que você tem para gastar agora
const saldoDisponivel = saldoInicial + stats.completedIncome - stats.completedExpense;

// Patrimônio Total = disponível + metas + investimentos
const patrimonioTotal = saldoDisponivel + totalMetas + totalInvestido;

// Saldo Real = Saldo Disponível (o que realmente está "livre")
const realBalance = saldoDisponivel;
```

### 2. Hook `useProfileStats.ts` (atualizar mesma lógica)

### 3. Hook `useDashboardCompleto.ts` (se aplicável)

### 4. UI no Dashboard - Reorganizar exibição

Atualizar o card para mostrar a composição correta:
- Título: **Saldo Disponível** (R$ 96,00)
- Subtítulo: Patrimônio Total (R$ 1.265,30)
- Detalhes: Em Metas: R$ 1.169,30

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useTransactions.ts` | Inverter cálculo em `useCompleteStats` |
| `src/hooks/useProfileStats.ts` | Atualizar mesma lógica |
| `src/pages/Dashboard.tsx` | Ajustar exibição dos cards |

## Resultado Esperado

| Campo | Antes | Depois |
|-------|-------|--------|
| **Saldo Disponível** | R$ 0,00 | **R$ 96,00** |
| Em Metas | R$ 1.169,30 | R$ 1.169,30 |
| Patrimônio Total | R$ 96,00 | **R$ 1.265,30** |

## Detalhes Técnicos

### Código atualizado para `useCompleteStats`:

```typescript
// Saldo Disponível = Saldo Inicial + Receitas Recebidas - Despesas Pagas
// Representa o dinheiro "livre" para gastar
const saldoDisponivel = saldoInicial + stats.completedIncome - stats.completedExpense;

// Patrimônio Total = Disponível + Metas + Investimentos
// Representa toda a riqueza do usuário
const patrimonioTotal = saldoDisponivel + totalMetas + totalInvestido;

// Saldo Real = Saldo Disponível
const realBalance = saldoDisponivel;

// Saldo Estimado = Disponível + Pendentes - Fatura
const estimatedBalance = saldoDisponivel + stats.pendingIncome - stats.pendingExpense - faturaCartaoTitular;

return {
  ...stats,
  realBalance,
  saldoDisponivel,
  patrimonioTotal,
  estimatedBalance,
  totalMetas,
  totalInvestido,
  totalGuardado,
};
```

## Fluxo Visual Corrigido

```text
ANTES (invertido):
┌────────────────────────────────────────────┐
│ Patrimônio = saldo + receitas - despesas   │
│            = R$ 96,00                       │
│                                            │
│ Disponível = patrimônio - metas            │
│            = 96 - 1169 = R$ 0,00 ❌        │
└────────────────────────────────────────────┘

DEPOIS (correto):
┌────────────────────────────────────────────┐
│ Disponível = saldo + receitas - despesas   │
│            = R$ 96,00 ✅                   │
│                                            │
│ Patrimônio = disponível + metas            │
│            = 96 + 1169 = R$ 1.265,30 ✅    │
└────────────────────────────────────────────┘
```

Agora o sistema reflete a realidade: você tem R$ 96,00 disponíveis para gastar, e seu patrimônio total (incluindo metas) é R$ 1.265,30.

