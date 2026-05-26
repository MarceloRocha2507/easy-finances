## Objetivo

Permitir que, no diálogo "Nova Compra" de um cartão Nubank, o usuário envie o arquivo CSV oficial da fatura (`date,title,amount`) e veja as compras extraídas no fluxo de revisão em lote já existente — exatamente como acontece hoje com prints de fatura.

## Por que não usar IA

O CSV do Nubank já é estruturado (`date,title,amount`). Mandar para a IA seria desperdício de tokens, mais lento e introduziria risco de alucinação. O parser será 100% local (TypeScript), determinístico e instantâneo.

## Mudanças

### 1. Novo parser local: `src/lib/nubankCsvParser.ts`
Função `parseNubankCsv(text: string): CompraExtraida[]` que:

- Lê o CSV (header `date,title,amount`).
- Para cada linha:
  - `date` (YYYY-MM-DD) → `data`.
  - `amount` negativo → `sinal: "credito"`, valor absoluto. Positivo → `sinal: "debito"`.
  - Detecta parcela no `title` usando o padrão `- Parcela X/Y` ou `- X/Y` no final (já existe lógica equivalente em `importar-compras-cartao.ts`, reaproveitar regex).
    - Marca `valor_eh_parcela = true`, preenche `parcela_atual`, `parcelas`.
  - Classifica `tipo`:
    - "Pagamento recebido" → `tipo: "pagamento"`, `sinal: "credito"`.
    - "Crédito de parcelamento de compra", "Estorno", "Reembolso" → `tipo: "estorno"`, `sinal: "credito"`.
    - "IOF" → `tipo: "iof"`.
    - "NuPay" / assinaturas recorrentes (Spotify, Claude, Adobe etc. — detectado por nome) → `tipo: "assinatura"` ou mantém "compra" (decidir manter "compra" para não inventar regra; o usuário já edita no lote).
    - Default → `tipo: "compra"`.
  - `estabelecimento` = título limpo (sem o sufixo "- Parcela X/Y", sem "Parcelamento de Compra - " inicial, sem "Pix no Crédito - " inicial — opcional, manter ou limpar? Decisão: **manter o título original** para fidelidade ao extrato, igual ao prompt do Tipo B atual).
  - `linha_original` = a linha bruta do CSV.

### 2. Aceitar CSV no `NovaCompraCartaoDialog.tsx`

- No input de upload (linha ~851), quando `isNubank()`, ampliar `accept` para `"image/*,.csv,text/csv"`.
- No handler do input, detectar `file.type === "text/csv"` ou extensão `.csv`:
  - Ler como texto (`file.text()`).
  - Chamar `parseNubankCsv(text)`.
  - Alimentar o fluxo existente: `setComprasLote(compras)` + `setLoteEhPicpay(false)` + toast com a contagem.
- Funciona tanto pelo botão "Ler comprovante" quanto pela área de "imagens pendentes" (se houver múltiplos arquivos, processar CSVs localmente e imagens via IA, depois mesclar em `comprasLote`).

### 3. Texto auxiliar na UI

- No label/botão de upload, quando for Nubank, indicar: "Aceita imagem ou CSV da fatura".

## Não muda

- A edge function `analisar-comprovante-cartao` permanece intacta — CSV nunca chega lá.
- O fluxo de revisão em lote (`RevisarComprasLoteDialog`) já cobre exibição/edição/salvamento — nenhuma alteração necessária.
- Importador em massa de `/cartoes/.../importar` (que usa outro formato com responsável) não é afetado.

## Pontos a confirmar

1. Para linhas tipo `Pix no Crédito - Fulano - 1/3`, o valor positivo representa um débito do titular (você emprestou via Pix parcelado). Tratar como `tipo: "compra"` parcelada, mesmo padrão de qualquer compra. OK?
2. Linhas "Crédito de parcelamento de compra" (negativas, sem descrição do estabelecimento original) devem entrar como `estorno`/crédito genérico no lote, para você associar manualmente. OK?
