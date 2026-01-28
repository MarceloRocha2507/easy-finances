
# Plano: Corrigir Validação de Saldo para Depósito em Meta

## Problema Identificado

O depósito está sendo bloqueado mesmo quando o valor é **igual** ao saldo disponível (R$ 67,03 = R$ 67,03).

**Causa**: Precisão de ponto flutuante em JavaScript. Números como `67.03` podem ser representados internamente como `67.02999999999999` ou `67.03000000000001`, fazendo com que a comparação `>` retorne `true` incorretamente.

## Solução

Usar uma **tolerância de precisão** (epsilon) nas comparações de valores monetários, ou arredondar os valores para 2 casas decimais antes de comparar.

## Alterações Necessárias

### 1. Arquivo: `src/components/dashboard/GerenciarMetaDialog.tsx`

**Linha 112-113 - Antes:**
```typescript
const valorDepositoNum = parseFloat(valorDeposito) || 0;
const depositoExcedeSaldo = valorDepositoNum > saldoDisponivel;
```

**Depois:**
```typescript
const valorDepositoNum = parseFloat(valorDeposito) || 0;
// Usar toFixed(2) para evitar problemas de precisão de ponto flutuante
const depositoExcedeSaldo = parseFloat(valorDepositoNum.toFixed(2)) > parseFloat(saldoDisponivel.toFixed(2));
```

### 2. Arquivo: `src/hooks/useMetas.ts`

**Linhas 241-244 - Antes:**
```typescript
// Validar saldo disponível se fornecido
if (data.saldoDisponivel !== undefined && data.valor > data.saldoDisponivel) {
  throw new Error("Saldo insuficiente para este depósito");
}
```

**Depois:**
```typescript
// Validar saldo disponível se fornecido (com tolerância para precisão de ponto flutuante)
if (data.saldoDisponivel !== undefined) {
  const valorArredondado = parseFloat(data.valor.toFixed(2));
  const saldoArredondado = parseFloat(data.saldoDisponivel.toFixed(2));
  if (valorArredondado > saldoArredondado) {
    throw new Error("Saldo insuficiente para este depósito");
  }
}
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/dashboard/GerenciarMetaDialog.tsx` | Arredondar valores antes de comparar (linha 113) |
| `src/hooks/useMetas.ts` | Arredondar valores antes de validar (linhas 241-244) |

## Resultado Esperado

- Depósito de R$ 67,03 com saldo de R$ 67,03 → **Permitido** ✅
- Depósito de R$ 67,04 com saldo de R$ 67,03 → **Bloqueado** ❌
- Qualquer valor menor que o saldo → **Permitido** ✅

## Detalhes Técnicos

O arredondamento com `toFixed(2)` + `parseFloat` garante que ambos os valores tenham exatamente 2 casas decimais antes da comparação, eliminando problemas como:

```javascript
// Problema de precisão
0.1 + 0.2 === 0.3 // false! (0.30000000000000004)

// Solução com arredondamento
parseFloat((0.1 + 0.2).toFixed(2)) === 0.3 // true
```
