import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChartWithLegend } from "@/components/dashboard/PieChartWithLegend";
import {
  NovaAssinaturaDialog,
  ExcluirAssinaturaDialog,
  DetalhesAssinaturaDialog,
  RadarGastosInvisiveis,
} from "@/components/assinaturas";
import { useAssinaturas, Assinatura } from "@/hooks/useAssinaturas";
import { formatCurrency } from "@/lib/formatters";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  MoreVertical,
  Repeat,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Activity,
  Pencil,
  Pause,
  Play,
  XCircle,
  CheckCircle,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const valorMensal = (a: Assinatura) => {
  const divisor: Record<string, number> = { mensal: 1, trimestral: 3, semestral: 6, anual: 12 };
  return a.valor / (divisor[a.frequencia] || 1);
};

const categoriaLabel = (c: string) =>
  c === "streaming" ? "Streaming" : c === "software" ? "Software" : c === "saude" ? "Saúde" : c === "educacao" ? "Educação" : "Outros";

const CATEGORIA_COLORS: Record<string, string> = {
  streaming: "#8B5CF6",
  software: "#3B82F6",
  saude: "#10B981",
  educacao: "#F59E0B",
  outros: "#6B7280",
};

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  ativa: { label: "Ativa", variant: "default" },
  pausada: { label: "Pausada", variant: "secondary" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

export default function Assinaturas() {
  const { assinaturas, isLoading, marcarComoPaga, pausar, cancelar, reativar } = useAssinaturas();

  const [dialogNova, setDialogNova] = useState(false);
  const [editando, setEditando] = useState<Assinatura | null>(null);
  const [excluindo, setExcluindo] = useState<Assinatura | null>(null);
  const [detalhes, setDetalhes] = useState<Assinatura | null>(null);

  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [ordenacao, setOrdenacao] = useState("proxima_cobranca");

  const ativas = useMemo(() => assinaturas.filter((a) => a.status === "ativa"), [assinaturas]);
  const gastoMensal = useMemo(() => ativas.reduce((s, a) => s + valorMensal(a), 0), [ativas]);

  const proximasRenovacoes = useMemo(() => {
    const hoje = new Date();
    return ativas.filter((a) => {
      const diff = differenceInDays(new Date(a.proxima_cobranca + "T12:00:00"), hoje);
      return diff >= 0 && diff <= 7;
    });
  }, [ativas]);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    ativas.forEach((a) => {
      const cat = a.categoria;
      map.set(cat, (map.get(cat) || 0) + valorMensal(a));
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name: categoriaLabel(name),
      value,
      color: CATEGORIA_COLORS[name] || "#6B7280",
    }));
  }, [ativas]);

  const filtered = useMemo(() => {
    let list = [...assinaturas];
    if (filtroStatus !== "todas") list = list.filter((a) => a.status === filtroStatus);
    if (filtroCategoria !== "todas") list = list.filter((a) => a.categoria === filtroCategoria);
    list.sort((a, b) => {
      if (ordenacao === "valor") return b.valor - a.valor;
      if (ordenacao === "nome") return a.nome.localeCompare(b.nome);
      return a.proxima_cobranca.localeCompare(b.proxima_cobranca);
    });
    return list;
  }, [assinaturas, filtroStatus, filtroCategoria, ordenacao]);

  const isProxima = (a: Assinatura) => {
    if (a.status !== "ativa") return false;
    const diff = differenceInDays(new Date(a.proxima_cobranca + "T12:00:00"), new Date());
    return diff >= 0 && diff <= 7;
  };

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">Assinaturas</h1>
            <p className="text-sm text-muted-foreground">Gerencie suas assinaturas recorrentes</p>
          </div>
          <Button onClick={() => { setEditando(null); setDialogNova(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Assinatura
          </Button>
        </div>

        {/* Radar de Gastos Invisíveis */}
        <RadarGastosInvisiveis />

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border rounded-xl">
            <CardContent className="p-4">
              {isLoading ? <Skeleton className="h-12 w-full" /> : (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted"><DollarSign className="h-5 w-5 text-muted-foreground" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gasto Mensal</p>
                    <p className="text-lg font-bold text-[#111827]">{formatCurrency(gastoMensal)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border rounded-xl">
            <CardContent className="p-4">
              {isLoading ? <Skeleton className="h-12 w-full" /> : (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted"><TrendingUp className="h-5 w-5 text-muted-foreground" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Projeção Anual</p>
                    <p className="text-lg font-bold text-[#111827]">{formatCurrency(gastoMensal * 12)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="border rounded-xl">
            <CardContent className="p-4">
              {isLoading ? <Skeleton className="h-12 w-full" /> : (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted"><Activity className="h-5 w-5 text-muted-foreground" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ativas</p>
                    <p className="text-lg font-bold text-[#111827]">{ativas.length}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pie chart + Alert */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PieChartWithLegend data={pieData} isLoading={isLoading} />

          <Card className="border rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Renovações Próximas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">{[1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
              ) : proximasRenovacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma renovação nos próximos 7 dias</p>
              ) : (
                <div className="space-y-2">
                  {proximasRenovacoes.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                      <div>
                        <p className="text-sm font-medium">{a.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(a.proxima_cobranca + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <p className="text-sm font-bold">{formatCurrency(a.valor)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="ativa">Ativa</SelectItem>
              <SelectItem value="pausada">Pausada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Categorias</SelectItem>
              <SelectItem value="streaming">Streaming</SelectItem>
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="saude">Saúde</SelectItem>
              <SelectItem value="educacao">Educação</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ordenacao} onValueChange={setOrdenacao}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="proxima_cobranca">Próxima cobrança</SelectItem>
              <SelectItem value="valor">Valor</SelectItem>
              <SelectItem value="nome">Nome</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Listing */}
        <Card className="border rounded-xl">
          <CardContent className="p-0 divide-y">
            {isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Repeat className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm text-muted-foreground">Nenhuma assinatura encontrada</p>
              </div>
            ) : (
              filtered.map((a) => {
                const sb = statusBadge[a.status] ?? statusBadge.ativa;
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer",
                      isProxima(a) && "border-l-2 border-l-amber-500"
                    )}
                    onClick={() => setDetalhes(a)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Repeat className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111827] truncate">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">{categoriaLabel(a.categoria)}</p>
                    </div>
                    <div className="text-right mr-2 hidden sm:block">
                      <p className="text-sm font-bold text-[#111827]">{formatCurrency(a.valor)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(a.proxima_cobranca + "T12:00:00"), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <Badge variant={sb.variant} className="hidden sm:inline-flex">{sb.label}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => setDetalhes(a)}>
                          <Eye className="mr-2 h-4 w-4" /> Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditando(a); setDialogNova(true); }}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        {a.status === "ativa" && (
                          <>
                            <DropdownMenuItem onClick={() => marcarComoPaga.mutate(a)}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Paga
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => pausar.mutate(a.id)}>
                              <Pause className="mr-2 h-4 w-4" /> Pausar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => cancelar.mutate(a.id)}>
                              <XCircle className="mr-2 h-4 w-4" /> Cancelar
                            </DropdownMenuItem>
                          </>
                        )}
                        {(a.status === "pausada" || a.status === "cancelada") && (
                          <DropdownMenuItem onClick={() => reativar.mutate(a)}>
                            <Play className="mr-2 h-4 w-4" /> Reativar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => setExcluindo(a)}>
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

      <NovaAssinaturaDialog open={dialogNova} onOpenChange={setDialogNova} assinatura={editando} />
      <ExcluirAssinaturaDialog open={!!excluindo} onOpenChange={(o) => !o && setExcluindo(null)} assinatura={excluindo} />
      <DetalhesAssinaturaDialog open={!!detalhes} onOpenChange={(o) => !o && setDetalhes(null)} assinatura={detalhes} />
    </Layout>
  );
}
