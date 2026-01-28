

# Plano: Corrigir Espaço em Branco no Gráfico de Pizza

## Problema Identificado

O componente `PieChartWithLegend` tem um layout flex com:
- Gráfico fixo de 200x200px à esquerda
- Legenda com `flex-1 w-full` à direita

O problema é que `flex-1` faz a legenda expandir para preencher todo o espaço disponível, criando um gap visual entre o gráfico e a legenda.

## Solução

Alterar o layout para que o gráfico e a legenda fiquem mais próximos, usando `items-start` no container e removendo o comportamento de expansão excessiva da legenda.

## Alterações no arquivo `src/components/dashboard/PieChartWithLegend.tsx`

| Linha | Antes | Depois |
|-------|-------|--------|
| 99 | `flex flex-col lg:flex-row items-center gap-4` | `flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4` |
| 134 | `flex-1 w-full` | `w-full lg:w-auto lg:min-w-[180px]` |

### Detalhes Técnicos

**Container principal (linha 99)**:
```tsx
// Antes
<div className="flex flex-col lg:flex-row items-center gap-4">

// Depois
<div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4">
```

**Container da legenda (linha 134)**:
```tsx
// Antes
<div className="flex-1 w-full">

// Depois
<div className="w-full lg:w-auto lg:min-w-[180px]">
```

Estas alterações:
1. `justify-center` - Centraliza os elementos para eliminar o espaço em branco extra
2. `lg:items-start` - Alinha o topo da legenda com o gráfico em desktop
3. `lg:w-auto lg:min-w-[180px]` - Remove a expansão automática, mantendo um tamanho mínimo adequado para a legenda

## Resultado Esperado

- Gráfico e legenda ficarão mais próximos
- Sem espaço em branco excessivo entre os elementos
- Layout continua responsivo (empilhado em mobile, lado a lado em desktop)

