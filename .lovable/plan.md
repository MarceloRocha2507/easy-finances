# Plano: alinhar análise de fatura às 5 regras de composição

Vou reescrever o prompt da edge function `analisar-comprovante-cartao` e ajustar a validação local para refletir exatamente a fórmula da fatura que você descreveu.

## O que muda

### 1. `supabase/functions/analisar-comprovante-cartao/index.ts` — systemPrompt

Substituir o bloco de regras atual por uma seção estruturada nas **5 categorias** da fatura:

1. **Compras à vista** → `tipo: "compra"`, `parcelas: 1`, `valor_eh_parcela: false`, valor cheio.
2. **Parcelas de meses anteriores** ("Parcela X de Y", "X/Y") → `tipo: "compra"`, `parcelas: Y`, `parcela_atual: X`, `valor_eh_parcela: true`, valor da linha = valor da parcela.
3. **Parcelamentos novos PicPay (trio Fin)** — quando aparece o trio na mesma fatura:
   - (a) Compra raiz original → marcar `ignorar: true`, `tipo: "compra_substituida"` (ou omitir se já estiver visivelmente riscada).
   - (b) "Credito Parcelamento Compra" → marcar `ignorar: true`, `tipo: "estorno_parcelamento"` (líquido já está coberto por a+c, não precisa entrar).
   - (c) "Fin <Nome> parc01/MM" + IOF → entram normalmente (`valor_eh_parcela: true` para o Fin, `tipo: "iof"` para os IOF).
4. **Compras riscadas SEM crédito correspondente na mesma fatura** → entram pelo valor cheio (`tipo: "compra"`, `ignorar: false`). Novo campo `riscada_sem_credito: true` para sinalizar na revisão.
5. **Pagamento de Fatura** (verde, dentro do ciclo) → sempre filtrar (já filtrado). Adicionar campo `eh_pagamento_parcial: true` opcional para que o frontend possa exibir/subtrair se quiser; por padrão NÃO entra no array de compras.

### 2. Detecção do "trio Fin" no backend

Hoje a regra depende 100% da IA marcar `ignorar` certo. Vou adicionar uma **pós-validação determinística** em JS:

- Agrupar itens por nome base (ex.: "Espetinhos" de "Fin Espetinhos parc01/02" bate com raiz "Espetinhosbom" via prefixo normalizado).
- Se existir simultaneamente: raiz (`tipo: compra`, valor V) + `estorno_parcelamento` de valor ≈ V + `Fin` com parc 01/N → forçar `ignorar=true` na raiz e no crédito, manter apenas Fin + IOF.
- Se existir raiz riscada SEM crédito de mesmo valor → manter raiz (regra 4), marcar `riscada_sem_credito=true`.

A IA continua extraindo tudo; a regra de composição vira responsabilidade do backend, mais confiável.

### 3. Novos campos no schema da tool call

Adicionar em `parameters.properties.compras.items.properties`:
- `riscada` (boolean) — texto visualmente tachado.
- `riscada_sem_credito` (boolean, preenchido pela pós-validação).
- `eh_pagamento_parcial` (boolean).

E em `required`, manter apenas o que a IA precisa retornar (`riscada` opcional).

### 4. `src/components/cartoes/RevisarComprasLoteDialog.tsx`

- Estender a interface `CompraExtraida` com `riscada`, `riscada_sem_credito`, `tipo: "estorno_parcelamento" | "compra_substituida" | ...`.
- Exibir badge "Riscada sem crédito ainda" quando `riscada_sem_credito=true` para o usuário decidir se mantém.
- Itens com `ignorar=true` já vêm desmarcados por padrão, mostrando o motivo ("Substituída por parcelamento Fin").

## O que NÃO muda

- Não mexo na regra de coerção de valor / `chooseMostReliableValue` — ela continua válida.
- Frontend `NovaCompraCartaoDialog` (single image) não muda — fluxo de lote (`RevisarComprasLoteDialog`) é o que precisa dos novos campos.
- Política de privacidade da imagem (zero-persistência) permanece.

## Detalhes técnicos

```text
Fórmula validada no backend após extração:

  válidos = compras.filter(c => !c.ignorar && c.tipo !== "pagamento_fatura")

  Total esperado = Σ válidos.valor_efetivo
    onde valor_efetivo:
      - compra à vista        → valor
      - parcela anterior      → valor (já é da parcela)
      - Fin parc 01/N         → valor (1ª parcela)
      - IOF                   → valor
      - riscada sem crédito   → valor
```

Pergunta antes de eu começar: você quer que eu **mostre na tela de revisão** uma linha somatória conferindo "Total esperado da fatura"? Isso ajudaria a bater o número antes do import, mas adiciona uma seção nova ao dialog. Se preferir manter enxuto, deixo só os badges por item.
