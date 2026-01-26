
# Plano: Ajustar o Dialog de Edição para Refletir o Mês Atual

## Problema Atual

Quando você edita uma compra (ex: "Nortmotos - Parcela 4/4" em Março/2026):
- O campo "Mês da 1ª parcela" mostra **janeiro/2026** (o mês original da compra)
- Deveria refletir o contexto do mês que você está visualizando ou ajustar as opções para ficarem centradas nesse mês

## Análise

O `EditarCompraDialog` recebe a `parcela` que já contém:
- `mes_referencia`: O mês da parcela que está sendo visualizada (ex: "2026-03")
- `numero_parcela`: O número desta parcela (ex: 4)

Com essas informações, é possível calcular o "Mês da 1ª parcela" correto usando a lógica reversa:
```
mesInicio = mesReferencia - (numeroParcela - parcelaInicial)
```

## Solução

Existem duas opções. Proponho a **Opção A** por ser mais consistente:

### Opção A: Calcular o mês da 1ª parcela a partir do contexto (Recomendada)

Usar o `mes_referencia` da parcela para inferir qual deve ser o mês de início exibido, garantindo consistência com o que o usuário está vendo.

**Vantagem**: O usuário vê os dados que fazem sentido para o contexto atual.

### Opção B: Centralizar dropdown no mês atual

Manter os dados originais, mas garantir que o dropdown de meses esteja centrado no mês que a parcela pertence.

**Desvantagem**: Pode confundir se o mês original for muito diferente do atual.

## Mudanças Técnicas (Opção A)

### Arquivo: `src/components/cartoes/EditarCompraDialog.tsx`

1. **Usar `mes_referencia` da parcela como contexto**

Ao carregar os dados, calcular o `mesFatura` baseado no mês da parcela atual:

```typescript
// Linha ~145-156 - Alterar a lógica de carregamento
if (compra) {
  setDescricao(compra.descricao || "");
  setValorTotal(compra.valor_total || 0);
  setCategoriaId(compra.categoria_id || null);
  setResponsavelId(compra.responsavel_id || null);
  setTotalParcelas(compra.parcelas || 1);
  setParcelaInicial(String(compra.parcela_inicial || 1));
  
  // NOVO: Calcular mes_inicio a partir do mes_referencia da parcela
  // Isso garante que o dialog mostre dados consistentes com o contexto
  if (parcela?.mes_referencia) {
    // parcela.mes_referencia já é o mês correto desta parcela
    // Calcular o mês de início: mesReferencia - (numeroParcela - parcelaInicial)
    const parcelaAtual = parcela.numero_parcela;
    const parcelaInicialVal = compra.parcela_inicial || 1;
    const offset = parcelaAtual - parcelaInicialVal;
    
    const [ano, mes] = parcela.mes_referencia.split("-").map(Number);
    const mesInicioCalculado = new Date(ano, mes - 1 - offset, 1);
    setMesFatura(format(mesInicioCalculado, "yyyy-MM"));
  } else if (compra.mes_inicio) {
    // Fallback para o valor original
    const mesDate = new Date(compra.mes_inicio);
    setMesFatura(format(mesDate, "yyyy-MM"));
  }
}
```

2. **Centralizar opções de mês no contexto atual**

Alterar o `useMemo` de `opcoesMesFatura` para usar o mês da parcela como centro:

```typescript
const opcoesMesFatura = useMemo(() => {
  // Usar o mês da parcela como referência, ou hoje se não disponível
  const mesBase = parcela?.mes_referencia 
    ? new Date(parcela.mes_referencia + "-01")
    : new Date();
  
  const meses = [];
  for (let i = -12; i < 12; i++) {
    const mes = addMonths(mesBase, i);
    meses.push({
      value: format(mes, "yyyy-MM"),
      label: format(mes, "MMMM/yyyy", { locale: ptBR }),
    });
  }
  return meses;
}, [parcela?.mes_referencia]);
```

## Comportamento Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Editar "Parcela 4/4" em Mar/2026 (início dez/2025) | Mês 1ª parcela: "dezembro/2025" | Mês 1ª parcela: "dezembro/2025" (correto, calculado) |
| Editar "Parcela 1/1" em Mar/2026 | Mês 1ª parcela: "março/2026" | Mês 1ª parcela: "março/2026" |
| Dropdown de meses ao editar parcela de Mar/2026 | Centrado na data atual (jan/2026) | Centrado em Mar/2026 |

## Arquivos a Modificar

1. `src/components/cartoes/EditarCompraDialog.tsx`
   - Calcular `mesFatura` a partir do `mes_referencia` da parcela
   - Centralizar dropdown no mês da parcela

## Tempo Estimado

3-5 minutos para implementar.
