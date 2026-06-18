import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, Send, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Config {
  id: string;
  enabled: boolean;
  hub_url: string;
  owner_user_id: string | null;
  send_saldo: boolean;
  send_total_a_pagar: boolean;
  send_events: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
}

interface LogRow {
  id: string;
  kind: string;
  detail: string | null;
  status: string;
  error: string | null;
  created_at: string;
}

export default function IntegracaoMonitorHubPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);

  async function loadAll() {
    setLoading(true);
    const [{ data: cfg }, { data: lg }] = await Promise.all([
      supabase.from("monitorhub_config" as never).select("*").limit(1).maybeSingle(),
      supabase.from("monitorhub_log" as never).select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    setConfig((cfg as Config) ?? null);
    setLogs((lg as LogRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    const { error } = await supabase
      .from("monitorhub_config" as never)
      .update({
        enabled: config.enabled,
        hub_url: config.hub_url,
        owner_user_id: config.owner_user_id || null,
        send_saldo: config.send_saldo,
        send_total_a_pagar: config.send_total_a_pagar,
        send_events: config.send_events,
      })
      .eq("id", config.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configuração salva" });
      loadAll();
    }
  }

  async function syncNow() {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("monitorhub-sync");
      if (error) throw error;
      toast({
        title: "Sincronização concluída",
        description: (data as { ok?: boolean; error?: string })?.ok
          ? "Métricas enviadas com sucesso."
          : (data as { error?: string })?.error || "Verifique os logs.",
      });
    } catch (e) {
      toast({ title: "Erro na sincronização", description: String(e), variant: "destructive" });
    } finally {
      setSyncing(false);
      loadAll();
    }
  }

  async function testConnection() {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("monitorhub-event", {
        body: { event: "transacao_criada", value: 0, payload: { test: true } },
      });
      if (error) throw error;
      toast({
        title: "Teste enviado",
        description: (data as { ok?: boolean })?.ok ? "Evento de teste aceito." : "Falhou — veja os logs.",
      });
    } catch (e) {
      toast({ title: "Erro no teste", description: String(e), variant: "destructive" });
    } finally {
      setTesting(false);
      loadAll();
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando…
        </div>
      </Layout>
    );
  }

  if (!config) {
    return (
      <Layout>
        <Card><CardContent className="p-6">Configuração não encontrada.</CardContent></Card>
      </Layout>
    );
  }

  const lastOk = config.last_sync_status === "ok";

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-semibold">Integração MonitorHub</h1>
          <p className="text-sm text-muted-foreground">Envio automático de métricas e eventos para o painel externo.</p>
        </div>

        {/* Status */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Status</CardTitle>
              <CardDescription>Estado atual da integração</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="enabled" className="text-sm">Ativa</Label>
              <Switch
                id="enabled"
                checked={config.enabled}
                onCheckedChange={(v) => setConfig({ ...config, enabled: v })}
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Última sincronização:</span>
              <span>
                {config.last_sync_at
                  ? format(parseISO(config.last_sync_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                  : "—"}
              </span>
              {config.last_sync_status && (
                <Badge variant={lastOk ? "default" : "destructive"} className="gap-1">
                  {lastOk ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {config.last_sync_status}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Token:</span>
              <Badge variant="secondary">configurado no servidor</Badge>
            </div>
            {config.last_sync_error && (
              <div className="w-full text-xs text-destructive">Erro: {config.last_sync_error}</div>
            )}
          </CardContent>
        </Card>

        {/* Configuração */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuração</CardTitle>
            <CardDescription>Endpoint, dono e tipos de envio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hub_url">URL do Hub</Label>
              <Input
                id="hub_url"
                value={config.hub_url}
                onChange={(e) => setConfig({ ...config, hub_url: e.target.value })}
                placeholder="https://...supabase.co/functions/v1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Owner user_id</Label>
              <Input
                id="owner"
                value={config.owner_user_id ?? ""}
                onChange={(e) => setConfig({ ...config, owner_user_id: e.target.value })}
                placeholder="UUID do usuário fonte das métricas"
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                <span className="text-sm">Enviar saldo</span>
                <Switch checked={config.send_saldo} onCheckedChange={(v) => setConfig({ ...config, send_saldo: v })} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                <span className="text-sm">Enviar total a pagar</span>
                <Switch checked={config.send_total_a_pagar} onCheckedChange={(v) => setConfig({ ...config, send_total_a_pagar: v })} />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                <span className="text-sm">Enviar eventos</span>
                <Switch checked={config.send_events} onCheckedChange={(v) => setConfig({ ...config, send_events: v })} />
              </label>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar
              </Button>
              <Button variant="outline" onClick={syncNow} disabled={syncing}>
                {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Sincronizar agora
              </Button>
              <Button variant="outline" onClick={testConnection} disabled={testing}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Testar conexão
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos envios</CardTitle>
            <CardDescription>20 registros mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem registros ainda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detalhe</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">
                        {format(parseISO(l.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell><Badge variant="outline">{l.kind}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={l.status === "ok" ? "default" : "destructive"}>{l.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{l.detail ?? "—"}</TableCell>
                      <TableCell className="text-xs text-destructive max-w-xs truncate">{l.error ?? ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
