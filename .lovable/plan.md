
# Simplificar o FiltroDataRange

## Objetivo
Remover os botoes de atalho (Hoje, Mes, Semana, 30 dias) e o botao de refresh do componente `FiltroDataRange`, mantendo apenas os dois date pickers e o seletor de mes com navegacao por setas, conforme a segunda imagem de referencia.

## Mudancas

### Arquivo: `src/components/FiltroDataRange.tsx`

1. **Remover imports nao utilizados**: `startOfWeek`, `endOfWeek`, `subDays`, `RefreshCw`
2. **Remover props**: `onRefresh` e `isLoading` da interface (tornar opcional por retrocompatibilidade)
3. **Remover funcoes de atalho**: `handleHoje`, `handleEstaSemana`, `handleEsteMes`, `handleUltimos30Dias`
4. **Remover bloco JSX dos atalhos**: Toda a secao "Atalhos + Refresh" (linhas 163-191)
5. **Simplificar layout**: Manter apenas a linha de datas (date pickers) e o seletor de mes lado a lado

### Resultado visual
O filtro ficara exatamente como na segunda imagem: dois campos de data com "ate" entre eles, seguidos do seletor de mes com setas de navegacao.

### Impacto
O componente e usado em 4 paginas (`Reports.tsx`, `RelatorioCategorias.tsx`, `Exportacoes.tsx`, `Transactions.tsx`). Todas continuarao funcionando normalmente - as props `onRefresh`/`isLoading` serao mantidas como opcionais mas nao renderizarao nada, sem quebrar chamadas existentes.
