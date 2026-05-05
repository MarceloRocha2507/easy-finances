## Calendário Financeiro

Nova página `/calendario` que consolida **todos os compromissos** do sistema em uma única visão temporal, no estilo premium fintech (light, #111827 / #6B7280, sem gradientes pesados).

### Layout

```text
┌─────────────────────────────────────────────────────────────┐
│  Calendário                              [Filtros ▾] [Hoje] │
│  ◂  Novembro 2026  ▸                                        │
├─────────────────────────────────────┬───────────────────────┤
│  Dom  Seg  Ter  Qua  Qui  Sex  Sáb  │  AGENDA               │
│  ┌──┬──┬──┬──┬──┬──┬──┐             │  ─────                │
│  │  │  │ 1│ 2│ 3│ 4│ 5│             │  Hoje · 12 nov        │
│  │  │  │••│• │  │ •│  │             │  • Netflix R$39,90    │
│  ├──┼──┼──┼──┼──┼──┼──┤             │  • Salário R$5.000    │
│  │ 6│ 7│ 8│ 9│10│11│12│             │                       │
│  │  │ •│  │•••│ │  │••│ ← hoje      │  Amanhã · 13 nov      │
│  ├──┴──┴──┴──┴──┴──┴──┤             │  • Fatura Nubank      │
│  │  ...               │             │    R$1.234,00         │
│  └────────────────────┘             │  ...                  │
│                                     │                       │
│  Legenda:                           │  [Ver mês inteiro]    │
│  ● Receita ● Despesa ● Fatura       │                       │
│  ● Assinatura ● Meta ● Investimento │                       │
└─────────────────────────────────────┴───────────────────────┘
```

- **Desktop (≥lg)**: grid mensal 3/5 + agenda lateral 2/5 (sticky, scroll independente).
- **Mobile**: grid mensal compacto no topo, agenda empilhada abaixo. Cada dia mostra até 3 pontinhos coloridos; clicar abre Sheet com lista do dia.
- **Hoje** destacado com ring `#3B82F6`; dias com eventos têm pontos coloridos (máx 4 visíveis + “+N”).

### Tipos de evento agregados

| Cor | Tipo | Origem | Data |
|-----|------|--------|------|
| `#22C55E` | Receita pendente | `transactions` (type=income, status=pending) | `due_date` |
| `#DC2626` | Despesa pendente | `transactions` (type=expense, status=pending) | `due_date` |
| `#8B5CF6` | Fatura cartão | `cartoes` (calc do mês ativo) | dia de vencimento |
| `#F59E0B` | Fechamento cartão | `cartoes` | dia de fechamento |
| `#EC4899` | Assinatura | `assinaturas` (status=ativa) | `proxima_cobranca` |
| `#0EA5E9` | Meta (prazo) | `metas` (não concluída) | `data_limite` |
| `#14B8A6` | Investimento (vencimento) | `investimentos` | `data_vencimento` |
| `#6B7280` | Acerto fatura | `acertos_fatura` (status=pendente) | `mes_referencia` |

Receitas/despesas concluídas (paid_date) também aparecem, mas com bolinha vazada para diferenciar de pendentes.

### Filtros

Pill-shaped no header (estilo fintech do projeto):
- **Tipos**: Todos · Receitas · Despesas · Cartões · Assinaturas · Metas · Investimentos
- **Status**: Todos · Pendentes · Concluídos
- Estado dos filtros em `useState` local (não precisa persistir).

### Interação

- **Clique em evento** → abre o modal correspondente:
  - Transação → `TransactionDetailsDialog` (já existe, permite marcar pago)
  - Fatura → navega para `/cartoes/:id/despesas` no mês
  - Assinatura → `DetalhesAssinaturaDialog`
  - Meta → `GerenciarMetaDialog`
  - Investimento → `DetalhesInvestimentoDialog`
  - Acerto → navega para `/cartoes/responsaveis`
- **Clique em dia vazio** → `Sheet` "Eventos do dia" + botão "Novo Registro" (link para `/transactions?date=YYYY-MM-DD`).
- **Botão "Hoje"** volta o mês para o atual.
- **Setas ◂ ▸** navegam entre meses (com animação `fade-in` suave).

### Arquitetura técnica

**Arquivos novos:**
- `src/pages/Calendario.tsx` — página, layout grid+agenda, filtros, navegação de mês.
- `src/components/calendario/CalendarioGrid.tsx` — grid 7×N com `date-fns` (`startOfMonth`, `endOfMonth`, `eachDayOfInterval`, ptBR).
- `src/components/calendario/DiaCelula.tsx` — célula individual: número, pontos coloridos, ring de hoje.
- `src/components/calendario/AgendaLateral.tsx` — lista cronológica dos próximos 30 dias agrupada por dia (ScrollArea).
- `src/components/calendario/EventoItem.tsx` — linha de evento (cor, ícone, descrição, valor formatado).
- `src/components/calendario/DiaDetalhesSheet.tsx` — Sheet mobile/desktop com eventos do dia clicado.
- `src/components/calendario/FiltrosCalendario.tsx` — pills de filtro.
- `src/components/calendario/index.ts` — barrel export.
- `src/hooks/useCalendarioEventos.ts` — hook único que faz `useQuery` paralelo das 7 fontes (range = mês visível ± 7 dias) e devolve array unificado `CalendarioEvento[]` ordenado por data; respeta `user_id`, limite de 10.000 linhas, e filtragem `gte/lt` em formato `YYYY-MM-DD` (regra de timezone das memórias).

**Tipo unificado:**
```ts
type CalendarioEvento = {
  id: string;
  data: Date;
  tipo: "receita" | "despesa" | "fatura" | "fechamento"
       | "assinatura" | "meta" | "investimento" | "acerto";
  titulo: string;
  valor?: number;
  status?: "pendente" | "concluido";
  cor: string;
  origemId: string;       // id na tabela original
  metadados?: Record<string, unknown>;  // ex: cartaoId
};
```

**Rota e navegação:**
- Adicionar rota `<Route path="/calendario" element={<Calendario />} />` em `src/App.tsx` (lazy + ProtectedRoute, seguindo padrão das outras páginas).
- Adicionar item no `SidebarNav.tsx` `mainMenuItems`: `{ icon: CalendarDays, label: "Calendário", href: "/calendario" }`, posicionado entre "Dashboard" e "Bancos".

### Performance
- `useQueries`/`Promise.all` no hook para paralelizar as 7 leituras.
- `staleTime: 60_000` para reduzir refetch ao trocar mês adjacente.
- Memoização: `useMemo` para agrupar eventos por dia (`Map<YYYY-MM-DD, CalendarioEvento[]>`).

### Estilo (alinhado às memórias Premium Fintech)
- Container raiz: `bg-white border border-[#E5E7EB] rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.07)]`.
- Cabeçalho do dia da semana: `text-[11px] uppercase tracking-wider text-[#6B7280]`.
- Células: `aspect-square` no desktop, `min-h-[64px]` no mobile, `border border-[#F3F4F6]`, hover sutil `bg-[#F9FAFB]`.
- Tipografia tabular nos valores (`tabular-nums`).
- Pills de filtro com `rounded-full px-3 py-1 text-xs`, ativos em `#3B82F6`/branco.

### Fora de escopo (não incluso)
- Drag-and-drop de eventos.
- Vista semanal/diária separadas (apenas mês + agenda).
- Sincronização com Google Calendar (pode ser feita depois com o connector).
