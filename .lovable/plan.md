
# Refatoracao Completa do Modulo de Relatorios

## Resumo

Refatorar as 3 paginas do modulo de Relatorios (Visao Geral, Por Categoria, Exportacoes) para corrigir problemas visuais/funcionais e alinhar com o design system do restante do app.

## Problemas Identificados

1. **Sem estados de carregamento** - Nenhuma das 3 paginas exibe skeleton/loading enquanto busca dados
2. **Sem estados vazios amigaveis** - Estados vazios sao textos simples sem icones
3. **Filtros limitados** - Apenas selecao de mes/ano, sem filtro diario/semanal/anual/customizado
4. **Inconsistencia visual** - Cards de resumo nao usam `StatCardPrimary` do design system
5. **Falta grafico de evolucao do saldo (linha)** na pagina principal
6. **Exportacoes usa `border-0 shadow-lg`** em vez do padrao `border shadow-sm rounded-xl`
7. **Dados nao memoizados** - Calculos como `pieData`, `totalExpenses`, `categoryComparison` recalculam a cada render

## Mudancas por Arquivo

### 1. `src/pages/Reports.tsx` (Visao Geral)

**Filtros**: Substituir os selects de mes/ano pelo componente `FiltroDataRange` ja existente no projeto, que inclui date pickers, atalhos (Hoje, Semana, Mes, 30 dias) e navegacao por mes. Adicionar tambem atalhos para "Este Ano" e "Ultimo Ano" para cobrir filtro anual.

**Cards de resumo**: Substituir os 3 cards manuais por `StatCardPrimary` (Saldo com type="neutral", Receitas com type="income", Despesas com type="expense").

**Graficos**:
- Manter o grafico de barras (Receitas x Despesas) com `CartesianGrid` e tooltip customizado igual ao Dashboard
- Manter `PieChartWithLegend` para distribuicao por categoria
- Adicionar novo grafico de linha (evolucao do saldo acumulado) usando `AreaChart` com gradiente, no padrao do `GastosDiarios`

**Loading**: Adicionar `Skeleton` para cada secao enquanto `isLoading` dos hooks estiver true

**Estado vazio**: Componente com icone e mensagem amigavel quando nao ha dados

**Memoizacao**: Envolver `pieData`, `totalExpenses` e dados do grafico de barras com `useMemo`

**Exportacao**: Manter botoes de PDF e CSV no header

### 2. `src/pages/reports/RelatorioCategorias.tsx` (Por Categoria)

**Filtros**: Substituir selects por `FiltroDataRange`

**Cards de resumo**: Usar `StatCardPrimary` para Total de Despesas e `StatCardSecondary` para Categorias Ativas e Maior Categoria

**Loading/Vazio**: Adicionar skeletons e estados vazios com icone

**Memoizacao**: `useMemo` para `pieData`, `categoryComparison`, `transactionsByCategory`

**Visual**: Padronizar cards com `border shadow-sm rounded-xl`

### 3. `src/pages/reports/Exportacoes.tsx` (Exportacoes)

**Visual**: Trocar `border-0 shadow-lg` por `border shadow-sm rounded-xl` em todos os cards para consistencia

**Filtros**: Substituir selects por `FiltroDataRange`

**Loading**: Mostrar skeleton no resumo lateral enquanto carrega transacoes

**Sem outras mudancas funcionais** - a logica de exportacao esta correta

## Detalhes Tecnicos

### Novo grafico: Evolucao do Saldo (Reports.tsx)

Calcular saldo acumulado dia a dia a partir das transacoes do periodo filtrado:
- Agrupar transacoes por data
- Para cada dia, somar receitas e subtrair despesas acumulativamente
- Renderizar com `AreaChart` + gradiente (mesmo padrao de `GastosDiarios`)

```text
Estrutura do dado:
[
  { date: "01/02", saldo: 1500 },
  { date: "05/02", saldo: 2300 },
  ...
]
```

### Uso do FiltroDataRange

O componente `FiltroDataRange` ja aceita `startDate`, `endDate`, callbacks e um botao de refresh. Os hooks `useTransactionStats`, `useExpensesByCategory` e `useTransactions` ja aceitam `startDate`/`endDate` como strings ISO. A integracao e direta.

### Skeletons

Usar o componente `Skeleton` existente (`src/components/ui/skeleton.tsx`) para criar placeholders:
- 3 retangulos para os cards de resumo (h-24)
- 1 retangulo para cada grafico (h-[220px])
- Retangulos para a tabela de categorias

### Layout do grid na pagina principal refatorada

```text
+-------------------------------------------+
| Header + Filtros (FiltroDataRange)         |
+-------------------------------------------+
| [StatCard]  [StatCard]  [StatCard]         |
+-------------------------------------------+
| [Receitas x Despesas]  | [Donut Categ.]   |
+-------------------------------------------+
| [Evolucao Saldo - AreaChart]              |
+-------------------------------------------+
| [Detalhamento por Categoria - tabela]     |
+-------------------------------------------+
| [Maiores Transacoes do Periodo]           |
+-------------------------------------------+
```

### Arquivos modificados
- `src/pages/Reports.tsx`
- `src/pages/reports/RelatorioCategorias.tsx`
- `src/pages/reports/Exportacoes.tsx`

### Dependencias
Nenhuma nova dependencia necessaria. Todos os componentes e bibliotecas ja estao instalados (`recharts`, `date-fns`, `Skeleton`, `FiltroDataRange`, `StatCardPrimary`, `StatCardSecondary`, `PieChartWithLegend`).
