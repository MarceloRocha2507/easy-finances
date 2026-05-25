## Cálculo detalhado da fatura PicPay

Adicionar, no fluxo de importação de fatura PicPay via foto, um **breakdown das 5 regras** + **validação contra o "Lançamentos" do Resumo**, sem mudar a UX de outros bancos.

## Onde aparece

`RevisarComprasLoteDialog` (dialog que já abre depois da IA extrair as compras do print da fatura PicPay). Antes da lista atual de itens, um novo bloco **"Cálculo da fatura"** mostra:

- Subtotais por regra (1 à vista, 2 parcelas anteriores, 3 Fin+IOF, 4 riscadas sem crédito, 5 pagamentos)
- Itens ignorados (riscadas com crédito + Credito Parcelamento Compra)
- **Total calculado** vs **Lançamentos (Resumo)** com badge verde/vermelho de divergência
- Campo editável de **Saldo da fatura anterior** (pré-preenchido pela IA, usuário pode corrigir)
- Campo editável de **Lançamentos** (pré-preenchido pela IA, para validação)

Quando o usuário edita os campos do Resumo, o cálculo e o tratamento dos pagamentos (Regra 5) recalculam ao vivo.

## Mudanças

### 1. Edge function `supabase/functions/analisar-comprovante-cartao/index.ts`

- No `picpayRules` do prompt: instruir a IA a **incluir** itens `pagamento_fatura` no array (hoje são descartados) e extrair dois campos novos do bloco Resumo:
  - `saldo_fatura_anterior` (numérico, do "Saldo da fatura anterior")
  - `lancamentos_resumo` (numérico, do campo "Lançamentos")
- Adicionar esses dois campos ao tool schema e ao response JSON.
- Remover, **somente para PicPay**, o filtro `tipo !== "pagamento_fatura"` (linha 359) para que os pagamentos cheguem ao frontend e a Regra 5 possa rodar lá. Para outros bancos, mantém o comportamento atual.

### 2. Nova lib `src/lib/picpayFaturaCalc.ts`

Função pura `calcularFaturaPicpay(compras, saldoAnterior)` que retorna:

```
{
  regra1_avista: { itens, total },
  regra2_parcelas: { itens, total },
  regra3_fin_iof: { itens, total },
  regra4_riscadas_sem_credito: { itens, total },
  regra5_pagamento: { ignorado?, aplicado?, total },
  ignorados: { riscadasComCredito, creditosParcelamento },
  total_calculado
}
```

Regras (idênticas ao prompt do usuário):

- **R1** – `tipo==="compra"`, `!riscada`, `parcela_atual===1` e `parcelas===1`, sem prefixo "Fin" → soma valor.
- **R2** – `tipo==="compra"`, `!riscada`, com sufixo `parcXX/YY` (regex) sem prefixo "Fin" → soma valor.
- **R3** – itens "Fin … parc01/N" (`parcela_atual===1`, `parcelas>1`, regex `\bfin\b`) → soma valor. Para cada Fin, soma também os IOFs (`tipo==="iof"`) imediatamente próximos.
- **R4** – `riscada===true` E **não existe** crédito (`tipo==="estorno_parcelamento"` ou linha "Credito Parcelamento Compra") com mesmo valor (±0,02) → soma valor.
- **R5** – `tipo==="pagamento_fatura"`:
  - se `saldoAnterior === 0` e há ≥2 pagamentos → ignora o de **maior** valor, subtrai apenas o **menor**.
  - se há apenas 1 pagamento → subtrai esse.
  - se `saldoAnterior > 0` → subtrai **todos** (já que nenhum quitou fatura anterior).
- **Ignorados** – riscadas com crédito correspondente + os próprios "Credito Parcelamento Compra" (já marcados `ignorar=true` pela pós-validação que já existe no edge).

### 3. Novo componente `src/components/cartoes/FaturaPicpayBreakdown.tsx`

Renderiza o resultado da lib acima dentro do `RevisarComprasLoteDialog`:

- 5 linhas com label, contagem de itens e subtotal (estilo premium fintech: `#F9FAFB` bg, borda `#E5E7EB`, sem sombras).
- 2 inputs inline pequenos: "Saldo fatura anterior" e "Lançamentos (Resumo)".
- Card final destacado: **Total calculado** vs **Lançamentos** com badge:
  - verde "Bate" quando `|diff| < 0,02`
  - vermelho "Divergência: R$ X,XX" caso contrário, com tooltip listando as 4 checagens sugeridas (riscada sem crédito, pagamento, IOF, par compra/crédito).
- Accordion "Ver itens ignorados" lista riscadas+créditos cancelados.

### 4. Integração no `RevisarComprasLoteDialog`

- Detectar se é PicPay (já temos a flag `picpay` no fluxo de envio).
- Se sim e a IA devolveu os campos novos, renderizar `FaturaPicpayBreakdown` no topo do dialog.
- Estado local `saldoAnterior` e `lancamentosResumo` inicializados com o que veio da IA, editáveis.
- Recalcular `useMemo` ao mudar qualquer um.
- A lista existente de compras e a importação continuam funcionando como hoje (o breakdown é informativo, não muda o que é gravado).

## Fora do escopo

- Não alterar o fluxo de outros bancos (Nubank, genérico).
- Não criar página dedicada nem rota nova.
- Não persistir o "saldo anterior" / "lançamentos" no banco — uso apenas durante a revisão.
- Não mudar o que é efetivamente importado: a Regra 3 já marca `ignorar=true` na raiz/crédito hoje. O breakdown só **mostra** o cálculo para conferência.

## Arquivos

- `supabase/functions/analisar-comprovante-cartao/index.ts` — prompt + tool schema + remoção do filtro de pagamento para PicPay
- `src/lib/picpayFaturaCalc.ts` (novo) — função pura de cálculo
- `src/components/cartoes/FaturaPicpayBreakdown.tsx` (novo) — UI do breakdown
- `src/components/cartoes/RevisarComprasLoteDialog.tsx` — integrar o breakdown
