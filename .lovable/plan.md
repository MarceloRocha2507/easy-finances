
# Correção: Saldo Duplicado nas Transações

## Problema Identificado

O saldo exibido na lista de transações está mostrando **-R$ 1.294,43** quando deveria mostrar **R$ 0,00** (conforme o card "Saldo Real").

### Causa Raiz

Na lógica do `useTransactionsWithBalance`, o sistema:

1. Calcula o saldo progressivo (patrimônio bruto): `saldo_inicial + receitas - despesas`
2. Para a **última transação**, subtrai o `totalGuardado` (metas + investimentos)

**O erro**: Quando o usuário deposita dinheiro em uma meta, o sistema já cria uma transação de despesa (categoria "Deposito em Meta"). Portanto, esse valor **já está descontado** no cálculo do saldo progressivo.

Ao subtrair novamente o `totalGuardado`, ocorre **dupla subtração**:
- 1a vez: transação de despesa "Deposito em Meta" diminui o saldo
- 2a vez: linhas 619-622 subtraem novamente o mesmo valor

### Exemplo Visual

```text
Saldo inicial: R$ 0
+ Retirada da meta (income): R$ 72,00
- Despesas: R$ 72,00
= Saldo bruto: R$ 0

Total em metas: R$ 1.294,43

Cálculo atual (errado):
  R$ 0 - R$ 1.294,43 = -R$ 1.294,43 ❌

Cálculo correto:
  R$ 0 (sem subtrair novamente) = R$ 0,00 ✓
```

## Solucao

Remover as linhas que subtraem o `totalGuardado` da última transação, pois os depositos em metas já são contabilizados como despesas.

## Alteracao Tecnica

**Arquivo:** `src/hooks/useTransactions.ts`

### Remover linhas 618-622

**Codigo atual (linhas 613-622):**
```typescript
// Identificar a última transação (mais recente por created_at)
const ultimaTransacaoId = allCompleted && allCompleted.length > 0 
  ? allCompleted[allCompleted.length - 1].id 
  : undefined;

// Ajustar APENAS a última transação para mostrar saldo disponível
if (ultimaTransacaoId) {
  const patrimonioAtual = saldoMap.get(ultimaTransacaoId) || 0;
  saldoMap.set(ultimaTransacaoId, patrimonioAtual - totalGuardado);
}
```

**Codigo corrigido:**
```typescript
// Identificar a última transação (mais recente por created_at)
const ultimaTransacaoId = allCompleted && allCompleted.length > 0 
  ? allCompleted[allCompleted.length - 1].id 
  : undefined;

// Nota: NÃO subtrair totalGuardado aqui porque depósitos em metas
// já são registrados como transações de despesa, evitando dupla contagem
```

## Resumo das Modificacoes

| Arquivo | Linhas | Alteracao |
|---------|--------|-----------|
| `src/hooks/useTransactions.ts` | 618-622 | Remover subtração de `totalGuardado` |

## Fluxo Apos Correcao

```text
Transação concluída
       ↓
Calcular saldo: inicial + receitas - despesas
       ↓
Exibir saldo na lista (sem ajuste adicional)
       ↓
Saldo final = Saldo Real ✓
```

## Resultado Esperado

- O saldo exibido na lista de transações será igual ao "Saldo Real"
- Não haverá mais valores negativos incorretos
- A última transação mostrará o saldo real após sua execução
- O tooltip ainda pode mostrar informações sobre patrimônio e valores guardados se necessário
