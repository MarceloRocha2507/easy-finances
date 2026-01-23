
## Plano: Criar Compras Parceladas Completas na Importação

### O Problema
Quando o usuário importa uma linha como:
```
2026-01-05,Nortmotos - Parcela 4/8,175.00 eu
```

O sistema está passando:
- `valorTotal: 175.00` (valor da parcela individual)
- `parcelas: 8`
- `parcelaInicial: 4`

Mas a função `criarCompraCartao` espera:
- `valorTotal: 1400.00` (valor TOTAL da compra = 175 × 8)

Isso faz com que cada parcela criada tenha valor de `1400 / 8 = 175` ✓, mas o registro da compra fica com `valor_total: 175` (incorreto).

### A Solução
Calcular o `valorTotal` corretamente na importação:

```
valorTotal = valorParcela × totalParcelas
```

Para "Parcela 4/8" com valor 175:
- `valorTotal = 175 × 8 = 1400`

### Alteração no Arquivo

**Arquivo:** `src/services/importar-compras-cartao.ts`

**Mudança na função `importarComprasEmLote` (linhas 390-401):**

```typescript
// ANTES (bug):
const input: CompraCartaoInput = {
  cartaoId,
  descricao: compra.descricao,
  valorTotal: compra.valor,  // ← valor da parcela
  parcelas: compra.parcelas,
  parcelaInicial: compra.parcelaInicial,
  // ...
};

// DEPOIS (corrigido):
// Para compras parceladas, calcular o valor total
// valorTotal = valorDaParcela × totalDeParcelas
const valorTotal = compra.tipoLancamento === "parcelada" 
  ? compra.valor * compra.parcelas 
  : compra.valor;

const input: CompraCartaoInput = {
  cartaoId,
  descricao: compra.descricao,
  valorTotal: valorTotal,  // ← agora é o valor total correto
  parcelas: compra.parcelas,
  parcelaInicial: compra.parcelaInicial,
  // ...
};
```

### Exemplo Prático

| Linha CSV | Valor no CSV | Tipo | Cálculo | valorTotal |
|-----------|--------------|------|---------|------------|
| `Nortmotos - Parcela 4/8,175.00 eu` | 175.00 | parcelada | 175 × 8 | 1400.00 |
| `IOF de compra internacional,0.16 eu` | 0.16 | unica | 0.16 × 1 | 0.16 |
| `Anthropic,10.41 eu` | 10.41 | unica | 10.41 × 1 | 10.41 |

### Comportamento Após a Correção

Para `Nortmotos - Parcela 4/8,175.00 eu`:

1. **Compra criada:**
   - `descricao: "Nortmotos - Parcela 4/8"`
   - `valor_total: 1400.00`
   - `parcelas: 8`
   - `parcela_inicial: 4`

2. **Parcelas criadas (5 parcelas, da 4 até a 8):**
   | Parcela | Valor | Mês Referência |
   |---------|-------|----------------|
   | 4/8 | R$ 175 | 2026-02 (fev) |
   | 5/8 | R$ 175 | 2026-03 (mar) |
   | 6/8 | R$ 175 | 2026-04 (abr) |
   | 7/8 | R$ 175 | 2026-05 (mai) |
   | 8/8 | R$ 175 | 2026-06 (jun) |

### Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/services/importar-compras-cartao.ts` | Calcular `valorTotal` multiplicando o valor da parcela pelo total de parcelas para compras parceladas |

---

### Seção Técnica

**Código final da correção:**

```typescript
// Em importarComprasEmLote, antes de criar o input:

// Para compras parceladas, o CSV mostra o valor de UMA parcela
// Precisamos calcular o valor total da compra
const valorTotal = compra.tipoLancamento === "parcelada" 
  ? compra.valor * compra.parcelas 
  : compra.valor;

const input: CompraCartaoInput = {
  cartaoId,
  descricao: compra.descricao,
  valorTotal,
  parcelas: compra.parcelas,
  parcelaInicial: compra.parcelaInicial,
  mesFatura: new Date(compra.mesFatura + "-01T12:00:00"),
  tipoLancamento: compra.tipoLancamento,
  dataCompra: compra.dataCompra,
  responsavelId: compra.responsavelId,
};
```
