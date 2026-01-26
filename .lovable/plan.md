
## Análise: Saldo Negativo Após Ajuste para R$ 0,00

### Diagnóstico

O sistema **está calculando corretamente**. Veja os dados do seu perfil:

| Campo | Valor |
|-------|-------|
| Saldo Inicial (ajustado) | -R$ 1.175,45 |
| Total em Metas | R$ 1.169,30 |
| Receitas (completed) | R$ 4.430,05 |
| Despesas (completed) | R$ 3.254,60 |

### Cálculo do Sistema

```text
┌─────────────────────────────────────────────────────────────┐
│ Saldo Base = Saldo Inicial + Receitas - Despesas            │
│ Saldo Base = -1.175,45 + 4.430,05 - 3.254,60 = R$ 0,00 ✓   │
├─────────────────────────────────────────────────────────────┤
│ Saldo Disponível = Saldo Base - Metas - Investimentos       │
│ Saldo Disponível = 0,00 - 1.169,30 - 0 = -R$ 1.169,30       │
└─────────────────────────────────────────────────────────────┘
```

### Por que está negativo?

O saldo disponível fica negativo porque:
- Você informou que tem **R$ 0,00 no banco**
- Mas o sistema ainda registra **R$ 1.169,30 guardados em metas**

Isso cria uma inconsistência: as metas indicam dinheiro "reservado", mas esse dinheiro não existe na conta.

### Possíveis Cenários

1. **O dinheiro das metas foi gasto**: Se você usou o dinheiro das metas, precisa atualizar os valores das metas para refletir a realidade
2. **O dinheiro está em outra conta**: Se o dinheiro das metas está numa poupança separada, o saldo da conta corrente ser R$ 0 faz sentido

### Soluções Propostas

#### Opção A: Zerar as metas (se o dinheiro foi usado)

Se você gastou o dinheiro das metas:
1. Vá em **Metas**
2. Ajuste o "valor atual" de cada meta para R$ 0,00
3. O saldo disponível voltará a ser R$ 0,00

#### Opção B: Separar contas (se o dinheiro está em poupança)

Se o dinheiro está numa poupança:
- O comportamento atual está **correto**
- A conta corrente está zerada
- O dinheiro das metas existe, mas está em outro lugar
- O "Saldo Disponível" mostra quanto você pode gastar NA CONTA CORRENTE (que é zero, pois você ainda "deve" para as metas)

#### Opção C: Considerar metas como parte do saldo real

Podemos alterar a lógica para que o "Saldo Real" NÃO desconte as metas, mostrando o patrimônio bruto. Assim:
- **Saldo Real = Patrimônio Bruto** (sem descontar metas)
- **Saldo Disponível = Patrimônio - Metas** (quanto sobra após reservar para metas)

---

## Mudança Técnica (Opção C)

Se quiser que o "Saldo Real" mostre o patrimônio sem descontar metas:

### Arquivo: `src/hooks/useTransactions.ts` (linha 756)

**Atual:**
```typescript
// Saldo Real (retrocompatibilidade) = saldoDisponivel
const realBalance = saldoDisponivel;
```

**Proposta:**
```typescript
// Saldo Real = Patrimônio Total (sem descontar metas)
const realBalance = saldoBase;
```

### Resultado esperado

| Antes | Depois |
|-------|--------|
| Saldo Real: -R$ 1.169,30 | Saldo Real: R$ 0,00 |
| Saldo Estimado: -R$ 1.169,30 | Saldo Estimado: R$ 0,00 |

**Importante:** Neste caso, o "Saldo Real" representaria o **patrimônio bruto** (quanto você tem no total), não o saldo disponível após reservar para metas.

---

## Recomendação

Antes de fazer qualquer alteração no código, preciso entender sua situação:

**Pergunta chave:** Os R$ 1.169,30 das metas ainda existem em algum lugar (poupança, investimento, etc.) ou foram gastos?

- Se **foram gastos**: Ajuste as metas para R$ 0
- Se **existem em outro lugar**: O saldo negativo está correto (mostra que você não tem dinheiro "disponível" na conta corrente)
- Se **quer ver patrimônio bruto**: Posso alterar para que "Saldo Real" não desconte metas
