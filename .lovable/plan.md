
# Plano: Adicionar Resumo de Despesas por Cartão

## Objetivo

Adicionar uma seção que exibe o total de despesas futuras **agrupadas por cartão de crédito**, permitindo visualizar rapidamente quanto será gasto em cada cartão no período selecionado.

## Situação Atual

A página de Despesas Futuras já possui:
- Cards de resumo geral (Total, Próximos 30d, Qtd.)
- Filtros por categoria, responsável, origem, tipo
- Lista/agrupamento por mês

O que falta:
- **Visão consolidada por cartão** mostrando o total de cada um

## Solução Proposta

### Nova Seção: "Resumo por Cartão"

Adicionar uma seção visual entre os cards de resumo e os filtros, exibindo cada cartão com seu respectivo total:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Por Cartão                                                              │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────┤
│ 💳 Inter    │ 💳 Nubank   │ 💳 Itaú     │ 💳 C6       │ 📄 Transações  │
│ R$ 915,95   │ R$ 1.250,00 │ R$ 780,00   │ R$ 320,00   │ R$ 450,00      │
│ (71 itens)  │ (23 itens)  │ (15 itens)  │ (8 itens)   │ (12 itens)     │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────────┘
```

### Características

| Item | Descrição |
|------|-----------|
| **Cor do cartão** | Usar a cor do cartão no ícone/borda |
| **Clicável** | Ao clicar, filtra a tabela por aquele cartão |
| **Transações** | Incluir um card separado para transações sem cartão |
| **Responsivo** | Grid que se adapta (2 cols mobile, 3-4 cols desktop) |

## Mudanças Técnicas

### 1. Adicionar função utilitária no hook

**Arquivo**: `src/hooks/useDespesasFuturas.ts`

Criar função `agruparPorCartao` que retorna:

```typescript
export type ResumoCartaoFuturo = {
  cartaoId: string | null;
  cartaoNome: string;
  cartaoCor?: string;
  total: number;
  quantidade: number;
};

export function agruparPorCartao(
  despesas: DespesaFutura[],
  cartoes: Cartao[]
): ResumoCartaoFuturo[]
```

Lógica:
1. Agrupar despesas pelo `cartaoId` (ou `null` para transações)
2. Somar valores e contar itens
3. Ordenar por total (maior para menor)
4. Incluir cor do cartão para estilização

### 2. Adicionar seção na página

**Arquivo**: `src/pages/DespesasFuturas.tsx`

Entre os cards de resumo e os filtros, adicionar:

```tsx
{/* Resumo por Cartão */}
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium flex items-center gap-2">
      <CreditCard className="h-4 w-4" />
      Por Cartão
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {resumoPorCartao.map((item) => (
        <button
          key={item.cartaoId || "transacao"}
          onClick={() => handleFiltrarCartao(item.cartaoId)}
          className={cn(
            "p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left",
            cartaoId === item.cartaoId && "ring-2 ring-primary"
          )}
          style={{ borderColor: item.cartaoCor || undefined }}
        >
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4" style={{ color: item.cartaoCor }} />
            <span className="font-medium text-sm truncate">{item.cartaoNome}</span>
          </div>
          <p className="text-lg font-bold text-expense">
            {formatCurrency(item.total)}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.quantidade} {item.quantidade === 1 ? "despesa" : "despesas"}
          </p>
        </button>
      ))}
    </div>
  </CardContent>
</Card>
```

### 3. Handler para filtrar ao clicar

```typescript
const handleFiltrarCartao = (cartaoIdClicado: string | null) => {
  if (cartaoIdClicado === null) {
    setCartaoId("transacao");
  } else if (cartaoId === cartaoIdClicado) {
    setCartaoId(""); // Toggle: remove filtro se já está selecionado
  } else {
    setCartaoId(cartaoIdClicado);
  }
};
```

## Arquivos a Modificar

| Arquivo | Ação | Mudança |
|---------|------|---------|
| `src/hooks/useDespesasFuturas.ts` | Modificar | Adicionar função `agruparPorCartao` e tipo `ResumoCartaoFuturo` |
| `src/pages/DespesasFuturas.tsx` | Modificar | Adicionar seção de resumo por cartão |

## Resultado Esperado

| Funcionalidade | Implementação |
|----------------|---------------|
| Ver total por cartão | Cards visuais com valor e quantidade |
| Identificar cartões | Cor e nome de cada cartão |
| Filtrar rapidamente | Clicar no card filtra a tabela |
| Ver transações | Card separado para despesas sem cartão |
| Toggle de filtro | Clicar novamente remove o filtro |

## Tempo Estimado

5-8 minutos para implementação.
