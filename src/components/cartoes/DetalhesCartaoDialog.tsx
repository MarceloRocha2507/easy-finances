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
  cartao: (Cartao & { mesExibicao?: Date }) | null;
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
      .reduce((sum, p) => sum + (Number(p.valor) || 0), 0);
  }, [parcelas]);

  const totalPago = useMemo(() => {
    return parcelas
      .filter((p) => p.paga)
      .reduce((sum, p) => sum + (Number(p.valor) || 0), 0);
  }, [parcelas]);

  // Total gasto pelo titular (EU) - inclui pagas e pendentes
  const totalMeu = useMemo(() => {
    return parcelas
      .filter((p) => p.is_titular === true || !p.responsavel_id)
      .reduce((sum, p) => sum + (Number(p.valor) || 0), 0);
  }, [parcelas]);

  if (!cartao) return null;

  const limite = cartao.limite;
  const disponivel = Math.max(limite - totalMes, 0);
  const usoPct = limite > 0 ? Math.min((totalMes / limite) * 100, 100) : 0;
  const podePagarFatura = parcelas.some((p) => !p.paga);

  const progressColor = usoPct > 85 ? "bg-destructive" : usoPct > 60 ? "bg-[#D97706]" : "bg-income";

  const accentColor = "#111827";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] p-0 gap-0 overflow-hidden flex flex-col rounded-2xl shadow-2xl border-0">

          {/* ── HEADER LIMPO ── */}
          <div className="relative px-5 pt-5 pb-5 bg-white border-b border-black/[0.06]">
            <DialogHeader className="space-y-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-8 w-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}14` }}
                  >
                    <CreditCard className="h-4 w-4" style={{ color: accentColor }} />
                  </div>
                  <DialogTitle className="text-base font-bold tracking-tight" style={{ color: "#111827" }}>
                    {cartao.nome}
                  </DialogTitle>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-semibold border-black/10 bg-black/[0.03] text-[#6B7280] hover:bg-black/[0.05]"
                >
                  {cartao.bandeira || "Crédito"}
                </Badge>
              </div>
              <DialogDescription className="sr-only">Detalhes da fatura do cartão</DialogDescription>
            </DialogHeader>

            {/* Month navigation */}
            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                className="h-7 w-7 rounded-full bg-black/[0.04] hover:bg-black/[0.08] transition-colors flex items-center justify-center"
                onClick={() => setMesRef((m) => addMonths(m, -1))}
              >
                <ChevronLeft className="h-4 w-4 text-[#6B7280]" />
              </button>
              <span className="text-xs font-semibold capitalize bg-black/[0.04] rounded-full px-4 py-1.5 min-w-[126px] text-center text-[#111827]">
                {monthLabel(mesRef)}
              </span>
              <button
                className="h-7 w-7 rounded-full bg-black/[0.04] hover:bg-black/[0.08] transition-colors flex items-center justify-center"
                onClick={() => setMesRef((m) => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4 text-[#6B7280]" />
              </button>
            </div>

            {/* Invoice amount - hero element */}
            <div className="text-center mt-5">
              <p className="text-[2.4rem] font-black leading-none tracking-tighter" style={{ color: "#111827" }}>
                {formatCurrency(totalMes)}
              </p>
              <p className="text-[10px] mt-2 uppercase tracking-[0.18em] font-semibold text-[#6B7280]">
                fatura atual
              </p>
            </div>

            {/* Limit / Available */}
            <div className="grid grid-cols-2 gap-2 mt-5">
              <div className="rounded-xl bg-black/[0.03] px-3 py-2.5 border border-black/[0.04]">
                <p className="text-[9px] uppercase tracking-widest font-semibold text-[#6B7280]">Limite</p>
                <p className="text-sm font-bold mt-1 text-[#111827]">{formatCurrency(limite)}</p>
              </div>
              <div className="rounded-xl bg-black/[0.03] px-3 py-2.5 border border-black/[0.04]">
                <p className="text-[9px] uppercase tracking-widest font-semibold text-[#6B7280]">Disponível</p>
                <p className="text-sm font-bold text-[#16A34A] mt-1">{formatCurrency(disponivel)}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    usoPct > 85 ? "bg-[#DC2626]" : usoPct > 60 ? "bg-[#D97706]" : "bg-[#16A34A]"
                  }`}
                  style={{ width: `${usoPct}%` }}
                />
              </div>
              <div className="flex justify-end mt-1">
                <span className="text-[9px] text-[#6B7280] font-medium">{usoPct.toFixed(0)}% utilizado</span>
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
                className="h-9 gap-1.5 rounded-xl font-semibold shadow-sm bg-[#111827] hover:bg-[#1F2937] text-white"
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
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#16A34A] rounded-l-xl" />
                  <div className="flex items-center gap-1 pl-1.5">
                    <Check className="h-3 w-3 text-[#16A34A]/70" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Pago</span>
                  </div>
                  <p className="text-sm font-bold text-[#16A34A] dark:text-[#16A34A] pl-1.5">{formatCurrency(totalPago)}</p>
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
                className="w-full h-9 text-xs gap-1.5 rounded-xl border-[#16A34A] text-[#16A34A] hover:bg-[#DCFCE7] dark:border-[#16A34A] dark:text-[#16A34A] dark:hover:bg-emerald-950/40"
                onClick={() => setPagarFaturaOpen(true)}
              >
                <Check className="h-3.5 w-3.5" />
                Pagar fatura
              </Button>
            )}

            {/* Ver todas as despesas - CTA principal */}
            <Button
              className="w-full h-11 text-sm gap-2 rounded-xl font-semibold shadow-sm"
              onClick={() => {
                onOpenChange(false);

                // Usa o mês da fatura exibida no card (mesma lógica do resumo)
                const faturaAtiva = new Date(cartao.mesExibicao);
                const month = faturaAtiva.getMonth() + 1;
                const year = faturaAtiva.getFullYear();

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
