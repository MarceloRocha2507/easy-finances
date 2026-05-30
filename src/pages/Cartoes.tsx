import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Receipt,
  RefreshCw,
  MoreHorizontal,
  FileText,
  Wifi,
} from "lucide-react";
import { regenerarParcelasFaltantes } from "@/services/compras-cartao";
import { useRegenerarParcelas } from "@/hooks/useRegenerarParcelas";
import { formatCurrency } from "@/lib/formatters";
import { useCartoes, usePrevisaoPorResponsavel, CartaoComResumo } from "@/services/cartoes";
import { NovoCartaoDialog } from "@/components/cartoes/NovoCartaoDialog";
import { DetalhesCartaoDialog } from "@/components/cartoes/DetalhesCartaoDialog";
import { DesfazerAlteracaoDialog } from "@/components/cartoes/DesfazerAlteracaoDialog";
import { GerarMensagensLoteDialog } from "@/components/cartoes/GerarMensagensLoteDialog";
import { ResumoResponsaveisMes } from "@/components/cartoes/ResumoResponsaveisMes";
import { cn } from "@/lib/utils";
import {
  calcularProximaOcorrenciaDia,
  calcularDataVencimentoCartao,
  calcularDiasAte,
} from "@/lib/dateUtils";

/* ======================================================
   Gradientes únicos por cartão
====================================================== */
const CARD_GRADIENTS = [
  { from: "#1a1a2e", to: "#16213e", accent: "#e94560" },   // Azul noite
  { from: "#0f3460", to: "#1a1a2e", accent: "#533483" },   // Marinho profundo
  { from: "#2d1b69", to: "#11998e", accent: "#a8edea" },   // Violeta → teal
  { from: "#141e30", to: "#243b55", accent: "#c0c0c0" },   // Deep ocean
  { from: "#373B44", to: "#4286f4", accent: "#f5f5f5" },   // Grafite → azul
  { from: "#1a1a2e", to: "#6a0572", accent: "#e040fb" },   // Noite → roxo
];

export default function Cartoes() {
  const [mesReferencia, setMesReferencia] = useState(new Date());
  const { data: cartoes = [], isLoading, refetch } = useCartoes(mesReferencia);
  const { data: previsaoData } = usePrevisaoPorResponsavel(mesReferencia);
  const [cartaoSelecionado, setCartaoSelecionado] = useState<CartaoComResumo | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [loteOpen, setLoteOpen] = useState(false);
  const regenerarParcelas = useRegenerarParcelas();
  const verificacaoExecutada = useRef(false);

  const responsaveis = previsaoData?.responsaveis || [];
  const previsao = previsaoData?.previsao || [];

  useEffect(() => {
    if (verificacaoExecutada.current) return;
    verificacaoExecutada.current = true;
    const timer = setTimeout(async () => {
      try {
        const resultado = await regenerarParcelasFaltantes();
        if (resultado.parcelasRegeneradas > 0) refetch();
      } catch (e) {
        console.error("Erro na verificação automática:", e);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [refetch]);

  const irMesAnterior = () =>
    setMesReferencia(new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() - 1, 1));

  const irProximoMes = () =>
    setMesReferencia(new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 1));

  const nomeMes = mesReferencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const getMesKey = (offset: number) => {
    const data = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + offset, 1);
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
  };

  const getMesLabel = (offset: number) => {
    const data = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + offset, 1);
    return data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase();
  };

  const getFaturaDoMes = (responsavelId: string, offset: number): number => {
    const mesKey = getMesKey(offset);
    return previsao[responsavelId]?.[mesKey] || 0;
  };

  const handleCartaoClick = (cartao: CartaoComResumo) => {
    setCartaoSelecionado(cartao);
    setDetalhesOpen(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 page-enter">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="section-title-accent font-display font-bold text-xl"
              style={{ color: 'hsl(var(--accent-violet))' }}
            >
              Cartões
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Gerencie seus cartões e acompanhe as faturas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {cartoes.length > 0 && (
                    <DropdownMenuItem onClick={() => setLoteOpen(true)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Mensagens
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={async () => { await regenerarParcelas.mutateAsync(); refetch(); }}
                    disabled={regenerarParcelas.isPending}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", regenerarParcelas.isPending && "animate-spin")} />
                    {regenerarParcelas.isPending ? "Verificando..." : "Verificar Parcelas"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              {cartoes.length > 0 && (
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setLoteOpen(true)}>
                  <FileText className="h-4 w-4 mr-1.5" />
                  Gerar Mensagens
                </Button>
              )}
              <DesfazerAlteracaoDialog onSuccess={() => refetch()} />
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={async () => { await regenerarParcelas.mutateAsync(); refetch(); }}
                disabled={regenerarParcelas.isPending}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", regenerarParcelas.isPending && "animate-spin")} />
                {regenerarParcelas.isPending ? "Verificando..." : "Verificar Parcelas"}
              </Button>
            </div>

            <NovoCartaoDialog onSaved={() => refetch()} />
          </div>
        </div>

        {/* Previsão de Faturas */}
        <Card className="rounded-2xl border border-border shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: 'hsl(var(--accent-violet))' }}
              />
              <h2 className="section-title-accent font-display font-bold text-sm"
                style={{ color: 'hsl(var(--accent-violet))' }}>
                Previsão de Faturas
              </h2>
              <span className="text-xs text-muted-foreground ml-1">— próximos 4 meses</span>
            </div>

            {(() => {
              const titular = responsaveis.find((r: { is_titular: boolean }) => r.is_titular);
              if (!titular) {
                return (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum responsável titular cadastrado
                  </p>
                );
              }
              return (
                <div className="grid grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((offset) => {
                    const isAtual = offset === 0;
                    const valor = getFaturaDoMes(titular.id, offset);
                    return (
                      <div
                        key={offset}
                        className={cn(
                          "p-3 rounded-xl text-center transition-all",
                          isAtual
                            ? "bg-background border-2 shadow-sm"
                            : "bg-muted/40 border border-border/50"
                        )}
                        style={isAtual ? { borderColor: 'hsl(var(--accent-violet))' } : undefined}
                      >
                        <p className={cn(
                          "text-[10px] font-display font-semibold uppercase tracking-widest mb-1.5",
                          isAtual ? "text-muted-foreground" : "text-muted-foreground/60"
                        )}
                          style={isAtual ? { color: 'hsl(var(--accent-violet))' } : undefined}
                        >
                          {getMesLabel(offset)}
                        </p>
                        <p className={cn(
                          "font-display font-bold tabular-nums",
                          isAtual ? "text-lg" : "text-sm text-muted-foreground"
                        )}>
                          {formatCurrency(valor)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Navegação de Mês */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-2 bg-muted/50 rounded-2xl px-3 py-1.5 border border-border/50">
            <button
              onClick={irMesAnterior}
              className="h-7 w-7 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-display font-semibold text-sm capitalize min-w-[140px] text-center">
              {nomeMes}
            </span>
            <button
              onClick={irProximoMes}
              className="h-7 w-7 flex items-center justify-center rounded-xl hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Resumo por responsável */}
        <ResumoResponsaveisMes mesReferencia={mesReferencia} />

        {/* Grid de Cartões */}
        {cartoes.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            message="Nenhum cartão cadastrado. Clique em 'Novo Cartão' acima para adicionar."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {cartoes.map((cartao, index) => (
              <CartaoCard
                key={cartao.id}
                cartao={cartao}
                mesReferencia={mesReferencia}
                onClick={() => handleCartaoClick(cartao)}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {detalhesOpen && cartaoSelecionado && (
        <DetalhesCartaoDialog
          cartao={cartaoSelecionado}
          open={detalhesOpen}
          onOpenChange={setDetalhesOpen}
          onUpdated={() => refetch()}
          mesInicial={mesReferencia}
        />
      )}

      <GerarMensagensLoteDialog
        cartoes={cartoes}
        mesReferencia={mesReferencia}
        open={loteOpen}
        onOpenChange={setLoteOpen}
      />
    </Layout>
  );
}

/* ======================================================
   Componente CartaoCard — Estilo cartão físico premium
====================================================== */

interface CartaoCardProps {
  cartao: CartaoComResumo;
  mesReferencia: Date;
  onClick: () => void;
  index: number;
}

function CartaoCard({ cartao, mesReferencia, onClick, index }: CartaoCardProps) {
  const dataFechamento = calcularProximaOcorrenciaDia(cartao.dia_fechamento);
  const dataVencimento = calcularDataVencimentoCartao(
    dataFechamento,
    cartao.dia_fechamento,
    cartao.dia_vencimento
  );
  const diasAteVencimento = calcularDiasAte(dataVencimento);

  const mesParaExibir = cartao.mesExibicao || mesReferencia;
  const nomeMesFatura = mesParaExibir.toLocaleDateString("pt-BR", { month: "long" });

  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  const usoPercent = Math.min(cartao.percentualUsado, 100);
  const usoColor =
    cartao.percentualUsado > 85
      ? "#f87171"
      : cartao.percentualUsado > 60
      ? "#fbbf24"
      : "#4ade80";

  const statusLabel =
    cartao.statusFaturaExibida === "paga"
      ? "Paga"
      : cartao.statusFaturaExibida === "fechada"
      ? "Fechada"
      : "Aberta";

  const statusStyle =
    cartao.statusFaturaExibida === "paga"
      ? { bg: "bg-emerald-500/20", text: "text-emerald-300" }
      : cartao.statusFaturaExibida === "fechada"
      ? { bg: "bg-amber-500/20", text: "text-amber-300" }
      : { bg: "bg-white/10", text: "text-white/70" };

  return (
    <div
      className="cursor-pointer group animate-fade-in"
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={onClick}
    >
      {/* Face do Cartão — visual de cartão físico */}
      <div
        className="relative h-48 rounded-2xl overflow-hidden select-none transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_24px_48px_rgba(0,0,0,0.35)]"
        style={{
          background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
          boxShadow: '0 8px_24px rgba(0,0,0,0.25)',
        }}
      >
        {/* Brilho diagonal */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)',
          }}
        />

        {/* Círculos decorativos de fundo */}
        <div
          className="absolute -right-8 -top-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${gradient.accent}15 0%, transparent 70%)` }}
        />
        <div
          className="absolute -left-4 -bottom-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${gradient.accent}10 0%, transparent 70%)` }}
        />

        {/* Topo do cartão: chip + bandeira */}
        <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
          {/* Chip EMV */}
          <div className="relative w-9 h-7 rounded-[5px] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #f5e17a 30%, #b8860b 60%, #d4af37 100%)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-px p-1 opacity-60">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-yellow-900/30 rounded-[1px]" />
              ))}
            </div>
          </div>

          {/* Bandeira */}
          <span className="font-display font-extrabold text-sm tracking-wider uppercase text-white/90">
            {cartao.bandeira || "CRÉDITO"}
          </span>
        </div>

        {/* Ícone Contactless */}
        <div className="absolute top-5 left-16">
          <Wifi className="h-4 w-4 rotate-90 text-white/30" strokeWidth={1.5} />
        </div>

        {/* Número mascarado */}
        <div className="absolute bottom-14 left-5 right-5">
          <p className="font-mono text-base tracking-[0.2em] text-white/50 select-none">
            ●●●● ●●●● ●●●● ••••
          </p>
        </div>

        {/* Rodapé do cartão: nome + status */}
        <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
          <div>
            <p className="text-[9px] font-display font-semibold uppercase tracking-widest text-white/40 mb-0.5">
              Titular
            </p>
            <p className="font-display font-bold text-sm text-white tracking-wide uppercase truncate max-w-[160px]">
              {cartao.nome}
            </p>
          </div>
          <span className={cn(
            "text-[10px] font-display font-semibold px-2.5 py-1 rounded-full",
            statusStyle.bg,
            statusStyle.text
          )}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Painel de informações abaixo do cartão */}
      <div className="mt-3 bg-card border border-border rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-300 group-hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">

        {/* Fatura em destaque */}
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <p className="text-[10px] font-display font-semibold uppercase tracking-widest text-muted-foreground">
              Fatura {nomeMesFatura}
            </p>
            <p className="font-display font-extrabold text-2xl tabular-nums text-foreground mt-0.5">
              {formatCurrency(cartao.faturaExibida)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground/70">
              Vence em
            </p>
            <p className={cn(
              "text-sm font-display font-bold",
              diasAteVencimento <= 3 ? "text-red-500" : diasAteVencimento <= 7 ? "text-amber-500" : "text-muted-foreground"
            )}>
              {diasAteVencimento}d
            </p>
          </div>
        </div>

        {/* Barra de uso */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-display font-semibold uppercase tracking-widest text-muted-foreground">
              Uso do limite
            </span>
            <span className="text-[11px] font-display font-bold" style={{ color: usoColor }}>
              {usoPercent.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${usoPercent}%`, backgroundColor: usoColor }}
            />
          </div>
        </div>

        {/* Grid Limite / Usado / Disponível */}
        <div className="grid grid-cols-3 gap-1 text-center">
          {[
            { label: "Limite", value: cartao.limite, color: "text-foreground" },
            {
              label: "Usado",
              value: cartao.limiteUsado,
              color: cartao.percentualUsado > 85
                ? "text-red-500 dark:text-red-400"
                : cartao.percentualUsado > 60
                ? "text-amber-500 dark:text-amber-400"
                : "text-foreground",
            },
            {
              label: "Disponível",
              value: cartao.limiteDisponivel,
              color: cartao.limiteDisponivel > cartao.limite * 0.2
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-foreground",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="py-2 rounded-xl bg-muted/40">
              <p className="text-[9px] font-display font-semibold uppercase tracking-widest text-muted-foreground/70 mb-1">
                {label}
              </p>
              <p className={cn("text-xs font-display font-bold tabular-nums", color)}>
                {formatCurrency(value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
