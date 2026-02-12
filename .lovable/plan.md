
# Ajustar Layout dos Cartoes para Telas de 320px

## Problemas em 320px

Em telas muito estreitas (320px), varios elementos do dialog de detalhes do cartao e do card de listagem podem ser cortados:

1. **Metricas do header (Limite/Fatura/Disponivel)**: Valores monetarios longos (ex: R$ 10.000,00) podem ser cortados no grid de 3 colunas
2. **Linha de transacao**: O valor com `min-w-[85px]` ocupa muita proporcao da tela de 320px (o dialog tem ~288px uteis), deixando pouco espaco para a descricao
3. **Resumo Pendente/Pago**: Os dois chips + botao "Pagar fatura" podem nao caber em uma unica linha
4. **Navegacao de meses + acoes**: A barra com setas, label do mes e botoes de acao pode ficar apertada
5. **Card do DashboardCartoes**: O resumo de 3 colunas (Total Faturas/Limite Total/Disponivel) pode cortar valores

## Alteracoes

### Arquivo: `src/components/cartoes/DetalhesCartaoDialog.tsx`

**1. Metricas do header (linha 257)**
- Reduzir o texto de `text-[11px]` para `text-[10px]` apenas em telas menores que `sm`
- Garantir que `truncate` funcione nos valores

**2. Valor da transacao (linha 516)**
- Reduzir `min-w-[85px]` para `min-w-[70px]` para dar mais espaco a descricao em 320px
- Usar `text-xs` em vez de `text-sm` no valor para telas pequenas

**3. Resumo Pendente/Pago (linhas 440-461)**
- Trocar `gap-4` por `gap-2` para caber melhor em 320px
- Usar `flex-wrap` para permitir que os chips quebrem linha se necessario
- Esconder texto "Pagar fatura" no botao em telas muito estreitas, mantendo so o icone

**4. Navegacao de meses (linhas 278-414)**
- Reduzir `min-w-[100px]` do label do mes para `min-w-[80px]` para economizar espaco

**5. Botao Nova Compra (linha 410-413)**
- Ja usa `hidden sm:inline` no texto, entao so mostra o icone "+" em mobile - ok

### Arquivo: `src/components/cartoes/DashboardCartoes.tsx`

**6. Resumo de 3 colunas (linhas 134-150)**
- Usar `text-xs` nos valores em telas pequenas para evitar corte
- Adicionar `truncate` nos valores monetarios

**7. Card individual (linhas 65-82)**
- Adicionar `truncate` ao nome do cartao para evitar overflow

## Detalhes Tecnicos

Alteracoes linha a linha:

1. **DetalhesCartaoDialog.tsx, linha 257**: `text-[11px] sm:text-sm` -> `text-[10px] sm:text-sm`
2. **DetalhesCartaoDialog.tsx, linha 288**: `min-w-[100px]` -> `min-w-[80px]`
3. **DetalhesCartaoDialog.tsx, linha 440**: `gap-4` -> `gap-2 flex-wrap`
4. **DetalhesCartaoDialog.tsx, linha 516**: `min-w-[85px]` -> `min-w-[70px]`; adicionar `text-xs sm:text-sm` no span do valor
5. **DashboardCartoes.tsx, linha 135**: `grid-cols-3 gap-4` -> `grid-cols-3 gap-2 sm:gap-4`
6. **DashboardCartoes.tsx, linha 138**: Adicionar `truncate` no `<p>` do valor "Total Faturas"
7. **DashboardCartoes.tsx, linha 143/148**: Idem para "Limite Total" e "Disponivel"
