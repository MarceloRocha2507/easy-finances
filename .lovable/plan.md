

# Organizar Listagem por Grupos com Cabecalhos Colapsaveis

## Visao Geral

Reorganizar a listagem de transacoes para agrupar itens por tipo, com cabecalhos visuais contendo subtotal, e permitir recolher/expandir cada grupo. Cada grupo tera diferenciacao visual (cores de borda/fundo).

## Grupos definidos

Dependendo da tab ativa:

- **Tab "Despesas"**: 3 grupos possiveis
  1. Faturas de Cartao (icone roxo, borda roxa) -- itens com `isFaturaCartao` ou categoria "Fatura de Cartao"
  2. Despesas Fixas/Recorrentes (icone amarelo, borda amarela) -- `tipo_lancamento === 'fixa'` ou `is_recurring`
  3. Despesas Comuns (icone vermelho, borda vermelha) -- todas as outras despesas

- **Tab "Receitas"**: 2 grupos
  1. Receitas Fixas/Recorrentes (borda verde-escuro)
  2. Receitas Avulsas (borda verde)

- **Tab "Todos"**: todos os grupos acima combinados

- **Tab "Pendentes"** e **Tab "Fixas"**: sem agrupamento (ja sao filtros especificos)

## Arquivos modificados

### `src/pages/Transactions.tsx`

#### 1. Novo tipo e logica de agrupamento

Criar funcao `agruparTransacoes` que recebe o array de `sortedTransactions` e a `activeTab`, e retorna:

```text
type GrupoTransacao = {
  key: string;
  label: string;
  icon: React.ComponentType;
  colorClass: string;       // classes de cor do cabecalho
  bgClass: string;           // fundo leve nos itens do grupo
  borderClass: string;       // borda esquerda nos itens
  items: (Transaction | FaturaVirtual)[];
  subtotal: number;
};
```

A funcao classifica cada item em seu grupo, calcula o subtotal e ordena os itens por data de vencimento dentro de cada grupo.

#### 2. Estado de grupos colapsados

Adicionar `const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())` para controlar quais grupos estao recolhidos.

Funcao toggle: `toggleGroup(key)` que adiciona/remove do Set.

#### 3. Componente `GroupHeader`

Cabecalho clicavel para cada grupo com:
- Icone do grupo (CreditCard roxo, TrendingDown vermelho, TrendingUp verde, RefreshCw amarelo)
- Label do grupo (ex: "Faturas de Cartao")
- Quantidade de itens entre parenteses
- Subtotal formatado (ex: "R$ 867,94")
- Seta de chevron indicando expandido/recolhido
- Fundo leve com a cor do grupo

#### 4. Renderizacao agrupada

Substituir o `sortedTransactions.map(...)` atual por:

```text
{grupos.map(grupo => (
  <div key={grupo.key}>
    <GroupHeader grupo={grupo} collapsed={...} onToggle={...} />
    {!collapsed && (
      <div className="space-y-0.5">
        {grupo.items.map(item => (
          // renderizar TransactionRow ou FaturaCartaoRow com borda esquerda colorida
        ))}
      </div>
    )}
  </div>
))}
```

#### 5. Diferenciacao visual nos itens

Cada item dentro de um grupo recebe:
- **Faturas de cartao**: `border-l-2 border-violet-400 bg-violet-50/30`
- **Despesas comuns**: `border-l-2 border-red-300 bg-red-50/20`
- **Receitas**: `border-l-2 border-emerald-300 bg-emerald-50/20`
- **Fixas/Recorrentes**: `border-l-2 border-amber-300 bg-amber-50/20`
- **Pendentes**: `bg-amber-50/30` (ja existente, manter)

#### 6. Tabs sem agrupamento

Nas tabs "Pendentes" e "Fixas", manter a listagem flat sem agrupamento (esses ja sao filtros especificos).

## Logica de classificacao dos itens

```text
function classificarItem(item, activeTab):
  if 'isFaturaCartao' in item:
    return 'faturas'
  if item.category?.name === 'Fatura de Cartao':
    return 'faturas'
  if item.tipo_lancamento === 'fixa' || item.is_recurring:
    return 'fixas'
  if item.type === 'income':
    return 'receitas'
  return 'despesas'
```

## Ordenacao dentro dos grupos

Itens dentro de cada grupo ordenados por `date` (data de vencimento), do mais proximo para o mais distante.

## Ordem dos grupos na tela

1. Faturas de Cartao (primeiro, pois sao compromissos com data fixa)
2. Despesas Fixas/Recorrentes
3. Despesas Comuns
4. Receitas (na tab "Todos")

## Importacoes adicionais necessarias

- `ChevronDown`, `ChevronRight` de lucide-react (para indicador de colapsado)
- `Collapsible`, `CollapsibleContent`, `CollapsibleTrigger` do radix (ja instalado)

## Resumo de alteracoes

- **Arquivo unico modificado**: `src/pages/Transactions.tsx`
- Adicionar funcao `agruparTransacoes`
- Adicionar componente `GroupHeader`
- Adicionar estado `collapsedGroups`
- Substituir renderizacao flat por renderizacao agrupada
- Adicionar classes de borda/fundo nos itens por grupo
- Manter comportamento flat nas tabs "Pendentes" e "Fixas"

