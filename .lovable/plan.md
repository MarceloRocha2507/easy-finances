

# Unificar todos os cards do sistema com o design StatCardMinimal

## Objetivo

Substituir todas as instancias de `StatCardPrimary` e `StatCardSecondary` em todas as paginas por `StatCardMinimal`, aplicando o visual premium e minimalista (fundo branco, borda fina, tipografia como peso visual, icone sutil) de forma consistente em todo o sistema.

## Paginas afetadas

1. **Dashboard** (`src/pages/Dashboard.tsx`) - 3x StatCardPrimary + 4x StatCardSecondary
2. **Investimentos** (`src/pages/Investimentos.tsx`) - 2x StatCardPrimary + 2x StatCardSecondary
3. **Metas** (`src/pages/Metas.tsx`) - 2x StatCardPrimary + 2x StatCardSecondary
4. **Relatorios** (`src/pages/Reports.tsx`) - 3x StatCardPrimary
5. **Relatorio Categorias** (`src/pages/reports/RelatorioCategorias.tsx`) - 1x StatCardPrimary + 2x StatCardSecondary
6. **Despesas Futuras** (`src/pages/DespesasFuturas.tsx`) - 3x StatCardSecondary

## Alteracoes

### 1. Atualizar `StatCardMinimal` para suportar `actions`

O card de "Saldo Disponivel" no Dashboard usa uma prop `actions` (botao de editar). Adicionar essa prop ao `StatCardMinimal`:

```typescript
interface StatCardMinimalProps {
  // ... props existentes
  actions?: ReactNode;
}
```

Renderizar o `actions` ao lado do icone no canto superior direito.

### 2. Dashboard (`src/pages/Dashboard.tsx`)

- Substituir imports de `StatCardPrimary`/`StatCardSecondary` por `StatCardMinimal`
- Converter os 7 cards para `StatCardMinimal`:
  - **Saldo Disponivel**: sem prefix, cor dinamica, com actions (botao editar) e subInfo
  - **Receitas**: sem prefix, valor positivo = verde
  - **Despesas**: prefix "-", valor vermelho
  - **A Receber**: prefix "+"
  - **A Pagar**: prefix "-", com subInfo de vencidas
  - **Fatura Cartao**: prefix "-"
  - **Total a Pagar**: prefix "-", com onClick
- Unificar o grid em uma unica secao (grid-cols-2 lg:grid-cols-4 ou manter 3+4)

### 3. Investimentos (`src/pages/Investimentos.tsx`)

Converter os 4 cards:
- **Patrimonio total**: sem prefix, cor dinamica
- **Total investido**: sem prefix
- **Rendimento total**: sem prefix, cor dinamica baseada no valor
- **Rentabilidade**: formatValue customizado para percentual

### 4. Metas (`src/pages/Metas.tsx`)

Converter os 4 cards:
- **Total**: formatValue para numero inteiro
- **Em andamento**: formatValue para numero inteiro
- **Concluidos**: formatValue para numero inteiro
- **Valor acumulado**: valor monetario padrao

### 5. Relatorios (`src/pages/Reports.tsx`)

Converter os 3 cards:
- **Resultado do Periodo**: cor dinamica
- **Total de Receitas**: positivo
- **Total de Despesas**: prefix "-"

### 6. Relatorio Categorias (`src/pages/reports/RelatorioCategorias.tsx`)

Converter os 3 cards:
- **Total de Despesas**: prefix "-", com subInfo comparativo
- **Categorias Ativas**: formatValue para numero inteiro
- **Maior Categoria**: com subInfo do nome

### 7. Despesas Futuras (`src/pages/DespesasFuturas.tsx`)

Converter os 3 cards:
- **Total no Periodo**: prefix "-"
- **Proximos 30 dias**: prefix "-"
- **Qtd. Despesas**: formatValue para numero inteiro

## Resultado

- Visual uniforme em todas as paginas do sistema
- Todos os cards com fundo branco limpo, borda fina, tipografia bold
- Icones sutis no canto superior direito com 30% de opacidade
- Cores semanticas apenas no texto dos valores
- Componentes `StatCardPrimary` e `StatCardSecondary` podem ser removidos ou mantidos como legado
