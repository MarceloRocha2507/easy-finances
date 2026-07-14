import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  MoreVertical,
  Repeat,
  CreditCard,
  Pencil,
  Pause,
  Play,
  XCircle,
  Trash2,
  Wallet,
} from "lucide-react";
import { useDespesasRecorrentes } from "@/hooks/useDespesasRecorrentes";
import { DespesaRecorrente } from "@/services/despesas-recorrentes";
import { NovaRecorrenciaDialog } from "@/components/recorrentes/NovaRecorrenciaDialog";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FREQ_LABEL: Record<string, string> = {
  diaria: "Diária",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

const METODO_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  debito: "Débito",
  conta: "Conta",
  cartao_credito: "Cartão",
};

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  ativa: { label: "Ativa", variant: "default" },
  pausada: { label: "Pausada", variant: "secondary" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

function estimarMensal(r: DespesaRecorrente): number {
  const n = Math.max(1, r.intervalo || 1);
  const perAno: Record<string, number> = {
    diaria: 365 / n,
    semanal: 52 / n,
    quinzenal: 26 / n,
    mensal: 12 / n,
    bimestral: 6 / n,
    trimestral: 4 / n,
    semestral: 2 / n,
    anual: 1 / n,
  };
  return (r.valor * (perAno[r.frequencia] || 12)) / 12;
}

export default function Recorrentes() {
  const { recorrentes, isLoading, pausar, cancelar, reativar, excluir } = useDespesasRecorrentes();
  const [dialog, setDialog] = useState(false);
  const [editar, setEditar] = useState<DespesaRecorrente | null>(null);
  const [excluindo, setExcluindo] = useState<DespesaRecorrente | null>(null);
  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [filtroMetodo, setFiltroMetodo] = useState("todos");

  const ativas = useMemo(() => recorrentes.filter((r) => r.status === "ativa"), [recorrentes]);
  const totalMensal = useMemo(
    () => ativas.reduce((s, r) => s + estimarMensal(r), 0),
    [ativas]
  );

  const filtered = useMemo(() => {
    let list = [...recorrentes];
    if (filtroStatus !== "todas") list = list.filter((r) => r.status === filtroStatus);
    if (filtroMetodo !== "todos") list = list.filter((r) => r.metodo_pagamento === filtroMetodo);
    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [recorrentes, filtroStatus, filtroMetodo]);

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-[#111827]">Despesas Recorrentes</h1>
            <p className="text-sm text-muted-foreground">
              Cadastre uma vez — o sistema gera automaticamente cada ocorrência
            </p>
          </div>
          <Button
            onClick={() => {
              setEditar(null);
              setDialog(true);
            }}
            className="gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Nova recorrência
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card className="border rounded-xl">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Ativas</p>
              <p className="text-lg font-bold text-[#111827]">{ativas.length}</p>
            </CardContent>
          </Card>
          <Card className="border rounded-xl">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Gasto mensal estimado</p>
              <p className="text-lg font-bold text-[#111827]">{formatCurrency(totalMensal)}</p>
            </CardContent>
          </Card>
          <Card className="border rounded-xl col-span-2 sm:col-span-1">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Projeção anual</p>
              <p className="text-lg font-bold text-[#111827]">{formatCurrency(totalMensal * 12)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os status</SelectItem>
              <SelectItem value="ativa">Ativa</SelectItem>
              <SelectItem value="pausada">Pausada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroMetodo} onValueChange={setFiltroMetodo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os métodos</SelectItem>
              {Object.entries(METODO_LABEL).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="border rounded-xl">
          <CardContent className="p-0 divide-y">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Repeat className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm text-muted-foreground">Nenhuma recorrência ainda</p>
              </div>
            ) : (
              filtered.map((r) => {
                const sb = STATUS_BADGE[r.status];
                const isCartao = r.metodo_pagamento === "cartao_credito";
                return (
                  <div
                    key={r.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {isCartao ? (
                        <CreditCard className="w-4 h-4 text-primary" />
                      ) : (
                        <Wallet className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">{r.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {FREQ_LABEL[r.frequencia]}
                        {r.intervalo > 1 ? ` (a cada ${r.intervalo})` : ""} • {METODO_LABEL[r.metodo_pagamento]}
                      </p>
                    </div>
                    <div className="text-right mr-2">
                      <p className="text-sm font-bold text-[#111827]">{formatCurrency(r.valor)}</p>
                      <Badge variant={sb.variant} className="text-[10px] h-4 mt-0.5">
                        {sb.label}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditar(r); setDialog(true); }}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        {r.status === "ativa" && (
                          <>
                            <DropdownMenuItem onClick={() => pausar.mutate(r)}>
                              <Pause className="mr-2 h-4 w-4" /> Pausar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => cancelar.mutate(r)}>
                              <XCircle className="mr-2 h-4 w-4" /> Cancelar
                            </DropdownMenuItem>
                          </>
                        )}
                        {(r.status === "pausada" || r.status === "cancelada") && (
                          <DropdownMenuItem onClick={() => reativar.mutate(r)}>
                            <Play className="mr-2 h-4 w-4" /> Reativar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setExcluindo(r)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <NovaRecorrenciaDialog open={dialog} onOpenChange={setDialog} editar={editar} />

      <AlertDialog open={!!excluindo} onOpenChange={(o) => !o && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir recorrência?</AlertDialogTitle>
            <AlertDialogDescription>
              Ocorrências futuras ainda não pagas serão removidas. O histórico pago será preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (excluindo) excluir.mutate(excluindo);
                setExcluindo(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
