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

A imagem pode conter UMA ÚNICA compra (recibo simples) ou MÚLTIPLAS compras (print do app do banco, extrato da fatura, lista de transações). Extraia TODAS as compras visíveis e retorne no array "compras".

Para cada compra, extraia:
1. valor: valor TOTAL da compra (número em reais, ponto decimal). Se for parcelado ("3x de R$ 50,00"), retorne o total (R$ 150,00).
2. estabelecimento: nome curto e limpo (ex: "Pão de Açúcar", "Uber", "Amazon"). Sem CNPJ nem endereço.
3. data: data da compra no formato YYYY-MM-DD. Converta de DD/MM/AAAA se necessário. Se não houver, use a data de hoje.
4. parcelas: inteiro entre 1 e 24. Procure "Nx de R$ Y", "em N vezes", "parcelado em N", "N/M", "N x". À vista ou sem indicação = 1. Ignore parcelamentos cancelados/recusados.

Regras importantes:
- IGNORE linhas de pagamento de fatura, estornos, créditos, ajustes e taxas (não são compras).
- IGNORE totais/subtotais da fatura — só as transações individuais.
- Se a imagem for ilegível ou não contiver compras, retorne compras: [] e confianca: "baixa".
- Máximo 30 compras por imagem.`;

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
                    maxItems: 30,
                    items: {
                      type: "object",
                      properties: {
                        valor: { type: ["number", "null"], description: "Valor TOTAL em reais" },
                        estabelecimento: { type: ["string", "null"], description: "Nome do estabelecimento" },
                        data: { type: ["string", "null"], description: "Data YYYY-MM-DD" },
                        parcelas: { type: "integer", minimum: 1, maximum: 24, description: "Nº de parcelas (1 = à vista)" },
                      },
                      required: ["valor", "estabelecimento", "data", "parcelas"],
                      additionalProperties: false,
                    },
                  },
                  confianca: { type: "string", enum: ["alta", "media", "baixa"] },
                },
                required: ["compras", "confianca"],
                additionalProperties: false,
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
      compras: Array<{ valor: number | null; estabelecimento: string | null; data: string | null; parcelas: number }>;
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

    const compras = Array.isArray(parsed.compras) ? parsed.compras : [];

    // Retrocompat: também devolve os campos da primeira compra no nível raiz
    const first = compras[0];
    const legacy = first
      ? {
          valor: first.valor,
          estabelecimento: first.estabelecimento,
          data: first.data,
          parcelas: first.parcelas ?? 1,
        }
      : { valor: null, estabelecimento: null, data: null, parcelas: 1 };

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
