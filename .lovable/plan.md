

## Correção: Saldo Estimado com dupla contabilização de despesas

### Problema identificado

A fórmula atual do Saldo Estimado é:

```text
Saldo Estimado = Saldo Disponível + Receitas Pendentes − Despesas Pendentes − Fatura do Cartão (Titular)
```

O campo `pendingExpense` inclui **todas** as transações pendentes de despesa da tabela `transactions`, inclusive aquelas com categoria "Fatura do Cartão" (criadas quando o usuário agenda o pagamento de uma fatura). Porém, `faturaCartaoTitular` já cobre exatamente esse valor a partir da tabela `parcelas_cartao`. Resultado: a fatura do cartão é subtraída **duas vezes**.

### Solução

Na query de transações pendentes do mês (`pendingDoMes`), incluir o `category_id` na seleção. No loop de cálculo, separar as despesas pendentes em dois grupos:

- **Despesas pendentes comuns** (fora do cartão) → continuam subtraindo do Saldo Estimado
- **Despesas pendentes com categoria "Fatura do Cartão"** → excluídas do cálculo do Saldo Estimado (já cobertas por `faturaCartaoTitular`)

### Alterações em `src/hooks/useTransactions.ts`

1. **Linha 1113**: Adicionar `category_id` ao select da query `pendingDoMes`:
   ```typescript
   .select('type, amount, due_date, category_id')
   ```

2. **Linhas 1182-1188**: No loop de pendentes, excluir despesas da categoria "Fatura do Cartão" do `pendingExpense`:
   ```typescript
   (pendingDoMes || []).forEach((t) => {
     const amount = Number(t.amount);
     const isFaturaCartao = t.category_id && metaCategoryIds_fatura.has(t.category_id);
     stats.pendingCount++;
     if (t.type === 'income') {
       stats.pendingIncome += amount;
     } else {
       // Despesas de fatura de cartão já estão em faturaCartaoTitular
       if (!isFaturaCartao) {
         stats.pendingExpense += amount;
       }
     }
     if (t.due_date && t.due_date < today) stats.overdueCount++;
   });
   ```

3. **Antes do loop**: Buscar o ID da categoria "Fatura do Cartão" usando a query de categorias já existente (`metaCategories`), expandindo-a para incluir "Fatura do Cartão":
   ```typescript
   .in('name', ['Depósito em Meta', 'Retirada de Meta', 'Fatura do Cartão'])
   ```
   E criar um set separado `faturaCategoryIds` para as categorias de fatura.

### Resultado

- **Saldo Estimado** = Disponível + A Receber − Despesas Pendentes (sem cartão) − Fatura Cartão
- Sem dupla contabilização
- Cards de "A Pagar" continuam exibindo o total correto (despesas pendentes + fatura)
- Nenhuma outra parte do sistema é afetada

