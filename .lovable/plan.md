

# Plano: Redesign Completo do Dashboard Financeiro

## Visao Geral

Vou implementar uma transformacao visual completa do Dashboard seguindo as diretrizes especificadas, criando uma experiencia moderna e profissional inspirada em apps de fintech.

---

## 1. Cards de Resumo Principal (Saldo, Receitas, Despesas)

### Alteracoes

| Elemento | Antes | Depois |
|----------|-------|--------|
| Tamanho | `text-xl font-semibold` | `text-2xl sm:text-3xl font-bold` |
| Fundo | `border card-hover` | Gradientes sutis + `shadow-lg rounded-xl` |
| Icones | `w-5 h-5` em container 10x10 | `w-6 h-6` em container 12x12 |
| Animacao | `animate-fade-in-up` basica | Entrada refinada com transform |

### Estilos por Card

```text
Saldo Disponivel:
- Gradiente: bg-gradient-to-br from-slate-50 to-slate-100 (light)
            bg-gradient-to-br from-slate-800 to-slate-900 (dark)
- Icone destacado com fundo semi-transparente

Receitas:
- Gradiente: bg-gradient-to-br from-emerald-50 to-green-50 (light)
            bg-gradient-to-br from-emerald-950/50 to-green-950/50 (dark)
- Borda sutil esquerda verde

Despesas:
- Gradiente: bg-gradient-to-br from-rose-50 to-red-50 (light)
            bg-gradient-to-br from-rose-950/50 to-red-950/50 (dark)
- Borda sutil esquerda vermelha
```

---

## 2. Cards Secundarios (A Receber, A Pagar, Fatura, Total)

### Alteracoes

| Elemento | Antes | Depois |
|----------|-------|--------|
| Padding | `p-5` | `p-6` |
| Borda | `border border-{color}-200` | `border-l-4 border-{color}-500` |
| Grid | `md:grid-cols-2 lg:grid-cols-4` | Mantido mas com melhor responsividade |
| Layout | Flexbox basico | Estrutura mais organizada |

### Cores por Status

```text
A Receber (pendente positivo): border-l-blue-500
A Pagar (pendente negativo): border-l-amber-500
Fatura Cartao: border-l-purple-500
Total a Pagar (critico): border-l-red-500
```

---

## 3. Card de Saldo Estimado

### Transformacao para Banner Destacado

| Elemento | Antes | Depois |
|----------|-------|--------|
| Fundo | `bg-primary/5` | Gradiente dark: `from-slate-800 via-slate-700 to-slate-800` |
| Layout | Horizontal basico | Centralizado com icone hero |
| Tipografia | `text-2xl font-bold` | `text-3xl sm:text-4xl font-bold` |
| Tooltip | Nao tem | Tooltip explicativo no icone de info |

### Estrutura

```text
+--------------------------------------------------+
|  [Icone Grande]                                  |
|  Saldo Estimado do Mes      [?] tooltip          |
|  R$ XX.XXX,XX                                    |
|  saldo + receitas - despesas - cartao            |
+--------------------------------------------------+
```

---

## 4. Graficos

### Grafico de Pizza (Despesas por Categoria)

| Elemento | Antes | Depois |
|----------|-------|--------|
| Container | `border card-hover` | `border rounded-xl shadow-sm` |
| Legenda | Labels no grafico | Legenda interativa ao lado |
| Cores | Cores das categorias | Mantido + hover com destaque |
| Altura | `220px` | `280px` para acomodar legenda |

### Grafico de Barras (Receitas vs Despesas)

| Elemento | Antes | Depois |
|----------|-------|--------|
| Cores | HSL fixo | `hsl(var(--income))` e `hsl(var(--expense))` |
| Grid | `strokeDasharray="3 3"` | Grid mais sutil |
| Bordas | `radius={[2, 2, 0, 0]}` | `radius={[4, 4, 0, 0]}` |
| Container | `border card-hover` | `border rounded-xl shadow-sm` |

---

## 5. Sidebar (Layout.tsx)

### Melhorias

| Elemento | Antes | Depois |
|----------|-------|--------|
| Hover | `hover:glass-hover` | Transicao mais suave 300ms |
| Item ativo | `glass text-foreground` | `bg-primary text-primary-foreground` |
| Logo | Simples | Maior destaque com sombra sutil |
| Separadores | `border-t border-border/50` | Mais espaco + label de secao |

### Classes Atualizadas

```text
Item normal: hover:bg-muted/80 transition-all duration-300
Item ativo: bg-primary text-primary-foreground shadow-sm
Logo: text-lg font-bold com icone
```

---

## 6. Header (FiltroPeriodo)

### Melhorias

| Elemento | Antes | Depois |
|----------|-------|--------|
| Seletor mes | Select basico | Dropdown mais elegante com hover |
| Botao refresh | Presente | Mantido com feedback visual melhorado |
| Saudacao | `text-xl font-semibold` | `text-base text-muted-foreground` (menor) |

---

## 7. Novos Arquivos/Componentes

### `src/components/dashboard/StatCardPrimary.tsx` (novo)

Componente reutilizavel para cards principais com:
- Props: titulo, valor, icone, tipo (income/expense/neutral), subinfo
- Gradiente automatico baseado no tipo
- Animacao de entrada

### `src/components/dashboard/StatCardSecondary.tsx` (novo)

Componente para cards secundarios com:
- Props: titulo, valor, icone, status (pending/warning/danger)
- Borda colorida a esquerda
- Estados de hover

### `src/components/dashboard/EstimatedBalanceBanner.tsx` (novo)

Banner destacado para saldo estimado com:
- Tooltip explicativo
- Gradiente dark
- Layout centralizado

### `src/components/dashboard/PieChartWithLegend.tsx` (novo)

Grafico de pizza aprimorado com:
- Legenda interativa lateral
- Hover states
- Responsivo

---

## 8. Alteracoes no index.css

### Novas Classes Utilitarias

```css
/* Gradientes para cards */
.gradient-income {
  @apply bg-gradient-to-br from-emerald-50 to-green-50 
         dark:from-emerald-950/30 dark:to-green-950/30;
}

.gradient-expense {
  @apply bg-gradient-to-br from-rose-50 to-red-50 
         dark:from-rose-950/30 dark:to-red-950/30;
}

.gradient-neutral {
  @apply bg-gradient-to-br from-slate-50 to-gray-100 
         dark:from-slate-800 dark:to-slate-900;
}

.gradient-banner {
  @apply bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800;
}

/* Card com borda esquerda */
.card-status-pending { @apply border-l-4 border-l-blue-500; }
.card-status-warning { @apply border-l-4 border-l-amber-500; }
.card-status-danger { @apply border-l-4 border-l-red-500; }
.card-status-success { @apply border-l-4 border-l-emerald-500; }
```

---

## 9. Resumo de Arquivos a Modificar

| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| `src/pages/Dashboard.tsx` | Refatorar cards principais, secundarios e banner |
| `src/components/Layout.tsx` | Melhorar sidebar (hover, ativo, logo) |
| `src/components/dashboard/FiltroPeriodo.tsx` | Estilizar seletor de mes |
| `src/components/dashboard/CartoesCredito.tsx` | Adicionar rounded-xl |
| `src/components/dashboard/GastosDiarios.tsx` | Atualizar estilos do card |
| `src/components/dashboard/ComparativoMensal.tsx` | Atualizar estilos do card |
| `src/components/dashboard/MetasEconomia.tsx` | Atualizar estilos do card |
| `src/index.css` | Adicionar classes utilitarias de gradiente |

---

## 10. Resultado Visual Esperado

```text
+----------------------------------------------------------+
| Logo destacado                      [Mes] [Refresh]      |
+----------------------------------------------------------+
|                                                          |
| +----------------+ +----------------+ +----------------+ |
| |  SALDO DISP.   | |   RECEITAS     | |   DESPESAS     | |
| |  Gradiente     | | Gradiente      | | Gradiente      | |
| |  R$ 5.000      | | Verde          | | Vermelho       | |
| |  3xl bold      | | R$ 8.000       | | R$ 3.000       | |
| +----------------+ +----------------+ +----------------+ |
|                                                          |
| +----------+ +----------+ +----------+ +----------+      |
| | A Receber| | A Pagar  | | Fatura   | | Total    |      |
| | |azul    | | |amarelo | | |roxo    | | |vermelho|      |
| +----------+ +----------+ +----------+ +----------+      |
|                                                          |
| +------------------------------------------------------+ |
| |          SALDO ESTIMADO DO MES                       | |
| |          Banner gradiente dark                       | |
| |          R$ XX.XXX,XX                                | |
| +------------------------------------------------------+ |
|                                                          |
| +------------------------+ +------------------------+    |
| |    Grafico Pizza      | |   Grafico Barras       |    |
| |    + Legenda lateral  | |   Grid sutil           |    |
| +------------------------+ +------------------------+    |
|                                                          |
+----------------------------------------------------------+
```

---

## 11. Consideracoes Tecnicas

- **Dark Mode**: Todos os gradientes tem variantes dark usando classes Tailwind
- **Responsividade**: Grid adaptativo (1 col mobile, 2 tablet, 3-4 desktop)
- **Animacoes**: Usaremos as animacoes ja existentes (`animate-fade-in-up`) com staggers
- **Skeletons**: Manteremos os skeletons existentes para loading states
- **Tipografia**: Seguiremos a hierarquia proposta (3xl para principais, xl para secundarios)

