import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  if (!cartao) return null;

  const limite = cartao.limite;
  const disponivel = Math.max(limite - totalMes, 0);
  const usoPct = limite > 0 ? Math.min((totalMes / limite) * 100, 100) : 0;
  const podePagarFatura = parcelas.some((p) => !p.paga);

  const progressColor = usoPct > 85 ? "bg-destructive" : usoPct > 60 ? "bg-amber-500" : "bg-income";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] p-0 gap-0 overflow-hidden flex flex-col">
          {/* Header redesenhado */}
          <div className="px-5 sm:px-6 pt-5 pb-5 bg-muted border-b">
            <DialogHeader className="space-y-0">
              <div className="flex items-center justify-center gap-2 mb-1">
                <DialogTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  {cartao.nome}
                </DialogTitle>
                <Badge variant="outline" className="text-[10px]">
                  {cartao.bandeira || "Crédito"}
                </Badge>
              </div>
              <DialogDescription className="sr-only">
                Detalhes da fatura do cartão
              </DialogDescription>
            </DialogHeader>

            {/* Navegação de mês compacta */}
            <div className="flex items-center justify-center gap-1 mt-2 mb-3">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full"
                onClick={() => setMesRef((m) => addMonths(m, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[110px] text-center text-xs font-medium text-muted-foreground capitalize bg-background/60 rounded-full px-3 py-1">
                {monthLabel(mesRef)}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full"
                onClick={() => setMesRef((m) => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Valor da fatura como destaque */}
            <p className="text-center text-2xl sm:text-3xl font-bold text-destructive tracking-tight">
              {formatCurrency(totalMes)}
            </p>
            <p className="text-center text-xs text-muted-foreground mt-0.5">fatura atual</p>

            {/* Limite e Disponível inline */}
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <span>Limite: <span className="font-semibold text-foreground">{formatCurrency(limite)}</span></span>
              <span>Disponível: <span className="font-semibold text-income">{formatCurrency(disponivel)}</span></span>
            </div>

            {/* Progress bar com cor dinâmica */}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${progressColor}`}
                  style={{ width: `${usoPct}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">{usoPct.toFixed(0)}%</span>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="px-5 sm:px-6 py-4 space-y-3 overflow-y-auto overflow-x-hidden min-h-0">
            {/* Ações */}
            <div className="flex items-center justify-between gap-1 min-w-0">
              <div className="flex items-center gap-1 shrink-0">
                {/* Mobile: dropdown */}
                <div className="flex sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-9 w-9">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
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
                <div className="hidden sm:flex items-center gap-0.5">
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
              </div>

              <Button size="sm" className="h-9 sm:h-8 gap-1" onClick={() => setNovaCompraOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Compra</span>
              </Button>
            </div>

            {/* Resumo Pendente / Pago - cards lado a lado */}
            {parcelas.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-medium">Pendente</span>
                  </div>
                  <p className="text-sm font-semibold text-destructive">{formatCurrency(totalMes)}</p>
                </div>
                <div className="rounded-xl border border-income/20 bg-income/5 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Check className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-medium">Pago</span>
                  </div>
                  <p className="text-sm font-semibold text-income">{formatCurrency(totalPago)}</p>
                </div>
              </div>
            )}

            {/* Pagar fatura */}
            {podePagarFatura && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs gap-1.5"
                onClick={() => setPagarFaturaOpen(true)}
              >
                <Check className="h-3.5 w-3.5" />
                Pagar fatura
              </Button>
            )}

            {/* Ver todas as despesas */}
            <Button
              className="w-full h-10 sm:h-9 text-sm gap-2"
              onClick={() => {
                onOpenChange(false);
                navigate(`/cartoes/${cartao.id}/despesas`);
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {parcelas.length > 0
                ? `Ver todas as ${parcelas.length} despesas`
                : "Ver tela ampla"}
            </Button>

            {/* Ações do cartão - discretas */}
            <div className="flex gap-2 pt-2 border-t min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-1.5 min-w-0 h-9 text-xs"
                onClick={() => setEditarCartaoOpen(true)}
              >
                <Settings className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Editar cartão</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-1.5 min-w-0 h-9 text-xs text-destructive hover:text-destructive"
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
