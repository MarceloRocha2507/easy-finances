
## Plano: Corrigir Atribuição de Mês de Fatura na Importação

### Problema Identificado

Ao importar compras para a fatura de março, as compras acabaram sendo atribuídas a fevereiro. Isso acontece porque:

1. O cálculo automático do mês de fatura usa a lógica: `se data_compra < dia_fechamento → fatura do mês atual da compra`
2. Para compras feitas no dia 4 de fevereiro (antes do fechamento dia 5), o sistema atribui à fatura de **fevereiro**, não março
3. O usuário pode não ter percebido o mês sugerido ou não ajustou na UI

### Análise das Inconsistências

Encontrei **três implementações diferentes** da mesma lógica no código:

| Arquivo | Lógica | Resultado (compra dia 4, fechamento dia 5) |
|---------|--------|-------------------------------------------|
| `importar-compras-cartao.ts` | `dia < diaFechamento → mês atual` | Fevereiro |
| `NovaCompraCartaoDialog.tsx` | `dia < diaFechamento → mês anterior` | Janeiro |
| `transactions.ts` | `dia <= diaFechamento → mês atual` | Fevereiro |

Essa inconsistência é problemática e precisa ser corrigida.

### Mudanças Propostas

#### 1. Unificar a Lógica de Cálculo do Mês de Fatura

Criar uma função centralizada em `src/lib/dateUtils.ts` que será usada por todos os arquivos:

```typescript
/**
 * Calcular o mês da fatura baseado na data da compra e dia de fechamento.
 * 
 * Regra: Compras feitas ANTES do dia de fechamento entram na fatura 
 * que VENCE naquele mês. Compras NO DIA ou APÓS o fechamento vão 
 * para a fatura do mês seguinte.
 * 
 * Exemplo com fechamento dia 5:
 * - Compra em 04/fev → fatura de fevereiro (fecha dia 5/fev, vence em março)
 * - Compra em 05/fev → fatura de março (fecha dia 5/mar, vence em abril)
 */
export function calcularMesFaturaCartao(
  dataCompra: Date, 
  diaFechamento: number
): Date {
  const diaCompra = dataCompra.getDate();
  const mesCompra = dataCompra.getMonth();
  const anoCompra = dataCompra.getFullYear();

  if (diaCompra < diaFechamento) {
    // Compra antes do fechamento: vai para a fatura do mês atual
    return new Date(anoCompra, mesCompra, 1);
  } else {
    // Compra no dia ou após o fechamento: vai para a fatura do próximo mês
    return new Date(anoCompra, mesCompra + 1, 1);
  }
}
```

#### 2. Melhorar a Visibilidade do Mês de Fatura na Importação

- Adicionar um **alerta/destaque visual** quando o mês sugerido for diferente do mês atual
- Mostrar um **resumo** antes de importar: "Compras serão importadas para fevereiro/2026 (X itens), março/2026 (Y itens)"
- Permitir **alteração em lote** do mês de fatura (não apenas linha a linha)

#### 3. Adicionar Seletor Global de Mês de Fatura

Adicionar um dropdown no topo da página de importação para definir o mês de fatura **padrão** para todas as linhas, com opção de sobrescrever o cálculo automático:

```
┌─────────────────────────────────────────────────────────────┐
│ Mês da fatura para importação:                              │
│ ○ Automático (baseado na data da compra)                    │
│ ● Fixar em: [Março/2026 ▼]                                  │
│                                                             │
│ ⚠️ 5 compras têm data anterior ao fechamento de março.       │
│    Considere usar o mês de fevereiro para essas compras.    │
└─────────────────────────────────────────────────────────────┘
```

---

### Seção Técnica

#### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/dateUtils.ts` | Adicionar função centralizada `calcularMesFaturaCartao()` |
| `src/services/importar-compras-cartao.ts` | Usar função centralizada; remover duplicata local |
| `src/components/cartoes/NovaCompraCartaoDialog.tsx` | Usar função centralizada; corrigir lógica |
| `src/services/transactions.ts` | Usar função centralizada |
| `src/pages/cartoes/ImportarCompras.tsx` | Adicionar seletor de mês de fatura global e resumo por mês |

#### Nova UI na Importação

```tsx
// Estado
const [mesFaturaGlobal, setMesFaturaGlobal] = useState<string | null>(null);
const [modoMesFatura, setModoMesFatura] = useState<"automatico" | "fixo">("automatico");

// Resumo por mês (para mostrar ao usuário)
const resumoPorMes = useMemo(() => {
  const grupos = new Map<string, number>();
  previewData.filter(p => p.valido).forEach(p => {
    const mes = p.mesFatura;
    grupos.set(mes, (grupos.get(mes) || 0) + 1);
  });
  return grupos;
}, [previewData]);
```

#### Aplicar Mês Global

```tsx
// Ao mudar para "fixo", aplicar a todas as linhas
useEffect(() => {
  if (modoMesFatura === "fixo" && mesFaturaGlobal) {
    setPreviewData(prev => prev.map(p => ({
      ...p,
      mesFatura: mesFaturaGlobal
    })));
  }
}, [modoMesFatura, mesFaturaGlobal]);
```

---

### Critérios de Aceite

1. A lógica de cálculo de mês de fatura é **idêntica** em todos os pontos do código
2. O usuário pode **forçar** um mês de fatura específico para todas as compras do lote
3. Antes de importar, o usuário vê claramente **para qual(is) mês(es)** as compras serão importadas
4. Se houver compras com datas inconsistentes com o mês escolhido, aparece um **alerta** informativo
5. A documentação inline explica claramente a regra de atribuição de mês
