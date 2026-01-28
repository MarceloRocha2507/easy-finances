
# Plano: Aplicar Melhorias da Página "Por Categoria" na "Visão Geral"

## Problema Identificado

A página de Relatórios "Visão Geral" (`/reports`) apresenta os mesmos problemas que foram corrigidos em "Por Categoria":

1. **Gráfico de pizza sem legenda interativa** - Usa o `PieChart` básico do Recharts em vez do componente `PieChartWithLegend` padronizado
2. **Altura do gráfico de barras muito grande** - Usa `height={300}` enquanto o padrão ajustado é `height={220}`
3. **CardHeader sem padding reduzido** - Falta o `pb-2` para consistência visual

## Alterações Necessárias

### Arquivo: `src/pages/Reports.tsx`

| Alteração | Antes | Depois |
|-----------|-------|--------|
| Import | Não importa `PieChartWithLegend` | Adicionar import do `PieChartWithLegend` |
| Card do Pie Chart (linhas 195-225) | Card customizado com `PieChart` básico | Usar componente `PieChartWithLegend` |
| CardHeader do Bar Chart (linha 229) | Sem classe | Adicionar `className="pb-2"` |
| ResponsiveContainer do Bar Chart (linha 233) | `height={300}` | `height={220}` |

### Detalhes Técnicos

**1. Adicionar import:**
```tsx
import { PieChartWithLegend } from '@/components/dashboard';
```

**2. Substituir o Card do Pie Chart (linhas 194-225):**
```tsx
// Antes: Card customizado com PieChart básico
<Card className="border">
  <CardHeader>
    <CardTitle>Despesas por Categoria</CardTitle>
  </CardHeader>
  <CardContent>
    {pieData.length > 0 ? (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>...</PieChart>
      </ResponsiveContainer>
    ) : (
      <div className="h-[300px]">...</div>
    )}
  </CardContent>
</Card>

// Depois: Usar o componente padronizado
<PieChartWithLegend data={pieData} />
```

**3. Ajustar o Card do Bar Chart (linhas 228-244):**
```tsx
// Antes
<CardHeader>
  <CardTitle>Comparativo Anual ({selectedYear})</CardTitle>
</CardHeader>
<CardContent>
  <ResponsiveContainer width="100%" height={300}>

// Depois
<CardHeader className="pb-2">
  <CardTitle className="text-base font-medium">Comparativo Anual ({selectedYear})</CardTitle>
</CardHeader>
<CardContent>
  <ResponsiveContainer width="100%" height={220}>
```

## Resultado Esperado

- Gráfico de pizza com legenda interativa ao lado (donut com hover e destaque)
- Cards de gráficos com alturas similares (~220px) eliminando o espaço em branco
- Visual consistente entre "Visão Geral" e "Por Categoria"
- Melhor aproveitamento do espaço horizontal

## Benefícios

1. **Consistência visual** - Ambas as páginas de relatórios terão o mesmo padrão
2. **Reutilização de código** - Usa o componente `PieChartWithLegend` já existente
3. **Melhor UX** - Legenda interativa permite destacar categorias ao passar o mouse
4. **Sem espaço em branco** - Os dois cards do grid terão alturas próximas
