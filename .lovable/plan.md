

# Ajustar Seção de Gráficos do Dashboard

## O que muda

A seção de gráficos já existe com ambos os componentes implementados corretamente. A única mudança necessária é **inverter a ordem** dos gráficos no grid:

- **Atual**: Rosca (esquerda) | Barras (direita)
- **Solicitado**: Barras (esquerda) | Rosca (direita)

Tudo o mais já está conforme a especificação:
- Grid 2 colunas em desktop, empilhado em mobile (`grid-cols-1 lg:grid-cols-2`)
- BarChart com barras agrupadas verde/vermelha, eixo X com meses, tooltip BRL
- PieChart donut com legenda lateral (cor + nome + valor + percentual)
- Cards com `rounded-xl`, `shadow-sm`, responsivo

## Mudança em `src/pages/Dashboard.tsx`

Na seção de gráficos (linhas 319-392), trocar a ordem dos dois filhos do grid:

1. Primeiro: Card do BarChart "Receitas vs Despesas"
2. Segundo: `PieChartWithLegend` "Despesas por Categoria"

## Arquivo modificado
| Arquivo | Ação |
|---------|------|
| `src/pages/Dashboard.tsx` | Inverter ordem dos gráficos no grid |

