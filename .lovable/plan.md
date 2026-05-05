# Layout: 2 Painéis Agrupados (Visão Geral + Este Mês)

Substituir o painel único atual da página `/transactions` por **dois painéis lado a lado**, mantendo a separação semântica entre métricas globais e do mês corrente.

## Estrutura visual

```text
┌─────────────────────────────┬───────────────────────────────────────┐
│ VISÃO GERAL                 │ ESTE MÊS                              │
│                             │ ─────────────────────────────────────│
│ Total de Despesas (hero)    │ ┌────────┬─────────┬─────────┐       │
│ R$ 3.496,59       👁 💳     │ │Receitas│Despesas │A Receber│       │
│ inclui outros · detalhes    │ ├────────┼─────────┼─────────┤       │
│ ───────────────────────────│ │A Pagar │Assinat. │         │       │
│ ┌──────────┬──────────┐    │ └────────┴─────────┴─────────┘       │
│ │Saldo Real│Estimado  │    │                                       │
│ └──────────┴──────────┘    │                                       │
└─────────────────────────────┴───────────────────────────────────────┘
       2/5 da largura                    3/5 da largura
```

No mobile (`< lg`), os dois painéis empilham em coluna única.

## Painel 1 — Visão Geral (`lg:col-span-2`)

- Título compacto: **"VISÃO GERAL"** (11px uppercase, tracking-wider, cinza #6B7280)
- **Hero "Total de Despesas"** — destaque grande (texto 2xl/26px), cor `#DC2626`, com:
  - Botão olho (toggle visibilidade) e ícone `CreditCard`
  - Clique no card → abre `DetalhesDespesasDialog`
  - Subtítulo: *"inclui outros responsáveis · clique para detalhes"*
- Divisor sutil
- Grid 2 colunas com:
  - **Saldo Real** (clica → `AjustarSaldoDialog`)
  - **Estimado** (com cálculo "neste mês" + fórmula "real + a receber - a pagar")

## Painel 2 — Este Mês (`lg:col-span-3`)

- Título: **"ESTE MÊS"** (mesmo estilo)
- Divisor
- Grid 3 colunas com 5 tiles:
  - **Receitas** — `completedIncome` (verde)
  - **Despesas** — `completedExpenseWithFatura` (vermelho)
  - **A Receber** — `pendingIncome` (verde, prefix "+")
  - **A Pagar** — `pendingExpense` (vermelho, prefix "-")
  - **Assinaturas** — `totalMensalAssinaturas` (clica → `/assinaturas`)

## Implementação

**Arquivo único alterado:** `src/pages/Transactions.tsx` (linhas 1293–1418).

Substituir o bloco atual `{/* Painel unificado - Hero + grid compacto interno */}` por dois containers `<div>` dentro de `<AnimatedSection delay={0.1} className="grid grid-cols-1 lg:grid-cols-5 gap-3">`.

Reaproveita 100% dos componentes/lógica existente:
- `UnifiedMetricTile` (já criado)
- `DetalhesDespesasDialog`, `AjustarSaldoDialog`
- Mesmos dados de `stats`, `totalMensalAssinaturas`, `assinaturasAtivas`, `renovamEssaSemana`

**Tokens de design respeitados:**
- Containers: `bg-white border border-[#E5E7EB] rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.07)]`
- Tema light, sem gradientes pesados
- Divisores `divide-[#E5E7EB]` entre tiles

**Removido:** card único anterior. Nada na lógica de cálculo é alterado — só o layout/agrupamento visual.
