

# Redesign: Cards de Resumo com visual premium e minimalista

## Objetivo

Substituir o visual atual dos 6 cards de resumo na pagina de Transacoes (gradientes, bordas coloridas laterais, fundos pasteis) por um design limpo e moderno inspirado em apps como Notion e Linear.

## Abordagem

Criar um **novo componente unificado** `StatCardMinimal` que substitui tanto `StatCardPrimary` quanto `StatCardSecondary` na pagina de Transacoes. Os componentes originais continuam existindo para uso no Dashboard.

## Especificacoes visuais

- **Fundo**: branco / `#F8F8F8` (sem gradientes, sem fundos coloridos)
- **Borda**: 1px solid `#E5E7EB` (uniforme, sem borda lateral colorida)
- **Border-radius**: 10px
- **Box-shadow**: `0 1px 3px rgba(0,0,0,0.07)`
- **Padding**: 16px
- **Icone**: pequeno (16x16), canto superior direito, opacidade baixa (~30%)
- **Valor**: bold, grande (`text-xl`), cor semantica apenas no texto:
  - Positivo: `#16A34A`
  - Negativo: `#DC2626`
  - Neutro: foreground padrao
- **Label**: `#6B7280`, texto pequeno, abaixo ou acima do valor
- **SubInfo**: mantido como texto muted discreto

## Alteracoes

### 1. Novo arquivo: `src/components/dashboard/StatCardMinimal.tsx`

Componente unificado com props:
```text
title: string
value: number
icon: LucideIcon
prefix?: string ("+", "-")
subInfo?: ReactNode
delay?: number
onClick?: () => void
isLoading?: boolean
formatValue?: (v: number) => string
```

Logica de cor do valor:
- Se tem prefix "-": valor exibido em vermelho `#DC2626`
- Se tem prefix "+": valor exibido em verde `#16A34A`
- Sem prefix: verde se >= 0, vermelho se < 0

### 2. Atualizar `src/components/dashboard/index.ts`

Exportar o novo `StatCardMinimal`.

### 3. Atualizar `src/pages/Transactions.tsx`

Substituir os 6 cards (2x StatCardPrimary + 4x StatCardSecondary) por 6x `StatCardMinimal`:

```text
Grid: grid-cols-2 lg:grid-cols-3 gap-3

1. Receitas    - prefix: nenhum, valor positivo = verde
2. Despesas    - prefix: nenhum, valor = vermelho (sempre negativo)
3. A Receber   - prefix: "+"
4. A Pagar     - prefix: "-"
5. Saldo Real  - sem prefix, cor dinamica
6. Estimado    - sem prefix, cor dinamica
```

### Resultado

- 6 cards uniformes, limpos, sem gradientes ou bordas coloridas
- Tipografia carrega o peso visual (valores grandes e bold, labels discretos)
- Icones sutis no canto superior direito
- Aparencia moderna e premium tipo Notion/Linear
- Dashboard continua usando os componentes antigos sem alteracao

