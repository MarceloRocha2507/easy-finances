
# Corrigir Discrepancia entre Dashboard e Relatorios

## Problema

Os valores de Receitas e Despesas nos Relatorios nao batem com o Dashboard por dois motivos:

### 1. Relatorios nao filtram por status

O hook `useTransactionStats` (usado nos Relatorios) soma **todas** as transacoes do periodo, independente do status (pending, completed, cancelled). Ja o Dashboard usa `useCompleteStats`, que filtra apenas transacoes com `status = 'completed'`.

Isso explica a diferenca:
- Dashboard Receitas: R$ 2.462,50 (apenas completed)
- Relatorios Receitas: R$ 4.077,05 (completed + pending + cancelled)

### 2. Relatorios nao excluem categorias de Meta

O Dashboard exclui transacoes das categorias "Deposito em Meta" e "Retirada de Meta" dos totais mensais. Os Relatorios incluem tudo.

### 3. Bug de timezone residual no useCompleteStats

As linhas 857-858 do `useCompleteStats` ainda usam `toISOString().split('T')[0]`, que nao foi corrigido na ultima alteracao.

## Solucao

### Arquivo: `src/hooks/useTransactions.ts`

**Linha 857-858** - Corrigir timezone:
```
// De:
const inicioMes = new Date(...).toISOString().split('T')[0];
const fimMes = new Date(...).toISOString().split('T')[0];

// Para:
const inicioMes = `${mesRef.getFullYear()}-${String(mesRef.getMonth() + 1).padStart(2, '0')}-01`;
const fimMes = (() => { const d = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 0); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
```

**Linhas 139-180 (`useTransactionStats`)** - Adicionar filtro `status = 'completed'` e exclusao de categorias de meta, para ficar consistente com o Dashboard:
```typescript
// Adicionar .eq('status', 'completed') na query
// Buscar categorias de meta e excluir dos totais
```

**Linhas 182-235 (`useExpensesByCategory`)** - Adicionar filtro `status = 'completed'` tambem, para que o grafico de pizza mostre apenas despesas efetivamente pagas.

### Arquivo: `src/pages/Reports.tsx`

**Linha 175** - Atualizar label do card de "Saldo do Periodo" para refletir que mostra apenas transacoes confirmadas. Trocar para "Saldo Realizado" ou manter "Saldo do Periodo" mas com subtitulo "recebidas - pagas".

### Resultado esperado

Apos as correcoes, os Relatorios mostrarao os mesmos valores do Dashboard:
- Receitas: apenas transacoes `completed` (excluindo metas)
- Despesas: apenas transacoes `completed` (excluindo metas)
- Saldo: Receitas - Despesas do periodo (apenas realizados)
