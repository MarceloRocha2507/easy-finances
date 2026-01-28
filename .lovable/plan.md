

# Plano: Padronizar Layout de Gráficos na Página Economia

## Problema Identificado

Na página `/economia` (aba "Visão Geral"), a seção de gráficos apresenta:

1. **Dois cards separados em grid 2:3** - Um para o gráfico de pizza (Distribuição de Gastos) e outro para o ranking (Gastos por Categoria)
2. **Espaço em branco excessivo** - O card do gráfico de pizza tem muito espaço vazio na parte inferior
3. **Implementação customizada** - Não usa o componente `PieChartWithLegend` padronizado

## Solução Proposta

Substituir a estrutura de dois cards separados por **um único card usando o componente `PieChartWithLegend`**, seguido pelo card de Ranking separado - exatamente como funciona na página de Relatórios.

**Alternativa**: Manter os dois cards mas usar o `PieChartWithLegend` no lugar do gráfico customizado, eliminando o espaço em branco.

## Alterações Necessárias

### Arquivo: `src/pages/Economia.tsx`

**1. Adicionar import do componente padronizado (linha 5):**
```tsx
import { PieChartWithLegend } from "@/components/dashboard";
```

**2. Substituir a seção do grid (linhas 126-202):**

Antes: Grid 2:3 com dois cards separados
```tsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
  {/* Card do Gráfico de Pizza */}
  <Card className="lg:col-span-2 shadow-sm rounded-xl">
    <CardHeader>Distribuição de Gastos</CardHeader>
    <CardContent>
      {/* PieChart customizado com 200px de altura */}
      {/* Legenda customizada embaixo */}
    </CardContent>
  </Card>

  {/* Ranking */}
  <div className="lg:col-span-3">
    <RankingGastos />
  </div>
</div>
```

Depois: Grid 1:1 com componente padronizado
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Usar o componente padronizado */}
  <PieChartWithLegend data={pieData} />

  {/* Ranking */}
  {isLoading ? (
    <Skeleton className="h-[350px] rounded-xl" />
  ) : (
    <RankingGastos
      gastos={analise?.gastosPorCategoria || []}
      totalGasto={analise?.totalGasto || 0}
    />
  )}
</div>
```

## Benefícios

1. **Consistência visual** - Mesmo padrão usado em Relatórios e Dashboard
2. **Legenda interativa** - Hover destaca segmentos do gráfico
3. **Eliminação do espaço em branco** - Cards com alturas similares
4. **Menos código** - Remove ~50 linhas de implementação customizada
5. **Manutenibilidade** - Um único componente para atualizar

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| Dois cards com proporção 2:3 | Dois cards com proporção 1:1 |
| Gráfico de pizza com legenda embaixo | Gráfico donut com legenda ao lado |
| Espaço em branco excessivo | Altura equilibrada entre cards |
| Implementação customizada | Componente padronizado reutilizado |

