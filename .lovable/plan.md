

# Melhoria de Estrutura e Design do Modal "Detalhes do Cartao"

## Problemas identificados

1. **Header com gradiente**: o fundo usa `hsl(var(--background))` misturado com a cor do cartao, resultando em contraste inconsistente
2. **Metricas (Limite/Fatura/Disponivel)**: texto pequeno demais no mobile, sem separacao visual clara
3. **Navegacao de mes**: botoes e label muito comprimidos em telas estreitas
4. **Lista de parcelas**: altura fixa de 200px pode ser insuficiente ou excessiva dependendo do dispositivo
5. **Acoes do rodape (Editar/Excluir)**: sem destaque visual, parecem botoes secundarios demais
6. **Busca**: campo de busca ocupa espaco mesmo quando nao ha parcelas
7. **Overflow**: textos longos (como "54.824.042 LUCAS DE BRITO MARQUES") cortam sem indicacao clara

## Melhorias planejadas

### 1. Header redesenhado
- Usar a cor do cartao como faixa superior solida com texto branco para melhor contraste
- Metricas em cards individuais com bordas arredondadas e fundo semi-transparente
- Barra de progresso mais visivel com label de porcentagem

### 2. Metricas responsivas
- Em mobile: grid de 3 colunas com fonte adaptada (`text-xs` no mobile, `text-sm` no desktop)
- Cada metrica com label acima e valor abaixo, alinhamento consistente
- Cores semanticas mais evidentes (destructive para fatura, income para disponivel)

### 3. Area de conteudo otimizada
- Navegacao de mes com botoes maiores no mobile (toque mais facil)
- Campo de busca so aparece quando ha parcelas (condicional)
- Resumo pendente/pago integrado na navegacao de mes para economizar espaco vertical

### 4. Lista de parcelas adaptativa
- Altura dinamica: `max-h-[35vh]` em vez de `h-[200px]` fixo, adaptando-se ao tamanho da tela
- Cada item com padding maior no mobile para facilitar o toque
- Separadores visuais entre itens

### 5. Rodape com acoes claras
- Botoes "Editar" e "Excluir" com icones e estilo mais definido
- Separacao visual mais forte do conteudo acima

## Detalhes Tecnicos

### Arquivo: `src/components/cartoes/DetalhesCartaoDialog.tsx`

**Header (linhas 234-273)**:
- Substituir gradiente por fundo solido usando `cartao.cor` com overlay escuro para garantir legibilidade
- Metricas em mini-cards com `bg-white/15 backdrop-blur` para efeito glassmorphism sobre a cor do cartao
- Progress bar com indicador de porcentagem

**Navegacao (linhas 278-415)**:
- Mover resumo pendente/pago para a mesma linha da navegacao de mes
- Unificar botao "Pagar fatura" no dropdown de acoes (mobile) para liberar espaco
- Touch targets minimos de 44px nos botoes de navegacao mobile

**Lista de parcelas (linhas 464-553)**:
- Trocar `h-[200px]` por `max-h-[35vh] min-h-[120px]` para adaptar ao viewport
- Adicionar `divide-y` para separadores visuais entre itens
- Aumentar padding vertical dos itens no mobile

**Rodape (linhas 570-591)**:
- Botao "Ver todas" com destaque visual (variant outline mantido)
- Acoes Editar/Excluir com `variant="outline"` e `variant="destructive"` respectivamente para clareza

### Sequencia de implementacao
1. Redesenhar o header com cor solida e metricas glassmorphism
2. Otimizar area de navegacao e resumo
3. Ajustar lista de parcelas com altura dinamica e separadores
4. Melhorar rodape com acoes mais claras
5. Testar em viewports de 320px, 375px, 414px e desktop

