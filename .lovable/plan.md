

# Modernizar seção de gráficos do Dashboard

## 1. Reorganizar layout dos gráficos (`src/pages/Dashboard.tsx`)

### Novo layout
- "Receitas vs Despesas" ocupa largura total (100%) no topo, fora do grid 2 colunas
- "Despesas por Categoria" e "Comparativo Mensal" ficam lado a lado (grid 2 colunas)
- "Gastos por Dia" fica abaixo, largura total

### Mudanças no JSX
- Extrair o card "Receitas vs Despesas" do grid atual para um bloco solo com `mb-4`
- Mover `PieChartWithLegend` e `ComparativoMensal` para um grid `lg:grid-cols-2` juntos
- `GastosDiarios` fica sozinho abaixo

## 2. Modernizar "Receitas vs Despesas" (`src/pages/Dashboard.tsx`)

- Aumentar altura do gráfico de 220px para 280px (aproveitando largura total)
- Barras com cores: `#22c55e` (receitas) e `#f87171` (despesas)
- Manter `radius={[6, 6, 0, 0]}` para cantos mais arredondados
- Adicionar legenda compacta inline no header (bolinhas coloridas + texto)
- Tooltip já existente, manter com estilo atual

## 3. Compactar "Comparativo Mensal" (`src/components/dashboard/ComparativoMensal.tsx`)

- Remover o banner verde "Parabéns! Você está economizando!" e o banner amarelo de atenção
- Substituir por texto inline sutil com ícone ao lado do percentual (ex: icone check verde + "Economizando" em texto pequeno)
- Reduzir `CardHeader` padding e título para `text-base font-medium`
- Reduzir `mb-6` do bloco central para `mb-3`
- Grid "Mês Atual / Mês Anterior" com padding reduzido (`p-3`) e valores `text-lg` em vez de `text-xl`
- O badge de percentual continua como destaque principal (manter estilo pill com cor)

## 4. "Despesas por Categoria" -- sem alterações no componente

O `PieChartWithLegend` já está bem implementado com donut chart, legenda lateral interativa e empty state. Nenhuma mudança necessária no componente em si.

## 5. "Gastos por Dia" -- sem alterações

Componente já está alinhado com o design system. Mantém posição atual.

## Resumo de arquivos alterados

| Arquivo | Tipo de alteração |
|---|---|
| `src/pages/Dashboard.tsx` | Reorganizar grid dos gráficos, atualizar cores das barras, adicionar legenda inline, aumentar altura |
| `src/components/dashboard/ComparativoMensal.tsx` | Compactar card, remover banners, texto inline sutil, reduzir espaçamentos |

