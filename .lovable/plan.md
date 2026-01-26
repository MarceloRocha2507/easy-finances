
# Plano: Página de Despesas Futuras com Filtros

## Objetivo

Criar uma nova página dedicada para visualizar todas as despesas futuras (parcelas de cartão + transações pendentes), com filtros avançados por categoria, responsável, período, cartão e tipo de lançamento.

## Análise do Cenário Atual

### Fontes de Despesas Futuras

1. **Parcelas de Cartão** (`parcelas_cartao`)
   - Campo `mes_referencia` indica o mês da parcela
   - Campo `paga = false` indica parcelas pendentes
   - Vinculadas a `compras_cartao` que contém categoria e responsável

2. **Transações Pendentes** (`transactions`)
   - Campo `due_date` indica data de vencimento
   - Campo `status = 'pending'` indica transações futuras
   - Campo `tipo_lancamento` pode ser `unica`, `parcelada` ou `fixa`

### Componentes Existentes que Serão Reutilizados

- `FiltroDataRange`: Seleção de período com atalhos
- `useCategories`: Lista de categorias do usuário
- `useResponsaveis`: Lista de responsáveis
- `useCartoes`: Lista de cartões
- `formatCurrency`: Formatação de valores

---

## Arquitetura da Solução

### Nova Página: `src/pages/DespesasFuturas.tsx`

Uma página unificada que combina:
- Parcelas de cartão com `mes_referencia > hoje`
- Transações com `due_date > hoje` e `status = 'pending'`

### Localização no Menu

Adicionar no submenu de **Transações**:
```
Transações
├── Visão Geral
├── Recorrentes
├── Importar
└── Despesas Futuras (NOVO)
```

---

## Estrutura da Página

### Header

```text
┌─────────────────────────────────────────────────────────────┐
│  Despesas Futuras                                           │
│  Visualize todas as despesas programadas para os próximos   │
│  meses                                                      │
└─────────────────────────────────────────────────────────────┘
```

### Cards de Resumo

```text
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Total Período  │  │ Próximos 30d   │  │ Qtd. Despesas  │
│ R$ 12.450,00   │  │ R$ 3.200,00    │  │ 47             │
└────────────────┘  └────────────────┘  └────────────────┘
```

### Filtros

```text
┌─────────────────────────────────────────────────────────────┐
│ [Data Inicial] até [Data Final] | Hoje | Mês | 3 meses     │
│                                                             │
│ [Categoria ▼] [Responsável ▼] [Cartão ▼] [Tipo ▼]          │
└─────────────────────────────────────────────────────────────┘
```

**Filtros disponíveis:**
- **Período**: Range de datas com atalhos (próximos 30, 60, 90 dias, próximos 3/6/12 meses)
- **Categoria**: Dropdown com todas as categorias + "Sem categoria"
- **Responsável**: Dropdown com responsáveis ativos
- **Cartão**: Dropdown com cartões ou "Transações (sem cartão)"
- **Tipo**: Parcelado, Fixo/Recorrente, Única

### Tabela de Despesas

```text
| ✓  | Descrição              | Vencimento | Categoria | Origem     | Valor       |
|----|------------------------|------------|-----------|------------|-------------|
| □  | Netflix                | 15/02/2026 | Streaming | Nubank     | R$ 55,90    |
| □  | Parcela 5/10 - iPhone  | 05/03/2026 | Tech      | Itaú       | R$ 499,00   |
| □  | Aluguel                | 01/03/2026 | Moradia   | Transação  | R$ 2.500,00 |
```

### Agrupamento por Mês (Visual)

Opção de visualizar agrupado por mês:

```text
▼ Fevereiro/2026                           Total: R$ 3.500,00
  ├── Netflix                R$ 55,90
  ├── Spotify               R$ 34,90
  └── iPhone (5/10)         R$ 499,00

▼ Março/2026                               Total: R$ 4.200,00
  ├── Aluguel               R$ 2.500,00
  └── iPhone (6/10)         R$ 499,00
```

---

## Mudanças Técnicas

### 1. Novo Hook: `src/hooks/useDespesasFuturas.ts`

```typescript
export type DespesaFutura = {
  id: string;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  categoria: { id: string; nome: string; cor: string } | null;
  responsavel: { id: string; nome: string } | null;
  origem: "cartao" | "transacao";
  cartaoNome?: string;
  cartaoId?: string;
  tipo: "parcelada" | "fixa" | "unica";
  parcela?: { numero: number; total: number };
};

export function useDespesasFuturas(filtros: {
  dataInicio: Date;
  dataFim: Date;
  categoriaId?: string;
  responsavelId?: string;
  cartaoId?: string;
  tipo?: string;
})
```

**Lógica de busca:**

1. Buscar parcelas de cartão:
```sql
SELECT * FROM parcelas_cartao
JOIN compras_cartao ON ...
WHERE mes_referencia >= dataInicio
  AND mes_referencia <= dataFim
  AND paga = false
```

2. Buscar transações pendentes:
```sql
SELECT * FROM transactions
WHERE due_date >= dataInicio
  AND due_date <= dataFim
  AND status = 'pending'
  AND type = 'expense'
```

3. Combinar e ordenar por data de vencimento

### 2. Nova Página: `src/pages/DespesasFuturas.tsx`

Componentes principais:
- Cards de resumo (total período, próximos 30 dias, quantidade)
- Filtros (período, categoria, responsável, cartão, tipo)
- Toggle de visualização (lista/agrupado por mês)
- Tabela de despesas futuras

### 3. Atualizar Menu: `src/components/Layout.tsx`

Adicionar item no submenu de Transações:
```typescript
const transacoesMenu = {
  subItems: [
    // ... existentes ...
    { icon: CalendarClock, label: "Despesas Futuras", href: "/transactions/futuras" },
  ],
};
```

### 4. Atualizar Rotas: `src/App.tsx`

```typescript
const DespesasFuturasPage = lazy(() => import("./pages/DespesasFuturas"));

<Route
  path="/transactions/futuras"
  element={
    <ProtectedRoute>
      <Suspense fallback={<LoadingScreen />}>
        <DespesasFuturasPage />
      </Suspense>
    </ProtectedRoute>
  }
/>
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useDespesasFuturas.ts` | Criar | Hook para buscar e combinar despesas futuras |
| `src/pages/DespesasFuturas.tsx` | Criar | Página principal com filtros e tabela |
| `src/components/Layout.tsx` | Modificar | Adicionar item no menu |
| `src/App.tsx` | Modificar | Adicionar rota |

---

## Funcionalidades Extras

1. **Exportar para CSV/PDF**: Botão para exportar a lista filtrada
2. **Totais por categoria**: Resumo visual de quanto será gasto por categoria
3. **Gráfico de projeção**: Timeline visual mostrando os gastos futuros

---

## Resultado Esperado

| Funcionalidade | Implementação |
|----------------|---------------|
| Ver todas as despesas futuras | Lista unificada de parcelas + transações |
| Filtrar por categoria | Dropdown com categorias |
| Filtrar por responsável | Dropdown com responsáveis |
| Filtrar por cartão | Dropdown com cartões |
| Filtrar por período | Range de datas com atalhos |
| Filtrar por tipo | Parcelado/Fixo/Única |
| Ver totais | Cards de resumo |
| Ordenar por data | Tabela ordenada por vencimento |

## Tempo Estimado

15-20 minutos para implementação completa.
