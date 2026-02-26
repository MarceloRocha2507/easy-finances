

# Seção "Contas a Pagar do Mês" no Dashboard

## Resumo

Criar um novo componente `ContasAPagar` que exibe as despesas do mês selecionado em uma lista estilizada, com status (Pago/Pendente/Vencido), totalizadores e barra de progresso. Posicionado entre a barra de comprometimento e os gráficos.

## Novo componente: `src/components/dashboard/ContasAPagar.tsx`

### Dados
- Buscar transações do tipo `expense` no mês selecionado usando `useTransactions` com filtros `startDate`, `endDate` e `type: 'expense'`
- Cada item mostra: nome, categoria (cor + nome), data de vencimento (`due_date` ou `date`), valor e status
- Status badge:
  - `completed` = "Pago" (badge verde)
  - `pending` + vencido (due_date < hoje) = "Vencido" (badge vermelho)
  - `pending` + nao vencido = "Pendente" (badge amarelo)

### Ordenacao
- Vencidos primeiro (por data crescente)
- Pendentes por data crescente
- Pagos por ultimo

### Limite de itens
- Exibe no maximo 5 por padrao
- Botao "Mostrar mais" se houver mais de 5
- Controle via estado local `expanded`

### Cabecalho
- Titulo: "Contas a Pagar" com icone `ClipboardList`
- Subtexto: "Resumo das despesas de [mes por extenso]"
- Botao "Ver todas" com `Link` para `/transactions`

### Rodape
- Separador
- Totalizadores: "Total Pago" (verde) e "Total Pendente" (amarelo)
- Em mobile: empilham verticalmente (`flex-col sm:flex-row`)
- Barra de progresso fina mostrando % pago do total

### Estilo
- Card branco, `rounded-xl`, `shadow-sm`
- Hover nos itens: `hover:bg-gray-50`
- Espacamento entre itens: `space-y-3`
- Cores da categoria vindas do banco (campo `color` da categoria)

## Mudanca em `src/pages/Dashboard.tsx`

- Importar `ContasAPagar` do barrel `@/components/dashboard`
- Inserir entre a barra de comprometimento e os graficos:
```tsx
<ContasAPagar mesReferencia={mesReferencia} />
```

## Mudanca em `src/components/dashboard/index.ts`

- Exportar o novo componente `ContasAPagar`

## Arquivos modificados/criados

| Arquivo | Acao |
|---------|------|
| `src/components/dashboard/ContasAPagar.tsx` | Criar - novo componente |
| `src/components/dashboard/index.ts` | Editar - adicionar export |
| `src/pages/Dashboard.tsx` | Editar - inserir componente entre comprometimento e graficos |

## Detalhes tecnicos

### Estrutura visual

```text
+----------------------------------------------------------+
| ClipboardList  Contas a Pagar           [Ver todas ->]   |
| Resumo das despesas de fevereiro                         |
|----------------------------------------------------------|
| [cor] Aluguel                  Vence 05/03  -R$ 1.200  [Pendente] |
| [cor] Supermercado             Vence 01/03  -R$ 450    [Pago]     |
| ...                                                      |
|                    [Mostrar mais]                         |
|----------------------------------------------------------|
| Total Pago: R$ 2.100     Total Pendente: R$ 1.800       |
| [========████████==============]  54% pago              |
+----------------------------------------------------------+
```

### Query de dados
Reutiliza o hook `useTransactions` existente com filtros de data e tipo:
```tsx
const { data: transactions } = useTransactions({
  startDate: inicioMes,
  endDate: fimMes,
  type: 'expense',
});
```

### Logica de status visual
```tsx
const getStatusInfo = (t: Transaction) => {
  if (t.status === 'completed') return { label: 'Pago', color: 'bg-green-100 text-green-700' };
  const dueDate = t.due_date || t.date;
  const isOverdue = new Date(dueDate) < new Date();
  if (isOverdue) return { label: 'Vencido', color: 'bg-red-100 text-red-700' };
  return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' };
};
```
