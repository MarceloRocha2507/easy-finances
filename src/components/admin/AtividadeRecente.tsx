import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ActivityLog } from "@/hooks/useAdmin";

interface AtividadeRecenteProps {
  onFetch: () => Promise<ActivityLog[]>;
}

const acaoLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  INSERT: { label: "Criação", variant: "default" },
  UPDATE: { label: "Edição", variant: "secondary" },
  DELETE: { label: "Exclusão", variant: "destructive" },
};

export function AtividadeRecente({ onFetch }: AtividadeRecenteProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    onFetch().then(setLogs).catch(console.error).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    );
  }

  if (!logs.length) {
    return <div className="text-center py-8 text-muted-foreground">Nenhuma atividade registrada</div>;
  }

  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader>
        <CardTitle>Últimas 50 Atividades Administrativas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Tabela</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const acao = acaoLabels[log.acao] || { label: log.acao, variant: "secondary" as const };
              return (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{log.email}</TableCell>
                  <TableCell><Badge variant={acao.variant}>{acao.label}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.tabela}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
