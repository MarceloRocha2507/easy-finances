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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  CalendarIcon,
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
  Scale,
  RotateCcw,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCategories } from "@/hooks/useCategories";

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
import { AjustarFaturaDialog } from "@/components/cartoes/AjustarFaturaDialog";
import { EstornarCompraDialog } from "@/components/cartoes/EstornarCompraDialog";
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
  categoriaId: string | null;
  dataInicio: Date | null;
  dataFim: Date | null;
}

const filtrosIniciais: Filtros = {
  busca: "",
  status: "todos",
  responsavelId: null,
  categoriaId: null,
  dataInicio: null,
  dataFim: null,
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

  // Ordenação
  type OrdemData = 'asc' | 'desc' | null;
  const [ordemData, setOrdemData] = useState<OrdemData>(null);

  // Dialogs
  const [novaCompraOpen, setNovaCompraOpen] = useState(false);
  const [editarCompraOpen, setEditarCompraOpen] = useState(false);
  const [excluirCompraOpen, setExcluirCompraOpen] = useState(false);
  const [estornarCompraOpen, setEstornarCompraOpen] = useState(false);
  const [ajustarFaturaOpen, setAjustarFaturaOpen] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<ParcelaFatura | null>(null);

  // Hooks
  const { data: responsaveis = [] } = useResponsaveis();
  const { data: categories = [] } = useCategories();

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
    let resultado = parcelas.filter((p) => {
      if (filtros.busca) {
        const termoBusca = filtros.busca.toLowerCase().trim();
        
        // Buscar por descrição
        const matchDescricao = p.descricao.toLowerCase().includes(termoBusca);
        
        // Buscar por valor (formatado e numérico)
        const valorFormatado = formatCurrency(Math.abs(p.valor)).toLowerCase();
        const valorNumerico = String(Math.abs(p.valor));
        const matchValor = valorFormatado.includes(termoBusca) || 
                           valorNumerico.includes(termoBusca.replace(',', '.'));
        
        if (!matchDescricao && !matchValor) {
          return false;
        }
      }

      if (filtros.status === "pendente" && p.paga) return false;
      if (filtros.status === "pago" && !p.paga) return false;

      if (filtros.responsavelId) {
        if (p.responsavel_id !== filtros.responsavelId) return false;
      }

      // Filtro de categoria
      if (filtros.categoriaId && p.categoria_id !== filtros.categoriaId) {
        return false;
      }

      // Filtro de data de compra
      if (filtros.dataInicio || filtros.dataFim) {
        const dataCompra = p.data_compra ? new Date(p.data_compra + 'T00:00:00') : null;
        if (!dataCompra) return false;
        
        if (filtros.dataInicio && dataCompra < filtros.dataInicio) return false;
        if (filtros.dataFim) {
          const fimDoDia = new Date(filtros.dataFim);
          fimDoDia.setHours(23, 59, 59, 999);
          if (dataCompra > fimDoDia) return false;
        }
      }

      return true;
    });

    // Ordenar por data se ativo
    if (ordemData) {
      resultado = [...resultado].sort((a, b) => {
        const dataA = a.data_compra ? new Date(a.data_compra + 'T00:00:00').getTime() : 0;
        const dataB = b.data_compra ? new Date(b.data_compra + 'T00:00:00').getTime() : 0;
        return ordemData === 'asc' ? dataA - dataB : dataB - dataA;
      });
    }

    return resultado;
  }, [parcelas, filtros, ordemData]);

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
    filtros.responsavelId !== null ||
    filtros.categoriaId !== null ||
    filtros.dataInicio !== null ||
    filtros.dataFim !== null;

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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={() => setAjustarFaturaOpen(true)} className="gap-1">
                  <Scale className="h-4 w-4" />
                  Ajustar
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adicionar crédito ou débito avulso</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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

            {/* Filtro de Categoria */}
            <Select
              value={filtros.categoriaId || "todas"}
              onValueChange={(v) =>
                setFiltros((f) => ({
                  ...f,
                  categoriaId: v === "todas" ? null : v,
                }))
              }
            >
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro de Data */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {filtros.dataInicio || filtros.dataFim ? (
                    <span className="text-xs">
                      {filtros.dataInicio?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) || '...'} 
                      {' - '}
                      {filtros.dataFim?.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) || '...'}
                    </span>
                  ) : (
                    <span className="text-xs">Período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: filtros.dataInicio || undefined,
                    to: filtros.dataFim || undefined,
                  }}
                  onSelect={(range) => {
                    setFiltros((f) => ({
                      ...f,
                      dataInicio: range?.from || null,
                      dataFim: range?.to || null,
                    }));
                  }}
                  className="pointer-events-auto"
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>

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
                  <TableHead className="hidden lg:table-cell">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 -ml-3 hover:bg-accent"
                      onClick={() => {
                        setOrdemData((prev) => 
                          prev === null ? 'asc' : 
                          prev === 'asc' ? 'desc' : null
                        );
                      }}
                    >
                      Data
                      {ordemData === null && <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />}
                      {ordemData === 'asc' && <ArrowUp className="h-3.5 w-3.5" />}
                      {ordemData === 'desc' && <ArrowDown className="h-3.5 w-3.5" />}
                    </Button>
                  </TableHead>
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
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}

                {!loading && parcelasFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
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
                        <div className="flex items-center gap-2">
                          {p.tipo_lancamento === 'estorno' && (
                            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              Estorno
                            </Badge>
                          )}
                          {p.tipo_lancamento === 'ajuste' && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Ajuste
                            </Badge>
                          )}
                          <p className={cn(
                            "font-medium",
                            p.paga && "line-through text-muted-foreground"
                          )}>
                            {p.descricao}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {p.data_compra 
                            ? new Date(p.data_compra + 'T00:00:00').toLocaleDateString('pt-BR')
                            : '-'}
                        </span>
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
                          p.paga 
                            ? "line-through text-muted-foreground" 
                            : p.valor < 0 
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-destructive"
                        )}>
                          {p.valor < 0 
                            ? `- ${formatCurrency(Math.abs(p.valor))}`
                            : formatCurrency(p.valor)
                          }
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
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setParcelaSelecionada(p);
                                    setEstornarCompraOpen(true);
                                  }}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Estornar</TooltipContent>
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

      <EstornarCompraDialog
        parcela={parcelaSelecionada}
        open={estornarCompraOpen}
        onOpenChange={(open) => {
          setEstornarCompraOpen(open);
          if (!open) setParcelaSelecionada(null);
        }}
        onEstornado={() => {
          setEstornarCompraOpen(false);
          setParcelaSelecionada(null);
          carregarFatura();
        }}
      />

      {id && (
        <AjustarFaturaDialog
          cartaoId={id}
          mesReferencia={mesRef}
          open={ajustarFaturaOpen}
          onOpenChange={setAjustarFaturaOpen}
          onSuccess={() => {
            carregarFatura();
          }}
        />
      )}
    </Layout>
  );
}
