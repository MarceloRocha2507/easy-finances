import { useEffect, useMemo, useState } from "react";
import {
  listarParcelasDaFatura,
  ParcelaFatura,
  marcarParcelaComoPaga,
  pagarFaturaDoMes,
} from "@/services/compras-cartao";
import { useAcertosMes } from "@/services/acertos";
import { useResponsaveis } from "@/services/responsaveis";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Cartao } from "@/services/cartoes";
import { NovaCompraCartaoDialog } from "./NovaCompraCartaoDialog";
import { EditarCartaoDialog } from "./EditarCartaoDialog";
import { ExcluirCartaoDialog } from "./ExcluirCartaoDialog";
import { GerarMensagemDialog } from "./GerarMensagemDialog";
import { RegistrarAcertoDialog } from "./RegistrarAcertoDialog";
import { ResumoPorResponsavel } from "./ResumoPorResponsavel";
import { EditarCompraDialog } from "./EditarCompraDialog";
import { ExcluirCompraDialog } from "./ExcluirCompraDialog";

import {
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Check,
  Tag,
  Search,
  ChevronDown,
  SlidersHorizontal,
  X,
  Filter,
  FileText,
  Wallet,
  User,
  Crown,
} from "lucide-react";

import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

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

interface Props {
  cartao: Cartao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function DetalhesCartaoDialog({
  cartao,
  open,
  onOpenChange,
  onUpdated,
}: Props) {
  const [mesRef, setMesRef] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [parcelas, setParcelas] = useState<ParcelaFatura[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Dialogs do cartão
  const [novaCompraOpen, setNovaCompraOpen] = useState(false);
  const [editarCartaoOpen, setEditarCartaoOpen] = useState(false);
  const [excluirCartaoOpen, setExcluirCartaoOpen] = useState(false);
  const [gerarMensagemOpen, setGerarMensagemOpen] = useState(false);
  const [registrarAcertoOpen, setRegistrarAcertoOpen] = useState(false);

  // Dialogs da compra
  const [editarCompraOpen, setEditarCompraOpen] = useState(false);
  const [excluirCompraOpen, setExcluirCompraOpen] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<ParcelaFatura | null>(null);

  // Filtros
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciais);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  // Hooks
  const { data: responsaveis = [] } = useResponsaveis();
  const { data: acertos = [], refetch: refetchAcertos } = useAcertosMes(
    open && cartao ? cartao.id : null,
    mesRef
  );

  const temFiltrosAtivos =
    filtros.busca !== "" ||
    filtros.status !== "todos" ||
    filtros.responsavelId !== null;

  /* ======================================================
     Carregar dados
  ====================================================== */

  async function carregarFatura() {
    if (!cartao) return;
    setLoading(true);
    setErro(null);

    try {
      const parcelasData = await listarParcelasDaFatura(cartao.id, mesRef);
      setParcelas(parcelasData ?? []);
    } catch (e) {
      console.error(e);
      setParcelas([]);
      setErro("Não foi possível carregar a fatura.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!cartao || !open) return;
    carregarFatura();
    setFiltros(filtrosIniciais);
  }, [cartao?.id, open, mesRef]);

  /* ======================================================
     Aplicar filtros
  ====================================================== */

  const parcelasFiltradas = useMemo(() => {
    return parcelas.filter((p) => {
      // Busca
      if (
        filtros.busca &&
        !p.descricao.toLowerCase().includes(filtros.busca.toLowerCase())
      ) {
        return false;
      }

      // Status
      if (filtros.status === "pendente" && p.paga) return false;
      if (filtros.status === "pago" && !p.paga) return false;

      // Responsável
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

  if (!cartao) return null;

  const limite = cartao.limite;
  const disponivel = Math.max(limite - totalMes, 0);
  const usoPct = limite > 0 ? Math.min((totalMes / limite) * 100, 100) : 0;

  const podePagarFatura = parcelas.some((p) => !p.paga);

  function limparFiltros() {
    setFiltros(filtrosIniciais);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh]">
          {/* Header */}
          <div
            className="p-6 text-white"
            style={{
              background: `linear-gradient(135deg, rgb(15 23 42) 0%, rgb(15 23 42) 60%, ${cartao.cor || "#6366f1"}50 100%)`,
            }}
          >
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2 text-white">
                    <CreditCard className="h-5 w-5" />
                    {cartao.nome}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Fatura mensal do cartão
                  </DialogDescription>
                </div>

                <Badge variant="secondary" className="text-xs">
                  {cartao.bandeira || "Crédito"}
                </Badge>
              </div>
            </DialogHeader>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-slate-400">Limite</p>
                <p className="font-semibold">{formatCurrency(limite)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Total do mês</p>
                <p className="font-semibold text-red-400">
                  {formatCurrency(totalMes)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Disponível</p>
                <p className="font-semibold text-emerald-400">
                  {formatCurrency(disponivel)}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <Progress value={usoPct} className="h-2" />
              <p className="text-xs text-slate-400 mt-1">
                {usoPct.toFixed(0)}% do limite utilizado
              </p>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6 overflow-y-auto">
            {/* Navegação + Ações */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setMesRef((m) => addMonths(m, -1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="min-w-[160px] text-center font-semibold capitalize">
                  {monthLabel(mesRef)}
                </span>

                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setMesRef((m) => addMonths(m, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setGerarMensagemOpen(true)}
                >
                  <FileText className="h-4 w-4" />
                  Mensagem
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => setRegistrarAcertoOpen(true)}
                >
                  <Wallet className="h-4 w-4" />
                  Acerto
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => setNovaCompraOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Nova compra
                </Button>
              </div>
            </div>

            {/* Resumo por responsável */}
            {parcelas.length > 0 && (
              <ResumoPorResponsavel
                parcelas={parcelas}
                acertos={acertos}
                className="mb-4"
              />
            )}

            {/* FILTROS */}
            <Collapsible open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
              <div className="flex items-center gap-2 mb-4">
                {/* Busca rápida */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar compra..."
                    className="pl-9"
                    value={filtros.busca}
                    onChange={(e) =>
                      setFiltros((f) => ({ ...f, busca: e.target.value }))
                    }
                  />
                  {filtros.busca && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setFiltros((f) => ({ ...f, busca: "" }))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Botão de filtros avançados */}
                <CollapsibleTrigger asChild>
                  <Button
                    variant={temFiltrosAtivos ? "secondary" : "outline"}
                    size="sm"
                    className="gap-2"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros
                    {temFiltrosAtivos && (
                      <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center text-xs">
                        !
                      </Badge>
                    )}
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        filtrosAbertos && "rotate-180"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent>
                <div className="p-4 mb-4 border rounded-xl bg-muted/30 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Status */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={filtros.status}
                        onValueChange={(v) =>
                          setFiltros((f) => ({
                            ...f,
                            status: v as "todos" | "pendente" | "pago",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="pendente">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              Pendentes
                            </div>
                          </SelectItem>
                          <SelectItem value="pago">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              Pagos
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Responsável */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Responsável</label>
                      <Select
                        value={filtros.responsavelId || "todos"}
                        onValueChange={(v) =>
                          setFiltros((f) => ({
                            ...f,
                            responsavelId: v === "todos" ? null : v,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {responsaveis.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              <div className="flex items-center gap-2">
                                {r.is_titular ? (
                                  <Crown className="h-4 w-4 text-primary" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                                {r.apelido || r.nome}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {temFiltrosAtivos && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2"
                      onClick={limparFiltros}
                    >
                      <X className="h-4 w-4" />
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Resultado dos filtros */}
            {temFiltrosAtivos && (
              <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4 text-blue-500" />
                  <span>
                    Mostrando <strong>{parcelasFiltradas.length}</strong> de{" "}
                    <strong>{parcelas.length}</strong> parcelas
                  </span>
                </div>
                <span className="text-sm font-medium">
                  Total: {formatCurrency(totalFiltrado)}
                </span>
              </div>
            )}

            {podePagarFatura && !temFiltrosAtivos && (
              <Button
                variant="secondary"
                className="w-full mb-4 gap-2"
                onClick={async () => {
                  await pagarFaturaDoMes(cartao.id, mesRef);
                  carregarFatura();
                  onUpdated();
                }}
              >
                <Check className="h-4 w-4" />
                Pagar fatura inteira ({formatCurrency(totalMes)})
              </Button>
            )}

            {/* Resumo pendente/pago */}
            {parcelas.length > 0 && !temFiltrosAtivos && (
              <div className="flex gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Pendente: {formatCurrency(totalMes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Pago: {formatCurrency(totalPago)}</span>
                </div>
              </div>
            )}

            <ScrollArea className="h-[240px]">
              {loading && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Carregando fatura...
                </div>
              )}

              {erro && (
                <div className="p-4 text-sm text-red-500 bg-red-500/10 rounded-xl">
                  {erro}
                </div>
              )}

              {!loading && !erro && parcelasFiltradas.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  {temFiltrosAtivos
                    ? "Nenhuma parcela encontrada com os filtros."
                    : "Nenhuma parcela neste mês."}
                </div>
              )}

              {!loading &&
                !erro &&
                parcelasFiltradas.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex justify-between items-center p-3 rounded-xl mb-2 transition-all",
                      p.paga
                        ? "opacity-60 bg-emerald-500/5 border border-emerald-500/20"
                        : "hover:bg-muted/50 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Checkbox
                                checked={!!p.paga}
                                onCheckedChange={async () => {
                                  await marcarParcelaComoPaga(p.id, !p.paga);
                                  carregarFatura();
                                  onUpdated();
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {p.paga ? "Marcar como pendente" : "Marcar como paga"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Categoria badge */}
                      <div className="flex items-center gap-2">
                        {p.categoria_nome && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="w-6 h-6 rounded-md flex items-center justify-center"
                                  style={{
                                    backgroundColor: `${p.categoria_cor}20`,
                                    color: p.categoria_cor,
                                  }}
                                >
                                  <Tag className="h-3 w-3" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{p.categoria_nome}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <p
                          className={cn(
                            "font-medium",
                            p.paga && "line-through text-muted-foreground"
                          )}
                        >
                          {p.descricao}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {p.numero_parcela}/{p.total_parcelas}
                          </span>
                          {p.responsavel_apelido || p.responsavel_nome ? (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {p.responsavel_apelido || p.responsavel_nome}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Valor + Menu de ações */}
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "font-semibold value-display",
                          p.paga
                            ? "line-through text-muted-foreground"
                            : "text-red-500"
                        )}
                      >
                        {formatCurrency(Math.abs(p.valor))}
                      </p>

                      {/* MENU DE AÇÕES */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setParcelaSelecionada(p);
                              setEditarCompraOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar compra
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={() => {
                              setParcelaSelecionada(p);
                              setExcluirCompraOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir compra
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
            </ScrollArea>

            <Separator className="my-4" />

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setEditarCartaoOpen(true)}
              >
                <Pencil className="h-4 w-4" />
                Editar cartão
              </Button>

              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={() => setExcluirCartaoOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir cartão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogs do cartão */}
      <NovaCompraCartaoDialog
        cartao={cartao}
        open={novaCompraOpen}
        onOpenChange={setNovaCompraOpen}
        onSaved={() => {
          setNovaCompraOpen(false);
          carregarFatura();
          refetchAcertos();
          onUpdated();
        }}
      />

      <EditarCartaoDialog
        cartao={cartao}
        open={editarCartaoOpen}
        onOpenChange={setEditarCartaoOpen}
        onSaved={onUpdated}
      />

      <ExcluirCartaoDialog
        cartao={cartao}
        open={excluirCartaoOpen}
        onOpenChange={setExcluirCartaoOpen}
        onDeleted={onUpdated}
      />

      <GerarMensagemDialog
        cartao={cartao}
        mesReferencia={mesRef}
        open={gerarMensagemOpen}
        onOpenChange={setGerarMensagemOpen}
      />

      <RegistrarAcertoDialog
        cartao={cartao}
        mesReferencia={mesRef}
        open={registrarAcertoOpen}
        onOpenChange={setRegistrarAcertoOpen}
        onSaved={() => {
          refetchAcertos();
        }}
      />

      {/* Dialogs da compra */}
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
          refetchAcertos();
          onUpdated();
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
          refetchAcertos();
          onUpdated();
        }}
      />
    </>
  );
}