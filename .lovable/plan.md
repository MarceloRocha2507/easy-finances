
# Corrigir Dialog de Detalhes do Cartao Cortado no Mobile

## Problema

O modal "Detalhes do Cartao" (DetalhesCartaoDialog) esta com o conteudo cortado no mobile. Especificamente:
- A linha de metricas "Limite / Fatura / Disponivel" transborda horizontalmente, cortando o valor de "Disponivel"
- O `overflow-hidden` no DialogContent impede que o conteudo seja visivel
- Textos longos de descricao nas parcelas ultrapassam a area visivel

## Mudancas

### Arquivo: `src/components/cartoes/DetalhesCartaoDialog.tsx`

1. **Metricas do header**: Mudar o layout das metricas (Limite/Fatura/Disponivel) de `flex flex-wrap` para um grid `grid grid-cols-3` no mobile, garantindo que os 3 valores caibam sem transbordar. Reduzir o tamanho da fonte dos valores no mobile.

2. **Largura do DialogContent**: Adicionar `w-[calc(100%-2rem)]` para garantir margens laterais de 16px no mobile (seguindo o padrao global de modais do projeto).

3. **Truncar valores longos**: Adicionar `truncate` nos spans de valores monetarios do header para evitar overflow em telas muito pequenas.

## Detalhes Tecnicos

- Linha 234: Adicionar `w-[calc(100%-2rem)]` ao DialogContent
- Linhas 258-271: Trocar o layout de `flex flex-wrap` para `grid grid-cols-3 gap-2` com textos menores e truncados
- Manter `overflow-hidden` no DialogContent pois e necessario para o gradiente do header, mas garantir que o conteudo interno nao ultrapasse os limites
