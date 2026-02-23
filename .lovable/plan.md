

# Reduzir tamanho dos cards de resumo no mobile

## Problema

Os cards `StatCardPrimary` e `StatCardSecondary` usam `p-6` fixo, icones grandes (w-12/h-12 e w-10/h-10) e fontes grandes (text-2xl/text-3xl e text-xl), ocupando muito espaco vertical no mobile conforme a screenshot.

## Solucao

Reduzir padding, fontes e icones no mobile usando classes responsivas do Tailwind. Nenhuma mudanca em desktop.

### Arquivo: `src/components/dashboard/StatCardPrimary.tsx`

1. Padding: `p-3 sm:p-6`
2. Titulo: `text-xs sm:text-sm`
3. Valor: `text-lg sm:text-2xl md:text-3xl`
4. Margem titulo-valor: `mb-1 sm:mb-2`
5. Icone container: `w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl`
6. Icone: `w-4 h-4 sm:w-6 sm:h-6`
7. SubInfo margem: `mt-1 sm:mt-2`

### Arquivo: `src/components/dashboard/StatCardSecondary.tsx`

1. Padding: `p-3 sm:p-6`
2. Titulo: `text-xs sm:text-sm`
3. Valor: `text-base sm:text-xl`
4. Icone container: `w-8 h-8 sm:w-10 sm:h-10`
5. Icone: `w-4 h-4 sm:w-5 sm:h-5`

### Arquivo: `src/pages/Transactions.tsx`

1. Grid gap: `gap-2 sm:gap-3` (linha 764)

Isso reduz significativamente a altura dos cards no mobile sem afetar o layout desktop.
