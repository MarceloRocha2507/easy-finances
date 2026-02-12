

# Fix: Stale Closure no Drag-Follow da Sidebar

## Problema Encontrado

Ao revisar o codigo, identifiquei um bug de **stale closure** no hook `useSwipeGesture`. O `handleTouchEnd` usa o valor de `dragOffset` do estado React, mas como ele esta dentro de um `useCallback`, o valor pode estar desatualizado no momento em que o usuario solta o dedo. Isso pode fazer com que o gesto de swipe nao funcione corretamente -- o usuario arrasta alem de 40% mas a sidebar volta em vez de abrir/fechar.

Alem disso, o `handleTouchMove` tem `isDragging` como dependencia, o que causa recriacao desnecessaria do listener a cada vez que `isDragging` muda.

## Solucao

Usar **refs** para rastrear `dragOffset` e `isDragging` internamente nos handlers, mantendo o estado React apenas para expor os valores ao componente. Isso elimina o problema de closure e melhora a performance.

## Alteracoes

### Arquivo: `src/hooks/useSwipeGesture.ts`

1. Adicionar `dragOffsetRef` (useRef) que e atualizado junto com `setDragOffset` no `touchmove`
2. Adicionar `isDraggingRef` (useRef) para verificacao interna no `touchmove`
3. No `handleTouchEnd`, usar `dragOffsetRef.current` em vez de `dragOffset` do estado para a verificacao de threshold
4. No `handleTouchMove`, usar `isDraggingRef.current` em vez de `isDragging` do estado
5. Remover `dragOffset` e `isDragging` das dependencias dos callbacks para evitar recriacao desnecessaria dos event listeners

### Resultado esperado

- O gesto de swipe sempre respeita corretamente o threshold de 40%
- Menos re-renders e recriacao de event listeners durante o arraste
- Comportamento identico ao planejado originalmente

