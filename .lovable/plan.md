
# Manter "Acerto de Fatura" nos totais de Despesas

## O que muda

Remover "Acerto de Fatura" da lista de categorias excluidas dos cards mensais. Assim, essas transacoes voltarao a contar normalmente nos totais de Receitas/Despesas do mes.

## Alteracao

### `src/hooks/useTransactions.ts` (linha 755)

Remover `'Acerto de Fatura'` da lista de categorias filtradas:

**Antes:**
```
.in('name', ['Depósito em Meta', 'Retirada de Meta', 'Acerto de Fatura']);
```

**Depois:**
```
.in('name', ['Depósito em Meta', 'Retirada de Meta']);
```

Apenas uma linha alterada. As transacoes de "Acerto de Fatura" voltarao a aparecer nos cards de Despesas e Receitas do mes normalmente. O saldo real nao sera afetado (ja esta correto desde a ultima alteracao).
