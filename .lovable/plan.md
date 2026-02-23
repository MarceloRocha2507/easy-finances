

# Revisao Completa e Padronizacao Visual do Sistema

## Diagnostico

Apos analise detalhada de todas as paginas e componentes, identifiquei as seguintes inconsistencias:

### 1. Cards de Resumo - 4 padroes diferentes

| Pagina | Padrao Usado |
|--------|-------------|
| Dashboard | `StatCardPrimary` + `StatCardSecondary` (padrao de referencia) |
| Transactions | Cards inline manuais com divs coloridas (sem componente reutilizavel) |
| Reports | `StatCardPrimary` (OK) |
| Economia | Cards manuais com `gradient-*` classes (similar mas nao identico) |
| Investimentos | Cards manuais misturando `gradient-*` + `border-l-4` |
| Metas | Cards manuais misturando `gradient-*` + `border-l-4` |
| Bancos | Card manual unico com `gradient-neutral` |
| DespesasFuturas | Cards basicos `Card/CardHeader/CardContent` sem estilizacao |

### 2. Filtros de Periodo - 2 componentes diferentes

- `FiltroPeriodo` (Dashboard, Economia): Select dropdown com setas e botao "Hoje"
- `FiltroDataRange` (Transactions, Reports): Date pickers com seletor de mes inline

Nao ha padrao unico; cada um tem estilo e comportamento distintos.

### 3. Graficos - Inconsistencias de estilo

- Dashboard usa `hsl(var(--income))` e `hsl(var(--expense))` para cores das barras
- Reports usa cores hardcoded `hsl(142 76% 36%)` e `hsl(0 84% 60%)`
- Tooltips tem estruturas ligeiramente diferentes entre Dashboard e Reports
- Dashboard usa `CartesianGrid stroke="hsl(var(--border))"` vs Reports usa `className="stroke-border"`

### 4. Estados Vazios - Inconsistentes

- Metas: `Target` icon + texto + botao
- Investimentos: `PiggyBank` icon + texto + botao
- Cartoes: `CreditCard` icon + texto (sem botao)
- Bancos: `Building2` icon + titulo + texto + botao
- DespesasFuturas: sem estado vazio dedicado

### 5. Headers de Pagina

A maioria segue `text-xl font-semibold`, mas `DespesasFuturas` inclui um icone no titulo, quebrando o padrao.

---

## Plano de Implementacao

### Fase 1: Design Tokens Centralizados

Criar arquivo `src/lib/design-tokens.ts` com constantes reutilizaveis:

```text
Tokens para:
- Cores semanticas por status (income, expense, pending, warning, etc.)
- Tamanhos padrao de cards, icones, fontes
- Classes padrao para gradientes, bordas, sombras
- Configuracoes de graficos (cores, fontes, tooltips)
```

### Fase 2: Padronizar Cards de Resumo

**Transacoes (maior mudanca):** Substituir os 6 mini-cards inline por `StatCardPrimary` (Receitas, Despesas) e `StatCardSecondary` (A Receber, A Pagar, Saldo Real, Estimado), usando os mesmos componentes do Dashboard.

**Economia (`ResumoEconomia`):** Refatorar para usar `StatCardPrimary` + `StatCardSecondary` ao inves de cards manuais.

**Investimentos:** Refatorar os 4 cards para usar `StatCardPrimary` (Patrimonio, Rendimento) e `StatCardSecondary` (Total investido, Rentabilidade).

**Metas:** Refatorar os 4 cards para usar `StatCardPrimary` (Total, Concluidos) e `StatCardSecondary` (Em andamento, Valor acumulado).

**DespesasFuturas:** Refatorar os 3 cards basicos para usar `StatCardSecondary` com status semanticos (danger para total, warning para proximos 30d, info para quantidade).

**Bancos:** Manter card unico de resumo geral pois tem layout especifico, mas padronizar rounded-xl e shadow.

### Fase 3: Padronizar Graficos

**Reports (`src/pages/Reports.tsx`):**
- Substituir cores hardcoded das barras por `hsl(var(--income))` e `hsl(var(--expense))`
- Usar `stroke="hsl(var(--border))"` na CartesianGrid (consistente com Dashboard)
- Padronizar formatacao do YAxis com a funcao `formatYAxis` do Dashboard
- Unificar o componente de Tooltip customizado

### Fase 4: Padronizar Estados Vazios

Criar componente reutilizavel `EmptyState` em `src/components/ui/empty-state.tsx`:

```text
Props:
- icon: LucideIcon
- title?: string
- message: string
- action?: { label: string, onClick: () => void }
```

Substituir todos os estados vazios manuais pelo componente padronizado em: Metas, Investimentos, Cartoes, Bancos, Transacoes, DespesasFuturas.

### Fase 5: Padronizar Headers

Todas as paginas devem seguir:

```text
<h1 className="text-xl font-semibold text-foreground">Titulo</h1>
<p className="text-sm text-muted-foreground">Subtitulo</p>
```

Corrigir `DespesasFuturas` removendo o icone do h1 (icones ficam nos cards, nao nos titulos).

### Fase 6: Padronizar Skeletons de Loading

Todas as paginas devem usar `Skeleton` com `rounded-xl` e alturas consistentes:
- Cards de resumo: `h-28 rounded-xl`
- Graficos: `h-[300px] rounded-xl`
- Listas: `h-16 rounded-xl` (repetido 3-5x)

---

## Detalhes Tecnicos

### Arquivos a Criar
1. `src/lib/design-tokens.ts` - Tokens centralizados
2. `src/components/ui/empty-state.tsx` - Componente de estado vazio

### Arquivos a Modificar
1. `src/pages/Transactions.tsx` - Cards de resumo com StatCardPrimary/Secondary
2. `src/pages/Reports.tsx` - Cores dos graficos, tooltips padronizados
3. `src/pages/DespesasFuturas.tsx` - Cards com StatCardSecondary, header, empty state
4. `src/pages/Investimentos.tsx` - Cards com StatCardPrimary/Secondary
5. `src/pages/Metas.tsx` - Cards com StatCardPrimary/Secondary
6. `src/components/economia/Resumoeconomia.tsx` - Cards com StatCardPrimary/Secondary
7. `src/components/dashboard/StatCardSecondary.tsx` - Adicionar status "success" para saldo positivo
8. `src/pages/Cartoes.tsx` - Empty state padronizado
9. `src/pages/Bancos.tsx` - Empty state padronizado
10. `src/pages/Categories.tsx` - Empty state padronizado (se aplicavel)

### Semantica de Cores Padronizada

| Status | Cor | Uso |
|--------|-----|-----|
| income/success | Emerald/Green | Receitas, saldo positivo, concluidos |
| expense/danger | Rose/Red | Despesas, saldo negativo, vencidos |
| pending | Blue | A receber, pendentes positivos |
| warning | Amber | A pagar, pendentes negativos, atencao |
| info | Purple | Informativos, cartao, investimentos |
| neutral | Slate | Saldo, totais sem polaridade |

### Componentes Primarios vs Secundarios

- **StatCardPrimary**: Para metricas principais (Saldo, Receitas, Despesas, Patrimonio). Usa gradientes, shadow-lg, border-0, texto grande (2xl-3xl).
- **StatCardSecondary**: Para metricas secundarias (Pendentes, Comparativos, Detalhes). Usa border-l-4 colorida, shadow-sm, texto menor (xl).

Essa divisao ja existe no Dashboard e sera replicada para todos os modulos.
