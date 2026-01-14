import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listarParcelasDaFatura,
  ParcelaFatura,
  marcarParcelaComoPaga,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
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
  User,
  ExternalLink,
  Settings,
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

  // Dialogs da compra
  const [editarCompraOpen, setEditarCompraOpen] = useState(false);
  const [excluirCompraOpen, setExcluirCompraOpen] = useState(false);
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
  const parcelasExibidas = parcelasFiltradas.slice(0, 6);
  const temMais = parcelasFiltradas.length > 6;

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
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {/* Header compacto */}
          <div
            className="px-5 py-4 text-white"
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

            {/* Métricas inline */}
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div>
                <span className="text-muted-foreground">Limite:</span>{" "}
                <span className="font-medium text-foreground">{formatCurrency(limite)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Fatura:</span>{" "}
                <span className="font-medium text-destructive">{formatCurrency(totalMes)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Disponível:</span>{" "}
                <span className="font-medium text-emerald-500">{formatCurrency(disponivel)}</span>
              </div>
            </div>

            <Progress value={usoPct} className="h-1.5 mt-2" />
          </div>

          {/* Conteúdo */}
          <div className="px-5 py-4 space-y-4">
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
                <span className="min-w-[100px] text-center text-sm font-medium capitalize">
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
                <Button size="sm" className="h-8 gap-1" onClick={() => setNovaCompraOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Compra
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
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span>Pendente: {formatCurrency(totalMes)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
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
            <ScrollArea className="h-[200px]">
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

              <div className="space-y-1">
                {!loading && !erro && parcelasExibidas.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between py-2 px-2 rounded-lg transition-colors",
                      p.paga
                        ? "opacity-50 bg-emerald-500/5"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Checkbox
                        checked={!!p.paga}
                        className="h-4 w-4"
                        onCheckedChange={async () => {
                          await marcarParcelaComoPaga(p.id, !p.paga);
                          carregarFatura();
                          onUpdated();
                        }}
                      />
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

                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "text-sm font-semibold",
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
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => setEditarCartaoOpen(true)}
              >
                <Settings className="h-3.5 w-3.5" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-1.5 text-destructive hover:text-destructive"
                onClick={() => setExcluirCartaoOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
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
