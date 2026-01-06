import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Pencil,
  Search,
  Trash2,
  User,
  Tag,
  X,
  Crown,
  Plus,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  listarParcelasDaFatura,
  ParcelaFatura,
  marcarParcelaComoPaga,
  calcularResumoPorResponsavel,
  ResumoResponsavel,
} from "@/services/compras-cartao";
import { useResponsaveis } from "@/services/responsaveis";
import { Cartao } from "@/services/cartoes";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { EditarCompraDialog } from "@/components/cartoes/EditarCompraDialog";
import { ExcluirCompraDialog } from "@/components/cartoes/ExcluirCompraDialog";
import { NovaCompraCartaoDialog } from "@/components/cartoes/NovaCompraCartaoDialog";
import { useAuth } from "@/hooks/useAuth";

/* ======================================================
   Utils
====================================================== */

function monthLabel(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(d);
}

function addMonths(base: Date, delta: number) {
  return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}

/* ======================================================
   Tipos de Filtro
====================================================== */

interface Filtros {
  busca: string;
  status: "todos" | "pendente" | "pago";
  responsavelId: string | null;
}

const filtrosIniciais: Filtros = {
  busca: "",
  status: "todos",
  responsavelId: null,
};

/* ======================================================
   Component
====================================================== */

export default function DespesasCartao() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cartao, setCartao] = useState<Cartao | null>(null);
  const [mesRef, setMesRef] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [parcelas, setParcelas] = useState<ParcelaFatura[]>([]);
  const [resumoResponsaveis, setResumoResponsaveis] = useState<ResumoResponsavel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciais);

  // Dialogs
  const [novaCompraOpen, setNovaCompraOpen] = useState(false);
  const [editarCompraOpen, setEditarCompraOpen] = useState(false);
  const [excluirCompraOpen, setExcluirCompraOpen] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<ParcelaFatura | null>(null);

  // Hooks
  const { data: responsaveis = [] } = useResponsaveis();

  /* ======================================================
     Carregar cartão
  ====================================================== */

  useEffect(() => {
    if (!id || !user) return;

    async function fetchCartao() {
      const { data, error } = await supabase
        .from("cartoes")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

      if (!error && data) {
        setCartao(data as Cartao);
      }
    }

    fetchCartao();
  }, [id, user]);

  /* ======================================================
     Carregar parcelas e resumo
  ====================================================== */

  async function carregarFatura() {
    if (!id) return;
    setLoading(true);

    try {
      const [parcelasData, resumoData] = await Promise.all([
        listarParcelasDaFatura(id, mesRef),
        calcularResumoPorResponsavel(id, mesRef),
      ]);
      setParcelas(parcelasData ?? []);
      setResumoResponsaveis(resumoData ?? []);
    } catch (e) {
      console.error(e);
      setParcelas([]);
      setResumoResponsaveis([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    carregarFatura();
    setFiltros(filtrosIniciais);
  }, [id, mesRef]);

  /* ======================================================
     Aplicar filtros
  ====================================================== */

  const parcelasFiltradas = useMemo(() => {
    return parcelas.filter((p) => {
      if (
        filtros.busca &&
        !p.descricao.toLowerCase().includes(filtros.busca.toLowerCase())
      ) {
        return false;
      }

      if (filtros.status === "pendente" && p.paga) return false;
      if (filtros.status === "pago" && !p.paga) return false;

      if (filtros.responsavelId) {
        if (p.responsavel_id !== filtros.responsavelId) return false;
      }

      return true;
    });
  }, [parcelas, filtros]);

  /* ======================================================
     Totais
  ====================================================== */

  const totalMes = useMemo(() => {
    return parcelas
      .filter((p) => !p.paga)
      .reduce((sum, p) => sum + Math.abs(Number(p.valor) || 0), 0);
  }, [parcelas]);

  const totalPago = useMemo(() => {
    return parcelas
      .filter((p) => p.paga)
      .reduce((sum, p) => sum + Math.abs(Number(p.valor) || 0), 0);
  }, [parcelas]);

  const totalFiltrado = useMemo(() => {
    return parcelasFiltradas.reduce(
      (sum, p) => sum + Math.abs(Number(p.valor) || 0),
      0
    );
  }, [parcelasFiltradas]);

  const temFiltrosAtivos =
    filtros.busca !== "" ||
    filtros.status !== "todos" ||
    filtros.responsavelId !== null;

  if (!id) return null;

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header compacto */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cartoes")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CreditCard
              className="h-5 w-5"
              style={{ color: cartao?.cor || "#6366f1" }}
            />
            <div>
              <h1 className="text-xl font-bold">{cartao?.nome || "Cartão"}</h1>
              <p className="text-xs text-muted-foreground">Despesas do mês</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setNovaCompraOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" />
            Nova compra
          </Button>
        </div>

        {/* Resumo inline */}
        <div className="flex flex-wrap items-center gap-4 p-3 rounded-lg bg-muted/50 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-destructive" />
            <span>Pendente:</span>
            <span className="font-semibold text-destructive">{formatCurrency(totalMes)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Pago:</span>
            <span className="font-semibold text-emerald-500">{formatCurrency(totalPago)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Total:</span>
            <span className="font-semibold">{formatCurrency(totalMes + totalPago)}</span>
          </div>
        </div>

        {/* Resumo por responsável */}
        {resumoResponsaveis.length > 0 && (
          <div className="p-3 rounded-lg border bg-card space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Por responsável</p>
            <div className="flex flex-wrap gap-3">
              {resumoResponsaveis.map((r) => (
                <div
                  key={r.responsavel_id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors",
                    filtros.responsavelId === r.responsavel_id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                  onClick={() => setFiltros((f) => ({
                    ...f,
                    responsavelId: f.responsavelId === r.responsavel_id ? null : r.responsavel_id,
                  }))}
                >
                  {r.is_titular ? (
                    <Crown className="h-3.5 w-3.5" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                  <span className="font-medium">{r.responsavel_apelido || r.responsavel_nome}</span>
                  <span className="text-xs opacity-75">{formatCurrency(r.total)}</span>
                  <span className="text-xs opacity-50">({r.percentual.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navegação de mês + Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Mês */}
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => setMesRef((m) => addMonths(m, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center font-medium capitalize">
              {monthLabel(mesRef)}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => setMesRef((m) => addMonths(m, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Filtros inline */}
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-8 h-8"
                value={filtros.busca}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, busca: e.target.value }))
                }
              />
              {filtros.busca && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setFiltros((f) => ({ ...f, busca: "" }))}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <Select
              value={filtros.status}
              onValueChange={(v) =>
                setFiltros((f) => ({
                  ...f,
                  status: v as "todos" | "pendente" | "pago",
                }))
              }
            >
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="pago">Pagos</SelectItem>
              </SelectContent>
            </Select>

            {temFiltrosAtivos && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                onClick={() => setFiltros(filtrosIniciais)}
              >
                <X className="h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Resultado dos filtros */}
        {temFiltrosAtivos && (
          <div className="text-sm text-muted-foreground">
            Mostrando <strong>{parcelasFiltradas.length}</strong> de{" "}
            <strong>{parcelas.length}</strong> · Total: <strong>{formatCurrency(totalFiltrado)}</strong>
          </div>
        )}

        {/* Tabela de despesas */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="hidden md:table-cell">Responsável</TableHead>
                  <TableHead className="text-center w-20">Parcela</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}

                {!loading && parcelasFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-20" />
                      <p className="text-muted-foreground text-sm">
                        {temFiltrosAtivos
                          ? "Nenhum resultado encontrado."
                          : "Nenhuma despesa neste mês."}
                      </p>
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  parcelasFiltradas.map((p) => (
                    <TableRow
                      key={p.id}
                      className={cn(p.paga && "opacity-50 bg-emerald-500/5")}
                    >
                      <TableCell>
                        <Checkbox
                          checked={!!p.paga}
                          onCheckedChange={async () => {
                            await marcarParcelaComoPaga(p.id, !p.paga);
                            carregarFatura();
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <p className={cn(
                          "font-medium",
                          p.paga && "line-through text-muted-foreground"
                        )}>
                          {p.descricao}
                        </p>
                      </TableCell>

                      <TableCell className="hidden sm:table-cell">
                        {p.categoria_nome ? (
                          <Badge
                            variant="secondary"
                            className="gap-1 text-xs"
                            style={{
                              backgroundColor: `${p.categoria_cor}15`,
                              color: p.categoria_cor,
                            }}
                          >
                            <Tag className="h-3 w-3" />
                            {p.categoria_nome}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        {p.responsavel_apelido || p.responsavel_nome ? (
                          <span className="text-sm">
                            {p.responsavel_apelido || p.responsavel_nome}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">
                          {p.numero_parcela}/{p.total_parcelas}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className={cn(
                          "font-semibold",
                          p.paga ? "line-through text-muted-foreground" : "text-destructive"
                        )}>
                          {formatCurrency(Math.abs(p.valor))}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-0.5">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setParcelaSelecionada(p);
                                    setEditarCompraOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setParcelaSelecionada(p);
                                    setExcluirCompraOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Excluir</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      {cartao && (
        <NovaCompraCartaoDialog
          cartao={cartao}
          open={novaCompraOpen}
          onOpenChange={setNovaCompraOpen}
          onSaved={() => {
            setNovaCompraOpen(false);
            carregarFatura();
          }}
        />
      )}

      <EditarCompraDialog
        parcela={parcelaSelecionada}
        open={editarCompraOpen}
        onOpenChange={(open) => {
          setEditarCompraOpen(open);
          if (!open) setParcelaSelecionada(null);
        }}
        onSaved={() => {
          setEditarCompraOpen(false);
          setParcelaSelecionada(null);
          carregarFatura();
        }}
      />

      <ExcluirCompraDialog
        parcela={parcelaSelecionada}
        open={excluirCompraOpen}
        onOpenChange={(open) => {
          setExcluirCompraOpen(open);
          if (!open) setParcelaSelecionada(null);
        }}
        onDeleted={() => {
          setExcluirCompraOpen(false);
          setParcelaSelecionada(null);
          carregarFatura();
        }}
      />
    </Layout>
  );
}
