import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarParcelasDaFatura,
  ParcelaFatura,
  desmarcarTodasParcelas,
} from "@/services/compras-cartao";
import { useAcertosMes } from "@/services/acertos";
import { useResponsaveis } from "@/services/responsaveis";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Cartao } from "@/services/cartoes";
import { NovaCompraCartaoDialog } from "./NovaCompraCartaoDialog";
import { EditarCartaoDialog } from "./EditarCartaoDialog";
import { ExcluirCartaoDialog } from "./ExcluirCartaoDialog";
import { GerarMensagemDialog } from "./GerarMensagemDialog";
import { RegistrarAcertoDialog } from "./RegistrarAcertoDialog";
import { EditarCompraDialog } from "./EditarCompraDialog";
import { ExcluirCompraDialog } from "./ExcluirCompraDialog";
import { PagarFaturaDialog } from "./PagarFaturaDialog";
import { AjustarFaturaDialog } from "./AjustarFaturaDialog";
import { EstornarCompraDialog } from "./EstornarCompraDialog";

import {
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Check,
  Search,
  X,
  FileText,
  Wallet,
  ExternalLink,
  Scale,
  Settings,
  RotateCcw,
  Upload,
} from "lucide-react";

import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ======================================================
   Utils
====================================================== */

function monthLabel(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "numeric",
  }).format(d);
}

function addMonths(base: Date, delta: number) {
  return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}

/* ======================================================
   Component
====================================================== */

interface Props {
  cartao: Cartao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
  mesInicial?: Date;
}

export function DetalhesCartaoDialog({
  cartao,
  open,
  onOpenChange,
  onUpdated,
  mesInicial,
}: Props) {
  const navigate = useNavigate();
  const [mesRef, setMesRef] = useState(
    () => mesInicial ? new Date(mesInicial.getFullYear(), mesInicial.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  // Reset mesRef when dialog opens with a new mesInicial
  useEffect(() => {
    if (open && mesInicial) {
      setMesRef(new Date(mesInicial.getFullYear(), mesInicial.getMonth(), 1));
    }
  }, [open, mesInicial]);

  const [parcelas, setParcelas] = useState<ParcelaFatura[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Dialogs do cartão
  const [novaCompraOpen, setNovaCompraOpen] = useState(false);
  const [editarCartaoOpen, setEditarCartaoOpen] = useState(false);
  const [excluirCartaoOpen, setExcluirCartaoOpen] = useState(false);
  const [gerarMensagemOpen, setGerarMensagemOpen] = useState(false);
  const [pagarFaturaOpen, setPagarFaturaOpen] = useState(false);
  const [registrarAcertoOpen, setRegistrarAcertoOpen] = useState(false);
  const [ajustarFaturaOpen, setAjustarFaturaOpen] = useState(false);
  const [desmarcarPagasOpen, setDesmarcarPagasOpen] = useState(false);

  // Dialogs da compra
  const [editarCompraOpen, setEditarCompraOpen] = useState(false);
  const [excluirCompraOpen, setExcluirCompraOpen] = useState(false);
  const [estornarCompraOpen, setEstornarCompraOpen] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<ParcelaFatura | null>(null);

  // Filtro simples (apenas busca)
  const [busca, setBusca] = useState("");

  // Hooks
  const { data: acertos = [], refetch: refetchAcertos } = useAcertosMes(
    open && cartao ? cartao.id : null,
    mesRef
  );

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

  async function handleDesmarcarPagas() {
    if (!cartao) return;
    try {
      const count = await desmarcarTodasParcelas(cartao.id, mesRef);
      toast.success(`${count} compra(s) desmarcada(s)`);
      carregarFatura();
      refetchAcertos();
      onUpdated();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao desmarcar parcelas pagas");
    }
  }

  useEffect(() => {
    if (!cartao || !open) return;
    carregarFatura();
    setBusca("");
  }, [cartao?.id, open, mesRef]);

  /* ======================================================
     Aplicar filtros (apenas busca)
  ====================================================== */

  const parcelasFiltradas = useMemo(() => {
    if (!busca) return parcelas;
    return parcelas.filter((p) =>
      p.descricao.toLowerCase().includes(busca.toLowerCase())
    );
  }, [parcelas, busca]);

  // Limitar exibição a 6 itens no dialog compacto
  const parcelasExibidas = parcelasFiltradas.slice(0, 5);
  const temMais = parcelasFiltradas.length > 5;

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

  if (!cartao) return null;

  const limite = cartao.limite;
  const disponivel = Math.max(limite - totalMes, 0);
  const usoPct = limite > 0 ? Math.min((totalMes / limite) * 100, 100) : 0;
  const podePagarFatura = parcelas.some((p) => !p.paga);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] p-0 gap-0 border-0 overflow-hidden [&>button]:text-white [&>button]:hover:text-white/80">
          {/* Header com cor sólida do cartão */}
          <div
            className="px-4 sm:px-5 pt-4 pb-5 overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-600"
          >
            <DialogHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-white/80" />
                  <span className="truncate">{cartao.nome}</span>
                </DialogTitle>
                <Badge className="text-[10px] sm:text-xs bg-white/20 text-white border-white/30 shrink-0">
                  {cartao.bandeira || "Crédito"}
                </Badge>
              </div>
              <DialogDescription className="sr-only">
                Detalhes da fatura do cartão
              </DialogDescription>
            </DialogHeader>

            {/* Métricas glassmorphism */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-2 min-w-0">
                <span className="text-white/70 text-[10px] sm:text-xs block">Limite</span>
                <p className="font-semibold text-white text-xs sm:text-sm truncate">{formatCurrency(limite)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-2 min-w-0">
                <span className="text-white/70 text-[10px] sm:text-xs block">Fatura</span>
                <p className="font-semibold text-red-200 text-xs sm:text-sm truncate">{formatCurrency(totalMes)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-2 min-w-0 text-right">
                <span className="text-white/70 text-[10px] sm:text-xs block">Disponível</span>
                <p className="font-semibold text-emerald-200 text-xs sm:text-sm truncate">{formatCurrency(disponivel)}</p>
              </div>
            </div>

            {/* Progress bar com porcentagem */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[10px] sm:text-xs text-white/70">
                <span>Uso do limite</span>
                <span className="font-medium text-white">{usoPct.toFixed(0)}%</span>
              </div>
              <Progress value={usoPct} className="h-2 bg-white/20 [&>div]:bg-white/90" />
            </div>
          </div>

          {/* Conteúdo */}
          <div className="px-4 sm:px-5 py-4 space-y-3 overflow-y-auto">
            {/* Navegação + Ações compactas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 sm:h-8 sm:w-8"
                  onClick={() => setMesRef((m) => addMonths(m, -1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[85px] sm:min-w-[100px] text-center text-sm font-medium capitalize">
                  {monthLabel(mesRef)}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 sm:h-8 sm:w-8"
                  onClick={() => setMesRef((m) => addMonths(m, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-1">
                {/* Mobile: dropdown com ações */}
                <div className="flex sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-9 w-9">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {podePagarFatura && (
                        <>
                          <DropdownMenuItem onClick={() => setPagarFaturaOpen(true)}>
                            <Check className="h-4 w-4 mr-2" />
                            Pagar fatura
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => setGerarMensagemOpen(true)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar mensagem
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRegistrarAcertoOpen(true)}>
                        <Wallet className="h-4 w-4 mr-2" />
                        Registrar acerto
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAjustarFaturaOpen(true)}>
                        <Scale className="h-4 w-4 mr-2" />
                        Ajustar fatura
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        onOpenChange(false);
                        navigate(`/cartoes/${cartao.id}/importar`);
                      }}>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar compras
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={totalPago === 0}
                        onClick={() => setDesmarcarPagasOpen(true)}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Desmarcar pagas
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {/* Desktop: botões individuais */}
                <div className="hidden sm:flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setGerarMensagemOpen(true)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Gerar mensagem</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setRegistrarAcertoOpen(true)}>
                          <Wallet className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Registrar acerto</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setAjustarFaturaOpen(true)}>
                          <Scale className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ajustar fatura</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8" 
                          onClick={() => {
                            onOpenChange(false);
                            navigate(`/cartoes/${cartao.id}/importar`);
                          }}
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Importar compras</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          disabled={totalPago === 0}
                          onClick={() => setDesmarcarPagasOpen(true)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Desmarcar pagas</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Botão Nova Compra sempre visível */}
                <Button size="sm" className="h-9 sm:h-8 gap-1" onClick={() => setNovaCompraOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Compra</span>
                </Button>
              </div>
            </div>

            {/* Resumo pendente/pago inline */}
            {parcelas.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap text-xs bg-muted/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-muted-foreground">Pendente:</span>
                  <span className="font-medium">{formatCurrency(totalMes)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-income" />
                  <span className="text-muted-foreground">Pago:</span>
                  <span className="font-medium">{formatCurrency(totalPago)}</span>
                </div>
                {podePagarFatura && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 text-xs gap-1 hidden sm:flex"
                    onClick={() => setPagarFaturaOpen(true)}
                  >
                    <Check className="h-3 w-3" />
                    Pagar fatura
                  </Button>
                )}
              </div>
            )}

            {/* Busca rápida - só aparece quando há parcelas */}
            {parcelas.length > 0 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-8 h-9 sm:h-8 text-sm"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                {busca && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setBusca("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}

            {/* Lista de parcelas */}
            <ScrollArea className="max-h-[35vh] min-h-[120px] [&>div]:!overflow-x-hidden">
              {loading && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Carregando...
                </div>
              )}

              {erro && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  {erro}
                </div>
              )}

              {!loading && !erro && parcelasFiltradas.length === 0 && (
                <div className="py-8 text-center">
                  <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground">
                    {busca ? "Nenhum resultado." : "Nenhuma despesa neste mês."}
                  </p>
                </div>
              )}

              <div className="divide-y divide-border/50 overflow-hidden">
                {!loading && !erro && parcelasExibidas.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between py-2.5 sm:py-2 px-2 transition-colors",
                      p.paga
                        ? "opacity-50 bg-income/5"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2 overflow-hidden">
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          p.paga && "line-through text-muted-foreground"
                        )}>
                          {p.descricao}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.numero_parcela}/{p.total_parcelas}
                          {(p.responsavel_apelido || p.responsavel_nome) && (
                            <> · {p.responsavel_apelido || p.responsavel_nome}</>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-7 sm:w-7">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setParcelaSelecionada(p);
                            setEditarCompraOpen(true);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setParcelaSelecionada(p);
                            setEstornarCompraOpen(true);
                          }}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Estornar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setParcelaSelecionada(p);
                              setExcluirCompraOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Ver mais / tela ampla */}
            <Button
              variant="outline"
              className="w-full h-10 sm:h-9 text-sm gap-2"
              onClick={() => {
                onOpenChange(false);
                navigate(`/cartoes/${cartao.id}/despesas`);
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {temMais
                ? `Ver todas as ${parcelasFiltradas.length} despesas`
                : "Ver tela ampla"}
            </Button>

            {/* Ações do cartão */}
            <div className="flex gap-2 pt-3 border-t min-w-0">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 min-w-0 h-10 sm:h-9"
                onClick={() => setEditarCartaoOpen(true)}
              >
                <Settings className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Editar cartão</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 gap-1.5 min-w-0 h-10 sm:h-9"
                onClick={() => setExcluirCartaoOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Excluir</span>
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

      <PagarFaturaDialog
        cartao={cartao}
        mesReferencia={mesRef}
        parcelas={parcelas}
        open={pagarFaturaOpen}
        onOpenChange={setPagarFaturaOpen}
        onPaid={() => {
          carregarFatura();
          refetchAcertos();
          onUpdated();
        }}
      />

      <AjustarFaturaDialog
        cartaoId={cartao.id}
        mesReferencia={mesRef}
        open={ajustarFaturaOpen}
        onOpenChange={setAjustarFaturaOpen}
        corCartao={cartao.cor}
        onSuccess={() => {
          carregarFatura();
          refetchAcertos();
          onUpdated();
        }}
      />

      {/* Dialogs da compra */}
      <EditarCompraDialog
        parcela={parcelaSelecionada}
        open={editarCompraOpen}
        corCartao={cartao.cor}
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
        corCartao={cartao.cor}
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

      <EstornarCompraDialog
        parcela={parcelaSelecionada}
        open={estornarCompraOpen}
        corCartao={cartao.cor}
        onOpenChange={(open) => {
          setEstornarCompraOpen(open);
          if (!open) setParcelaSelecionada(null);
        }}
        onEstornado={() => {
          setEstornarCompraOpen(false);
          setParcelaSelecionada(null);
          carregarFatura();
          refetchAcertos();
          onUpdated();
        }}
      />

      {/* AlertDialog desmarcar pagas */}
      <AlertDialog open={desmarcarPagasOpen} onOpenChange={setDesmarcarPagasOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desmarcar todas as pagas?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as compras marcadas como pagas neste mês ({formatCurrency(totalPago)}) serão desmarcadas. Esta ação pode ser revertida marcando-as novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDesmarcarPagas}>
              Desmarcar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
