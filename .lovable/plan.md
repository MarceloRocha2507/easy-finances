
# Plano: Aplicar Estilos de Cards do Dashboard em Todo o Sistema

## Visao Geral

Vou propagar os estilos visuais dos cards do Dashboard (`StatCardPrimary`, `StatCardSecondary`) para todas as outras paginas e componentes do sistema, garantindo consistencia visual em toda a aplicacao.

---

## Componentes de Referencia (Dashboard)

### StatCardPrimary
- Gradientes por tipo: `income`, `expense`, `neutral`
- `shadow-lg rounded-xl border-0`
- Padding: `p-6`
- Valores: `text-2xl sm:text-3xl font-bold`
- Icones: container `w-12 h-12 rounded-xl`
- Animacao: `animate-fade-in-up` com delay

### StatCardSecondary
- Borda colorida esquerda: `border-l-4 border-l-{color}-500`
- `shadow-sm rounded-xl`
- Padding: `p-6`
- Valores: `text-xl font-semibold`
- Icones: container `w-10 h-10 rounded-lg`

---

## Arquivos e Alteracoes

### 1. `src/components/economia/Resumoeconomia.tsx`

**Situacao Atual**: Cards simples com `Card` + `CardContent pt-4 pb-4`

**Alteracoes**:
- Aplicar gradientes por tipo (Receitas = income, Gastos = expense)
- Adicionar `shadow-lg rounded-xl` nos cards principais
- Icones com containers coloridos
- Tipografia maior para valores

```text
Receitas: gradient-income + icone TrendingUp
Gastos: gradient-expense + icone TrendingDown  
Economizado: gradient-income/expense conforme valor
Comparativo: neutral com border-l colorido
```

### 2. `src/pages/Metas.tsx`

**Situacao Atual**: Cards com `border card-hover` e valores `text-2xl`

**Alteracoes**:
- Cards de stats (Total, Em andamento, Concluidos, Valor acumulado): usar padroes do Dashboard
- Adicionar icones com containers coloridos (Target, Clock, Check, Wallet)
- Adicionar bordas coloridas a esquerda baseado no status
- Gradientes sutis nos cards de stats

```text
Total: neutral + icone Target
Em andamento: warning (amber) + icone Clock
Concluidos: income (green) + icone Check
Valor acumulado: info (purple) + icone Wallet
```

### 3. `src/pages/Investimentos.tsx`

**Situacao Atual**: Cards com `bg-card border rounded-xl p-5 card-hover`

**Alteracoes**:
- Cards de resumo: aplicar gradientes e shadows
- Patrimonio total: neutral gradient
- Total investido: info (blue) border-l
- Rendimento total: income/expense conforme valor
- Rentabilidade: info (purple) border-l
- Aumentar containers de icones para `w-12 h-12 rounded-xl`

### 4. `src/components/investimentos/InvestimentoCard.tsx`

**Situacao Atual**: Card simples com `hover:shadow-lg`

**Alteracoes**:
- Adicionar `rounded-xl shadow-sm`
- Melhorar container do icone para `rounded-xl` (ja tem `rounded-xl`)
- Valor atual em `text-2xl font-bold`
- Adicionar borda colorida sutil baseada no rendimento (positivo=verde, negativo=vermelho)

### 5. `src/pages/Bancos.tsx`

**Situacao Atual**: Card de resumo com `border mb-6`, texto `text-3xl font-bold`

**Alteracoes**:
- Card de resumo geral: usar `gradient-neutral shadow-lg rounded-xl`
- Manter o destaque do saldo total
- Adicionar icones com containers coloridos nos stats do grid

### 6. `src/components/bancos/BancoCard.tsx`

**Situacao Atual**: Card com `border card-hover`

**Alteracoes**:
- Adicionar `shadow-sm rounded-xl`
- Melhorar a area de saldo com gradiente sutil
- Icone do banco em container `rounded-xl`

### 7. `src/pages/Cartoes.tsx`

**Situacao Atual**: Card de previsao com `card-hover`, CartaoCard com header colorido

**Alteracoes**:
- Card de Previsao de Faturas: `shadow-lg rounded-xl`
- Melhorar grid de meses com gradientes sutis

### 8. `src/pages/Admin.tsx`

**Situacao Atual**: Cards com `card-hover animate-fade-in-up`

**Alteracoes**:
- Aplicar gradientes por tipo de stat
- Total: neutral
- Admins: warning (amber)
- Ativos: income (green)  
- Inativos: danger (red)
- Expirando: warning (amber)
- Adicionar `shadow-lg rounded-xl`

### 9. `src/components/economia/Rankinggastos.tsx`

**Situacao Atual**: Card simples

**Alteracoes**:
- Adicionar `shadow-sm rounded-xl` ao container
- Manter layout interno

### 10. `src/components/economia/Insightseconomia.tsx`

**Situacao Atual**: Card simples

**Alteracoes**:
- Adicionar `shadow-sm rounded-xl`
- Cards de insight individuais: melhorar borders

### 11. `src/pages/Economia.tsx`

**Situacao Atual**: Cards simples em varias secoes

**Alteracoes**:
- Card de grafico pizza: `shadow-sm rounded-xl`
- Card de previsao: `shadow-sm rounded-xl` com gradiente sutil
- Cards de dicas: `shadow-sm rounded-xl`

### 12. `src/components/profile/EstatisticasTab.tsx`

**Situacao Atual**: Cards com estilos mistos

**Alteracoes**:
- Aplicar `shadow-sm rounded-xl` uniformemente
- Icones em containers coloridos

### 13. `src/components/profile/PerfilTab.tsx`, `SegurancaTab.tsx`, `PreferenciasTab.tsx`

**Alteracoes**:
- Todos os cards de configuracao: `shadow-sm rounded-xl`

---

## Classes Utilitarias a Reutilizar

Ja existem em `index.css`:
```css
.gradient-income { ... from-emerald-50 to-green-50 ... }
.gradient-expense { ... from-rose-50 to-red-50 ... }
.gradient-neutral { ... from-slate-50 to-gray-100 ... }
```

---

## Resumo de Padronizacao

| Tipo de Card | Gradiente | Border-L | Shadow | Corners | Padding |
|--------------|-----------|----------|--------|---------|---------|
| Stat Principal | Sim (por tipo) | Opcional | shadow-lg | rounded-xl | p-6 |
| Stat Secundario | Nao | Sim (4px) | shadow-sm | rounded-xl | p-6 |
| Card de Conteudo | Nao | Nao | shadow-sm | rounded-xl | p-5/p-6 |
| Card Destacado | Especial | Nao | shadow-lg | rounded-xl | p-6+ |

---

## Arquivos a Modificar

| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| `src/components/economia/Resumoeconomia.tsx` | Refatorar 4 cards com gradientes e icones |
| `src/pages/Metas.tsx` | Refatorar 4 cards de stats |
| `src/pages/Investimentos.tsx` | Refatorar 4 cards de resumo |
| `src/components/investimentos/InvestimentoCard.tsx` | Adicionar shadow e border baseado em rendimento |
| `src/pages/Bancos.tsx` | Refatorar card de resumo geral |
| `src/components/bancos/BancoCard.tsx` | Adicionar shadow-sm rounded-xl |
| `src/pages/Cartoes.tsx` | Melhorar card de previsao |
| `src/pages/Admin.tsx` | Refatorar 5 cards de stats com gradientes |
| `src/components/economia/Rankinggastos.tsx` | Adicionar shadow-sm rounded-xl |
| `src/components/economia/Insightseconomia.tsx` | Adicionar shadow-sm rounded-xl |
| `src/pages/Economia.tsx` | Padronizar todos os cards |
| `src/components/profile/EstatisticasTab.tsx` | Padronizar cards |
| `src/components/profile/PerfilTab.tsx` | Padronizar cards |
| `src/components/profile/SegurancaTab.tsx` | Padronizar cards |
| `src/components/profile/PreferenciasTab.tsx` | Padronizar cards |

---

## Resultado Esperado

Todos os cards do sistema terao:
- Visual consistente com o Dashboard
- Gradientes sutis para destaque por tipo
- Shadows apropriadas (lg para principais, sm para secundarios)
- Cantos arredondados uniformes (rounded-xl)
- Icones em containers coloridos harmonicos
- Animacoes de entrada padronizadas
