// Edge function: analisar-comprovante-cartao
// Recebe uma imagem (base64) e usa Lovable AI Gateway para extrair UMA OU MAIS compras.

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

    const systemPrompt = `Você é um assistente especializado em ler comprovantes, recibos, notas fiscais e EXTRATOS DE FATURA de cartão de crédito no Brasil.

A imagem pode conter UMA ÚNICA compra (recibo simples) ou MÚLTIPLAS compras (print do app do banco, extrato da fatura, lista de transações). Extraia TODAS as linhas de transação visíveis (compras, taxas, impostos, estornos) e retorne no array "compras".

Para cada item, extraia:
1. valor: valor absoluto da transação em REAIS, como NÚMERO (não string), usando PONTO como separador decimal.
   - ATENÇÃO AO FORMATO BRASILEIRO: "R$ 1.234,56" significa mil duzentos e trinta e quatro reais e cinquenta e seis centavos → retorne 1234.56 (ponto = milhar, vírgula = decimal).
   - "R$ 49,90" → 49.90. "R$ 1.299,00" → 1299.00. "R$ 12,5" → 12.50. NUNCA inverta vírgula e ponto.
   - Se for PARCELADO ("3x de R$ 50,00" ou "3x R$ 50,00"), retorne o VALOR TOTAL da compra (3 × 50,00 = 150.00), NÃO o valor da parcela.
   - Se aparecer só o valor total da compra parcelada (ex: "R$ 150,00 em 3x"), retorne 150.00.
   - Confira sempre se o valor extraído bate visualmente com o que está escrito; não invente dígitos.
2. estabelecimento: nome ou descrição do item exatamente como aparece (ex: "Pão de Açúcar", "IOF", "Anuidade", "Estorno Uber").
3. tipo: categorize em: "compra", "iof", "encargo", "anuidade", "juros", "seguro", "estorno" ou "outro".
4. sinal: "debito" (para compras e taxas) ou "credito" (para estornos, pagamentos e créditos).
5. data: data da transação no formato YYYY-MM-DD. Converta de DD/MM/AAAA se necessário. Se não houver, use a data de hoje.
6. parcelas: número TOTAL de parcelas da compra, inteiro entre 1 e 24. Procure "Nx de R$ Y", "em N vezes", "parcelado em N", "N/M" (aqui M é o total), "N x". À vista ou sem indicação = 1.
7. parcela_atual: número da parcela ATUAL mostrada na fatura, inteiro entre 1 e o valor de "parcelas". MUITO IMPORTANTE:
   - Se aparecer "6/10", "Parcela 6 de 10", "6 de 10", "06/10" → parcela_atual = 6 e parcelas = 10.
   - Se aparecer "3x de R$ 50,00" sem indicar qual parcela, assuma parcela_atual = 1.
   - À vista ou parcela única → parcela_atual = 1.
   - NUNCA assuma 1 quando a fatura mostra claramente que já está em uma parcela posterior.

Regras importantes:
- NÃO ignore IOF, taxas ou estornos. Registre TUDO que represente uma transação na fatura.
- **IMPORTANTE**: Ignore transações que estejam com o texto **riscado ou tachado** na imagem. Elas geralmente indicam compras canceladas ou não processadas.
- IGNORE totais/subtotais da fatura — só as transações individuais.
- Se a imagem for ilegível ou não contiver transações, retorne compras: [] e confianca: "baixa".
- Máximo 30 itens por imagem.`;

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
                        tipo: { type: "string", description: "compra, iof, encargo, anuidade, juros, seguro, estorno ou outro" },
                        sinal: { type: "string", description: "debito ou credito" },
                        data: { type: "string", description: "Data YYYY-MM-DD" },
                        parcelas: { type: "integer", description: "Nº TOTAL de parcelas, 1 a 24 (1 = à vista)" },
                        parcela_atual: { type: "integer", description: "Nº da parcela ATUAL mostrada (ex: '6/10' = 6). Default 1." },
                      },
                      required: ["valor", "estabelecimento", "tipo", "sinal", "data", "parcelas", "parcela_atual"],
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
      compras: Array<{ valor: number | null; estabelecimento: string | null; data: string | null; parcelas: number; tipo?: string; sinal?: "debito" | "credito" }>;
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

    const compras = rawCompras.map((c: any) => ({
      ...c,
      valor: coerceValor(c?.valor),
      parcelas: Math.min(Math.max(parseInt(String(c?.parcelas ?? 1)) || 1, 1), 24),
    })).filter((c: any) => c.valor !== null && c.valor > 0);

    // Retrocompat: também devolve os campos da primeira compra no nível raiz
    const first = compras[0];
    const legacy = first
      ? {
          valor: first.valor,
          estabelecimento: first.estabelecimento,
          data: first.data,
          parcelas: first.parcelas ?? 1,
          tipo: first.tipo,
          sinal: first.sinal,
        }
      : { valor: null, estabelecimento: null, data: null, parcelas: 1, tipo: "compra", sinal: "debito" };

    return new Response(
      JSON.stringify({ ...legacy, compras, confianca: parsed.confianca || "media" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("Erro analisar-comprovante-cartao:", e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
