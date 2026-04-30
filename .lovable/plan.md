
# Corrigir status do badge dos cartões na página /cartoes

## Problema
Quando a fatura do mês selecionado está paga, o sistema avança o card para mostrar o valor e mês da próxima fatura (ex: Maio), mas o **badge de status** continua "Paga" porque é calculado em relação ao mês atual, não ao mês exibido.

## Mudanças

**1. `src/services/cartoes.ts`** — adicionar campo `statusFaturaExibida` ("paga" | "fechada" | "aberta") calculado a partir de `mesExibicao`:
- Mês exibido é futuro → `"aberta"` (ainda não fechou)
- Mês exibido é o atual e `dia_fechamento` já passou → `"fechada"`
- Caso totalmente quitado sem fatura futura → `"paga"`
- Caso contrário → `"aberta"`

**2. `src/pages/Cartoes.tsx`** — substituir o cálculo inline do badge (linhas 358–367) para usar `cartao.statusFaturaExibida`.

## Resultado
Cartões cuja fatura do mês atual já foi paga exibirão o mês seguinte (ex: Maio) com badge **"Aberta"**, em vez de "Paga".
