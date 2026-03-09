

## Melhorias no LixeiraDialog — Design e Responsividade

### Alterações

**1. Botão trigger (`LixeiraDialog.tsx`)**
- Remover o Badge de contagem do botão
- Manter apenas ícone (mobile) + "Lixeira" (desktop)

**2. Header do modal**
- Título simplificado: apenas "Lixeira" sem contagem entre parênteses
- Botão "Esvaziar" com estilo mais discreto (outline/ghost ao invés de destructive)

**3. Lista de itens — layout responsivo**
- Mobile: layout vertical (descrição + valor em cima, data embaixo, ações à direita compactas)
- Usar `divide-y` ao invés de `space-y-2` + borders individuais para visual mais limpo (padrão premium-list)
- Hover sutil `hover:bg-muted/50` seguindo o padrão existente
- Ações (restaurar/excluir) menores e mais espaçadas no mobile

**4. Empty state**
- Manter como está, já segue o padrão

**5. Responsividade geral**
- `sm:max-w-lg` para desktop, full-width no mobile (já funciona via dialog.tsx)
- Scroll area com padding adequado no mobile

