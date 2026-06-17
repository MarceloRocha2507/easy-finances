// MonitorHub HTTP client (server-side only — token never exposed to browser).
// Fire-and-forget: failures are logged but never thrown to the caller.

const BASE_URL = "https://sqaccuorasgvxmxpjbgg.supabase.co/functions/v1";
const TIMEOUT_MS = 8000;

function getToken(): string | null {
  const token = Deno.env.get("MONITORHUB_TOKEN");
  if (!token) {
    console.warn("[monitorhub] MONITORHUB_TOKEN não configurado — chamada ignorada.");
    return null;
  }
  return token;
}

async function postJson(path: string, body: unknown): Promise<void> {
  const token = getToken();
  if (!token) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-integration-token": token,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    // Sempre consumir body para evitar leak
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.error(`[monitorhub] ${path} falhou [${res.status}]: ${text.slice(0, 300)}`);
    }
  } catch (err) {
    console.error(`[monitorhub] erro ao chamar ${path}:`, err instanceof Error ? err.message : err);
  } finally {
    clearTimeout(timer);
  }
}

export interface Metrica {
  key: string;
  value: number;
  unit?: string;
}

export async function enviarMetrica(key: string, value: number, unit?: string): Promise<void> {
  const body: Metrica = { key, value, ...(unit ? { unit } : {}) };
  await postJson("/ingest-metric", body);
}

export async function enviarMetricas(metricas: Metrica[]): Promise<void> {
  if (metricas.length === 0) return;
  await postJson("/ingest-metric", metricas);
}

export async function enviarEvento(
  event: string,
  value?: number,
  payload?: Record<string, unknown>
): Promise<void> {
  const body: Record<string, unknown> = { event };
  if (typeof value === "number") body.value = value;
  if (payload) body.payload = payload;
  await postJson("/ingest-event", body);
}
