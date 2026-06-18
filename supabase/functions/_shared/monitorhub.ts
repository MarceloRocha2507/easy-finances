// MonitorHub HTTP client (server-side only — token never exposed to browser).
// Logs every call into public.monitorhub_log.

import { createClient } from "npm:@supabase/supabase-js@2";

const DEFAULT_BASE_URL = "https://sqaccuorasgvxmxpjbgg.supabase.co/functions/v1";
const TIMEOUT_MS = 8000;

function getToken(): string | null {
  const token = Deno.env.get("MONITORHUB_TOKEN");
  if (!token) {
    console.warn("[monitorhub] MONITORHUB_TOKEN não configurado — chamada ignorada.");
    return null;
  }
  return token;
}

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

export async function logMonitorhub(
  kind: "metric" | "event" | "sync",
  status: "ok" | "error",
  detail?: string,
  error?: string
): Promise<void> {
  try {
    await admin().from("monitorhub_log").insert({ kind, status, detail, error });
  } catch (e) {
    console.error("[monitorhub] falha ao gravar log:", e);
  }
}

export interface MonitorConfig {
  enabled: boolean;
  hub_url: string;
  owner_user_id: string | null;
  send_saldo: boolean;
  send_total_a_pagar: boolean;
  send_events: boolean;
}

export async function getConfig(): Promise<MonitorConfig | null> {
  const { data, error } = await admin()
    .from("monitorhub_config")
    .select("enabled,hub_url,owner_user_id,send_saldo,send_total_a_pagar,send_events")
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[monitorhub] erro ao ler config:", error);
    return null;
  }
  return data as MonitorConfig | null;
}

async function postJson(
  baseUrl: string,
  path: string,
  body: unknown
): Promise<{ ok: boolean; error?: string }> {
  const token = getToken();
  if (!token) return { ok: false, error: "missing_token" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-integration-token": token,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      const err = `HTTP ${res.status}: ${text.slice(0, 300)}`;
      console.error(`[monitorhub] ${path} falhou: ${err}`);
      return { ok: false, error: err };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[monitorhub] erro ao chamar ${path}:`, msg);
    return { ok: false, error: msg };
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
  await enviarMetricas([{ key, value, ...(unit ? { unit } : {}) }]);
}

export async function enviarMetricas(metricas: Metrica[]): Promise<void> {
  if (metricas.length === 0) return;
  const cfg = await getConfig();
  const baseUrl = cfg?.hub_url ?? DEFAULT_BASE_URL;
  if (cfg && !cfg.enabled) {
    await logMonitorhub("metric", "error", metricas.map((m) => m.key).join(","), "integration_disabled");
    return;
  }
  const r = await postJson(baseUrl, "/ingest-metric", metricas);
  await logMonitorhub(
    "metric",
    r.ok ? "ok" : "error",
    metricas.map((m) => `${m.key}=${m.value}`).join(", "),
    r.error
  );
}

export async function enviarEvento(
  event: string,
  value?: number,
  payload?: Record<string, unknown>
): Promise<void> {
  const cfg = await getConfig();
  const baseUrl = cfg?.hub_url ?? DEFAULT_BASE_URL;
  if (cfg && (!cfg.enabled || !cfg.send_events)) {
    await logMonitorhub("event", "error", event, "events_disabled");
    return;
  }
  const body: Record<string, unknown> = { event };
  if (typeof value === "number") body.value = value;
  if (payload) body.payload = payload;
  const r = await postJson(baseUrl, "/ingest-event", body);
  await logMonitorhub("event", r.ok ? "ok" : "error", event, r.error);
}
