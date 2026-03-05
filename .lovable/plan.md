

## Problema

Na aba "Pendentes", todas as transacoes aparecem numa lista flat sem separacao entre despesas e receitas. O usuario quer que sejam agrupadas.

## Solucao

Ativar o sistema de agrupamento para a aba `pending`, com dois grupos simples: "Despesas Pendentes" e "Receitas Pendentes".

## Alteracoes

**Arquivo: `src/pages/Transactions.tsx`**

1. **Linha 127-152** — Adicionar configs de grupo para pendentes no `GRUPO_CONFIG`:
   - `despesas_pendentes: { key: 'despesas_pendentes', label: 'Despesas Pendentes' }`
   - `receitas_pendentes: { key: 'receitas_pendentes', label: 'Receitas Pendentes' }`

2. **Linha 165-204** — Na funcao `agruparTransacoes`, adicionar logica para `activeTab === 'pending'`:
   - Classificar itens como `despesas_pendentes` ou `receitas_pendentes` baseado no `type`
   - Adicionar esses keys na `ordemGrupos`

3. **Linha 368** — Alterar `useGrouping` para incluir `pending`:
   ```typescript
   const useGrouping = activeTab === 'all' || activeTab === 'expense' || activeTab === 'income' || activeTab === 'pending';
   ```

