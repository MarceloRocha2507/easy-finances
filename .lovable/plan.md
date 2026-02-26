

# Melhorar Responsividade da Tela de Assinaturas no Mobile

## Problemas Identificados (pela screenshot)

1. **Radar alert card**: O texto e o botao "Analisar agora" ficam empilhados de forma desorganizada, o texto quebra palavra por palavra
2. **Detection cards**: Os botoes "Ignorar" e "Adicionar" ficam espremidos ao lado do conteudo, cortados na borda direita
3. **Header**: O botao "Nova Assinatura" pode ficar apertado em telas muito pequenas
4. **Filtros**: Os selects com largura fixa podem nao caber lado a lado
5. **Listagem**: Valor e data ocultos no mobile sem alternativa visual

## Alteracoes

### 1. RadarGastosInvisiveis.tsx

**Alert card**: Mudar layout para empilhar verticalmente no mobile. O icone + texto ficam em uma linha, o botao "Analisar agora" vai para uma linha separada abaixo em telas pequenas:
- Trocar `flex items-center gap-3 flex-wrap` por `flex flex-col sm:flex-row sm:items-center gap-3`
- Botao com `w-full sm:w-auto` no mobile

**Detection cards**: Layout empilhado no mobile. Conteudo em cima, botoes em baixo ocupando largura total:
- Container principal: `flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3`
- Botoes: `flex items-center gap-2 w-full sm:w-auto` com botoes usando `flex-1 sm:flex-initial`
- Metadata (valor medio, ocorrencias, total): layout em coluna no mobile com `flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3`

### 2. Assinaturas.tsx

**Header**: Empilhar no mobile
- `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`
- Botao com `w-full sm:w-auto`

**Filtros**: Selects com largura responsiva
- Trocar larguras fixas por `w-full sm:w-[140px]` etc.
- Grid `grid grid-cols-1 sm:grid-cols-3 gap-3` em vez de `flex flex-wrap`

**Listagem mobile**: Mostrar valor e data abaixo do nome no mobile
- Adicionar uma linha extra visivel apenas no mobile (`sm:hidden`) com valor + data
- Manter a coluna desktop oculta no mobile como ja esta

## Arquivos a modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/assinaturas/RadarGastosInvisiveis.tsx` | Layout empilhado para alert card e detection cards no mobile |
| `src/pages/Assinaturas.tsx` | Header, filtros e listagem responsivos |

