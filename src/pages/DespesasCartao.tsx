import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  Banknote,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Pencil,
  Search,
  Trash2,
  CheckSquare,
  User,
  Tag,
  X,
  Crown,
  Plus,
  Scale,
  RotateCcw,
  MoreVertical,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  desmarcarTodasParcelas,
  excluirParcelas,
} from "@/services/compras-cartao";
import { useResponsaveis } from "@/services/responsaveis";
import { Cartao } from "@/services/cartoes";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { formatarTempoRelativo } from "@/hooks/useUltimaAlteracao";
import { EditarCompraDialog } from "@/components/cartoes/EditarCompraDialog";
import { ExcluirCompraDialog } from "@/components/cartoes/ExcluirCompraDialog";
import { NovaCompraCartaoDialog } from "@/components/cartoes/NovaCompraCartaoDialog";
import { AjustarFaturaDialog } from "@/components/cartoes/AjustarFaturaDialog";
import { AdiantarFaturaDialog } from "@/components/cartoes/AdiantarFaturaDialog";
import { EstornarCompraDialog } from "@/components/cartoes/EstornarCompraDialog";
import { ExcluirFaturaDialog } from "@/components/cartoes/ExcluirFaturaDialog";
import { DetalhesCompraCartaoDialog } from "@/components/cartoes/DetalhesCompraCartaoDialog";
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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [cartao, setCartao] = useState<Cartao | null>(null);
  const [mesRef, setMesRef] = useState(() => {
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    if (month && year) {
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });
  const [parcelas, setParcelas] = useState<ParcelaFatura[]>([]);
  const [resumoResponsaveis, setResumoResponsaveis] = useState<ResumoResponsavel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciais);

  // Ordenação
  type OrdemData = 'asc' | 'desc' | null;
  const [ordemData, setOrdemData] = useState<OrdemData>(null);

  // Sync URL with month
  useEffect(() => {
    if (id) {
      const month = mesRef.getMonth() + 1;
      const year = mesRef.getFullYear();
      navigate(`/cartoes/${id}/despesas?month=${month}&year=${year}`, { replace: true });
    }
  }, [mesRef, id, navigate]);

  // Dialogs
  const [novaCompraOpen, setNovaCompraOpen] = useState(false);
  const [editarCompraOpen, setEditarCompraOpen] = useState(false);
  const [excluirCompraOpen, setExcluirCompraOpen] = useState(false);
  const [estornarCompraOpen, setEstornarCompraOpen] = useState(false);
  const [ajustarFaturaOpen, setAjustarFaturaOpen] = useState(false);
  const [adiantarFaturaOpen, setAdiantarFaturaOpen] = useState(false);
  const [excluirFaturaOpen, setExcluirFaturaOpen] = useState(false);
  const [detalhesCompraOpen, setDetalhesCompraOpen] = useState(false);
  const [desmarcarPagasOpen, setDesmarcarPagasOpen] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<ParcelaFatura | null>(null);
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [excluindoLote, setExcluindoLote] = useState(false);
  const [confirmarExcluirLoteOpen, setConfirmarExcluirLoteOpen] = useState(false);
  const actionClickedRef = useRef(0);

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

  const handleDesmarcarPagas = useCallback(async () => {
    if (!id) return;
    try {
      const count = await desmarcarTodasParcelas(id, mesRef);
      toast.success(`${count} compra(s) desmarcada(s) como paga(s)`);
      carregarFatura();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao desmarcar compras pagas");
    } finally {
      setDesmarcarPagasOpen(false);
    }
  }, [id, mesRef]);

  const [escopoLote, setEscopoLote] = useState<"parcela" | "restantes">("parcela");

  // Contagem de parcelas futuras (incluindo a atual) para as compras selecionadas
  // Usa numero_parcela/total_parcelas do próprio item para detectar futuras em outros meses
  const previaExclusaoLote = useMemo(() => {
    if (selecionadas.size === 0) return { selecionadas: 0, totalComFuturas: 0, temFuturas: false };
    const mapa = new Map(parcelas.map((p) => [p.id, p]));
    let totalComFuturas = 0;
    let temFuturas = false;
    for (const pid of selecionadas) {
      const p = mapa.get(pid);
      if (!p) continue;
      // Parcelas restantes = esta + todas as futuras (mesmo que em meses não carregados)
      const parcelasRestantes = p.total_parcelas - p.numero_parcela + 1;
      totalComFuturas += parcelasRestantes;
      if (p.numero_parcela < p.total_parcelas) temFuturas = true;
    }
    return { selecionadas: selecionadas.size, totalComFuturas, temFuturas };
  }, [selecionadas, parcelas]);

  const handleExcluirLote = useCallback(async () => {
    if (selecionadas.size === 0) return;
    setExcluindoLote(true);
    const ids = Array.from(selecionadas);
    const mapa = new Map(parcelas.map((p) => [p.id, p]));
    let ok = 0;
    let fail = 0;
    for (const pid of ids) {
      const p = mapa.get(pid);
      if (!p) { fail++; continue; }
      try {
        await excluirParcelas({
          compraId: p.compra_id,
          parcelaId: p.id,
          numeroParcela: p.numero_parcela,
          escopo: escopoLote,
        });
        ok++;
      } catch (e) {
        console.error(e);
        fail++;
      }
    }
    setExcluindoLote(false);
    setConfirmarExcluirLoteOpen(false);
    setSelecionadas(new Set());
    setModoSelecao(false);
    setEscopoLote("parcela");
    if (ok > 0) {
      toast.success(
        escopoLote === "restantes"
          ? `${ok} compra(s) — parcelas atuais e futuras excluídas`
          : `${ok} parcela(s) excluída(s)`,
      );
    }
    if (fail > 0) toast.error(`${fail} falha(s) ao excluir`);
    carregarFatura();
  }, [selecionadas, parcelas, escopoLote]);



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
        
        // Buscar por descrição ou nome_fatura
        const matchDescricao = p.descricao.toLowerCase().includes(termoBusca);
        const matchNomeFatura = (p.nome_fatura || '').toLowerCase().includes(termoBusca);
        
        // Buscar por valor (formatado e numérico)
        const valorFormatado = formatCurrency(Math.abs(p.valor)).toLowerCase();
        const valorNumerico = String(Math.abs(p.valor));
        const matchValor = valorFormatado.includes(termoBusca) || 
                           valorNumerico.includes(termoBusca.replace(',', '.'));
        
        if (!matchDescricao && !matchNomeFatura && !matchValor) {
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

  // Totais corrigidos: considera valores negativos (créditos/adiantamentos)
  const totaisFatura = useMemo(() => {
    let saldoPendente = 0;
    let saldoPago = 0;

    for (const p of parcelas) {
      const valor = Number(p.valor) || 0;
      if (p.paga) {
        saldoPago += valor; // Inclui negativos (créditos já aplicados)
      } else {
        saldoPendente += valor;
      }
    }

    // Se o saldo pendente for negativo, temos crédito a favor
    const creditoAFavor = saldoPendente < 0 ? Math.abs(saldoPendente) : 0;
    const pendenteFinal = Math.max(0, saldoPendente);

    return {
      pendente: pendenteFinal,
      pago: saldoPago,
      total: saldoPendente + saldoPago,
      creditoAFavor,
    };
  }, [parcelas]);

  // Compatibilidade com código existente
  const totalMes = totaisFatura.pendente;
  const totalPago = totaisFatura.pago;

  // Detecta se o cartão é Nubank (para exibir opção de importar CSV)
  const isNubank = useMemo(
    () => !!cartao?.nome?.toLowerCase().includes("nubank"),
    [cartao]
  );

  // Verificar se há itens pagos escondidos pelo filtro
  const temItensPagosEscondidos = useMemo(() => {
    if (filtros.status !== "pendente") return false;
    return parcelas.some((p) => p.paga);
  }, [parcelas, filtros.status]);

  const totalFiltrado = useMemo(() => {
    return parcelasFiltradas.reduce(
      (sum, p) => sum + Number(p.valor || 0),
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/cartoes")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CreditCard
              className="h-5 w-5 shrink-0 hidden sm:block"
              style={{ color: cartao?.cor || "#111827" }}
            />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">{cartao?.nome || "Cartão"}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Despesas do mês</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile: dropdown com ações */}
            <div className="flex sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setAjustarFaturaOpen(true)}>
                    <Scale className="h-4 w-4 mr-2" />
                    Ajustar fatura
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAdiantarFaturaOpen(true)} disabled={totalMes === 0}>
                    <Banknote className="h-4 w-4 mr-2" />
                    Adiantar pagamento
                  </DropdownMenuItem>
                  {isNubank && (
                    <DropdownMenuItem onClick={() => navigate(`/cartoes/${id}/importar`)}>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar CSV Nubank
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => setDesmarcarPagasOpen(true)} 
                    disabled={totalPago === 0}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Desmarcar pagas
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setExcluirFaturaOpen(true)} 
                    disabled={parcelas.length === 0}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir fatura
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Desktop: botões individuais */}
            <div className="hidden sm:flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setExcluirFaturaOpen(true)} 
                      className="gap-1 text-destructive hover:text-destructive"
                      disabled={parcelas.length === 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excluir toda a fatura do mês</TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setDesmarcarPagasOpen(true)} 
                      className="gap-1"
                      disabled={totalPago === 0}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Desmarcar todas as compras pagas</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setAdiantarFaturaOpen(true)} 
                      className="gap-1"
                      disabled={totalMes === 0}
                    >
                      <Banknote className="h-4 w-4" />
                      Adiantar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Registrar pagamento parcial antecipado</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Importar CSV Nubank (apenas cartões Nubank) */}
            {isNubank && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/cartoes/${id}/importar`)}
                      className="gap-1"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="hidden sm:inline">Importar CSV</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Importar fatura CSV do Nubank</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Nova compra sempre visível */}
            <Button size="sm" onClick={() => setNovaCompraOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova compra</span>
            </Button>
          </div>
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
            <span className="font-semibold text-emerald-500">{formatCurrency(Math.abs(totalPago))}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Total:</span>
            <span className="font-semibold">{formatCurrency(totaisFatura.total)}</span>
          </div>
          {totaisFatura.creditoAFavor > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">
                Crédito a favor: {formatCurrency(totaisFatura.creditoAFavor)}
              </Badge>
            </div>
          )}
        </div>

        {/* Alerta: itens pagos escondidos pelo filtro */}
        {temItensPagosEscondidos && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <span>⚠️</span>
              <span>Você está filtrando apenas pendentes. Itens pagos/adiantados não aparecem.</span>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setFiltros((f) => ({ ...f, status: "todos" }))}
            >
              Mostrar todos
            </Button>
          </div>
        )}

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
        <div className="space-y-3">
          {/* Linha 1: Navegação de mês */}
          <div className="flex items-center gap-2 p-1 bg-gray-50/50 rounded-lg border border-gray-100 w-fit">
            <div className="flex items-center gap-1 rounded-md bg-white border border-gray-200 px-1 h-9 shadow-sm">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-gray-100 transition-colors"
                onClick={() => setMesRef((m) => addMonths(m, -1))}
              >
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              </Button>
              <span className="min-w-[120px] sm:min-w-[140px] text-center font-semibold capitalize text-[13px] text-gray-700 select-none">
                {monthLabel(mesRef)}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-gray-100 transition-colors"
                onClick={() => setMesRef((m) => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4 text-gray-500" />
              </Button>
            </div>
          </div>

          {/* Linha 2: Filtros - wrap em mobile */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Busca - sempre visível */}
            <div className="relative flex-1 min-w-[140px] max-w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-8 h-8 text-sm"
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

            {/* Status - sempre visível */}
            <Select
              value={filtros.status}
              onValueChange={(v) =>
                setFiltros((f) => ({
                  ...f,
                  status: v as "todos" | "pendente" | "pago",
                }))
              }
            >
              <SelectTrigger className="w-[100px] sm:w-[120px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="pago">Pagos</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtros adicionais - ocultos em mobile pequeno */}
            <div className="hidden sm:flex items-center gap-2">
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
                  {categories
                    .filter((cat) => cat.type === 'expense')
                    .filter((cat, index, arr) => arr.findIndex(c => c.name === cat.name) === index)
                    .map((cat) => (
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
            </div>

            {temFiltrosAtivos && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                onClick={() => setFiltros(filtrosIniciais)}
              >
                <X className="h-3 w-3" />
                <span className="hidden sm:inline">Limpar</span>
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

        {/* Toolbar de seleção em lote */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {!modoSelecao ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => {
                setModoSelecao(true);
                setSelecionadas(new Set());
              }}
              disabled={parcelasFiltradas.length === 0}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Selecionar
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 w-full">
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => {
                  if (selecionadas.size === parcelasFiltradas.length) {
                    setSelecionadas(new Set());
                  } else {
                    setSelecionadas(new Set(parcelasFiltradas.map((p) => p.id)));
                  }
                }}
              >
                {selecionadas.size === parcelasFiltradas.length && parcelasFiltradas.length > 0
                  ? "Desmarcar tudo"
                  : "Selecionar tudo"}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selecionadas.size} selecionada(s)
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setModoSelecao(false);
                    setSelecionadas(new Set());
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 gap-1.5"
                  disabled={selecionadas.size === 0 || excluindoLote}
                  onClick={() => setConfirmarExcluirLoteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir{selecionadas.size > 0 ? ` (${selecionadas.size})` : ""}
                </Button>
              </div>
            </div>
          )}
        </div>


        {/* Tabela de despesas */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="hidden lg:table-cell p-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-full w-full justify-start gap-1 px-3 font-medium hover:bg-accent"
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
                  <TableHead className="hidden xl:table-cell text-center">Alterado</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}

                {!loading && parcelasFiltradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
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
                      className={cn(
                        "cursor-pointer",
                        p.paga && "opacity-50 bg-emerald-500/5"
                      )}
                      onClick={(e) => {
                        // Não abrir detalhes se uma ação do dropdown foi clicada recentemente (últimos 500ms)
                        if (Date.now() - actionClickedRef.current < 500) {
                          return;
                        }
                        // Não abrir detalhes se clicou no checkbox ou nas ações
                        const target = e.target as HTMLElement;
                        if (target.closest('button, [role="checkbox"], [data-action-cell], [role="menu"], [role="menuitem"]')) return;
                        setParcelaSelecionada(p);
                        setDetalhesCompraOpen(true);
                      }}
                      onPointerDown={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('[data-action-cell]')) {
                          e.stopPropagation();
                        }
                      }}
                    >
                      <TableCell>
                        {modoSelecao ? (
                          <Checkbox
                            checked={selecionadas.has(p.id)}
                            onCheckedChange={() => {
                              setSelecionadas((prev) => {
                                const next = new Set(prev);
                                if (next.has(p.id)) next.delete(p.id);
                                else next.add(p.id);
                                return next;
                              });
                            }}
                          />
                        ) : (
                          <Checkbox
                            checked={!!p.paga}
                            onCheckedChange={async () => {
                              await marcarParcelaComoPaga(p.id, !p.paga);
                              carregarFatura();
                            }}
                          />
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-0.5">
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
                              {p.nome_fatura || p.descricao}
                            </p>
                          </div>
                          {/* Mostrar descrição como subtexto quando houver nome_fatura */}
                          {p.nome_fatura && p.descricao && p.nome_fatura !== p.descricao && (
                            <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                              {p.descricao}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className={cn(
                          "font-semibold text-sm tabular-nums",
                          p.valor < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                        )}>
                          {formatCurrency(Math.abs(p.valor))}
                        </span>
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
                              backgroundColor: `${p.categoria_cor || "#94a3b8"}20`,
                              color: p.categoria_cor || "#64748b",
                              borderColor: `${p.categoria_cor || "#94a3b8"}40`,
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

                      <TableCell className="hidden xl:table-cell text-center">
                        <span className="text-xs text-muted-foreground">
                          {p.updated_at ? formatarTempoRelativo(p.updated_at) : '-'}
                        </span>
                      </TableCell>

                      <TableCell data-action-cell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              actionClickedRef.current = Date.now();
                              setParcelaSelecionada(p);
                              setEditarCompraOpen(true);
                            }}>
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              actionClickedRef.current = Date.now();
                              setParcelaSelecionada(p);
                              setEstornarCompraOpen(true);
                            }}>
                              <RotateCcw className="h-3.5 w-3.5 mr-2" /> Estornar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                actionClickedRef.current = Date.now();
                                setParcelaSelecionada(p);
                                setExcluirCompraOpen(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        corCartao={cartao?.cor}
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
        corCartao={cartao?.cor}
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
        corCartao={cartao?.cor}
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
          corCartao={cartao?.cor}
          onSuccess={() => {
            carregarFatura();
          }}
        />
      )}

      {id && cartao && (
        <>
          <AdiantarFaturaDialog
            cartao={cartao}
            mesReferencia={mesRef}
            totalPendente={totalMes}
            open={adiantarFaturaOpen}
            onOpenChange={setAdiantarFaturaOpen}
            onSuccess={carregarFatura}
          />

          <ExcluirFaturaDialog
            open={excluirFaturaOpen}
            onOpenChange={setExcluirFaturaOpen}
            cartaoId={id}
            cartaoNome={cartao.nome}
            mesReferencia={mesRef}
            totalParcelas={parcelas.length}
            valorTotal={totalMes + totalPago}
            onSuccess={() => {
              carregarFatura();
            }}
          />
        </>
      )}

      <DetalhesCompraCartaoDialog
        parcela={parcelaSelecionada}
        open={detalhesCompraOpen}
        corCartao={cartao?.cor}
        onOpenChange={(open) => {
          setDetalhesCompraOpen(open);
          if (!open) setParcelaSelecionada(null);
        }}
        onEdit={(p) => {
          setDetalhesCompraOpen(false);
          setParcelaSelecionada(p);
          setEditarCompraOpen(true);
        }}
      />

      <AlertDialog open={desmarcarPagasOpen} onOpenChange={setDesmarcarPagasOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desmarcar todas as compras pagas?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as compras marcadas como pagas neste mês serão desmarcadas. Essa ação não pode ser desfeita automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDesmarcarPagas}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmarExcluirLoteOpen}
        onOpenChange={(v) => {
          setConfirmarExcluirLoteOpen(v);
          if (!v) setEscopoLote("parcela");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selecionadas.size} compra(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha o que deseja excluir. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2 py-2">
            <button
              type="button"
              onClick={() => setEscopoLote("parcela")}
              className="flex items-start gap-3 rounded-lg p-3 text-left transition-colors"
              style={{
                background: escopoLote === "parcela" ? "#F9FAFB" : "transparent",
                border: escopoLote === "parcela" ? "1.5px solid #111827" : "1px solid #E5E7EB",
              }}
            >
              <div
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                style={{
                  border: escopoLote === "parcela" ? "1.5px solid #111827" : "1.5px solid #D1D5DB",
                }}
              >
                {escopoLote === "parcela" && (
                  <div className="h-2 w-2 rounded-full" style={{ background: "#111827" }} />
                )}
              </div>
              <div className="flex-1">
                <p style={{ color: "#111827", fontWeight: 600, fontSize: 14 }}>
                  Apenas as parcelas deste mês
                </p>
                <p style={{ color: "#6B7280", fontSize: 13 }}>
                  {previaExclusaoLote.selecionadas} parcela(s) deste mês
                </p>
              </div>
            </button>

            {previaExclusaoLote.temFuturas && (
              <button
                type="button"
                onClick={() => setEscopoLote("restantes")}
                className="flex items-start gap-3 rounded-lg p-3 text-left transition-colors"
                style={{
                  background: escopoLote === "restantes" ? "#F9FAFB" : "transparent",
                  border: escopoLote === "restantes" ? "1.5px solid #111827" : "1px solid #E5E7EB",
                }}
              >
                <div
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{
                    border: escopoLote === "restantes" ? "1.5px solid #111827" : "1.5px solid #D1D5DB",
                  }}
                >
                  {escopoLote === "restantes" && (
                    <div className="h-2 w-2 rounded-full" style={{ background: "#111827" }} />
                  )}
                </div>
                <div className="flex-1">
                  <p style={{ color: "#111827", fontWeight: 600, fontSize: 14 }}>
                    Estas e todas as parcelas futuras
                  </p>
                  <p style={{ color: "#6B7280", fontSize: 13 }}>
                    {previaExclusaoLote.selecionadas} compra(s) selecionadas • {previaExclusaoLote.totalComFuturas} parcela(s) no total (incluindo meses futuros)
                  </p>
                </div>
              </button>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindoLote}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleExcluirLote(); }}
              disabled={excluindoLote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluindoLote ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
