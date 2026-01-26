

# Plano: Simplificar a Seção "Por Cartão"

## Objetivo

Tornar a seção de resumo por cartão mais compacta e menos "polida", removendo elementos decorativos excessivos e reduzindo o espaçamento.

## Situação Atual

A seção "Por Cartão" usa:
- Um `Card` container com `CardHeader` e `CardContent`
- Botões individuais com `p-3`, bordas coloridas e `ring-2` ao selecionar
- Texto do valor em `text-lg`
- Espaçamento `gap-3` entre os items

## Mudanças Propostas

### Antes (atual):
```text
┌─────────────────────────────────────────────────────────────────┐
│ Por Cartão                                                      │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │ ┌───────────────┐ │
│ │ Nubank   │ │ │ Inter    │ │ │ PicPay   │ │ │ Will Bank     │ │
│ │ R$ 3.254 │ │ │ R$ 1.442 │ │ │ R$ 308   │ │ │ R$ 75         │ │
│ └──────────┘ │ └──────────┘ │ └──────────┘ │ └───────────────┘ │
└──────────────┴──────────────┴──────────────┴───────────────────┘
```

### Depois (mais compacto):
```text
Por Cartão: Transações R$ 4.442 (11) • Nubank R$ 3.254 (66) • Inter R$ 1.442 (94) • PicPay R$ 308 (4) • Will Bank R$ 75 (1)
```

Ou como badges/chips inline:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Por Cartão                                                                  │
│ [Transações R$ 4.442] [Nubank R$ 3.254] [Inter R$ 1.442] [PicPay R$ 308]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Mudanças Técnicas

### Arquivo: `src/pages/DespesasFuturas.tsx`

Substituir o grid de cards por uma lista de chips/badges em linha:

**De (linhas 236-284):**
```tsx
<Card>
  <CardHeader className="pb-2">...</CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {/* Botões grandes com bordas */}
    </div>
  </CardContent>
</Card>
```

**Para:**
```tsx
<div className="flex flex-wrap items-center gap-2">
  <span className="text-sm text-muted-foreground flex items-center gap-1">
    <CreditCard className="h-4 w-4" />
    Por Cartão:
  </span>
  {resumoPorCartao.map((item) => (
    <button
      key={item.cartaoId || "transacao"}
      onClick={() => handleFiltrarCartao(item.cartaoId)}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 text-sm rounded-md border hover:bg-muted/50 transition-colors",
        (item.cartaoId === null && cartaoId === "transacao") ||
          (item.cartaoId && cartaoId === item.cartaoId)
          ? "ring-1 ring-primary bg-muted/30"
          : ""
      )}
      style={{ borderColor: item.cartaoCor || undefined }}
    >
      {item.cartaoId ? (
        <CreditCard className="h-3 w-3" style={{ color: item.cartaoCor }} />
      ) : (
        <Receipt className="h-3 w-3 text-muted-foreground" />
      )}
      <span className="font-medium">{item.cartaoNome}</span>
      <span className="text-expense font-semibold">{formatCurrency(item.total)}</span>
      <span className="text-muted-foreground text-xs">({item.quantidade})</span>
    </button>
  ))}
</div>
```

## Resultado Visual

Uma linha horizontal com chips clicáveis, cada um mostrando:
- Ícone do cartão (colorido)
- Nome do cartão
- Valor total
- Quantidade entre parênteses

## Benefícios

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Espaço vertical | ~120px | ~40px |
| Bordas | Grossas e coloridas | Sutis |
| Padding | `p-3` generoso | `px-2 py-1` compacto |
| Layout | Grid rígido | Flex wrap fluído |

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/DespesasFuturas.tsx` | Substituir grid de cards por linha de chips |

## Tempo Estimado

2-3 minutos para implementar.

