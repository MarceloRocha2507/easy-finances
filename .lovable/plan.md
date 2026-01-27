
# Plano: Otimização de Performance no Carregamento de Compras do Cartão

## Diagnóstico

Identifiquei **múltiplos problemas de performance** que causam lentidão no carregamento das compras do cartão:

### Problema 1: Código Duplicado com Implementações Diferentes

Existem **duas implementações** da função `listarParcelasDaFatura`:

| Arquivo | Localização | Características |
|---------|-------------|-----------------|
| `src/services/compras-cartao.ts` | Linhas 123-200 | Mais completa, com relacionamentos |
| `src/services/transactions.ts` | Linhas 248-321 | Simplificada, sem responsável/categoria |

O componente `CartaoCard.tsx` importa de `transactions.ts`, enquanto `DespesasCartao.tsx` importa de `compras-cartao.ts`.

### Problema 2: Chamadas em Loop (N+1 Query Problem)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  CartaoCard (Cartão 1)  ─────► listarParcelasDaFatura() ─► 2 queries     │
│  CartaoCard (Cartão 2)  ─────► listarParcelasDaFatura() ─► 2 queries     │
│  CartaoCard (Cartão 3)  ─────► listarParcelasDaFatura() ─► 2 queries     │
│  CartaoCard (Cartão 4)  ─────► listarParcelasDaFatura() ─► 2 queries     │
│  CartaoCard (Cartão 5)  ─────► listarParcelasDaFatura() ─► 2 queries     │
│                                                                          │
│  TOTAL: 10 requisições separadas para exibir 5 cartões!                  │
└──────────────────────────────────────────────────────────────────────────┘
```

O componente `CartaoCard.tsx` (linha 77-91) faz uma chamada `useEffect` para cada cartão renderizado.

### Problema 3: Query Ineficiente em `listarParcelasDaFatura`

Na versão de `compras-cartao.ts` (linhas 134-173):

```typescript
// 1. Busca TODAS as parcelas do mês (sem filtro de cartão)
const { data: parcelas } = await supabase
  .from("parcelas_cartao")
  .select(`...`)
  .gte("mes_referencia", primeiroDia)
  .lte("mes_referencia", ultimoDia);

// 2. Faz OUTRA query para filtrar por cartão
const { data: comprasCartao } = await supabase
  .from("compras_cartao")
  .select("id")
  .eq("cartao_id", cartaoId);

// 3. Filtra no JavaScript
return parcelas.filter(p => compraIds.has(p.compra_id));
```

**Resultado**: 2 queries + filtragem JS ao invés de 1 query otimizada.

### Problema 4: Falta de Índices no Banco

Índices existentes:
- `idx_parcelas_cartao_ativo` (ativo)
- `idx_parcelas_cartao_tipo_recorrencia` (tipo_recorrencia)
- `idx_parcelas_unique` (compra_id, numero_parcela, mes_referencia)

**Faltando**:
- Índice em `parcelas_cartao.mes_referencia` (usado em filtros de data)
- Índice em `compras_cartao.cartao_id` (usado para filtrar por cartão)

## Solução Proposta

### Fase 1: Adicionar Índices no Banco de Dados

Criar índices para acelerar as queries mais frequentes:

```sql
-- Índice para filtros por mês de referência
CREATE INDEX IF NOT EXISTS idx_parcelas_mes_referencia 
ON parcelas_cartao (mes_referencia);

-- Índice para filtros por cartão
CREATE INDEX IF NOT EXISTS idx_compras_cartao_id 
ON compras_cartao (cartao_id);
```

### Fase 2: Unificar e Otimizar a Função `listarParcelasDaFatura`

**Arquivo**: `src/services/compras-cartao.ts`

Reescrever a função para fazer **uma única query otimizada**:

```typescript
export async function listarParcelasDaFatura(
  cartaoId: string,
  mesReferencia: Date
): Promise<ParcelaFatura[]> {
  const ano = mesReferencia.getFullYear();
  const mes = mesReferencia.getMonth();
  const primeiroDia = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
  const proximoMes = new Date(ano, mes + 1, 1);
  const ultimoDia = `${proximoMes.getFullYear()}-${String(proximoMes.getMonth() + 1).padStart(2, "0")}-01`;

  // UMA ÚNICA QUERY com JOIN implícito via Supabase
  const { data: parcelas, error } = await supabase
    .from("parcelas_cartao")
    .select(`
      id,
      compra_id,
      numero_parcela,
      valor,
      mes_referencia,
      paga,
      created_at,
      updated_at,
      ativo,
      compra:compras_cartao!inner(
        id,
        descricao,
        parcelas,
        data_compra,
        tipo_lancamento,
        cartao_id,
        categoria_id,
        responsavel_id,
        categoria:categories(id, name, color, icon),
        responsavel:responsaveis(id, nome, apelido, is_titular)
      )
    `)
    .eq("compra.cartao_id", cartaoId)  // Filtro direto no JOIN
    .gte("mes_referencia", primeiroDia)
    .lt("mes_referencia", ultimoDia)
    .eq("ativo", true)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!parcelas) return [];

  return parcelas.map((p: any) => ({
    id: p.id,
    compra_id: p.compra_id,
    // ... mapeamento dos campos
  }));
}
```

**Benefício**: De 2 queries para **1 query** com filtro direto.

### Fase 3: Eliminar Chamadas em Loop no CartaoCard

**Problema atual**: `CartaoCard.tsx` faz uma chamada API individual para cada cartão.

**Solução**: O componente `CartaoCard` na página `Cartoes.tsx` (linhas 257-418) já recebe os dados pré-calculados via prop `cartao: CartaoComResumo`, que inclui `limiteUsado`, `faturaAtual`, etc.

O `CartaoCard` em `src/components/cartoes/CartaoCard.tsx` é diferente e é usado em contextos que ainda não têm os dados pré-carregados.

**Opção 1 - Preferencial**: Remover o `useEffect` do `CartaoCard.tsx` e passar os dados já calculados como props.

**Opção 2**: Criar um hook que carrega todos os cartões de uma vez (batch) ao invés de um por um.

### Fase 4: Remover Código Duplicado

**Arquivo**: `src/services/transactions.ts`

Remover a função duplicada `listarParcelasDaFatura` (linhas 248-321) e atualizar todos os imports para usar a versão de `compras-cartao.ts`.

**Arquivos a atualizar**:
- `src/components/cartoes/CartaoCard.tsx` - mudar import

### Fase 5: Otimizar useDashboardCompleto

**Arquivo**: `src/hooks/useDashboardCompleto.ts`

O hook atual (linhas 159-192) carrega **todas** as compras sem filtro para depois processar no JavaScript:

```typescript
// ATUAL - Carrega TUDO
const { data: compras } = await supabase
  .from("compras_cartao")
  .select("id, cartao_id, descricao, valor_total, parcelas, created_at")
  .in("cartao_id", cartaoIds)
  .order("created_at", { ascending: false });
```

**Solução**: Adicionar limite e filtro de data para carregar apenas dados relevantes:

```typescript
// OTIMIZADO - Carrega apenas o necessário
const { data: compras } = await supabase
  .from("compras_cartao")
  .select("id, cartao_id, descricao, valor_total, parcelas, created_at")
  .in("cartao_id", cartaoIds)
  .gte("created_at", mesAnterior) // Limitar período
  .order("created_at", { ascending: false })
  .limit(200); // Limitar quantidade
```

## Resumo das Mudanças

| Arquivo | Mudança | Impacto |
|---------|---------|---------|
| **Migração SQL** | Criar índices `idx_parcelas_mes_referencia` e `idx_compras_cartao_id` | Acelera queries de filtro |
| `src/services/compras-cartao.ts` | Reescrever `listarParcelasDaFatura` com JOIN + filtro direto | 2 queries → 1 query |
| `src/services/transactions.ts` | Remover função duplicada `listarParcelasDaFatura` | Elimina confusão |
| `src/components/cartoes/CartaoCard.tsx` | Remover `useEffect` e usar dados via props ou cache | Elimina N+1 queries |
| `src/hooks/useDashboardCompleto.ts` | Adicionar filtro de período e limite nas queries | Reduz dados transferidos |

## Resultados Esperados

| Métrica | Antes | Depois |
|---------|-------|--------|
| Queries por cartão | 2 | 0 (pré-carregado) |
| Total queries (5 cartões) | ~12 | ~4 |
| Tempo de resposta | 2-4s | <1s |
| Dados transferidos | Sem limite | Limitado por período |

## Tempo Estimado

Implementação completa: **20-30 minutos**
