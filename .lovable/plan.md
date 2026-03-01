

# Corrigir sidebar cortada no mobile

## Problema
A sidebar mobile usa `overflow-hidden` no container, o que impede a rolagem quando o conteudo da navegacao e maior que a area visivel. O `SidebarUserSection` no rodape fica cortado ou invisivel em telas pequenas.

## Solucao

### Arquivo: `src/components/Layout.tsx`

1. **Trocar `overflow-hidden` por estrutura flex adequada** no aside mobile (linha 102):
   - Remover `overflow-hidden` do container
   - O container ja usa `flex flex-col`, entao o `SidebarNav` (que tem `flex-1` e `overflow-y-auto`) vai ocupar o espaco disponivel e rolar internamente
   - O `SidebarUserSection` fica fixo no rodape

2. **Ajustar `top-16` para `top-14`** -- o header mobile tem `h-14` (56px), mas `top-16` e 64px, criando um gap de 8px. Corrigir para `top-14` para alinhar corretamente.

### Resultado esperado
- A navegacao rola internamente quando o conteudo e maior que a tela
- A secao do usuario (avatar, nome, notificacoes) fica sempre visivel no rodape
- Nenhum conteudo e cortado em telas de 320px ate 768px

