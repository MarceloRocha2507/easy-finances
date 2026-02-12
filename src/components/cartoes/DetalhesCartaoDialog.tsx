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
}

export function DetalhesCartaoDialog({
  cartao,
  open,
  onOpenChange,
  onUpdated,
}: Props) {
  const navigate = useNavigate();
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
        <DialogContent className="max-w-lg w-[calc(100%-2rem)] p-0 overflow-hidden">
          {/* Header compacto */}
          <div
            className="px-5 py-4 text-white overflow-hidden"
            style={{
              background: `linear-gradient(135deg, hsl(var(--background)) 0%, ${cartao.cor || "#6366f1"}40 100%)`,
            }}
          >
            <DialogHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <CreditCard className="h-4 w-4" style={{ color: cartao.cor }} />
                  {cartao.nome}
                </DialogTitle>
                <Badge variant="outline" className="text-xs text-foreground border-border">
                  {cartao.bandeira || "Crédito"}
                </Badge>
              </div>
              <DialogDescription className="sr-only">
                Detalhes da fatura do cartão
              </DialogDescription>
            </DialogHeader>

            {/* Métricas inline - responsivo */}
            <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] sm:text-sm">
              <div className="min-w-0">
                <span className="text-muted-foreground">Limite</span>
                <p className="font-medium text-foreground truncate">{formatCurrency(limite)}</p>
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground">Fatura</span>
                <p className="font-medium text-destructive truncate">{formatCurrency(totalMes)}</p>
              </div>
              <div className="min-w-0 text-right">
                <span className="text-muted-foreground">Disponível</span>
                <p className="font-medium text-income truncate">{formatCurrency(disponivel)}</p>
              </div>
            </div>

            <Progress value={usoPct} className="h-1.5 mt-2" />
          </div>

          {/* Conteúdo */}
          <div className="px-5 py-4 space-y-4 overflow-hidden">
            {/* Navegação + Ações compactas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setMesRef((m) => addMonths(m, -1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[80px] text-center text-sm font-medium capitalize">
                  {monthLabel(mesRef)}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
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
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                <Button size="sm" className="h-8 gap-1" onClick={() => setNovaCompraOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Compra</span>
                </Button>
              </div>
            </div>

            {/* Busca rápida */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-8 h-8 text-sm"
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

            {/* Resumo pendente/pago inline */}
            {parcelas.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span>Pendente: {formatCurrency(totalMes)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-income" />
                  <span>Pago: {formatCurrency(totalPago)}</span>
                </div>
                {podePagarFatura && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-6 text-xs gap-1"
                    onClick={() => setPagarFaturaOpen(true)}
                  >
                    <Check className="h-3 w-3" />
                    Pagar fatura
                  </Button>
                )}
              </div>
            )}

            {/* Lista de parcelas */}
            <ScrollArea className="h-[200px] [&>div]:!overflow-x-hidden">
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

              <div className="space-y-1 overflow-hidden">
                {!loading && !erro && parcelasExibidas.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between py-2 px-2 rounded-lg transition-colors",
                      p.paga
                        ? "opacity-50 bg-income/5"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          p.paga && "line-through text-muted-foreground"
                        )}>
                          {p.descricao}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.numero_parcela}/{p.total_parcelas}
                          {(p.responsavel_apelido || p.responsavel_nome) && (
                            <> · {p.responsavel_apelido || p.responsavel_nome}</>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className={cn(
                        "text-xs sm:text-sm font-semibold min-w-[70px] text-right",
                        p.paga ? "line-through text-muted-foreground" : "text-destructive"
                      )}>
                        {formatCurrency(Math.abs(p.valor))}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
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
              className="w-full h-9 text-sm gap-2"
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
            <div className="flex gap-2 pt-2 border-t min-w-0">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-1.5 min-w-0"
                onClick={() => setEditarCartaoOpen(true)}
              >
                <Settings className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Editar</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-1.5 min-w-0 text-destructive hover:text-destructive"
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
