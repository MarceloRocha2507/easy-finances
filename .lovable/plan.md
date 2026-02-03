
# Correção: Data de Vencimento do Cartão

## Problema Identificado

O cartão "Mercado Pago" está configurado com:
- Fechamento: dia 2
- Vencimento: dia 9

O sistema está mostrando:
- Fechamento: 02/03/2026 (correto)
- Vencimento: 09/02/2026 (incorreto - deveria ser 09/03/2026)

### Causa Raiz

A função `proximaOcorrenciaDia` calcula cada data de forma independente:

```text
Hoje: 03/02/2026

Fechamento (dia 2):
  - Dia 2 já passou em fevereiro
  - Próxima ocorrência: 02/03/2026 ✓

Vencimento (dia 9):
  - Dia 9 ainda não passou em fevereiro
  - Próxima ocorrência: 09/02/2026 ✗
```

O problema é que o vencimento está sendo calculado sem considerar que ele deve vir **após** o fechamento. Se a fatura fecha dia 2 de março, o vencimento dia 9 deve ser em março também.

## Solucao

Modificar a lógica para garantir que o vencimento sempre ocorra **no mesmo mês ou após** o fechamento.

### Lógica Corrigida

```text
1. Calcular próxima data de fechamento
2. Calcular data de vencimento:
   - Se dia_vencimento > dia_fechamento:
     → Vencimento no mesmo mês do fechamento
   - Se dia_vencimento <= dia_fechamento:
     → Vencimento no mês seguinte ao fechamento
```

### Exemplos

| Fechamento | Vencimento | Hoje | Resultado |
|------------|------------|------|-----------|
| Dia 2 | Dia 9 | 03/02 | Fecha 02/03, Vence 09/03 |
| Dia 15 | Dia 5 | 03/02 | Fecha 15/02, Vence 05/03 |
| Dia 25 | Dia 10 | 03/02 | Fecha 25/02, Vence 10/03 |
| Dia 5 | Dia 12 | 03/02 | Fecha 05/02, Vence 12/02 |

## Alteracao Tecnica

**Arquivo:** `src/components/cartoes/CartaoCard.tsx`

### Modificar o useMemo (linhas 109-119)

**Codigo atual:**
```typescript
const { dataFechamento, dataVencimento, diasFechamento, diasVencimento } = useMemo(() => {
  const fechamento = proximaOcorrenciaDia(cartao.dia_fechamento);
  const vencimento = proximaOcorrenciaDia(cartao.dia_vencimento);

  return {
    dataFechamento: fechamento,
    dataVencimento: vencimento,
    diasFechamento: diasAte(fechamento),
    diasVencimento: diasAte(vencimento),
  };
}, [cartao.dia_fechamento, cartao.dia_vencimento]);
```

**Codigo corrigido:**
```typescript
const { dataFechamento, dataVencimento, diasFechamento, diasVencimento } = useMemo(() => {
  const fechamento = proximaOcorrenciaDia(cartao.dia_fechamento);
  
  // Calcular vencimento baseado na data de fechamento
  let vencimento: Date;
  
  if (cartao.dia_vencimento > cartao.dia_fechamento) {
    // Vencimento no mesmo mês do fechamento
    const diaVenc = clampDiaNoMes(
      fechamento.getFullYear(), 
      fechamento.getMonth(), 
      cartao.dia_vencimento
    );
    vencimento = new Date(fechamento.getFullYear(), fechamento.getMonth(), diaVenc);
  } else {
    // Vencimento no mês seguinte ao fechamento
    const proxMes = new Date(fechamento.getFullYear(), fechamento.getMonth() + 1, 1);
    const diaVenc = clampDiaNoMes(
      proxMes.getFullYear(), 
      proxMes.getMonth(), 
      cartao.dia_vencimento
    );
    vencimento = new Date(proxMes.getFullYear(), proxMes.getMonth(), diaVenc);
  }

  return {
    dataFechamento: fechamento,
    dataVencimento: vencimento,
    diasFechamento: diasAte(fechamento),
    diasVencimento: diasAte(vencimento),
  };
}, [cartao.dia_fechamento, cartao.dia_vencimento]);
```

## Resumo das Modificacoes

| Arquivo | Linhas | Alteracao |
|---------|--------|-----------|
| `src/components/cartoes/CartaoCard.tsx` | 109-119 | Corrigir cálculo de vencimento baseado no fechamento |

## Resultado Esperado

Para o cartão Mercado Pago (fecha dia 2, vence dia 9):
- Fechamento: 02/03/2026 ✓
- Vencimento: 09/03/2026 ✓ (corrigido)

O vencimento agora sempre será calculado em relação à data de fechamento, garantindo que a fatura vença após fechar.
