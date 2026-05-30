// Edge function: analisar-comprovante-cartao
// Recebe uma imagem (base64) e usa Lovable AI Gateway para extrair UMA OU MAIS compras.
//
// POLÍTICA DE PRIVACIDADE DA IMAGEM:
// - A imagem trafega APENAS em memória durante esta requisição.
// - NÃO é gravada em storage, bucket, tabela, cache ou disco.
// - NUNCA logue `imageBase64`, `dataUrl` ou `body` em console.log/console.error.
//   Apenas metadados seguros (mimeType, tamanho em bytes, status HTTP).
// - As referências são liberadas explicitamente antes do return.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_BASE64_SIZE = 8 * 1024 * 1024; // ~6MB de imagem

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (
      !body ||
      (!body.imageBase64 && !body.text) ||
      (body.imageBase64 && typeof body.imageBase64 !== "string") ||
      (body.imageBase64 && typeof body.mimeType !== "string")
    ) {
      return new Response(JSON.stringify({ error: "imageBase64 + mimeType OU text são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64, mimeType, text: rawText } = body as { imageBase64?: string; mimeType?: string; text?: string };
    const isPicpay = body?.picpay === true;
    const isNubank = body?.nubank === true;

    const anoAtual = new Date().getFullYear(); // ex.: 2026

    if (imageBase64 && imageBase64.length > MAX_BASE64_SIZE) {
      return new Response(JSON.stringify({ error: "Imagem muito grande (máx ~6MB)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (imageBase64 && !/^image\/(png|jpeg|jpg|webp|heic|heif)$/i.test(mimeType!)) {
      return new Response(JSON.stringify({ error: "Formato de imagem não suportado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // dataUrl remoted, we use conditionally in the fetch body

    const picpayRules = `

## COMPOSIÇÃO DA FATURA PICPAY (5 categorias)

Fatura final = (1) compras à vista + (2) parcelas de meses anteriores + (3) 1ª parcela Fin + IOF + (4) compras riscadas SEM crédito ainda − (5) pagamento parcial recebido.

### 1) Compras à vista
Sem indicação de parcela. → tipo="compra", parcelas=1, parcela_atual=1, valor_eh_parcela=false. Valor cheio.

### 2) Parcelas de compras anteriores
"Parcela X de Y", "X/Y", "parc XX/YY" SEM prefixo "Fin". → tipo="compra", parcelas=Y, parcela_atual=X, valor_eh_parcela=true. Valor mostrado JÁ É a parcela (NÃO multiplique).

### 3) Parcelamentos novos PicPay (trio "Fin")
Quando o usuário parcela uma compra já lançada, aparecem 3 movimentos na MESMA fatura:
  (a) Compra raiz original (normalmente RISCADA) → tipo="compra_substituida", ignorar=true, riscada=true.
  (b) "Credito Parcelamento Compra" (verde, com seta ←) → tipo="estorno_parcelamento", sinal="credito", ignorar=true. NÃO entra (já compensa a raiz).
  (c) "Fin <Nome> parcNN/MM" + "IOF Diario Parcelado" / "IOF Adicional Parcelado" → ENTRAM normalmente.
     - Fin: tipo="compra", estabelecimento=<Nome>, parcelas=MM, parcela_atual=NN, valor_eh_parcela=true, ignorar=false.
     - IOF: tipo="iof", parcelas=1, valor_eh_parcela=false, ignorar=false.

### 4) Compras RISCADAS SEM crédito correspondente
Linha tachada SEM "Credito Parcelamento Compra" de valor igual na mesma fatura. → tipo="compra", riscada=true, ignorar=false, valor_eh_parcela=false. Valor cheio permanece.

### 5) Pagamento de Fatura
Linhas verdes "Pagamento de Fatura"/"Pagamento recebido". → tipo="pagamento_fatura", sinal="credito". INCLUA no array (o frontend aplica a Regra 5 baseada no saldo da fatura anterior).

### Resumo da fatura (campos extras no nível raiz)
Procure o bloco "Resumo" da fatura e preencha (se visíveis):
- saldo_fatura_anterior: valor numérico do "Saldo da fatura anterior" (ex.: "R$ 0,00" → 0).
- lancamentos_resumo: valor numérico do campo "Lançamentos" do Resumo.
Se algum não estiver visível, omita o campo.

### ✅ CHECKLIST OBRIGATÓRIO ANTES DE FINALIZAR A RESPOSTA
1. Releia a imagem de CIMA para BAIXO procurando QUALQUER texto em VERDE (Pagamento de Fatura, Credito Parcelamento Compra) e QUALQUER texto TACHADO/RISCADO.
2. Itens verdes → devem estar no array com sinal="credito". Itens tachados → devem estar com riscada=true.
3. CONTE: número de linhas verdes visíveis DEVE IGUALAR ao número de itens com sinal="credito" no array. Se não bater, adicione os que faltam ANTES de responder.
4. "Credito Parcelamento Compra" com seta ← aparece várias vezes seguidas no mesmo dia — extraia TODAS, uma por uma.
5. NUNCA omita "Pagamento de Fatura" mesmo que pareça repetido ou técnico.`;

    const nubankRules = `

## REGRAS NUBANK

A entrada pode ser de DOIS tipos. Identifique antes de extrair:

### ⚠️ ATENÇÃO VISUAL — LINHAS VERDES (LEIA ANTES DE TUDO)

O app do Nubank usa TEMA ESCURO. Nele, TODA linha cujo valor está em **verde** OU cujo valor começa com sinal "–" / "-" / "− R$" é um LANÇAMENTO VÁLIDO e DEVE ser extraída no array "compras" com sinal="credito".

Essas linhas têm o MESMO peso visual que compras normais (mesmo tamanho de fonte, mesma posição na lista) — NÃO são cabeçalho, NÃO são resumo, NÃO são decoração. NÃO PODEM ser ignoradas.

Os textos típicos em verde no Nubank são:
- "Pagamento recebido" / "Pagamento de fatura" → tipo="pagamento_fatura"
- "Crédito de parcelamento de compra" → tipo="estorno_parcelamento" (a descrição costuma quebrar em 2 ou 3 linhas: "Crédito de" / "parcelamento de" / "compra" — trate sempre como UMA única linha lógica)
- "Estorno X" / "Reembolso X" / "Crédito <Estabelecimento>" → tipo="estorno"
- "Pix no Crédito - <nome>" / "Pix no credito - <nome>" → isso é USO DO LIMITE DO CARTÃO, então classifique como tipo="compra", sinal="debito". A palavra "Crédito" aqui faz parte do nome do produto e NÃO indica estorno/crédito.

Para TODAS essas: valor = número absoluto positivo, sinal = "credito", data = cabeçalho de data acima da linha.

### COMO A FATURA DO NUBANK FUNCIONA (contexto OBRIGATÓRIO)



A fatura do Nubank tem 3 grandes grupos de lançamentos:

1) **Débitos (gastos)**
   - **Compra à vista:** entra pelo valor cheio em UM único lançamento.
   - **Compra parcelada de origem:** entra parcela por parcela, UMA por mês. O valor da linha já é o da PARCELA.
   - **Parcelamento interno do banco:** quando o usuário parcela DEPOIS uma compra que já estava à vista nesta fatura, o Nubank faz DOIS lançamentos:
     a. **Estorna o valor original** com a descrição "Crédito de parcelamento de compra" (linha negativa/verde) → cancela a compra à vista.
     b. **Cria as parcelas mensais** ("Parcelamento de Compra - <Estabelecimento> - Parcela X/Y") que passam a aparecer mês a mês.

2) **Créditos / estornos** (linhas negativas ou verdes)
   - "Estorno", "Reembolso", "Crédito" do comerciante → reduz a fatura.
   - "Crédito de parcelamento de compra" → estorno técnico do item 1c acima. NÃO é estorno de comerciante.

3) **Pagamentos** (linhas negativas verdes "Pagamento recebido" / "Pagamento de fatura")
   - Pode ser o pagamento da fatura do mês ANTERIOR, ou
   - Um ADIANTAMENTO da fatura atual (distinguível pela data: se for antes do fechamento e não houver fatura anterior em aberto, é adiantamento).
   - NUNCA é uma compra. Sempre tipo="pagamento_fatura", sinal="credito".

**Fórmula mental:** valor real da fatura = soma dos débitos − créditos de parcelamento − estornos − pagamentos/adiantamentos.

Seu trabalho é apenas EXTRAIR fielmente cada linha com a classificação correta. O frontend faz a matemática.

### TIPO A — TELA DE DETALHE DE UMA ÚNICA COMPRA
Características:
- Título grande no topo = nome do estabelecimento (ex.: "Pg *Even3 Ixhq").
- Linha "R$ X,XX" em destaque = VALOR TOTAL DA COMPRA.
- Linha "em Nx de R$ Y,YY" logo abaixo = parcelamento (N parcelas de Y).
- Badge "Compra parcelada" e bloco "Parcelas: Nx de R$ Y,YY" / "0 de N pagas".
- Pode aparecer data por extenso (ex.: "Segunda-feira, 25 de Maio de 2026, 18:59").

Extração (UMA única compra):
- tipo="compra", sinal="debito".
- valor = VALOR TOTAL (R$ X,XX em destaque, NÃO o valor da parcela).
- parcelas = N (de "em Nx de R$ Y").
- parcela_atual = 1.
- valor_eh_parcela = FALSE.
- estabelecimento = título grande no topo.
- data = converta a data por extenso para YYYY-MM-DD se visível; senão use hoje.
- linha_original = inclua AS DUAS LINHAS exatas: "R$ X,XX" e "em Nx de R$ Y,YY".
- valor_texto = "R$ X,XX" (TOTAL).

### TIPO B — LISTA / EXTRATO DE FATURA (várias compras)
Características:
- Várias transações empilhadas verticalmente.
- Datas aparecem como CABEÇALHO de grupo (ex.: "25 MAI", "26 MAI", "Hoje", "Ontem", "Segunda-feira").
- Cada item tem: nome do estabelecimento, opcionalmente uma categoria/subtítulo, e o valor à direita ou abaixo.
- Pode incluir linhas tipo "Parcela X de Y" ou "X/Y" abaixo do nome.
- Valores negativos / verdes / com sinal "+" = créditos (estornos, pagamentos recebidos, créditos de parcelamento).

Extração (UMA compra POR linha de transação — extraia TODAS):
- estabelecimento = nome principal da linha (NÃO use a categoria/subtítulo).
- valor = valor monetário daquela linha. Para "R$ 1.234,56" → 1234.56. SEMPRE positivo (o sinal vai em "sinal").
- data = use o CABEÇALHO de data ACIMA daquela linha. Converta para YYYY-MM-DD usando o ano ${anoAtual} quando o cabeçalho mostrar apenas dia/mês (ex.: "26 MAI" → ${anoAtual}-05-26). NUNCA use um ano anterior ao ${anoAtual} para datas sem ano explícito. "Hoje" = hoje. "Ontem" = ontem.
- Se a linha contiver "Parcela X de Y", "Parcela X/Y" ou terminar com "- X/Y" (ex: "Pix no Crédito - NOME - 1/8", "Mercadolivre*Cartola - Parcela 1/10"):
  - parcelas = Y, parcela_atual = X, valor_eh_parcela = TRUE (valor mostrado é APENAS daquela parcela — NÃO multiplique).
  - estabelecimento = texto SEM o sufixo de parcela (ex: "Pix no Crédito - NOME" sem o "- 1/8").
- Caso contrário: parcelas = 1, parcela_atual = 1, valor_eh_parcela = FALSE.

**Classificação do tipo (use EXATAMENTE estes valores):**
- "pagamento_fatura" + sinal="credito" → linhas "Pagamento recebido" / "Pagamento de fatura". **SEMPRE extraia** — não filtre, não pule. O frontend decide o que fazer com elas.
- "estorno_parcelamento" + sinal="credito" → linhas "Crédito de parcelamento de compra" (estorno técnico quando o usuário parcelou depois). **SEMPRE extraia, mesmo que apareçam várias seguidas no mesmo dia.** NÃO classifique como "estorno" comum.
- "estorno" + sinal="credito" → "Estorno", "Reembolso", "Crédito <Estabelecimento>" do comerciante.
- "compra" + sinal="debito" → linhas "Pix no Crédito - <nome>". Mesmo contendo a palavra "Crédito", isso é uma compra/cobrança usando o limite do cartão.
- "iof" → linhas "IOF".
- "anuidade" → linhas "Anuidade".
- "juros" → linhas "Juros".
- "encargo" → outros encargos.
- "compra" → tudo o mais (incluindo "Parcelamento de Compra - <X> - Parcela N/M", que é uma compra parcelada normal).

**Regras de sinal:**
- sinal="credito" SOMENTE se: texto contém "Estorno", "Pagamento recebido", "Pagamento de fatura", "Crédito de parcelamento", "Reembolso", "Crédito <Estab>", OU o valor tem sinal negativo / "+" / aparece em verde.
- EXCEÇÃO OBRIGATÓRIA: "Pix no Crédito" NUNCA deve virar sinal="credito" só por conter a palavra "Crédito".
- Caso contrário: sinal="debito".

- linha_original = copie o bloco de texto exato da transação (estabelecimento + parcela + valor).
- valor_texto = valor exatamente como aparece (ex.: "R$ 89,90", "-R$ 50,00").

IMPORTANTE: NUNCA invente compras. Se a imagem/texto tiver 3 linhas, retorne 3 compras. Se tiver 15, retorne 15. NÃO agrupe nem resuma. NÃO faça a matemática da fatura — apenas extraia.

### ✅ CHECKLIST OBRIGATÓRIO ANTES DE FINALIZAR A RESPOSTA
1. Releia a imagem de CIMA para BAIXO procurando QUALQUER texto em verde OU QUALQUER valor com prefixo "–" / "-" / "− R$".
2. Para CADA ocorrência encontrada, confirme que existe um item no array "compras" com sinal="credito", valor positivo e a data correspondente do cabeçalho acima.
3. CONTE: número de linhas verdes/negativas visíveis na imagem DEVE SER IGUAL ao número de itens com sinal="credito" no array. Se não bater, VOLTE e adicione as que faltam ANTES de responder.
4. Atenção especial: linhas "Crédito de parcelamento de compra" frequentemente aparecem 2 ou 3 vezes seguidas no mesmo dia — extraia TODAS, uma por uma.
5. NUNCA omita uma linha porque "parece técnica", "parece resumo" ou "parece duplicada" — extraia tudo o que estiver visível.`;

    const genericRules = `

## REGRAS DE EXTRAÇÃO

### Compras à vista
Sem indicação de parcela. → tipo="compra", parcelas=1, parcela_atual=1, valor_eh_parcela=false. Valor cheio.

### Parcelas
"Parcela X de Y", "X/Y", "parc XX/YY". → tipo="compra", parcelas=Y, parcela_atual=X, valor_eh_parcela=true. Valor mostrado JÁ É a parcela (NÃO multiplique).

### Encargos / IOF / Anuidade
Use o tipo correspondente ("iof", "anuidade", "juros", "encargo", "seguro").

### Pagamento de Fatura
Linhas verdes "Pagamento de Fatura"/"Pagamento recebido". → tipo="pagamento_fatura". NÃO inclua no array.`;

    const bankRules = isPicpay ? picpayRules : isNubank ? nubankRules : genericRules;

    const systemPrompt = `Você é um assistente especializado em ler comprovantes, recibos, notas fiscais e EXTRATOS DE FATURA de cartão de crédito no Brasil (Nubank, Itaú, Bradesco, PicPay, etc).

A imagem pode conter UMA ÚNICA compra (recibo simples / tela de detalhe) ou MÚLTIPLAS compras (print do app do banco, extrato da fatura). Extraia TODAS as linhas de transação visíveis no array "compras".${isPicpay ? " NÃO descarte linhas riscadas — marque-as com riscada=true." : ""}
${bankRules}

## CAMPOS

1. valor (number): valor absoluto em REAIS. "R$ 1.234,56" → 1234.56. NUNCA inverta vírgula/ponto.
2. estabelecimento (string): nome como aparece.${isPicpay ? ' "Fin <Nome> parcXX/YY" → use só <Nome>.' : ""}
3. tipo: "compra" | "iof" | "encargo" | "anuidade" | "juros" | "seguro" | "estorno"${isPicpay || isNubank ? ' | "estorno_parcelamento"' : ""}${isPicpay ? ' | "compra_substituida"' : ""} | "pagamento_fatura" | "outro".
4. sinal: "debito" ou "credito".
5. data: YYYY-MM-DD. Se só vier dia/mês sem ano, use ${anoAtual}. Sem data, use hoje.
6. parcelas (int 1-24).
7. parcela_atual (int): "6/10" → 6.
8. valor_eh_parcela (bool): true quando o valor é de UMA parcela (extrato de fatura).
9. linha_original (string): copie a linha exata. Não invente.
10. valor_texto (string|null): valor exatamente como aparece (ex: "R$ 14,09").
11. riscada (bool): true se o texto da linha está tachado/riscado na imagem. Default false.
12. ignorar (bool): ${isPicpay ? "true para regras 3a e 3b (raiz substituída e crédito de parcelamento Fin). " : ""}Default false.

## REGRAS GERAIS

- NÃO ignore IOF mesmo de centavos.
- IGNORE totais/subtotais/headers/"Saldo da fatura anterior".
- O campo "valor" precisa bater com o valor visível na linha. Se "linha_original" tiver UM único valor, "valor" deve ser exatamente ele.
- Se ilegível, retorne compras: [] e confianca: "baixa". Máximo 60 itens.`;

    const creditAuditPrompt = isNubank
      ? `Você vai fazer uma SEGUNDA PASSAGEM focada APENAS em CRÉDITOS da fatura Nubank.

Objetivo: localizar TODAS as linhas em verde / negativas / com sinal "-" ou "–" e retornar SOMENTE essas linhas no array "compras".

Regras obrigatórias:
- Procure por: "Pagamento recebido", "Pagamento de fatura", "Crédito de parcelamento de compra", "Estorno", "Reembolso", "Crédito <estabelecimento>".
- "Crédito de parcelamento de compra" pode estar quebrado em 2 ou 3 linhas. Mesmo assim, trate como UMA transação.
- Retorne valor positivo e sinal="credito".
- Classifique como:
  - pagamento_fatura
  - estorno_parcelamento
  - estorno
- NÃO retorne compras em débito, totais, resumo, cabeçalhos ou saldo da fatura.
- Se existirem 4 linhas verdes visíveis, o array precisa ter 4 itens.
`
      : "";

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada");

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: (isNubank || isPicpay) && imageBase64 ? "gpt-4o" : "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: imageBase64
              ? [
                  { type: "text", text: "Extraia TODAS as compras visíveis nesta imagem." },
                  { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
                ]
              : [{ type: "text", text: `Extraia as compras deste texto:\n\n${rawText}` }],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "registrar_compras_comprovante",
              description: "Registra uma ou mais compras extraídas da imagem",
              parameters: {
                type: "object",
                properties: {
                  compras: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        valor: { type: "number", description: "Valor absoluto em reais" },
                        estabelecimento: { type: "string", description: "Nome ou descrição" },
                        tipo: {
                          type: "string",
                          description:
                            "compra, iof, encargo, anuidade, juros, seguro, estorno, estorno_parcelamento, compra_substituida, pagamento_fatura ou outro",
                        },
                        sinal: { type: "string", description: "debito ou credito" },
                        data: { type: "string", description: "Data YYYY-MM-DD" },
                        parcelas: { type: "integer", description: "Nº TOTAL de parcelas, 1 a 24 (1 = à vista)" },
                        parcela_atual: {
                          type: "integer",
                          description: "Nº da parcela ATUAL mostrada (ex: '6/10' = 6). Default 1.",
                        },
                        valor_eh_parcela: {
                          type: "boolean",
                          description:
                            "true se 'valor' é de UMA parcela (extrato de fatura). false se é o TOTAL da compra.",
                        },
                        linha_original: {
                          type: "string",
                          description: "Linha ou texto exato visível que originou a extração.",
                        },
                        valor_texto: {
                          type: "string",
                          description: "Valor monetário exatamente como aparece na linha, ex: 'R$ 14,09'.",
                        },
                        riscada: {
                          type: "boolean",
                          description: "true se o texto da linha aparece TACHADO/RISCADO na imagem. Default false.",
                        },
                        ignorar: {
                          type: "boolean",
                          description:
                            "true se a linha não deve ser importada (regras 3a/3b: compra raiz substituída ou crédito de parcelamento Fin). Default false.",
                        },
                      },
                      required: [
                        "valor",
                        "estabelecimento",
                        "tipo",
                        "sinal",
                        "data",
                        "parcelas",
                        "parcela_atual",
                        "valor_eh_parcela",
                        "linha_original",
                        "valor_texto",
                      ],
                    },
                  },
                  confianca: { type: "string", description: "alta, media ou baixa" },
                  saldo_fatura_anterior: {
                    type: "number",
                    description:
                      "Apenas PicPay: valor do 'Saldo da fatura anterior' visível no bloco Resumo. Omita se ausente.",
                  },
                  lancamentos_resumo: {
                    type: "number",
                    description:
                      "Apenas PicPay: valor do campo 'Lançamentos' do bloco Resumo (total mostrado pelo banco). Omita se ausente.",
                  },
                },
                required: ["compras", "confianca"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "registrar_compras_comprovante" } },
      }),
    });

    if (aiResponse.status === 429) {
      return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResponse.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResponse.ok) {
      const txt = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, txt);
      return new Response(JSON.stringify({ error: "Falha ao analisar imagem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResponse.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "IA não retornou dados estruturados" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: {
      compras: Array<{
        valor: number | string | null;
        estabelecimento: string | null;
        data: string | null;
        parcelas: number;
        parcela_atual?: number;
        valor_eh_parcela?: boolean;
        tipo?: string;
        sinal?: "debito" | "credito";
        linha_original?: string | null;
        valor_texto?: string | null;
        ignorar?: boolean;
      }>;
      confianca: string;
      saldo_fatura_anterior?: number;
      lancamentos_resumo?: number;
    };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(JSON.stringify({ error: "Resposta da IA inválida" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let rawCompras = Array.isArray(parsed.compras) ? parsed.compras : [];

    if (isNubank && imageBase64) {
      const creditAuditResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: `${systemPrompt}\n\n${creditAuditPrompt}` },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Faça uma segunda leitura e retorne SOMENTE os créditos/linhas verdes visíveis nesta imagem.",
                },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "registrar_compras_comprovante",
                description: "Registra uma ou mais compras extraídas da imagem",
                parameters: {
                  type: "object",
                  properties: {
                    compras: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          valor: { type: "number", description: "Valor absoluto em reais" },
                          estabelecimento: { type: "string", description: "Nome ou descrição" },
                          tipo: {
                            type: "string",
                            description:
                              "compra, iof, encargo, anuidade, juros, seguro, estorno, estorno_parcelamento, compra_substituida, pagamento_fatura ou outro",
                          },
                          sinal: { type: "string", description: "debito ou credito" },
                          data: { type: "string", description: "Data YYYY-MM-DD" },
                          parcelas: { type: "integer", description: "Nº TOTAL de parcelas, 1 a 24 (1 = à vista)" },
                          parcela_atual: {
                            type: "integer",
                            description: "Nº da parcela ATUAL mostrada (ex: '6/10' = 6). Default 1.",
                          },
                          valor_eh_parcela: {
                            type: "boolean",
                            description:
                              "true se 'valor' é de UMA parcela (extrato de fatura). false se é o TOTAL da compra.",
                          },
                          linha_original: {
                            type: "string",
                            description: "Linha ou texto exato visível que originou a extração.",
                          },
                          valor_texto: {
                            type: "string",
                            description: "Valor monetário exatamente como aparece na linha, ex: 'R$ 14,09'.",
                          },
                          riscada: {
                            type: "boolean",
                            description: "true se o texto da linha aparece TACHADO/RISCADO na imagem. Default false.",
                          },
                          ignorar: {
                            type: "boolean",
                            description:
                              "true se a linha não deve ser importada (regras 3a/3b: compra raiz substituída ou crédito de parcelamento Fin). Default false.",
                          },
                        },
                        required: [
                          "valor",
                          "estabelecimento",
                          "tipo",
                          "sinal",
                          "data",
                          "parcelas",
                          "parcela_atual",
                          "valor_eh_parcela",
                          "linha_original",
                          "valor_texto",
                        ],
                      },
                    },
                    confianca: { type: "string", description: "alta, media ou baixa" },
                  },
                  required: ["compras", "confianca"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "registrar_compras_comprovante" } },
        }),
      });

      if (creditAuditResponse.ok) {
        const creditAuditJson = await creditAuditResponse.json();
        const creditAuditToolCall = creditAuditJson?.choices?.[0]?.message?.tool_calls?.[0];

        if (creditAuditToolCall?.function?.arguments) {
          try {
            const creditAuditParsed = JSON.parse(creditAuditToolCall.function.arguments);
            const creditOnly = Array.isArray(creditAuditParsed?.compras)
              ? creditAuditParsed.compras.filter((item: any) => item?.sinal === "credito")
              : [];

            const normalizeText = (value: unknown) =>
              String(value ?? "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            const sameCompra = (a: any, b: any) => {
              const valueA = typeof a?.valor === "number" ? Math.abs(a.valor) : coerceValor(a?.valor_texto ?? a?.valor);
              const valueB = typeof b?.valor === "number" ? Math.abs(b.valor) : coerceValor(b?.valor_texto ?? b?.valor);
              const textA = normalizeText(a?.estabelecimento || a?.linha_original);
              const textB = normalizeText(b?.estabelecimento || b?.linha_original);

              return (
                a?.sinal === b?.sinal &&
                a?.tipo === b?.tipo &&
                a?.data === b?.data &&
                valueA !== null &&
                valueB !== null &&
                Math.abs(valueA - valueB) < 0.01 &&
                (textA.includes(textB) || textB.includes(textA))
              );
            };

            for (const creditItem of creditOnly) {
              if (!rawCompras.some((existing) => sameCompra(existing, creditItem))) {
                rawCompras.push(creditItem);
              }
            }
          } catch (creditAuditError) {
            console.error("Falha ao processar auditoria de créditos Nubank:", creditAuditError);
          }
        }
      }
    }

    // ============== SEGUNDA PASSAGEM: AUDITORIA DE CRÉDITOS E RISCADOS PICPAY ==============
    // Espelha o que já existe para Nubank: re-lê a imagem focando APENAS em itens verdes
    // (Pagamento de Fatura, Credito Parcelamento Compra) e itens tachados, para compensar
    // falhas de detecção do gpt-4o na primeira passagem.
    if (isPicpay && imageBase64) {
      const picpayAuditPrompt = `Você vai fazer uma SEGUNDA PASSAGEM focada APENAS em itens especiais da fatura PicPay.

## PASSO 1 — CONTE antes de extrair
Olhe a imagem inteira e CONTE:
- Quantas linhas têm texto em VERDE (cor verde, não cinza nem preto)?
- Quantas linhas têm texto TACHADO/RISCADO (linha horizontal cortando o nome ou o valor)?

## PASSO 2 — EXTRAIA cada item encontrado

Itens VERDES → sinal="credito", valor positivo absoluto:
- "Pagamento de Fatura" ou "Pagamento recebido" → tipo="pagamento_fatura", ignorar=false.
- "Credito Parcelamento Compra" (ícone ← seta) → tipo="estorno_parcelamento", ignorar=true.
  ATENÇÃO: aparecem várias seguidas (ex.: 3 linhas "Credito Parcelamento Compra" de valores diferentes). Extraia CADA UMA separadamente.

Itens TACHADOS/RISCADOS → sinal="debito", riscada=true, tipo="compra_substituida", ignorar=true.

## PASSO 3 — VERIFIQUE
- Número de itens verdes no array == número que você contou no Passo 1?
- Se não bater, adicione os que faltam antes de responder.

NÃO retorne compras normais (texto preto, sem risco). Só verdes e tachados.`;

      const picpayAuditResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: `${systemPrompt}\n\n${picpayAuditPrompt}` },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Faça uma segunda leitura e retorne SOMENTE os itens VERDES (Pagamento de Fatura, Credito Parcelamento Compra) e itens TACHADOS visíveis nesta imagem.",
                },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "registrar_compras_comprovante",
                description: "Registra uma ou mais compras extraídas da imagem",
                parameters: {
                  type: "object",
                  properties: {
                    compras: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          valor: { type: "number" },
                          estabelecimento: { type: "string" },
                          tipo: { type: "string" },
                          sinal: { type: "string" },
                          data: { type: "string" },
                          parcelas: { type: "integer" },
                          parcela_atual: { type: "integer" },
                          valor_eh_parcela: { type: "boolean" },
                          linha_original: { type: "string" },
                          valor_texto: { type: "string" },
                          riscada: { type: "boolean" },
                          ignorar: { type: "boolean" },
                        },
                        required: ["valor", "estabelecimento", "tipo", "sinal", "data", "parcelas", "parcela_atual", "valor_eh_parcela", "linha_original", "valor_texto"],
                      },
                    },
                    confianca: { type: "string" },
                  },
                  required: ["compras", "confianca"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "registrar_compras_comprovante" } },
        }),
      });

      if (picpayAuditResponse.ok) {
        const picpayAuditJson = await picpayAuditResponse.json();
        const picpayAuditToolCall = picpayAuditJson?.choices?.[0]?.message?.tool_calls?.[0];

        if (picpayAuditToolCall?.function?.arguments) {
          try {
            const picpayAuditParsed = JSON.parse(picpayAuditToolCall.function.arguments);
            const auditItems: any[] = Array.isArray(picpayAuditParsed?.compras)
              ? picpayAuditParsed.compras
              : [];

            const normalizeText = (value: unknown) =>
              String(value ?? "")
                .normalize("NFD")
                .replace(/[̀-ͯ]/g, "")
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            const coerceV = (v: unknown): number | null => {
              if (typeof v === "number" && isFinite(v)) return Math.abs(v);
              if (typeof v !== "string") return null;
              const s = v.trim().replace(/r\$\s*/i, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
              const n = parseFloat(s);
              return isFinite(n) ? Math.abs(n) : null;
            };

            const sameItem = (a: any, b: any) => {
              const vA = coerceV(a?.valor_texto ?? a?.valor);
              const vB = coerceV(b?.valor_texto ?? b?.valor);
              return (
                a?.sinal === b?.sinal &&
                a?.tipo === b?.tipo &&
                a?.data === b?.data &&
                vA !== null && vB !== null &&
                Math.abs(vA - vB) < 0.01 &&
                (normalizeText(a?.estabelecimento || a?.linha_original).includes(
                  normalizeText(b?.estabelecimento || b?.linha_original),
                ) ||
                  normalizeText(b?.estabelecimento || b?.linha_original).includes(
                    normalizeText(a?.estabelecimento || a?.linha_original),
                  ))
              );
            };

            for (const item of auditItems) {
              if (!rawCompras.some((existing: any) => sameItem(existing, item))) {
                rawCompras.push(item);
              }
            }
          } catch (auditError) {
            console.error("Falha ao processar auditoria de créditos PicPay:", auditError);
          }
        }
      }
    }

    // Coerção defensiva: a IA às vezes retorna valor como string ("1.234,56", "R$ 49,90").
    // Convertemos sempre para number no formato JS (ponto decimal).
    function coerceValor(v: unknown): number | null {
      if (typeof v === "number" && isFinite(v)) return Math.abs(v);
      if (typeof v !== "string") return null;
      let s = v
        .trim()
        .replace(/r\$\s*/i, "")
        .replace(/\s/g, "");
      if (!s) return null;
      const temVirgula = s.includes(",");
      const temPonto = s.includes(".");
      if (temVirgula && temPonto) {
        // formato BR: ponto = milhar, vírgula = decimal
        s = s.replace(/\./g, "").replace(",", ".");
      } else if (temVirgula) {
        s = s.replace(",", ".");
      }
      // se só tem ponto, mantém como está (assume decimal)
      const n = parseFloat(s);
      return isFinite(n) ? Math.abs(n) : null;
    }

    function extractCurrencyCandidates(text: unknown): number[] {
      if (typeof text !== "string") return [];
      const matches =
        text.match(/(?:R\$\s*)?-?\d{1,3}(?:\.\d{3})*,\d{2}|(?:R\$\s*)?-?\d+,\d{2}|(?:R\$\s*)?-?\d+\.\d{2}/gi) ?? [];
      const values = matches.map((match) => coerceValor(match)).filter((value): value is number => value !== null);

      return values.filter(
        (value, index) => values.findIndex((candidate) => Math.abs(candidate - value) < 0.01) === index,
      );
    }

    function chooseMostReliableValue(params: {
      aiValue: number | null;
      rawValueText?: string | null;
      sourceLine?: string | null;
      parcelas: number;
      valorEhParcela: boolean;
    }): number | null {
      const { aiValue, rawValueText, sourceLine, parcelas, valorEhParcela } = params;
      const valueFromText = coerceValor(rawValueText);
      if (valueFromText !== null) return valueFromText;

      const candidates = extractCurrencyCandidates(sourceLine);
      if (candidates.length === 0) return aiValue;
      if (candidates.length === 1) return candidates[0];

      if (aiValue !== null) {
        const exact = candidates.find((candidate) => Math.abs(candidate - aiValue) < 0.01);
        if (exact !== undefined) return exact;

        const parcelCandidate = candidates.find((candidate) => Math.abs(candidate * parcelas - aiValue) < 0.02);
        const totalCandidate = candidates.find((candidate) => Math.abs(candidate - aiValue * parcelas) < 0.02);

        if (valorEhParcela && parcelCandidate !== undefined) return parcelCandidate;
        if (!valorEhParcela && totalCandidate !== undefined) return totalCandidate;
      }

      const line = typeof sourceLine === "string" ? sourceLine : "";
      const hasCurrentInstallmentPattern = /(?:parc(?:ela)?\s*\d{1,2}\s*\/\s*\d{1,2}|\b\d{1,2}\s*\/\s*\d{1,2}\b)/i.test(
        line,
      );
      if (valorEhParcela || hasCurrentInstallmentPattern) return Math.min(...candidates);

      const multipliedTotal = candidates.find((candidate) =>
        candidates.some((other) => Math.abs(candidate - other * parcelas) < 0.02),
      );
      if (multipliedTotal !== undefined) return multipliedTotal;

      return aiValue ?? candidates[candidates.length - 1];
    }

    const compras = rawCompras
      .map((c: any) => {
        const parcelas = Math.min(Math.max(parseInt(String(c?.parcelas ?? 1)) || 1, 1), 24);
        let parcelaAtual = parseInt(String(c?.parcela_atual ?? 1)) || 1;
        parcelaAtual = Math.min(Math.max(parcelaAtual, 1), parcelas);
        const valorEhParcela = c?.valor_eh_parcela === true;
        const valor = chooseMostReliableValue({
          aiValue: coerceValor(c?.valor),
          rawValueText: typeof c?.valor_texto === "string" ? c.valor_texto : null,
          sourceLine: typeof c?.linha_original === "string" ? c.linha_original : null,
          parcelas,
          valorEhParcela,
        });
        const descricaoNormalizada = String(c?.estabelecimento ?? c?.linha_original ?? "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();
        const isPixNoCredito = isNubank && /\bpix no credito\b/.test(descricaoNormalizada);

        return {
          ...c,
          valor,
          parcelas,
          parcela_atual: parcelaAtual,
          valor_eh_parcela: valorEhParcela,
          tipo: isPixNoCredito ? "compra" : c?.tipo,
          sinal: isPixNoCredito ? "debito" : c?.sinal,
          riscada: c?.riscada === true,
          ignorar: isPixNoCredito ? false : c?.ignorar === true,
        };
      })
      .filter(
        (c: any) =>
          c.valor !== null &&
          c.valor > 0 &&
          // PicPay e Nubank precisam dos pagamentos para a reconciliação correta da fatura.
          (isPicpay || isNubank ? true : c.tipo !== "pagamento_fatura"),
      );

    // ============== PÓS-PROCESSAMENTO DETERMINÍSTICO NUBANK ==============
    // O AI nem sempre marca valor_eh_parcela=true para itens com notação "- X/Y" ou "Parcela X/Y".
    if (isNubank) {
      const parcelaRegexEnd = /\s*[-–]\s*(?:Parcela\s+)?(\d{1,2})\s*\/\s*(\d{1,2})\s*$/i;
      const parcelaRegexInline = /[-–]\s*(?:Parcela\s+)?(\d{1,2})\s*\/\s*(\d{1,2})/i;
      for (const c of compras as any[]) {
        const estab = typeof c.estabelecimento === "string" ? c.estabelecimento : "";
        const linha = typeof c.linha_original === "string" ? c.linha_original : "";
        const m = estab.match(parcelaRegexEnd) ?? linha.match(parcelaRegexInline);
        if (m) {
          const parcelaAtualDetect = parseInt(m[1], 10);
          const totalParcelasDetect = parseInt(m[2], 10);
          if (parcelaAtualDetect >= 1 && totalParcelasDetect >= parcelaAtualDetect && totalParcelasDetect <= 99) {
            c.parcelas = totalParcelasDetect;
            c.parcela_atual = parcelaAtualDetect;
            c.valor_eh_parcela = true;
            if (typeof c.estabelecimento === "string") {
              c.estabelecimento = c.estabelecimento.replace(parcelaRegexEnd, "").trim();
            }
          }
        }
      }
    }

    // ============== PÓS-PROCESSAMENTO DE TIPO DE CRÉDITOS NUBANK ==============
    // O AI às vezes retorna tipo="estorno" para "Crédito de parcelamento de compra", mas
    // o correto é tipo="estorno_parcelamento". Com tipo errado, o frontend marca o item como
    // creditoParcelamentoGenerico=true e o EXCLUI do import por padrão — causando total
    // da fatura maior que o Nubank (crédito que deveria reduzir o total fica de fora).
    if (isNubank) {
      const normCred = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      for (const c of compras as any[]) {
        const texto = normCred([c.estabelecimento, c.linha_original].filter(Boolean).join(" "));

        // 'Crédito de parcelamento de compra' deve SEMPRE ser estorno_parcelamento + credito
        if (
          c.sinal === "credito" &&
          (texto.includes("credito de parcelamento") ||
            (texto.includes("credito") && texto.includes("parcelamento") && texto.includes("compra"))) &&
          c.tipo !== "estorno_parcelamento"
        ) {
          c.tipo = "estorno_parcelamento";
        }

        // 'Pagamento recebido' / 'Pagamento de fatura' deve SEMPRE ser pagamento_fatura + credito.
        // O AI às vezes retorna tipo errado (compra/outro) ou sinal errado (debito), fazendo o
        // item ser importado como débito positivo e inflando o total da fatura.
        if (
          texto.includes("pagamento recebido") ||
          texto.includes("pagamento de fatura") ||
          texto.includes("pagamento da fatura")
        ) {
          c.tipo = "pagamento_fatura";
          c.sinal = "credito";
        }

        // Corrigir ano claramente errado nas datas (ex.: AI leu "2023" numa fatura de 2026).
        // Datas com ano < (anoAtual - 1) num extrato de fatura são quase certamente erros de OCR.
        if (c.data && typeof c.data === "string") {
          const mData = c.data.match(/^(\d{4})-(\d{2}-\d{2})$/);
          if (mData && parseInt(mData[1]) < anoAtual - 1) {
            c.data = `${anoAtual}-${mData[2]}`;
          }
        }
      }
    }

    // ============== CORREÇÃO DE DATAS PARA PICPAY ==============
    // A IA às vezes lê o ano errado (ex.: "2023" em vez de 2026) nas imagens de parcelamentos.
    if (isPicpay) {
      for (const c of compras as any[]) {
        if (c.data && typeof c.data === "string") {
          const mData = c.data.match(/^(\d{4})-(\d{2}-\d{2})$/);
          if (mData && parseInt(mData[1]) < anoAtual - 1) {
            c.data = `${anoAtual}-${mData[2]}`;
          }
        }
      }
    }

    // ============== PÓS-PROCESSAMENTO DE TIPO DE CRÉDITOS PICPAY ==============
    // A IA às vezes retorna tipo="compra" e sinal="debito" para itens que são claramente
    // créditos (ex.: "Credito Parcelamento Compra" com sinal errado). Corrigimos de forma
    // determinística, igual ao bloco Nubank acima.
    if (isPicpay) {
      const normP = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      for (const c of compras as any[]) {
        const texto = normP([c.estabelecimento, c.linha_original].filter(Boolean).join(" "));

        // "Credito Parcelamento Compra" (verde, seta ←) deve SEMPRE ser estorno_parcelamento
        // + credito + ignorar=true, independente do que a IA retornou.
        if (
          texto.includes("credito parcelamento compra") ||
          texto.includes("crédito parcelamento compra")
        ) {
          c.tipo = "estorno_parcelamento";
          c.sinal = "credito";
          c.ignorar = true;
        }

        // "Pagamento de Fatura" deve SEMPRE ser pagamento_fatura + credito.
        if (
          texto.includes("pagamento de fatura") ||
          texto.includes("pagamento da fatura") ||
          texto.includes("pagamento recebido")
        ) {
          c.tipo = "pagamento_fatura";
          c.sinal = "credito";
          c.ignorar = false; // pagamentos não devem ser ignorados
        }
      }
    }

    // ============== PÓS-VALIDAÇÃO DETERMINÍSTICA DO TRIO "Fin" (APENAS PICPAY) ==============
    if (isPicpay) {
      function normalizeName(s: string | null | undefined): string {
        return (s || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
      }
      function nomesParecidos(a: string, b: string): boolean {
        if (!a || !b) return false;
        if (a === b) return true;
        const min = Math.min(a.length, b.length);
        if (min < 3) return false;
        return a.startsWith(b.substring(0, min)) || b.startsWith(a.substring(0, min));
      }

      const finPrimeiras = compras.filter(
        (c: any) =>
          c.tipo === "compra" &&
          c.valor_eh_parcela === true &&
          c.parcela_atual === 1 &&
          typeof c.linha_original === "string" &&
          /\bfin\b/i.test(c.linha_original),
      );

      for (const fin of finPrimeiras) {
        const nomeFin = normalizeName(fin.estabelecimento);

        // Busca a raiz por NOME (não por valor: o total financiado difere do original por causa do IOF).
        const raiz = compras.find(
          (c: any) =>
            c !== fin &&
            c.tipo !== "iof" &&
            c.tipo !== "estorno_parcelamento" &&
            c.sinal !== "credito" &&
            !c.valor_eh_parcela &&
            nomesParecidos(normalizeName(c.estabelecimento), nomeFin),
        );

        if (!raiz) continue;

        // Busca o crédito pelo valor DA RAIZ (valor original pré-financiamento), não pelo totalCompra.
        const valorRaiz = raiz.valor || 0;
        const credito = compras.find(
          (c: any) =>
            c !== fin &&
            c.sinal === "credito" &&
            (c.tipo === "estorno_parcelamento" ||
              /credito\s+parcelamento\s+compra/i.test(c.linha_original || c.estabelecimento || "")) &&
            Math.abs((c.valor || 0) - valorRaiz) < 0.02,
        );

        if (credito) {
          raiz.ignorar = true;
          raiz.tipo = "compra_substituida";
          credito.ignorar = true;
          credito.tipo = "estorno_parcelamento";
        }
      }

      // FALLBACK AMPLIADO: itera sobre cada "Credito Parcelamento Compra" e busca a compra
      // original pelo valor — independentemente de riscada=true/false, pois a IA às vezes
      // não detecta visualmente o tachado nas imagens do PicPay.
      // Exclui itens Fin (nova parcela), IOF e pagamento_fatura da busca de compra original.
      const creditosParcelamentoLivres = (compras as any[]).filter(
        (c: any) =>
          !c.ignorar &&
          c.sinal === "credito" &&
          (c.tipo === "estorno_parcelamento" ||
            /credito\s*parcelamento\s*compra/i.test(c.linha_original || c.estabelecimento || "")),
      );
      for (const credito of creditosParcelamentoLivres) {
        if (credito.ignorar) continue;
        const compraOriginal = (compras as any[]).find(
          (c: any) =>
            !c.ignorar &&
            c.sinal !== "credito" &&
            c.tipo !== "iof" &&
            c.tipo !== "pagamento_fatura" &&
            !/\bfin\b/i.test(c.linha_original || c.estabelecimento || "") &&
            Math.abs((c.valor || 0) - (credito.valor || 0)) < 0.02,
        );
        if (compraOriginal) {
          compraOriginal.ignorar = true;
          compraOriginal.tipo = "compra_substituida";
          credito.ignorar = true;
        }
      }

      for (const c of compras) {
        if (!c.riscada || c.ignorar) continue;
        const temCredito = compras.some(
          (o: any) => o !== c && o.sinal === "credito" && Math.abs((o.valor || 0) - (c.valor || 0)) < 0.02,
        );
        (c as any).riscada_sem_credito = !temCredito;
      }
    }

    // Retrocompat: também devolve os campos da primeira compra no nível raiz
    const first = compras[0];
    const legacy = first
      ? {
          valor: first.valor,
          estabelecimento: first.estabelecimento,
          data: first.data,
          parcelas: first.parcelas ?? 1,
          parcela_atual: first.parcela_atual ?? 1,
          valor_eh_parcela: first.valor_eh_parcela ?? false,
          tipo: first.tipo,
          sinal: first.sinal,
        }
      : {
          valor: null,
          estabelecimento: null,
          data: null,
          parcelas: 1,
          parcela_atual: 1,
          valor_eh_parcela: false,
          tipo: "compra",
          sinal: "debito",
        };

    const responseBody = JSON.stringify({
      ...legacy,
      compras,
      confianca: parsed.confianca || "media",
      saldo_fatura_anterior: typeof parsed.saldo_fatura_anterior === "number" ? parsed.saldo_fatura_anterior : null,
      lancamentos_resumo: typeof parsed.lancamentos_resumo === "number" ? parsed.lancamentos_resumo : null,
    });

    return new Response(responseBody, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Erro analisar-comprovante-cartao:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
