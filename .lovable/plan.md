

## Plano: Diferenciar faturas pagas na listagem

### Problema atual
O hook `useFaturasNaListagem` filtra apenas parcelas com `paga: false`. Quando uma fatura é paga, ela desaparece da lista.

### Alterações

**1. `src/hooks/useFaturasNaListagem.ts`**
- Remover o filtro `.eq('paga', false)` da query de parcelas
- Adicionar campo `paga: boolean` ao tipo `FaturaVirtual` e ao `statusFatura` (novo valor `'paga'`)
- Na agrupação, separar totais pagos e não pagos por cartão+mês
- Se todas as parcelas de um grupo estão pagas → `statusFatura = 'paga'`
- Na ordenação final: faturas não pagas primeiro, pagas por último

**2. `src/pages/Transactions.tsx` — `FaturaCartaoRow`**
- Adicionar config de status `paga: { label: 'Paga', className: 'bg-green-100 text-green-700 ...' }`
- Quando `fatura.statusFatura === 'paga'`: valor em verde (`text-green-600`)
- Ícone de fundo muda para verde quando paga

**3. `src/pages/Transactions.tsx` — Toggle "Ocultar pagas"**
- Adicionar state `ocultarPagas` (default: false)
- Renderizar um Switch/toggle acima da lista de faturas no grupo "Faturas de Cartão"
- Quando ativo, filtrar faturas com `statusFatura === 'paga'` antes de renderizar

### Detalhes técnicos

No hook, a query passa a buscar todas as parcelas (pagas e não pagas). A agrupação verifica se **todas** parcelas de um cartão+mês estão pagas para definir `statusFatura = 'paga'`. A ordenação coloca pagas no final.

O toggle será um `Switch` simples com label "Ocultar pagas" posicionado no header do grupo "Faturas de Cartão" via `GroupHeader` ou inline.

