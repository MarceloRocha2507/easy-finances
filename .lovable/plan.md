

# Redesign do Modal DetalhesCartaoDialog

## Objetivo

Criar um design mais moderno, limpo e visualmente atraente para o modal de detalhes do cartao, mantendo toda a funcionalidade existente.

## Mudancas propostas

### 1. Cabecalho redesenhado
- Valor da fatura como destaque principal centralizado (tipografia grande e bold)
- Nome do cartao e bandeira como informacao secundaria acima do valor
- Icone do cartao em um circulo maior e mais elegante

### 2. Metricas em layout horizontal simplificado
- Substituir os 3 cards com borda por um layout mais leve
- Limite e Disponivel como texto inline abaixo do valor principal
- Barra de progresso mais estilizada com cores semanticas (verde/amarelo/vermelho baseado no percentual)

### 3. Navegacao de mes redesenhada
- Mover para dentro do cabecalho como seletor compacto
- Botoes de acao agrupados de forma mais organizada

### 4. Resumo Pendente/Pago aprimorado
- Cards lado a lado com icones e cores mais distintas
- Visual mais profissional com bordas sutis

### 5. Botoes de acao do rodape
- "Ver despesas" como botao principal (destaque)
- "Editar" e "Excluir" como botoes secundarios menores

## Detalhes tecnicos

### Arquivo: `src/components/cartoes/DetalhesCartaoDialog.tsx`

**Cabecalho (substituir linhas 209-250)**:
- Fundo `bg-muted` mantido conforme design system
- Nome do cartao + badge da bandeira na primeira linha
- Valor da fatura centralizado em tipografia `text-2xl font-bold`
- Texto "Fatura de [mes]" como subtitulo em `text-muted-foreground`
- Linha horizontal com Limite a esquerda e Disponivel a direita
- Barra de progresso com cor dinamica baseada no percentual:
  - Verde (`text-income`) quando < 60%
  - Amarelo quando 60-85%  
  - Vermelho (`text-destructive`) quando > 85%

**Navegacao de mes (substituir linhas 254-401)**:
- Seletor de mes mais compacto com fundo `bg-muted/50 rounded-full`
- No mobile: manter dropdown de acoes (MoreVertical)
- No desktop: manter tooltips nos icones de acao
- Botao "+ Compra" mantido

**Resumo Pendente/Pago (substituir linhas 403-428)**:
- Dois mini-cards lado a lado com `grid grid-cols-2 gap-3`
- Card Pendente: icone de relogio, fundo sutil `bg-destructive/5`, borda `border-destructive/20`
- Card Pago: icone de check, fundo sutil `bg-income/5`, borda `border-income/20`
- Botao "Pagar fatura" integrado abaixo quando houver pendencias

**Botao Ver Despesas (manter mas melhorar)**:
- Variante `default` ao inves de `outline` para dar mais destaque
- Texto mais convidativo

**Rodape (substituir linhas 446-468)**:
- "Editar cartao" e "Excluir" como botoes `ghost` e `ghost text-destructive` respectivamente
- Tamanho menor, mais discretos

### Arquivo modificado
- `src/components/cartoes/DetalhesCartaoDialog.tsx`

