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

    const systemPrompt = `Você é um assistente especializado em ler comprovantes, recibos, notas fiscais e EXTRATOS DE FATURA de cartão de crédito no Brasil (Nubank, Itaú, Bradesco, PicPay, etc).

A imagem pode conter UMA ÚNICA compra (recibo simples) ou MÚLTIPLAS compras (print do app do banco, extrato da fatura). Extraia TODAS as linhas de transação visíveis no array "compras".

Para cada item:
1. valor: valor absoluto em REAIS como NÚMERO (ponto decimal). "R$ 1.234,56" → 1234.56. "R$ 49,90" → 49.90. NUNCA inverta vírgula/ponto.
   - **REGRA CRÍTICA PARA EXTRATOS DE FATURA**: Se a linha indica a parcela ATUAL (ex: "parc 01/03", "Parcela 6 de 10", "01/12", "Fin X parc02/05"), o valor mostrado É O VALOR DA PARCELA daquele mês, NÃO o total. Retorne EXATAMENTE o valor mostrado e marque "valor_eh_parcela": true.
   - Em RECIBO simples (não fatura) dizendo "3x de R$ 50,00" sem indicar qual parcela, retorne o TOTAL (150.00) e "valor_eh_parcela": false.
2. estabelecimento: nome como aparece. Para "Fin <Nome> parcXX/YY" use só o nome (ex: "Fin Espetinhos parc01/02" → "Espetinhos").
3. tipo: "compra", "iof", "encargo", "anuidade", "juros", "seguro", "estorno", "estorno_parcelamento", "compra_substituida", "pagamento_fatura" ou "outro".
4. sinal: "debito" (compras/taxas) ou "credito" (estornos e créditos).
5. data: YYYY-MM-DD. Converta de DD/MM/AAAA. Sem data, use hoje.
6. parcelas: nº TOTAL de parcelas (1 a 24). "N/M" → M é o total. À vista = 1.
7. parcela_atual: nº da parcela ATUAL mostrada (1 a parcelas). "6/10" → 6. NUNCA assuma 1 quando há indicação clara de outra parcela.
8. valor_eh_parcela: boolean. true = valor é de UMA parcela (extrato com parcela atual visível). false = valor TOTAL da compra.
9. linha_original: copie a linha/texto visível que originou a extração, incluindo padrão de parcelas e valor quando existirem. Não invente nem resuma.
10. valor_texto: copie exatamente o valor monetário visto na linha (ex: "R$ 14,09"). Se não estiver claro, use null.
11. ignorar: boolean. true se a linha NÃO deve ser importada (compra original substituída por parcelamento — ver regra PicPay abaixo). Default false.

REGRAS CRÍTICAS:
- **NUNCA inclua "Pagamento de Fatura"** — pule essas linhas. São pagamentos da fatura anterior, NÃO lançamentos.
- **IGNORE transações com texto RISCADO/TACHADO** (canceladas) — NÃO retorne essas linhas no array.
- NÃO ignore IOF mesmo de centavos. Registre TUDO.
- IGNORE totais/subtotais/headers — só transações individuais.
- O campo "valor" precisa bater com o valor monetário realmente visível na linha. Se "linha_original" tiver um único valor, "valor" deve ser exatamente esse número.

**REGRAS ESPECÍFICAS PARA PICPAY**:
- Linhas começando com "Fin <Nome> parcNN/MM" (ex: "Fin Espetinhos parc01/02 R$ 11,48"): o valor JÁ É A PARCELA DO MÊS. Use valor_eh_parcela=true, parcelas=MM, parcela_atual=NN, tipo="compra", estabelecimento=<Nome>.
- "IOF Diario Parcelado" e "IOF Adicional Parcelado": tipo="iof", parcelas=1, valor_eh_parcela=false.
- "Credito Parcelamento Compra" (geralmente em verde com seta ←): tipo="estorno_parcelamento", sinal="credito", parcelas=1, valor_eh_parcela=false. Este crédito COMPENSA a compra original "raiz" que aparece em outro lugar da fatura — DEVE ser importado (não é crédito espúrio para ignorar).
- Se você ver uma compra "raiz" original (ex: "Espetinhosbom R$ 21,00") E TAMBÉM linhas "Fin Espetinhos parcXX/YY" da mesma compra na mesma fatura, a raiz já está sendo cobrada pelas parcelas: marque a raiz com ignorar=true e tipo="compra_substituida". Se a raiz já estiver visualmente riscada, simplesmente NÃO a inclua no array.

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
                        ignorar: { type: "boolean", description: "true se a linha não deve ser importada (compra raiz substituída por parcelamento). Default false." },
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
        ignorar: c?.ignorar === true,
      };
    }).filter((c: any) =>
      c.valor !== null &&
      c.valor > 0 &&
      c.tipo !== "pagamento_fatura" // pagamentos de fatura nunca entram
    );

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
