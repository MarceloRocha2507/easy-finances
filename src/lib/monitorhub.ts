// Wrapper client-side para enviar eventos ao MonitorHub via edge function.
// Fire-and-forget: nunca lança, nunca trava a UI.
import { supabase } from "@/integrations/supabase/client";

export type MonitorHubEvent = "transacao_criada" | "fatura_paga";

export function pushMonitorHubEvent(
  event: MonitorHubEvent,
  value?: number,
  payload?: Record<string, unknown>
): void {
  // Não aguardamos a promise — disparo assíncrono.
  void supabase.functions
    .invoke("monitorhub-event", {
      body: { event, value, payload, refreshSaldo: true },
    })
    .catch((err) => {
      console.warn("[monitorhub] push falhou:", err);
    });
}
