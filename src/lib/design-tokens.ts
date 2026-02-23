/**
 * Design Tokens Centralizados
 * Todas as constantes visuais reutilizáveis do sistema.
 * Alterações aqui refletem globalmente.
 */

// Cores semânticas para gráficos (usar com Recharts)
export const CHART_COLORS = {
  income: "hsl(var(--income))",
  expense: "hsl(var(--expense))",
  primary: "hsl(var(--primary))",
  border: "hsl(var(--border))",
  muted: "hsl(var(--muted-foreground))",
} as const;

// Formatação padrão do eixo Y em gráficos monetários
export function formatYAxis(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `R$${(value / 1000).toFixed(0)}k`;
  }
  return `R$${value}`;
}

// Tamanhos padrão de Skeleton por tipo
export const SKELETON = {
  card: "h-28 rounded-xl",
  chart: "h-[300px] rounded-xl",
  listItem: "h-16 rounded-xl",
} as const;
