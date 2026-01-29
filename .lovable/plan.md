
# Plano: Correção de Scroll nos Modais

## Problema Identificado

Os modais do sistema usam o componente `DialogContent` que está configurado com posicionamento fixo centralizado (`top-[50%] translate-y-[-50%]`), mas **sem altura máxima nem overflow definido**. Isso causa os seguintes problemas em mobile:

1. **Modais com muito conteúdo** ultrapassam a altura da tela
2. **Não é possível rolar** para ver o conteúdo que está fora da área visível
3. **Botões de ação** ficam escondidos na parte inferior

### Análise dos Modais Afetados

| Modal | Arquivo | Status Atual |
|-------|---------|--------------|
| Novo Registro (Transações) | `src/pages/Transactions.tsx` | Sem scroll |
| Novo Cartão | `src/components/cartoes/NovoCartaoDialog.tsx` | Sem scroll |
| Nova Meta | `src/components/dashboard/NovaMetaDialog.tsx` | Sem scroll |
| Editar Cartão | `src/components/cartoes/EditarCartaoDialog.tsx` | Sem scroll |
| Gerenciar Meta | `src/components/dashboard/GerenciarMetaDialog.tsx` | Sem scroll |
| Responsável | `src/pages/Responsaveis.tsx` | Sem scroll |
| Novo Investimento | `src/components/investimentos/NovoInvestimentoDialog.tsx` | Com scroll |
| Nova Compra Cartão | `src/components/cartoes/NovaCompraCartaoDialog.tsx` | Com scroll |
| Editar Banco | `src/components/bancos/EditarBancoDialog.tsx` | Com scroll |
| Novo Banco | `src/components/bancos/NovoBancoDialog.tsx` | Com scroll |

---

## Solução Proposta

Corrigir o componente **base** `DialogContent` em `src/components/ui/dialog.tsx` para incluir `max-h-[90vh]` e `overflow-y-auto` por padrão. Isso corrige **todos os modais** de uma vez.

### Alteração no DialogContent

**Arquivo:** `src/components/ui/dialog.tsx`

**Antes (linha 38-41):**
```tsx
className={cn(
  "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 sm:p-6 shadow-lg duration-200 ...",
  className,
)}
```

**Depois:**
```tsx
className={cn(
  "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 sm:p-6 shadow-lg duration-200 max-h-[90vh] overflow-y-auto ...",
  className,
)}
```

---

## Por que essa solução?

1. **Corrige todos os modais** automaticamente sem necessidade de alterar cada um
2. **Comportamento padrão correto**: modais devem ter scroll quando o conteúdo excede a tela
3. **Modais pequenos** não são afetados (apenas ganham a capacidade de rolar se necessário)
4. **90vh** deixa margem visual de 5% em cima e 5% embaixo
5. **Modais que já têm `max-h-[90vh] overflow-y-auto`** continuam funcionando normalmente (classes duplicadas não causam problemas)

---

## Seção Técnica

### Classes CSS Adicionadas

- `max-h-[90vh]`: Limita altura máxima a 90% do viewport
- `overflow-y-auto`: Habilita scroll vertical quando necessário

### Comportamento Resultante

```
+-------------------------------------------------+
|                    5% margem                     |
+-------------------------------------------------+
|  +-------------------------------------------+  |
|  | DialogContent (max-h: 90vh)               |  |
|  |                                           |  |
|  | [Header]                                  |  |
|  |                                           |  |
|  | [Conteúdo rolável]          ← scroll aqui |  |
|  | ...                                       |  |
|  |                                           |  |
|  | [Footer/Botões]                           |  |
|  +-------------------------------------------+  |
+-------------------------------------------------+
|                    5% margem                     |
+-------------------------------------------------+
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/ui/dialog.tsx` (linha 38-41) | Adicionar `max-h-[90vh] overflow-y-auto` ao `DialogContent` |

---

## Resultado Esperado

- Todos os modais poderão ser rolados quando o conteúdo exceder a tela
- Botões de ação sempre acessíveis
- Experiência consistente em todos os dispositivos
- Nenhum conteúdo cortado ou inacessível

---

## Testes Recomendados

1. Abrir modal "Novo Registro" em mobile e verificar scroll
2. Abrir modal "Novo Cartão" e tentar rolar até o botão "Salvar"
3. Testar modais com formulários longos (Nova Meta, Editar Cartão)
4. Verificar que modais pequenos continuam centralizados corretamente
