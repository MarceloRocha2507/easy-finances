
# Animacao Drag-Follow na Sidebar Mobile

## Objetivo

Fazer a sidebar acompanhar o dedo do usuario durante o arraste, criando uma experiencia nativa similar ao Gmail/WhatsApp. Em vez de abrir/fechar de forma binaria no final do gesto, a sidebar se move em tempo real seguindo o toque.

## Como vai funcionar

1. **Arrastando da borda esquerda** (sidebar fechada): a sidebar aparece gradualmente seguindo o dedo
2. **Arrastando para a esquerda** (sidebar aberta): a sidebar recua seguindo o dedo
3. **Ao soltar o dedo**: se o arraste passou de 40% da largura da sidebar, ela abre/fecha com animacao suave; caso contrario, volta a posicao original
4. **O overlay** tambem acompanha o arraste com opacidade progressiva

## Detalhes Tecnicos

### Arquivo: `src/hooks/useSwipeGesture.ts` (reescrever)

Transformar o hook para expor o **progresso do arraste em tempo real** alem dos callbacks finais:

- Adicionar `touchmove` listener para calcular o delta continuamente
- Expor `dragOffset` (numero em px que a sidebar deve se deslocar) e `isDragging` (boolean)
- No `touchend`, decidir se abre ou fecha baseado no progresso (threshold de 40% da largura da sidebar ~112px)
- Resetar `dragOffset` para 0 ao finalizar o gesto
- Para abrir: so rastrear se o toque comecou na borda esquerda (30px)
- Para fechar: so rastrear se a sidebar esta aberta
- Ignorar gestos predominantemente verticais (scrolling)

Retorno do hook:
```
{
  dragOffset: number,   // 0 a 280 (largura da sidebar)
  isDragging: boolean   // true durante o arraste
}
```

### Arquivo: `src/components/Layout.tsx` (modificar)

1. Receber `dragOffset` e `isDragging` do hook
2. Na sidebar mobile: substituir a classe CSS `translate-x` por `style={{ transform }}` inline calculado:
   - Fechada sem arraste: `translateX(-100%)`
   - Aberta sem arraste: `translateX(0)`
   - Durante arraste para abrir: `translateX(calc(-100% + ${dragOffset}px))`
   - Durante arraste para fechar: `translateX(${-dragOffset}px)`
3. Desabilitar `transition-transform` durante o arraste (`isDragging`) para que o movimento seja instantaneo
4. Reativar a transicao ao soltar o dedo para o snap final ser suave
5. Overlay: mostrar durante o arraste com opacidade proporcional ao progresso (`dragOffset / 280`)
