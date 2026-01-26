

## Plano: Remover Desconto de Metas do Saldo Disponível

### Problema Identificado

O card "Saldo Disponível" no Dashboard continua mostrando **-R$ 1.169,30** porque a variável `saldoDisponivel` ainda calcula:

```
saldoDisponivel = saldoBase - totalGuardado
saldoDisponivel = R$ 0,00 - R$ 1.169,30 = -R$ 1.169,30
```

### Solicitação do Usuário

O usuário quer que o "Saldo Disponível" **NÃO** desconte metas e investimentos. Ou seja, deve mostrar o mesmo valor do patrimônio bruto (R$ 0,00).

### Mudança Técnica

**Arquivo:** `src/hooks/useTransactions.ts` (linha 752)

**Código Atual:**
```typescript
// Saldo Disponível = Saldo Base - Total Guardado (Investimentos + Metas)
const saldoDisponivel = saldoBase - totalGuardado;
```

**Código Proposto:**
```typescript
// Saldo Disponível = Saldo Base (sem descontar metas/investimentos)
const saldoDisponivel = saldoBase;
```

### Resultado Esperado

| Card | Antes | Depois |
|------|-------|--------|
| Saldo Disponível | -R$ 1.169,30 | R$ 0,00 |
| Patrimônio | R$ 0,00 | R$ 0,00 |
| Em Metas | R$ 1.169,30 | R$ 1.169,30 (apenas informativo) |

### Comportamento Final

- **Saldo Disponível** = Patrimônio bruto (o que você realmente tem no banco)
- **Em Metas** = Apenas informativo, mostrando quanto você "pretende guardar"
- **Metas não são mais subtraídas** do saldo visível

### Observação sobre a UI

O card continuará mostrando "Em Metas: R$ 1.169,30" como informação adicional, mas esse valor não afetará mais o cálculo do saldo principal.

