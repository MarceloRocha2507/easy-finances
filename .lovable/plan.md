
# Plano: Resumir Informações para Mobile em Todo o Sistema

## Objetivo

Simplificar a densidade de informação exibida em dispositivos móveis em **todas as páginas**, mantendo os dados essenciais visíveis e ocultando/condensando informações secundárias que podem cortar na tela ou sobrecarregar a experiência do usuário.

## Estratégia Geral

1. **Criar hook `useIsMobile()`** para detectar mobile (já existe em `src/hooks/use-mobile.tsx`)
2. **Ocultar textos explicativos secundários** em mobile usando `hidden sm:block/inline/flex`
3. **Limitar quantidade de itens** em listas/grids em mobile
4. **Reduzir padding e fontes** em cards compactos
5. **Esconder colunas secundárias** em tabelas
6. **Esconder seções inteiras** que ocupam muito espaço vertical

---

## Alterações Detalhadas por Arquivo

### 1. Dashboard.tsx - Cards Principais e Secundários

**Problema**: subInfo nos cards mostra textos redundantes que ocupam espaço.

**Arquivos**: `src/pages/Dashboard.tsx`

**Alterações (linhas 180-244)**:
- Esconder subInfo de "recebidas" e "pagas" em mobile nos StatCardPrimary
- Simplificar subInfo nos StatCardSecondary

```tsx
// StatCardPrimary - Receitas (linha 186)
subInfo={<p className="text-xs text-muted-foreground hidden sm:block">recebidas</p>}

// StatCardPrimary - Despesas (linha 195)
subInfo={<p className="text-xs text-muted-foreground hidden sm:block">pagas</p>}

// StatCardSecondary - A Receber (linha 207)
subInfo={<span className="hidden sm:inline">pendentes</span>}

// StatCardSecondary - Fatura Cartão (linha 231)
subInfo={<span className="hidden sm:inline">titular do mês</span>}

// StatCardSecondary - Total a Pagar (linha 241)
subInfo={<span className="hidden sm:inline">contas + cartão</span>}
```

### 2. EstimatedBalanceBanner.tsx - Banner Compacto

**Problema**: Banner muito grande ocupa espaço vertical excessivo em mobile.

**Arquivo**: `src/components/dashboard/EstimatedBalanceBanner.tsx`

**Alterações**:
- Reduzir padding `p-4 sm:p-8`
- Reduzir tamanho do ícone e fonte
- Esconder texto explicativo inferior em mobile

```tsx
// Linha 28-30 - Padding responsivo
<CardContent className="p-4 sm:p-8">

// Linha 31-33 - Ícone menor em mobile
<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ...">
  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
</div>

// Linha 43-48 - Fonte menor em mobile
<p className="text-2xl sm:text-3xl sm:text-4xl font-bold ...">

// Linha 50-52 - Esconder fórmula em mobile
<p className="text-xs text-white/50 mt-3 hidden sm:block">
  saldo real + receitas pendentes - despesas pendentes - cartão
</p>
```

### 3. Dashboard.tsx - Seções Comparativo e Gastos

**Problema**: Grid com comparativo e gastos diários ocupa muito espaço vertical.

**Arquivo**: `src/pages/Dashboard.tsx`

**Alterações (linhas 318-326)**:
- Esconder ComparativoMensal em mobile (informação secundária)

```tsx
// Linha 320-322
{dashboardData?.comparativo && (
  <div className="hidden sm:block">
    <ComparativoMensal comparativo={dashboardData.comparativo} />
  </div>
)}
```

### 4. CartoesCredito.tsx - Limitar Cartões Visíveis

**Problema**: Grid de cartões pode ficar muito longo em mobile.

**Arquivo**: `src/components/dashboard/CartoesCredito.tsx`

**Alterações**:
- Adicionar import do `useIsMobile`
- Limitar a 2 cartões em mobile, mostrar "Ver todos"
- Compactar resumo superior

```tsx
// Linha 1 - Adicionar import
import { useIsMobile } from "@/hooks/use-mobile";

// Linha 118 - Hook
const isMobile = useIsMobile();

// Linha 130 - Resumo compacto
<div className="flex flex-wrap sm:grid sm:grid-cols-3 gap-2 sm:gap-4 mb-4 p-2 sm:p-3 rounded-md bg-secondary/50">
  <div className="text-center flex-1 min-w-[80px]">
    <p className="text-[10px] sm:text-xs text-muted-foreground">Faturas</p>
    <p className="text-xs sm:text-sm font-medium text-expense truncate">
      {formatCurrency(resumo.totalPendente)}
    </p>
  </div>
  ...
</div>

// Linha 165-173 - Limitar cartões em mobile
const cartoesVisiveis = isMobile ? cartoes.slice(0, 2) : cartoes;

{cartoesVisiveis.map((cartao) => (...))}

{isMobile && cartoes.length > 2 && (
  <Button variant="ghost" size="sm" className="w-full mt-2">
    Ver todos ({cartoes.length} cartões)
  </Button>
)}
```

### 5. ProximasFaturas.tsx e UltimasCompras.tsx - Limitar Itens

**Problema**: Muitos itens em mobile ocupam espaço.

**Arquivos**: `src/components/dashboard/ProximasFaturas.tsx`, `src/components/dashboard/UltimasCompras.tsx`

**Alterações**:
- Limitar a 3 itens em mobile (atualmente 4)
- Usar `useIsMobile` hook

```tsx
// ProximasFaturas.tsx - Linha 52-56
import { useIsMobile } from "@/hooks/use-mobile";

const isMobile = useIsMobile();
const limite = isMobile ? 3 : 4;
{faturasPendentes.slice(0, limite).map(...))}
```

```tsx
// UltimasCompras.tsx - Similar
import { useIsMobile } from "@/hooks/use-mobile";

const isMobile = useIsMobile();
const limite = isMobile ? 3 : 5;
{compras.slice(0, limite).map(...)}
```

### 6. MetasEconomia.tsx - Esconder Detalhes em Mobile

**Problema**: "X dias restantes" e "Faltam R$" ocupam espaço.

**Arquivo**: `src/components/dashboard/MetasEconomia.tsx`

**Alterações (linhas 82-87, 108-114)**:
- Esconder "dias restantes" em mobile
- Simplificar valores de meta

```tsx
// Linha 82-87 - Esconder dias restantes em mobile
{diasRestantes !== null && diasRestantes > 0 && !concluida && (
  <p className="text-xs text-muted-foreground flex items-center gap-1 hidden sm:flex">
    <Calendar className="h-3 w-3" />
    {diasRestantes} dias restantes
  </p>
)}

// Linha 113-115 - Esconder "Faltam X" em mobile
{!concluida && (
  <span className="hidden sm:inline">Faltam {formatCurrency(faltando)}</span>
)}
```

### 7. Transactions.tsx - Grid de Indicadores

**Problema**: Labels secundários ("recebidas", "pagas") cortando em mobile.

**Arquivo**: `src/pages/Transactions.tsx`

**Já corrigido parcialmente** - Verificar e reforçar:

```tsx
// Linhas onde existem labels secundários - esconder em mobile
<span className="text-[10px] text-muted-foreground hidden sm:block">recebidas</span>
<span className="text-[10px] text-muted-foreground hidden sm:block">pagas</span>
```

### 8. Investimentos.tsx - Cards Compactos

**Problema**: 4 cards de resumo ocupam espaço considerável.

**Arquivo**: `src/pages/Investimentos.tsx`

**Alterações (linhas 94-192)**:
- Reduzir padding e fonte dos cards de resumo
- Esconder ícones em mobile

```tsx
// Linha 98 - Padding responsivo
<CardContent className="p-4 sm:p-6">
  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ...">
      <Wallet className="h-5 w-5 sm:h-6 sm:w-6 ..." />
    </div>
  </div>
  <p className="text-xs sm:text-sm text-muted-foreground font-medium">Patrimônio total</p>
  <p className="text-xl sm:text-2xl sm:text-3xl font-bold mt-0.5 sm:mt-1 truncate">
    {formatCurrency(totais.patrimonio)}
  </p>
</CardContent>
```

### 9. InvestimentoCard.tsx - Card Compacto

**Problema**: Muita informação no card de investimento.

**Arquivo**: `src/components/investimentos/InvestimentoCard.tsx`

**Alterações**:
- Esconder informações adicionais (rentabilidade, dias vencimento) em mobile
- Compactar botões

```tsx
// Linha 125-143 - Esconder info adicional em mobile
<div className="items-center gap-4 mt-3 text-xs text-muted-foreground hidden sm:flex">
  {investimento.rentabilidadeAnual && (
    <span className="flex items-center gap-1">
      <TrendingUp className="h-3 w-3" />
      {investimento.rentabilidadeAnual}% a.a.
    </span>
  )}
  ...
</div>

// Linha 147-172 - Botões compactos em mobile
<div className="flex gap-2 mt-3 sm:mt-4">
  <Button size="sm" variant="outline" className="flex-1 text-xs sm:text-sm">
    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
    <span className="hidden sm:inline">Aportar</span>
    <span className="sm:hidden">+</span>
  </Button>
  ...
</div>
```

### 10. Metas.tsx - Cards de Stats Compactos

**Problema**: 4 cards de resumo com valores grandes.

**Arquivo**: `src/pages/Metas.tsx`

**Alterações (linhas 92-142)**:
- Aplicar mesmo padrão de padding/fonte responsiva

```tsx
// Linha 94, 117, etc. - Padding responsivo
<CardContent className="p-4 sm:p-6">
  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ...">
```

### 11. Bancos.tsx - Resumo Geral Compacto

**Problema**: Resumo geral com muitas informações.

**Arquivo**: `src/pages/Bancos.tsx`

**Alterações (linhas 115-152)**:
- Esconder ícones em mobile
- Compactar grid de stats

```tsx
// Linha 124 - Grid responsivo 2 colunas em mobile
<div className="grid grid-cols-2 gap-2 sm:gap-4">
  <div className="text-center">
    <div className="w-8 h-8 sm:w-10 sm:h-10 ... hidden sm:flex mx-auto mb-2">
      <Wallet className="h-4 w-4 sm:h-5 sm:w-5 ..." />
    </div>
    <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Contas</p>
    <span className="text-lg sm:text-xl font-bold">{bancosResumo.length}</span>
  </div>
  ...
</div>
```

### 12. BancoCard.tsx - Card Compacto

**Problema**: Muita informação no card de banco.

**Arquivo**: `src/components/bancos/BancoCard.tsx`

**Alterações**:
- Esconder informação de agência/conta em mobile
- Compactar grid de cartões

```tsx
// Linha 79-91 - Grid compacto
<div className="grid grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-3">
  <div>
    <p className="text-[10px] sm:text-xs text-muted-foreground">Cartões</p>
    ...
  </div>
</div>

// Linha 132-137 - Esconder agência/conta em mobile
{(banco.agencia || banco.conta) && (
  <div className="hidden sm:flex mt-3 pt-3 border-t items-center gap-4 text-xs text-muted-foreground">
    {banco.agencia && <span>Ag: {banco.agencia}</span>}
    {banco.conta && <span>Conta: {banco.conta}</span>}
  </div>
)}
```

### 13. Economia.tsx - Tab de Dicas Compacta

**Problema**: Dicas de economia ocupam muito espaço.

**Arquivo**: `src/pages/Economia.tsx`

**Alterações (linhas 196-221, 232-280)**:
- Mostrar apenas 2 dicas em mobile (atualmente 4)
- Esconder seção de "Princípios" em mobile

```tsx
// Linha 202-219 - Limitar dicas em mobile
const isMobile = useIsMobile();

<div className="grid sm:grid-cols-2 gap-2 sm:gap-3 text-sm text-muted-foreground">
  {/* Mostrar apenas 2 primeiras em mobile */}
  <p className="...">Regra 50/30/20...</p>
  <p className="...">Comece pequeno...</p>
  <p className="hidden sm:block ...">Seja realista...</p>
  <p className="hidden sm:block ...">Revise mensalmente...</p>
</div>

// Linha 233-282 - Esconder princípios em mobile
<Card className="mt-6 shadow-sm rounded-xl hidden sm:block">
  ...princípios para economizar...
</Card>
```

### 14. DespesasFuturas.tsx - Resumo por Cartão Compacto

**Problema**: Muitos chips de cartão ocupando espaço (já corrigido parcialmente).

**Arquivo**: `src/pages/DespesasFuturas.tsx`

**Reforçar limitação**:
- Usar `useIsMobile` para limitar a 4 cartões em mobile

```tsx
const cartoesVisiveis = isMobile ? resumoPorCartao.slice(0, 4) : resumoPorCartao;

{cartoesVisiveis.map(...)}
{isMobile && resumoPorCartao.length > 4 && (
  <span className="text-xs text-muted-foreground self-center">
    +{resumoPorCartao.length - 4}
  </span>
)}
```

---

## Resumo das Alterações

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/pages/Dashboard.tsx` | Esconder subInfo, ocultar ComparativoMensal |
| `src/components/dashboard/EstimatedBalanceBanner.tsx` | Padding/fonte menores, esconder fórmula |
| `src/components/dashboard/CartoesCredito.tsx` | Limitar 2 cartões, resumo compacto |
| `src/components/dashboard/ProximasFaturas.tsx` | Limitar 3 faturas |
| `src/components/dashboard/UltimasCompras.tsx` | Limitar 3 compras |
| `src/components/dashboard/MetasEconomia.tsx` | Esconder dias restantes, "Faltam X" |
| `src/pages/Investimentos.tsx` | Cards compactos |
| `src/components/investimentos/InvestimentoCard.tsx` | Esconder info extra, botões compactos |
| `src/pages/Metas.tsx` | Cards compactos |
| `src/pages/Bancos.tsx` | Resumo compacto, esconder ícones |
| `src/components/bancos/BancoCard.tsx` | Esconder agência/conta |
| `src/pages/Economia.tsx` | Limitar dicas, esconder princípios |
| `src/pages/DespesasFuturas.tsx` | Limitar chips de cartão |

## Padrões Aplicados em Todo o Sistema

1. **`hidden sm:block/inline/flex`**: Esconder em mobile, mostrar em sm+
2. **`slice(0, n)`**: Limitar quantidade de itens visíveis
3. **`text-xs sm:text-sm`**: Texto adaptativo
4. **`p-3 sm:p-6` / `p-4 sm:p-6`**: Padding responsivo em cards
5. **`w-10 h-10 sm:w-12 sm:h-12`**: Ícones menores em mobile
6. **`truncate`**: Evitar overflow de valores monetários
7. **`useIsMobile()`**: Hook para lógica condicional em JavaScript

## Benefícios

- **Menos scroll vertical**: Seções compactadas
- **Informação priorizada**: Apenas dados essenciais em mobile
- **Sem cortes de texto**: Valores monetários com truncate
- **UX melhorada**: Interface mais limpa e focada
- **Performance**: Menos elementos renderizados

## Testes Recomendados

- Verificar todas as páginas em viewport 375px (iPhone SE)
- Confirmar legibilidade de valores monetários
- Testar botões "Ver todos" onde aplicável
- Validar que informações essenciais permanecem visíveis
- Testar rotação de tela (landscape)
