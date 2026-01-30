
# Correção: Valores do Dashboard Filtrando Apenas o Mês Atual

## Problema Identificado

Na screenshot, o usuário está visualizando **Fevereiro de 2025**, mas os valores de "Receitas" (R$ 4.627,18) e "Despesas" (R$ 3.451,73) estão somando dados de **todos os meses**, não apenas de fevereiro.

### Causa Raiz

No hook `useCompleteStats` (linha 717-720), a query atual busca:
- **Todas as transações `completed`** - sem filtro de período
- **Apenas pendentes do mês** - corretamente filtrado

```tsx
// QUERY ATUAL (INCORRETA)
.or(`status.eq.completed,and(status.eq.pending,due_date.gte.${inicioMes},due_date.lte.${fimMes})`);
```

Isso resulta em:
- Receitas = Soma de TODAS as receitas recebidas desde sempre
- Despesas = Soma de TODAS as despesas pagas desde sempre

---

## Solução

Filtrar **também as transações completed** pelo mês selecionado, usando o campo `date` para transações já realizadas:

```text
ANTES:                              DEPOIS:
┌──────────────────────────────┐    ┌──────────────────────────────┐
│ status = completed           │    │ status = completed           │
│ OU                          │ →  │ E date entre início e fim    │
│ (status = pending            │    │ OU                          │
│  E due_date no mês)          │    │ (status = pending            │
└──────────────────────────────┘    │  E due_date no mês)          │
                                    └──────────────────────────────┘
```

---

## Alteração Técnica

**Arquivo:** `src/hooks/useTransactions.ts`

**Antes (linha 717-720):**
```tsx
const { data, error } = await supabase
  .from('transactions')
  .select('type, amount, status, due_date')
  .or(`status.eq.completed,and(status.eq.pending,due_date.gte.${inicioMes},due_date.lte.${fimMes})`);
```

**Depois:**
```tsx
const { data, error } = await supabase
  .from('transactions')
  .select('type, amount, status, due_date, date')
  .or(
    `and(status.eq.completed,date.gte.${inicioMes},date.lte.${fimMes}),` +
    `and(status.eq.pending,due_date.gte.${inicioMes},due_date.lte.${fimMes})`
  );
```

---

## Lógica Corrigida

| Tipo de Transação | Filtro | Resultado |
|-------------------|--------|-----------|
| **Completed** (pagas/recebidas) | `date` entre início e fim do mês | Receitas e Despesas do mês |
| **Pending** (pendentes) | `due_date` entre início e fim do mês | A Receber e A Pagar do mês |

---

## Impacto nas Estatísticas

Após a correção, os cards exibirão:

| Card | Antes | Depois |
|------|-------|--------|
| **Receitas** | Soma de TODA a história | Soma apenas do mês selecionado |
| **Despesas** | Soma de TODA a história | Soma apenas do mês selecionado |
| **A Receber** | Já estava correto | Sem mudança |
| **A Pagar** | Já estava correto | Sem mudança |

---

## Consideração sobre Saldo Disponível

O **Saldo Disponível** deve continuar calculando a partir de TODAS as transações completed (histórico completo), pois representa o dinheiro acumulado até o momento. Apenas os valores de "Receitas" e "Despesas" do mês devem ser filtrados.

Para isso, vamos separar as queries:

1. **Query para Receitas/Despesas do mês** - filtrada pelo período
2. **Query para Saldo Disponível** - sem filtro de período (acumulado)

---

## Alteração Completa

A solução completa envolve:

1. **Manter o cálculo do Saldo Disponível** usando todas as transações completed
2. **Criar estatísticas separadas** para receitas/despesas do mês selecionado
3. **Pendentes continuam filtrados** pelo due_date do mês

### Estrutura Final

```tsx
// 1. Buscar TODAS completed para saldo disponível (acumulado)
const { data: allCompleted } = await supabase
  .from('transactions')
  .select('type, amount')
  .eq('status', 'completed');

// 2. Buscar completed DO MÊS para receitas/despesas exibidas
const { data: completedDoMes } = await supabase
  .from('transactions')
  .select('type, amount')
  .eq('status', 'completed')
  .gte('date', inicioMes)
  .lte('date', fimMes);

// 3. Buscar pending DO MÊS para A Receber/A Pagar
const { data: pendingDoMes } = await supabase
  .from('transactions')
  .select('type, amount, due_date')
  .eq('status', 'pending')
  .gte('due_date', inicioMes)
  .lte('due_date', fimMes);
```

---

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useTransactions.ts` | Modificar | Separar queries para saldo vs. receitas/despesas do mês |

---

## Resultado Esperado

Ao selecionar **Fevereiro de 2025**:
- **Receitas**: Soma apenas das receitas completed em fevereiro
- **Despesas**: Soma apenas das despesas completed em fevereiro
- **A Receber**: Pendentes com due_date em fevereiro
- **A Pagar**: Pendentes com due_date em fevereiro
- **Saldo Disponível**: Acumulado de todo o histórico (correto)
- **Saldo Estimado**: Disponível + A Receber do mês - A Pagar do mês - Fatura
