

## Problema

No `CartaoCard`, as datas de fechamento e vencimento sao calculadas de forma independente usando `calcularProximaOcorrenciaDia`, que retorna a proxima ocorrencia FUTURA de um dia. Para o Mercado Pago (fechamento dia 2, vencimento dia 9), em 03/03/2026:

- `calcularProximaOcorrenciaDia(2)` → dia 2 ja passou → retorna **02/04/2026**
- `calcularDataVencimentoCartao(02/04, 2, 9)` → 9 > 2, mesmo mes → **09/04/2026**

Resultado: mostra abril, mas a fatura de marco fechou dia 2 e ainda vence dia 9 (daqui 6 dias). O usuario precisa ver as datas do ciclo ATIVO, nao do proximo ciclo.

## Logica correta

O cartao tem um ciclo: fecha no dia X, vence no dia Y. Se hoje esta ENTRE o fechamento e o vencimento do ciclo atual, deve mostrar as datas desse ciclo (fechamento ja passou, vencimento ainda por vir). So avanca para o proximo ciclo quando o vencimento tambem ja passou.

## Alteracoes

### 1. `src/lib/dateUtils.ts` — nova funcao `calcularCicloAtualCartao`

Adicionar funcao que calcula o ciclo ativo do cartao:

```typescript
export function calcularCicloAtualCartao(
  diaFechamento: number,
  diaVencimento: number,
  base = new Date()
): { dataFechamento: Date; dataVencimento: Date } {
  // Calcula o fechamento mais recente (passado ou hoje)
  // e o proximo fechamento, depois determina qual ciclo esta ativo
  // baseado em se o vencimento desse ciclo ja passou ou nao
}
```

Logica:
- Calcular fechamento do mes atual e do mes anterior
- Para cada fechamento, calcular o vencimento correspondente
- Se o vencimento do ciclo anterior ainda nao passou → usar ciclo anterior
- Caso contrario → usar ciclo atual (proximo fechamento)

### 2. `src/components/cartoes/CartaoCard.tsx` — usar nova funcao

Substituir o `useMemo` (linhas 82-97) para usar `calcularCicloAtualCartao` em vez de `calcularProximaOcorrenciaDia` + `calcularDataVencimentoCartao` separadamente.

### Resultado esperado (03/03/2026, Mercado Pago, fech=2, venc=9)

- Fechamento: 02/03/2026 (em -1 dia → "passou")
- Vencimento: 09/03/2026 (em 6 dias)

