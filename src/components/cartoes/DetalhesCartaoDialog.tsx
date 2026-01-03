import { useEffect, useMemo, useState } from "react";
import {
  listarParcelasDaFatura,
  ParcelaFatura,
  marcarParcelaComoPaga,
  pagarFaturaDoMes,
} from "@/services/transactions";
import { supabase } from "@/integrations/supabase/client";

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
import { ExcluirCompraDialog } from "./ExcluirCompraDialog";
import { EditarCompraDialog } from "./EditarCompraDialog";

import {
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Check,
  Utensils,
  Car,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Home,
  MoreHorizontal,
  Tag,
  Filter,
  X,
  Search,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

import { formatCurrency } from "@/lib/formatters";

/* ======================================================
   Tipo Categoria local
====================================================== */
type Categoria = {
  id: string;
  nome: string;
  cor: string;
  icone?: string;
};

/* ======================================================
   Função para listar categorias (com fallback)
====================================================== */
async function listarCategoriasSafe(): Promise<Categoria[]> {
  try {
    // Tenta tabela 'categories' primeiro
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, color, icon")
      .order("name");

    if (!error && data) {
      return data.map((c: any) => ({
        id: c.id,
        nome: c.name,
        cor: c.color || "#6366f1",
        icone: c.icon,
      }));
    }

    // Fallback: tenta tabela 'categorias'
    const { data: data2, error: error2 } = await (supabase as any)
      .from("categorias")
      .select("id, nome, cor, icone")
      .order("nome");

    if (!error2 && data2) {
      return data2;
    }

    return [];
  } catch (e) {
    console.log("Erro ao carregar categorias:", e);
    return [];
  }
}

/* ======================================================
   Mapa de ícones para categorias
====================================================== */
const ICONE_MAP: Record<string, React.ReactNode> = {
  utensils: <Utensils className="h-3 w-3" />,
  car: <Car className="h-3 w-3" />,
  "gamepad-2": <Gamepad2 className="h-3 w-3" />,
  "heart-pulse": <HeartPulse className="h-3 w-3" />,
  "graduation-cap": <GraduationCap className="h-3 w-3" />,
  "shopping-bag": <ShoppingBag className="h-3 w-3" />,
  home: <Home className="h-3 w-3" />,
  "more-horizontal": <MoreHorizontal className="h-3 w-3" />,
  tag: <Tag className="h-3 w-3" />,
};

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

function mesDaFaturaAtual(diaFechamento: number, hoje = new Date()) {
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const dia = hoje.getDate();

  return dia <= diaFechamento
    ? new Date(ano, mes, 1)
    : new Date(ano, mes + 1, 1);
}

/* ======================================================
   Tipos de Filtro
====================================================== */

type FiltroStatus = "todos" | "pendente" | "pago";

interface Filtros {
  busca: string;
  status: FiltroStatus;
  categoriaId: string | null;
  valorMin: number | null;
  valorMax: number | null;
}

const filtrosIniciais: Filtros = {
  busca: "",
  status: "todos",
  categoriaId: null,
  valorMin: null,
  valorMax: null,
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
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [novaCompraOpen, setNovaCompraOpen] = useState(false);
  const [editarCartaoOpen, setEditarCartaoOpen] = useState(false);
  const [excluirCartaoOpen, setExcluirCartaoOpen] = useState(false);
  const [excluirCompraOpen, setExcluirCompraOpen] = useState(false);
  const [editarCompraOpen, setEditarCompraOpen] = useState(false);

  const [parcelaSelecionada, setParcelaSelecionada] =
    useState<ParcelaFatura | null>(null);

  // Filtros
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciais);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const temFiltrosAtivos =
    filtros.busca !== "" ||
    filtros.status !== "todos" ||
    filtros.categoriaId !== null ||
    filtros.valorMin !== null ||
    filtros.valorMax !== null;

  /* ======================================================
     Carregar dados
  ====================================================== */

  async function carregarFatura() {
    if (!cartao) return;
    setLoading(true);
    setErro(null);

    try {
      const [parcelasData, categoriasData] = await Promise.all([
        listarParcelasDaFatura(cartao.id, mesRef),
        listarCategoriasSafe(),
      ]);
      setParcelas(parcelasData ?? []);
      setCategorias(categoriasData ?? []);
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
      if (
        filtros.busca &&
        !p.descricao.toLowerCase().includes(filtros.busca.toLowerCase())
      ) {
        return false;
      }

      if (filtros.status === "pendente" && p.paga) return false;
      if (filtros.status === "pago" && !p.paga) return false;

      if (filtros.categoriaId) {
        const catId = (p as any).categoria_id;
        if (filtros.categoriaId === "sem-categoria") {
          if (catId) return false;
        } else {
          if (catId !== filtros.categoriaId) return false;
        }
      }

      if (filtros.valorMin !== null && Math.abs(p.valor) < filtros.valorMin) {
        return false;
      }

      if (filtros.valorMax !== null && Math.abs(p.valor) > filtros.valorMax) {
        return false;
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

  const isFaturaFutura =
    mesRef.getTime() > mesDaFaturaAtual(cartao.dia_fechamento).getTime();

  const podePagarFatura = !isFaturaFutura && parcelas.some((p) => !p.paga);

  function limparFiltros() {
    setFiltros(filtrosIniciais);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh]">
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-slate-950 to-slate-900 text-white">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="flex items-center gap-2">
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
            {/* Navegação + Nova compra */}
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

              <Button
                size="sm"
                className="gap-2"
                onClick={() => setNovaCompraOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Nova compra
              </Button>
            </div>

            {/* SEÇÃO DE FILTROS */}
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
                      className={`h-4 w-4 transition-transform ${
                        filtrosAbertos ? "rotate-180" : ""
                      }`}
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
                            status: v as FiltroStatus,
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

                    {/* Categoria */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Categoria</label>
                      <Select
                        value={filtros.categoriaId || "todas"}
                        onValueChange={(v) =>
                          setFiltros((f) => ({
                            ...f,
                            categoriaId: v === "todas" ? null : v,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todas">Todas as categorias</SelectItem>
                          <SelectItem value="sem-categoria">
                            <span className="text-muted-foreground">
                              Sem categoria
                            </span>
                          </SelectItem>
                          {categorias.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: cat.cor }}
                                />
                                {cat.nome}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Valor mínimo */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valor mínimo</label>
                      <Input
                        type="number"
                        placeholder="R$ 0,00"
                        value={filtros.valorMin ?? ""}
                        onChange={(e) =>
                          setFiltros((f) => ({
                            ...f,
                            valorMin: e.target.value
                              ? Number(e.target.value)
                              : null,
                          }))
                        }
                      />
                    </div>

                    {/* Valor máximo */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valor máximo</label>
                      <Input
                        type="number"
                        placeholder="R$ 9.999,99"
                        value={filtros.valorMax ?? ""}
                        onChange={(e) =>
                          setFiltros((f) => ({
                            ...f,
                            valorMax: e.target.value
                              ? Number(e.target.value)
                              : null,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Botão limpar filtros */}
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
                    Mostrando{" "}
                    <strong>{parcelasFiltradas.length}</strong> de{" "}
                    <strong>{parcelas.length}</strong> parcelas
                  </span>
                </div>
                <span className="text-sm font-medium">
                  Total: {formatCurrency(totalFiltrado)}
                </span>
              </div>
            )}

            {isFaturaFutura && (
              <div className="mb-4 p-3 rounded-xl bg-blue-500/10 text-blue-400 text-sm border border-blue-500/20">
                Esta é uma <strong>fatura futura</strong>. Valores ainda não
                impactam o limite.
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

            {/* Resumo */}
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

            <ScrollArea className="h-[260px]">
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
                    ? "Nenhuma parcela encontrada com os filtros aplicados."
                    : "Nenhuma parcela encontrada para este mês."}
                </div>
              )}

              {!loading &&
                !erro &&
                parcelasFiltradas.map((p) => (
                  <div
                    key={p.id}
                    className={`flex justify-between items-center p-3 rounded-xl mb-2 transition-all ${
                      p.paga
                        ? "opacity-60 bg-emerald-500/5 border border-emerald-500/20"
                        : "hover:bg-muted/50 border border-transparent"
                    }`}
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
                      {(p as any).categoria_nome && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{
                                  backgroundColor: `${(p as any).categoria_cor}20`,
                                  color: (p as any).categoria_cor,
                                }}
                              >
                                {ICONE_MAP[(p as any).categoria_icone] || (
                                  <Tag className="h-3 w-3" />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {(p as any).categoria_nome}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {/* Info */}
                      <div>
                        <p
                          className={`font-medium ${
                            p.paga ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {p.descricao}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Parcela {p.numero_parcela}/{p.total_parcelas}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <p
                        className={`font-semibold ${
                          p.paga
                            ? "line-through text-muted-foreground"
                            : "text-expense"
                        }`}
                      >
                        {formatCurrency(Math.abs(p.valor))}
                      </p>

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

      {/* Dialogs */}
      <NovaCompraCartaoDialog
        cartao={cartao}
        open={novaCompraOpen}
        onOpenChange={setNovaCompraOpen}
        onSaved={() => {
          setNovaCompraOpen(false);
          carregarFatura();
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

      {parcelaSelecionada && (
        <>
          <ExcluirCompraDialog
            compra={{
              compra_id: parcelaSelecionada.compra_id,
              descricao: parcelaSelecionada.descricao,
            }}
            open={excluirCompraOpen}
            onOpenChange={setExcluirCompraOpen}
            onDeleted={() => {
              setExcluirCompraOpen(false);
              setParcelaSelecionada(null);
              carregarFatura();
              onUpdated();
            }}
          />

          <EditarCompraDialog
            parcela={parcelaSelecionada}
            open={editarCompraOpen}
            onOpenChange={setEditarCompraOpen}
            onSaved={() => {
              setEditarCompraOpen(false);
              setParcelaSelecionada(null);
              carregarFatura();
              onUpdated();
            }}
          />
        </>
      )}
    </>
  );
}