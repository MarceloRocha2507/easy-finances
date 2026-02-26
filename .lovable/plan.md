
# Texto das Despesas em Vermelho

## Problema
O card "Despesas" na pagina de Transacoes mostra o valor em verde porque o componente `StatCardMinimal` determina a cor com base no prefixo (`+` = verde, `-` = vermelho) ou se o valor e positivo/negativo. Como `completedExpense` e um numero positivo sem prefixo, ele aparece em verde.

## Solucao

### 1. `src/components/dashboard/StatCardMinimal.tsx`
Adicionar uma prop opcional `valueColor` que permite forcar a cor do valor, sobrescrevendo a logica automatica.

```tsx
interface StatCardMinimalProps {
  // ... props existentes
  valueColor?: "income" | "expense" | "neutral";
}
```

Logica de cor atualizada:
- Se `valueColor="expense"` fornecido, usar `text-[#DC2626]` (vermelho)
- Se `valueColor="income"` fornecido, usar `text-[#16A34A]` (verde)
- Caso contrario, manter logica atual baseada em prefix/valor

### 2. `src/pages/Transactions.tsx`
Adicionar `valueColor="expense"` no card de "Despesas" (linha ~932).

## Arquivos modificados
| Arquivo | Acao |
|---------|------|
| `src/components/dashboard/StatCardMinimal.tsx` | Adicionar prop `valueColor` |
| `src/pages/Transactions.tsx` | Passar `valueColor="expense"` no card Despesas |
