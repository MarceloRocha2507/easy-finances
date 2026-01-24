
## Plano: Adicionar Coluna "Valor Total" no Preview de Importação

### Objetivo
Mostrar o valor total calculado para compras parceladas na tabela de preview da importação, facilitando a visualização do impacto financeiro real de cada compra.

### Mudanças Propostas

#### 1. Atualizar a Interface `PreviewCompra`
**Arquivo:** `src/services/importar-compras-cartao.ts`

Adicionar um campo calculado `valorTotal` na interface:

```typescript
export interface PreviewCompra {
  // ... campos existentes ...
  valor: number;           // Valor da parcela individual
  valorTotal: number;      // Valor total (valor × parcelas)
  // ...
}
```

#### 2. Calcular o Valor Total no Parsing
**Arquivo:** `src/services/importar-compras-cartao.ts`

Na função `parseLinhasCompra`, calcular e incluir o `valorTotal`:

```typescript
// Para compras parceladas: valor × totalParcelas
// Para compras únicas: mesmo valor
const valorTotal = tipoLancamento === "parcelada" 
  ? valor * totalParcelas 
  : valor;

preview.valorTotal = valorTotal;
```

#### 3. Adicionar Coluna na Tabela de Preview
**Arquivo:** `src/pages/cartoes/ImportarCompras.tsx`

Adicionar nova coluna "Total" entre "Valor" e "Responsável":

| # | Status | Data | Descrição | Parcela | Total | Responsável | Fatura | Tipo |
|---|--------|------|-----------|---------|-------|-------------|--------|------|

**Visualização:**
- **Compra única:** Mostra apenas o valor (coluna Total igual ao valor)
- **Compra parcelada:** Mostra o valor da parcela na coluna "Valor" e o total calculado na coluna "Total"

Para compras parceladas, a coluna "Total" mostrará:
```tsx
<TableCell className="text-right text-sm text-muted-foreground">
  {p.tipoLancamento === "parcelada" ? formatCurrency(p.valorTotal) : "-"}
</TableCell>
```

#### 4. Atualizar Estatísticas do Header
Considerar mostrar também o total real (soma dos valores totais) além do total de parcelas:

```typescript
const stats = useMemo(() => {
  const validas = previewData.filter((p) => p.valido);
  const invalidas = previewData.filter((p) => !p.valido);
  const totalParcelas = validas.reduce((sum, p) => sum + p.valor, 0);
  const totalCompras = validas.reduce((sum, p) => sum + p.valorTotal, 0);

  return { validas: validas.length, invalidas: invalidas.length, totalParcelas, totalCompras };
}, [previewData]);
```

### Exemplo Visual

Antes:
| Valor | Tipo |
|-------|------|
| R$ 175,00 | 4/8 |

Depois:
| Parcela | Total | Tipo |
|---------|-------|------|
| R$ 175,00 | R$ 1.400,00 | 4/8 |

### Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/services/importar-compras-cartao.ts` | Adicionar campo `valorTotal` na interface e calculá-lo no parsing |
| `src/pages/cartoes/ImportarCompras.tsx` | Adicionar coluna "Total" na tabela de preview e renomear "Valor" para "Parcela" |

---

### Seção Técnica

**Interface atualizada:**
```typescript
export interface PreviewCompra {
  linha: number;
  dataOriginal: string;
  dataCompra: Date | null;
  descricao: string;
  valor: number;          // Valor da parcela
  valorTotal: number;     // Valor total da compra
  // ... resto dos campos
}
```

**Cálculo no parsing:**
```typescript
const valorTotal = tipoLancamento === "parcelada" 
  ? valor * totalParcelas 
  : valor;
```

**Nova coluna na tabela:**
```tsx
<TableHead className="text-right">Parcela</TableHead>
<TableHead className="text-right">Total</TableHead>
```

```tsx
<TableCell className="text-right font-medium">
  {formatCurrency(p.valor)}
</TableCell>
<TableCell className="text-right text-sm">
  {p.tipoLancamento === "parcelada" ? (
    <span className="text-muted-foreground">{formatCurrency(p.valorTotal)}</span>
  ) : (
    <span>-</span>
  )}
</TableCell>
```
