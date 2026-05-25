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
    if (!body || typeof body.imageBase64 !== "string" || typeof body.mimeType !== "string") {
      return new Response(
        JSON.stringify({ error: "imageBase64 e mimeType são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { imageBase64, mimeType } = body as { imageBase64: string; mimeType: string };
    const isPicpay = body?.picpay === true;
    const isNubank = body?.nubank === true;

    if (imageBase64.length > MAX_BASE64_SIZE) {
      return new Response(
        JSON.stringify({ error: "Imagem muito grande (máx ~6MB)" }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!/^image\/(png|jpeg|jpg|webp|heic|heif)$/i.test(mimeType)) {
      return new Response(
        JSON.stringify({ error: "Formato de imagem não suportado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataUrl = `data:${mimeType};base64,${imageBase64}`;

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
Se algum não estiver visível, omita o campo.`;

    const nubankRules = `

## REGRAS NUBANK — TELA DE DETALHE DE UMA COMPRA

A imagem normalmente é a tela de DETALHE de UMA ÚNICA compra do app Nubank. Características:
- Título grande = nome do estabelecimento (ex.: "Pg *Even3 Ixhq").
- Linha "R$ X,XX" em destaque = VALOR TOTAL DA COMPRA.
- Linha "em Nx de R$ Y,YY" (logo abaixo) = parcelamento (N parcelas de Y).
- Badge "Compra parcelada" e bloco "Parcelas: Nx de R$ Y,YY" / "0 de N pagas".
- Pode aparecer data por extenso (ex.: "Segunda-feira, 25 de Maio de 2026, 18:59").

### Como extrair:
- Registre UMA única compra: tipo="compra", sinal="debito".
- valor = VALOR TOTAL (R$ X,XX em destaque, NÃO o valor da parcela).
- parcelas = N (de "em Nx de R$ Y").
- parcela_atual = 1.
- valor_eh_parcela = FALSE (o valor é o total da compra inteira).
- estabelecimento = título grande no topo.
- data = converta a data por extenso para YYYY-MM-DD se visível; senão use hoje.
- linha_original = inclua AS DUAS LINHAS exatas: "R$ X,XX" e "em Nx de R$ Y,YY" para validação.
- valor_texto = "R$ X,XX" (o valor TOTAL, não o da parcela).

Se for um EXTRATO de fatura Nubank (lista com várias linhas), use regras genéricas: cada linha "Parcela X de Y" → valor_eh_parcela=true.`;

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
3. tipo: "compra" | "iof" | "encargo" | "anuidade" | "juros" | "seguro" | "estorno"${isPicpay ? ' | "estorno_parcelamento" | "compra_substituida"' : ""} | "pagamento_fatura" | "outro".
4. sinal: "debito" ou "credito".
5. data: YYYY-MM-DD. Sem data, use hoje.
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

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Extraia TODAS as compras visíveis nesta imagem." },
              { type: "image_url", image_url: { url: dataUrl } },
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
                        tipo: { type: "string", description: "compra, iof, encargo, anuidade, juros, seguro, estorno, estorno_parcelamento, compra_substituida, pagamento_fatura ou outro" },
                        sinal: { type: "string", description: "debito ou credito" },
                        data: { type: "string", description: "Data YYYY-MM-DD" },
                        parcelas: { type: "integer", description: "Nº TOTAL de parcelas, 1 a 24 (1 = à vista)" },
                        parcela_atual: { type: "integer", description: "Nº da parcela ATUAL mostrada (ex: '6/10' = 6). Default 1." },
                        valor_eh_parcela: { type: "boolean", description: "true se 'valor' é de UMA parcela (extrato de fatura). false se é o TOTAL da compra." },
                        linha_original: { type: "string", description: "Linha ou texto exato visível que originou a extração." },
                        valor_texto: { type: "string", description: "Valor monetário exatamente como aparece na linha, ex: 'R$ 14,09'." },
                        riscada: { type: "boolean", description: "true se o texto da linha aparece TACHADO/RISCADO na imagem. Default false." },
                        ignorar: { type: "boolean", description: "true se a linha não deve ser importada (regras 3a/3b: compra raiz substituída ou crédito de parcelamento Fin). Default false." },
                      },
                      required: ["valor", "estabelecimento", "tipo", "sinal", "data", "parcelas", "parcela_atual", "valor_eh_parcela", "linha_original", "valor_texto"],
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

    if (aiResponse.status === 429) {
      return new Response(
        JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResponse.status === 402) {
      return new Response(
        JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResponse.ok) {
      const txt = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, txt);
      return new Response(
        JSON.stringify({ error: "Falha ao analisar imagem" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiResponse.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "IA não retornou dados estruturados" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let parsed: {
      compras: Array<{ valor: number | string | null; estabelecimento: string | null; data: string | null; parcelas: number; parcela_atual?: number; valor_eh_parcela?: boolean; tipo?: string; sinal?: "debito" | "credito"; linha_original?: string | null; valor_texto?: string | null; ignorar?: boolean }>;
      confianca: string;
    };
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(
        JSON.stringify({ error: "Resposta da IA inválida" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const rawCompras = Array.isArray(parsed.compras) ? parsed.compras : [];

    // Coerção defensiva: a IA às vezes retorna valor como string ("1.234,56", "R$ 49,90").
    // Convertemos sempre para number no formato JS (ponto decimal).
    function coerceValor(v: unknown): number | null {
      if (typeof v === "number" && isFinite(v)) return Math.abs(v);
      if (typeof v !== "string") return null;
      let s = v.trim().replace(/r\$\s*/i, "").replace(/\s/g, "");
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
      const matches = text.match(/(?:R\$\s*)?-?\d{1,3}(?:\.\d{3})*,\d{2}|(?:R\$\s*)?-?\d+,\d{2}|(?:R\$\s*)?-?\d+\.\d{2}/gi) ?? [];
      const values = matches
        .map((match) => coerceValor(match))
        .filter((value): value is number => value !== null);

      return values.filter((value, index) => values.findIndex((candidate) => Math.abs(candidate - value) < 0.01) === index);
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
      const hasCurrentInstallmentPattern = /(?:parc(?:ela)?\s*\d{1,2}\s*\/\s*\d{1,2}|\b\d{1,2}\s*\/\s*\d{1,2}\b)/i.test(line);
      if (valorEhParcela || hasCurrentInstallmentPattern) return Math.min(...candidates);

      const multipliedTotal = candidates.find((candidate) =>
        candidates.some((other) => Math.abs(candidate - other * parcelas) < 0.02),
      );
      if (multipliedTotal !== undefined) return multipliedTotal;

      return aiValue ?? candidates[candidates.length - 1];
    }

    const compras = rawCompras.map((c: any) => {
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
      return {
        ...c,
        valor,
        parcelas,
        parcela_atual: parcelaAtual,
        valor_eh_parcela: valorEhParcela,
        riscada: c?.riscada === true,
        ignorar: c?.ignorar === true,
      };
    }).filter((c: any) =>
      c.valor !== null &&
      c.valor > 0 &&
      c.tipo !== "pagamento_fatura" // pagamentos de fatura nunca entram
    );

    // ============== PÓS-VALIDAÇÃO DETERMINÍSTICA DO TRIO "Fin" (APENAS PICPAY) ==============
    if (isPicpay) {
    // Regra 3: se existe trio (raiz + estorno_parcelamento + Fin parc01/N) na mesma fatura,
    // forçar ignorar=true em raiz e crédito. Se raiz está riscada SEM crédito de mesmo valor,
    // marcar riscada_sem_credito=true (regra 4).
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

    const finPrimeiras = compras.filter((c: any) =>
      c.tipo === "compra" &&
      c.valor_eh_parcela === true &&
      c.parcela_atual === 1 &&
      typeof c.linha_original === "string" &&
      /\bfin\b/i.test(c.linha_original)
    );

    for (const fin of finPrimeiras) {
      const totalCompra = (fin.valor || 0) * (fin.parcelas || 1);
      const nomeFin = normalizeName(fin.estabelecimento);

      // Tenta achar crédito de parcelamento com valor ≈ totalCompra
      const credito = compras.find((c: any) =>
        c !== fin &&
        c.sinal === "credito" &&
        (c.tipo === "estorno_parcelamento" || /credito\s+parcelamento\s+compra/i.test(c.linha_original || c.estabelecimento || "")) &&
        Math.abs((c.valor || 0) - totalCompra) < 0.02
      );

      // Tenta achar raiz: mesma similaridade de nome E (valor ≈ totalCompra OU está riscada)
      const raiz = compras.find((c: any) =>
        c !== fin &&
        c.tipo !== "iof" &&
        c.tipo !== "estorno_parcelamento" &&
        c.sinal !== "credito" &&
        !c.valor_eh_parcela &&
        nomesParecidos(normalizeName(c.estabelecimento), nomeFin) &&
        Math.abs((c.valor || 0) - totalCompra) < 0.02
      );

      if (raiz && credito) {
        raiz.ignorar = true;
        raiz.tipo = "compra_substituida";
        credito.ignorar = true;
        credito.tipo = "estorno_parcelamento";
      }
    }

    // Regra 4: marcar compras riscadas que NÃO têm crédito de mesmo valor
    for (const c of compras) {
      if (!c.riscada || c.ignorar) continue;
      const temCredito = compras.some((o: any) =>
        o !== c &&
        o.sinal === "credito" &&
        Math.abs((o.valor || 0) - (c.valor || 0)) < 0.02
      );
      (c as any).riscada_sem_credito = !temCredito;
    }
    } // fim if (isPicpay)




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
      : { valor: null, estabelecimento: null, data: null, parcelas: 1, parcela_atual: 1, valor_eh_parcela: false, tipo: "compra", sinal: "debito" };

    const responseBody = JSON.stringify({ ...legacy, compras, confianca: parsed.confianca || "media" });

    return new Response(
      responseBody,
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (e) {
    console.error("Erro analisar-comprovante-cartao:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
