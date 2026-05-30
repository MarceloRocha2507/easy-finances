import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  listarParcelasDaFatura,
  ParcelaFatura,
  desmarcarTodasParcelas,
} from "@/services/compras-cartao";
import { useAcertosMes } from "@/services/acertos";
import { useResponsaveis } from "@/services/responsaveis";
import { ResumoPorResponsavel } from "./ResumoPorResponsavel";
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
import { PagarFaturaDialog } from "./PagarFaturaDialog";
import { AjustarFaturaDialog } from "./AjustarFaturaDialog";

import {
  MoreVertical,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Check,
  FileText,
  Wallet,
  ExternalLink,
  Scale,
  Settings,
  RotateCcw,
  Upload,
  Clock,
  Crown,
} from "lucide-react";

import { formatCurrency } from "@/lib/formatters";
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
  }, [cartao?.id, open, mesRef]);

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

  // Total gasto pelo titular (EU) - inclui pagas e pendentes
  const totalMeu = useMemo(() => {
    return parcelas
      .filter((p) => p.is_titular === true || !p.responsavel_id)
      .reduce((sum, p) => sum + Math.abs(Number(p.valor) || 0), 0);
  }, [parcelas]);

  if (!cartao) return null;

  const limite = cartao.limite;
  const disponivel = Math.max(limite - totalMes, 0);
  const usoPct = limite > 0 ? Math.min((totalMes / limite) * 100, 100) : 0;
  const podePagarFatura = parcelas.some((p) => !p.paga);

  const progressColor = usoPct > 85 ? "bg-destructive" : usoPct > 60 ? "bg-amber-500" : "bg-income";

  const headerBg = cartao.cor
    ? `linear-gradient(145deg, ${cartao.cor} 0%, ${cartao.cor}cc 45%, #0f172a 100%)`
    : "linear-gradient(145deg, #334155 0%, #1e293b 50%, #0f172a 100%)";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl shadow-2xl border-0">

          {/* ── HEADER PREMIUM ── */}
          <div className="relative px-5 pt-5 pb-5 overflow-hidden" style={{ background: headerBg }}>
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/[0.04] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-white/[0.03] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />

            <DialogHeader className="space-y-0 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                  <DialogTitle className="text-base font-bold text-white tracking-tight">
                    {cartao.nome}
                  </DialogTitle>
                </div>
                <Badge className="bg-white/15 text-white border-white/25 text-[10px] font-semibold hover:bg-white/20">
                  {cartao.bandeira || "Crédito"}
                </Badge>
              </div>
              <DialogDescription className="sr-only">Detalhes da fatura do cartão</DialogDescription>
            </DialogHeader>

            {/* Month navigation */}
            <div className="flex items-center justify-center gap-2 mt-4 relative z-10">
              <button
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                onClick={() => setMesRef((m) => addMonths(m, -1))}
              >
                <ChevronLeft className="h-4 w-4 text-white/80" />
              </button>
              <span className="text-xs font-semibold text-white/75 capitalize bg-white/10 rounded-full px-4 py-1.5 min-w-[126px] text-center">
                {monthLabel(mesRef)}
              </span>
              <button
                className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                onClick={() => setMesRef((m) => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4 text-white/80" />
              </button>
            </div>

            {/* Invoice amount - hero element */}
            <div className="text-center mt-5 relative z-10">
              <p className="text-[2.6rem] font-black text-white leading-none tracking-tighter">
                {formatCurrency(totalMes)}
              </p>
              <p className="text-[10px] text-white/50 mt-2 uppercase tracking-[0.18em] font-semibold">
                fatura atual
              </p>
            </div>

            {/* Limit / Available - glass cards */}
            <div className="grid grid-cols-2 gap-2 mt-5 relative z-10">
              <div className="rounded-xl bg-white/10 px-3 py-2.5">
                <p className="text-[9px] text-white/55 uppercase tracking-widest font-semibold">Limite</p>
                <p className="text-sm font-bold text-white mt-1">{formatCurrency(limite)}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2.5">
                <p className="text-[9px] text-white/55 uppercase tracking-widest font-semibold">Disponível</p>
                <p className="text-sm font-bold text-emerald-300 mt-1">{formatCurrency(disponivel)}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 relative z-10">
              <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    usoPct > 85 ? "bg-red-400" : usoPct > 60 ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                  style={{ width: `${usoPct}%` }}
                />
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-[9px] text-white/40 font-medium">{usoPct.toFixed(0)}% utilizado</span>
              </div>
            </div>
          </div>

          {/* ── CONTEÚDO ── */}
          <div className="px-5 sm:px-6 py-4 space-y-4 overflow-y-auto overflow-x-hidden min-h-0">

            {/* Toolbar de ações */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 bg-muted/70 rounded-xl p-1">
                {/* Mobile: dropdown */}
                <div className="flex sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-8 w-8 rounded-lg hover:bg-background/80 flex items-center justify-center transition-colors">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
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

                {/* Desktop: ícones */}
                <div className="hidden sm:flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="h-8 w-8 rounded-lg hover:bg-background/80 flex items-center justify-center transition-colors" onClick={() => setGerarMensagemOpen(true)}>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Gerar mensagem</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="h-8 w-8 rounded-lg hover:bg-background/80 flex items-center justify-center transition-colors" onClick={() => setRegistrarAcertoOpen(true)}>
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Registrar acerto</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="h-8 w-8 rounded-lg hover:bg-background/80 flex items-center justify-center transition-colors" onClick={() => setAjustarFaturaOpen(true)}>
                          <Scale className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Ajustar fatura</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="h-8 w-8 rounded-lg hover:bg-background/80 flex items-center justify-center transition-colors"
                          onClick={() => {
                            onOpenChange(false);
                            navigate(`/cartoes/${cartao.id}/importar`);
                          }}
                        >
                          <Upload className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Importar compras</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="h-8 w-8 rounded-lg hover:bg-background/80 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          disabled={totalPago === 0}
                          onClick={() => setDesmarcarPagasOpen(true)}
                        >
                          <RotateCcw className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Desmarcar pagas</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-xl font-semibold shadow-sm text-white"
                style={cartao.cor ? { backgroundColor: cartao.cor, borderColor: cartao.cor } : {}}
                onClick={() => setNovaCompraOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Compra
              </Button>
            </div>

            {/* Status cards — Pendente / Pago / Meu */}
            {parcelas.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl border bg-card p-3 space-y-1.5 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-destructive/70 rounded-l-xl" />
                  <div className="flex items-center gap-1 pl-1.5">
                    <Clock className="h-3 w-3 text-destructive/60" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Pendente</span>
                  </div>
                  <p className="text-sm font-bold text-destructive pl-1.5">{formatCurrency(totalMes)}</p>
                </div>
                <div className="rounded-xl border bg-card p-3 space-y-1.5 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 rounded-l-xl" />
                  <div className="flex items-center gap-1 pl-1.5">
                    <Check className="h-3 w-3 text-emerald-500/70" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Pago</span>
                  </div>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 pl-1.5">{formatCurrency(totalPago)}</p>
                </div>
                <div className="rounded-xl border bg-card p-3 space-y-1.5 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-l-xl" />
                  <div className="flex items-center gap-1 pl-1.5">
                    <Crown className="h-3 w-3 text-primary/70" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Meu</span>
                  </div>
                  <p className="text-sm font-bold text-foreground pl-1.5">{formatCurrency(totalMeu)}</p>
                </div>
              </div>
            )}

            {/* Resumo por responsável */}
            {parcelas.length > 0 && (
              <ResumoPorResponsavel parcelas={parcelas} acertos={acertos} />
            )}

            {/* Pagar fatura */}
            {podePagarFatura && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs gap-1.5 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                onClick={() => setPagarFaturaOpen(true)}
              >
                <Check className="h-3.5 w-3.5" />
                Pagar fatura
              </Button>
            )}

            {/* Ver todas as despesas - CTA principal */}
            <Button
              className="w-full h-11 text-sm gap-2 rounded-xl font-semibold shadow-sm"
              onClick={async () => {
                onOpenChange(false);

                const { data: openParcela } = await supabase
                  .from("parcelas_cartao")
                  .select("mes_referencia, compra:compras_cartao!inner(cartao_id)")
                  .eq("compra.cartao_id", cartao.id)
                  .eq("paga", false)
                  .eq("ativo", true)
                  .order("mes_referencia", { ascending: true })
                  .limit(1)
                  .maybeSingle();

                let month, year;

                if (openParcela?.mes_referencia) {
                  const openDate = new Date(openParcela.mes_referencia + "T12:00:00");
                  month = openDate.getMonth() + 1;
                  year = openDate.getFullYear();
                } else {
                  month = mesRef.getMonth() + 1;
                  year = mesRef.getFullYear();
                }

                navigate(`/cartoes/${cartao.id}/despesas?month=${month}&year=${year}`);
              }}
            >
              <ExternalLink className="h-4 w-4" />
              {parcelas.length > 0 && totalMes > 0
                ? `Ver todas as ${parcelas.length} despesas`
                : "Ver fatura aberta"}
            </Button>

            {/* Ações secundárias */}
            <div className="flex gap-1 pt-1 border-t">
              <button
                className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-xl transition-colors font-medium"
                onClick={() => setEditarCartaoOpen(true)}
              >
                <Settings className="h-3.5 w-3.5" />
                Editar cartão
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-1.5 h-9 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-colors font-medium"
                onClick={() => setExcluirCartaoOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </button>
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
