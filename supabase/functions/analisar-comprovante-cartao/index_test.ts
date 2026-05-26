// Testes automáticos do parser Nubank.
// Foco: garantir que linhas verdes (pagamento_fatura, estorno_parcelamento, estorno)
// sejam SEMPRE extraídas e devolvidas no array final `compras`.

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

// ---------- Helpers de mock ----------

type ToolArgs = Record<string, unknown>;

function buildOpenAIResponse(toolArguments: ToolArgs): Response {
  return new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            tool_calls: [
              {
                function: {
                  name: "registrar_compras_comprovante",
                  arguments: JSON.stringify(toolArguments),
                },
              },
            ],
          },
        },
      ],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

interface MockScenario {
  mainPass: ToolArgs;
  auditPass?: ToolArgs;
}

let capturedHandler: ((req: Request) => Promise<Response>) | null = null;
let originalFetch: typeof fetch;
let originalServe: typeof Deno.serve;
let moduleLoaded = false;

async function loadHandlerOnce() {
  if (moduleLoaded) return;
  Deno.env.set("OPENAI_API_KEY", "test-key");
  originalServe = Deno.serve;
  // @ts-ignore — stub para capturar o handler
  Deno.serve = ((handler: (req: Request) => Promise<Response>) => {
    capturedHandler = handler;
    return { finished: Promise.resolve(), shutdown: () => Promise.resolve() } as unknown as Deno.HttpServer;
  }) as typeof Deno.serve;
  await import("./index.ts");
  // @ts-ignore restore
  Deno.serve = originalServe;
  moduleLoaded = true;
  originalFetch = globalThis.fetch;
}

function installFetchMock(scenario: MockScenario) {
  let call = 0;
  globalThis.fetch = (async (_input: Request | URL | string, _init?: RequestInit) => {
    call += 1;
    if (call === 1) return buildOpenAIResponse(scenario.mainPass);
    if (call === 2 && scenario.auditPass) return buildOpenAIResponse(scenario.auditPass);
    return buildOpenAIResponse({ compras: [], confianca: "baixa" });
  }) as typeof fetch;
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

async function invoke(body: Record<string, unknown>): Promise<{ status: number; json: any }> {
  if (!capturedHandler) throw new Error("Handler não capturado");
  const req = new Request("http://localhost/analisar-comprovante-cartao", {
    method: "POST",
    headers: { Authorization: "Bearer test", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const res = await capturedHandler(req);
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

const tinyPngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9ZL6e8wAAAAASUVORK5CYII=";

// ---------- Cenários ----------

Deno.test("Nubank: créditos da auditoria são mesclados quando a 1ª passagem só traz débitos", async () => {
  await loadHandlerOnce();
  installFetchMock({
    mainPass: {
      compras: [
        {
          valor: 89.9, estabelecimento: "Mercado X", tipo: "compra", sinal: "debito",
          data: "2026-05-25", parcelas: 1, parcela_atual: 1, valor_eh_parcela: false,
          linha_original: "Mercado X R$ 89,90", valor_texto: "R$ 89,90",
        },
      ],
      confianca: "alta",
    },
    auditPass: {
      compras: [
        {
          valor: 30, estabelecimento: "Crédito de parcelamento de compra", tipo: "estorno_parcelamento",
          sinal: "credito", data: "2026-05-26", parcelas: 1, parcela_atual: 1, valor_eh_parcela: false,
          linha_original: "Crédito de parcelamento de compra -R$ 30,00", valor_texto: "-R$ 30,00",
        },
        {
          valor: 34.9, estabelecimento: "Crédito de parcelamento de compra", tipo: "estorno_parcelamento",
          sinal: "credito", data: "2026-05-26", parcelas: 1, parcela_atual: 1, valor_eh_parcela: false,
          linha_original: "Crédito de parcelamento de compra -R$ 34,90", valor_texto: "-R$ 34,90",
        },
        {
          valor: 20, estabelecimento: "Pagamento recebido", tipo: "pagamento_fatura",
          sinal: "credito", data: "2026-05-20", parcelas: 1, parcela_atual: 1, valor_eh_parcela: false,
          linha_original: "Pagamento recebido -R$ 20,00", valor_texto: "-R$ 20,00",
        },
        {
          valor: 74.67, estabelecimento: "Pagamento recebido", tipo: "pagamento_fatura",
          sinal: "credito", data: "2026-05-22", parcelas: 1, parcela_atual: 1, valor_eh_parcela: false,
          linha_original: "Pagamento recebido -R$ 74,67", valor_texto: "-R$ 74,67",
        },
      ],
      confianca: "alta",
    },
  });

  try {
    const { status, json } = await invoke({
      imageBase64: tinyPngBase64, mimeType: "image/png", nubank: true,
    });
    assertEquals(status, 200);
    const creditos = json.compras.filter((c: any) => c.sinal === "credito");
    assertEquals(creditos.length, 4, "todos os 4 créditos devem estar presentes");
    const pagamentos = creditos.filter((c: any) => c.tipo === "pagamento_fatura");
    const estornosParc = creditos.filter((c: any) => c.tipo === "estorno_parcelamento");
    assertEquals(pagamentos.length, 2);
    assertEquals(estornosParc.length, 2);
    assert(creditos.every((c: any) => c.valor > 0), "valores devem ser positivos");
  } finally {
    restoreFetch();
  }
});

Deno.test("Nubank: dedup quando o mesmo crédito aparece nas duas passagens", async () => {
  await loadHandlerOnce();
  const credito = {
    valor: 114.2, estabelecimento: "Crédito de parcelamento de compra",
    tipo: "estorno_parcelamento", sinal: "credito", data: "2026-05-15",
    parcelas: 1, parcela_atual: 1, valor_eh_parcela: false,
    linha_original: "Crédito de parcelamento de compra -R$ 114,20", valor_texto: "-R$ 114,20",
  };
  installFetchMock({
    mainPass: { compras: [credito], confianca: "alta" },
    auditPass: { compras: [credito], confianca: "alta" },
  });

  try {
    const { json } = await invoke({ imageBase64: tinyPngBase64, mimeType: "image/png", nubank: true });
    const matches = json.compras.filter(
      (c: any) => c.tipo === "estorno_parcelamento" && Math.abs(c.valor - 114.2) < 0.01,
    );
    assertEquals(matches.length, 1, "duplicata deve ser deduplicada");
  } finally {
    restoreFetch();
  }
});

Deno.test("Nubank: pagamento_fatura NÃO é filtrado da resposta final", async () => {
  await loadHandlerOnce();
  installFetchMock({
    mainPass: {
      compras: [
        {
          valor: 500, estabelecimento: "Pagamento de fatura", tipo: "pagamento_fatura",
          sinal: "credito", data: "2026-05-10", parcelas: 1, parcela_atual: 1, valor_eh_parcela: false,
          linha_original: "Pagamento de fatura -R$ 500,00", valor_texto: "-R$ 500,00",
        },
      ],
      confianca: "alta",
    },
    auditPass: { compras: [], confianca: "alta" },
  });

  try {
    const { json } = await invoke({ imageBase64: tinyPngBase64, mimeType: "image/png", nubank: true });
    const pagamento = json.compras.find((c: any) => c.tipo === "pagamento_fatura");
    assert(pagamento, "pagamento_fatura deve estar presente para Nubank");
    assertEquals(pagamento.sinal, "credito");
    assertEquals(pagamento.valor, 500);
  } finally {
    restoreFetch();
  }
});

Deno.test("Genérico (sem nubank flag): pagamento_fatura É filtrado", async () => {
  await loadHandlerOnce();
  installFetchMock({
    mainPass: {
      compras: [
        {
          valor: 100, estabelecimento: "Pagamento", tipo: "pagamento_fatura",
          sinal: "credito", data: "2026-05-10", parcelas: 1, parcela_atual: 1, valor_eh_parcela: false,
          linha_original: "Pagamento -R$ 100,00", valor_texto: "-R$ 100,00",
        },
        {
          valor: 50, estabelecimento: "Loja", tipo: "compra", sinal: "debito",
          data: "2026-05-10", parcelas: 1, parcela_atual: 1, valor_eh_parcela: false,
          linha_original: "Loja R$ 50,00", valor_texto: "R$ 50,00",
        },
      ],
      confianca: "alta",
    },
  });

  try {
    const { json } = await invoke({ imageBase64: tinyPngBase64, mimeType: "image/png" });
    assert(!json.compras.some((c: any) => c.tipo === "pagamento_fatura"));
    assertEquals(json.compras.length, 1);
  } finally {
    restoreFetch();
  }
});

Deno.test("Nubank: estorno simples preserva sinal credito e valor positivo", async () => {
  await loadHandlerOnce();
  installFetchMock({
    mainPass: { compras: [], confianca: "alta" },
    auditPass: {
      compras: [
        {
          valor: 42.5, estabelecimento: "Estorno iFood", tipo: "estorno",
          sinal: "credito", data: "2026-05-18", parcelas: 1, parcela_atual: 1, valor_eh_parcela: false,
          linha_original: "Estorno iFood -R$ 42,50", valor_texto: "-R$ 42,50",
        },
      ],
      confianca: "alta",
    },
  });

  try {
    const { json } = await invoke({ imageBase64: tinyPngBase64, mimeType: "image/png", nubank: true });
    assertEquals(json.compras.length, 1);
    const estorno = json.compras[0];
    assertEquals(estorno.tipo, "estorno");
    assertEquals(estorno.sinal, "credito");
    assert(estorno.valor > 0);
  } finally {
    restoreFetch();
  }
});

Deno.test("Nubank: 'Pix no Crédito' deve ser reclassificado como compra em débito", async () => {
  await loadHandlerOnce();
  installFetchMock({
    mainPass: {
      compras: [
        {
          valor: 159.61, estabelecimento: "Pix no Crédito - Marcelo Rocha Fonseca Filho", tipo: "estorno",
          sinal: "credito", data: "2026-05-26", parcelas: 1, parcela_atual: 1, valor_eh_parcela: false,
          linha_original: "Pix no Crédito - Marcelo Rocha Fonseca Filho R$ 159,61", valor_texto: "R$ 159,61",
        },
        {
          valor: 7.6, estabelecimento: "Pix no Crédito - MALU ESTANISLAU", tipo: "estorno",
          sinal: "credito", data: "2026-05-26", parcelas: 1, parcela_atual: 1, valor_eh_parcela: false,
          linha_original: "Pix no Crédito - MALU ESTANISLAU R$ 7,60", valor_texto: "R$ 7,60",
        },
      ],
      confianca: "alta",
    },
    auditPass: { compras: [], confianca: "alta" },
  });

  try {
    const { status, json } = await invoke({ imageBase64: tinyPngBase64, mimeType: "image/png", nubank: true });
    assertEquals(status, 200);
    assertEquals(json.compras.length, 2);
    for (const compra of json.compras) {
      assertEquals(compra.tipo, "compra");
      assertEquals(compra.sinal, "debito");
      assert(compra.valor > 0);
      assert(String(compra.estabelecimento).toLowerCase().includes("pix no crédito".toLowerCase()));
    }
  } finally {
    restoreFetch();
  }
});

Deno.test("Sem authorization header → 401", async () => {
  await loadHandlerOnce();
  const req = new Request("http://localhost/x", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "abc" }),
  });
  const res = await capturedHandler!(req);
  await res.text();
  assertEquals(res.status, 401);
});
