

# Plano: Corrigir Layout do Gráfico de Pizza

## Problema Identificado

Analisando a imagem, o problema real é:

1. **Breakpoint incompatível**: O componente `PieChartWithLegend` usa `lg:flex-row` para colocar a legenda ao lado do gráfico. Porém, na página de relatórios, o card está dentro de um grid `lg:grid-cols-2`, ou seja, em telas `lg` o card já está ocupando apenas ~50% da largura.

2. **Legenda aparecendo abaixo**: Com apenas ~500px de largura disponível para o card, o breakpoint `lg` (1024px) nunca é atingido dentro do card, então a legenda fica sempre embaixo do gráfico.

3. **Espaço desperdiçado**: O card tem altura para acomodar gráfico + legenda lado a lado, mas como estão empilhados, sobra muito espaço em branco.

## Solução

Criar uma versão do componente que seja **mais flexível** e use `md:flex-row` (768px) em vez de `lg:flex-row`, ou passar uma prop para controlar isso. A abordagem mais simples é ajustar o breakpoint dentro do componente.

## Alterações

### Arquivo: `src/components/dashboard/PieChartWithLegend.tsx`

Alterar o breakpoint de `lg` para `md` para que a legenda fique ao lado do gráfico mais cedo:

| Linha | Antes | Depois |
|-------|-------|--------|
| 99 | `lg:flex-row` e `lg:items-start` | `md:flex-row` e `md:items-start` |
| 134 | `lg:w-auto lg:min-w-[180px]` | `md:w-auto md:min-w-[180px]` |

```tsx
// Linha 99 - Container principal
<div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-4">

// Linha 134 - Container da legenda  
<div className="w-full md:w-auto md:min-w-[180px]">
```

## Por que essa mudança resolve

- `md` = 768px breakpoint
- Em telas `lg` (1024px+), um grid de 2 colunas divide a tela em ~512px cada
- Com o breakpoint `md`, a legenda vai para o lado do gráfico quando o card tem ~384px+ de largura
- Isso elimina o espaço em branco, pois a legenda fica ao lado do gráfico mesmo dentro do grid de 2 colunas

## Resultado Esperado

- Gráfico de donut à esquerda
- Legenda interativa à direita (mesmo em cards estreitos)
- Sem espaço em branco excessivo
- Layout responsivo: empilha apenas em mobile real (<768px)

