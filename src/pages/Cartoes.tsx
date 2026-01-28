import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { regenerarParcelasFaltantes } from "@/services/compras-cartao";
import { useRegenerarParcelas } from "@/hooks/useRegenerarParcelas";
import { formatCurrency } from "@/lib/formatters";
import { useCartoes, usePrevisaoPorResponsavel, CartaoComResumo } from "@/services/cartoes";
import { NovoCartaoDialog } from "@/components/cartoes/NovoCartaoDialog";
import { DetalhesCartaoDialog } from "@/components/cartoes/DetalhesCartaoDialog";
import { DesfazerAlteracaoDialog } from "@/components/cartoes/DesfazerAlteracaoDialog";
import { cn } from "@/lib/utils";

export default function Cartoes() {
  const [mesReferencia, setMesReferencia] = useState(new Date());
  const { data: cartoes = [], isLoading, refetch } = useCartoes(mesReferencia);
  const { data: previsaoData } = usePrevisaoPorResponsavel(mesReferencia);
  const [cartaoSelecionado, setCartaoSelecionado] = useState<CartaoComResumo | null>(null);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const regenerarParcelas = useRegenerarParcelas();
  const verificacaoExecutada = useRef(false);

  const responsaveis = previsaoData?.responsaveis || [];
  const previsao = previsaoData?.previsao || [];

  // Verificação automática silenciosa ao carregar a página
  useEffect(() => {
    if (verificacaoExecutada.current) return;
    verificacaoExecutada.current = true;

    const timer = setTimeout(async () => {
      try {
        const resultado = await regenerarParcelasFaltantes();
        if (resultado.parcelasRegeneradas > 0) {
          refetch();
        }
      } catch (e) {
        console.error("Erro na verificação automática:", e);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [refetch]);

  // Navegação de mês
  const irMesAnterior = () => {
    setMesReferencia(new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() - 1, 1));
  };

  const irProximoMes = () => {
    setMesReferencia(new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 1));
  };

  const nomeMes = mesReferencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // Funções auxiliares para previsão de faturas
  const getMesKey = (offset: number) => {
    const data = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + offset, 1);
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
  };

  const getMesLabel = (offset: number) => {
    const data = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + offset, 1);
    return data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
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
          <Skeleton className="h-32 rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cartões</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gerencie seus cartões e acompanhe as faturas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DesfazerAlteracaoDialog onSuccess={() => refetch()} />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await regenerarParcelas.mutateAsync();
                refetch();
              }}
              disabled={regenerarParcelas.isPending}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", regenerarParcelas.isPending && "animate-spin")} />
              Verificar
            </Button>
            <NovoCartaoDialog onSaved={() => refetch()} />
          </div>
        </div>

        {/* Previsão de Faturas */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Previsão de Faturas</h2>
                <p className="text-xs text-muted-foreground">Gastos comprometidos nos próximos meses</p>
              </div>
            </div>

            {(() => {
              const titular = responsaveis.find(r => r.is_titular);
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
                    const valor = getFaturaDoMes(titular.id, offset);
                    return (
                      <div 
                        key={offset} 
                        className={cn(
                          "p-4 rounded-xl text-center transition-all",
                          offset === 0 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted hover:bg-accent"
                        )}
                      >
                        <p className={cn(
                          "text-xs font-medium capitalize mb-2",
                          offset === 0 ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>
                          {getMesLabel(offset)}
                        </p>
                        <p className={cn(
                          "text-lg font-bold value-display",
                          offset === 0 ? "text-primary-foreground" : "text-foreground"
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
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={irMesAnterior} className="rounded-xl">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-base font-semibold capitalize min-w-[160px] text-center">
            {nomeMes}
          </span>
          <Button variant="ghost" size="icon" onClick={irProximoMes} className="rounded-xl">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Lista de Cartões */}
        {cartoes.length === 0 ? (
          <Card className="py-16 text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" strokeWidth={1.5} />
            <p className="text-muted-foreground mb-2">Nenhum cartão cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Clique em "Novo Cartão" acima para adicionar
            </p>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Dialogs */}
      {detalhesOpen && cartaoSelecionado && (
        <DetalhesCartaoDialog
          cartao={cartaoSelecionado}
          open={detalhesOpen}
          onOpenChange={setDetalhesOpen}
          onUpdated={() => refetch()}
        />
      )}
    </Layout>
  );
}

/* ======================================================
   Componente CartaoCard - Design de cartão amigável
====================================================== */

interface CartaoCardProps {
  cartao: CartaoComResumo;
  mesReferencia: Date;
  onClick: () => void;
  index: number;
}

function CartaoCard({ cartao, mesReferencia, onClick, index }: CartaoCardProps) {
  // Calcular dias até fechamento e vencimento
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth();

  let dataFechamento = new Date(anoAtual, mesAtual, cartao.dia_fechamento);
  if (dataFechamento < hoje) {
    dataFechamento = new Date(anoAtual, mesAtual + 1, cartao.dia_fechamento);
  }
  const diasAteFechamento = Math.ceil(
    (dataFechamento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  let dataVencimento = new Date(anoAtual, mesAtual, cartao.dia_vencimento);
  if (dataVencimento < hoje) {
    dataVencimento = new Date(anoAtual, mesAtual + 1, cartao.dia_vencimento);
  }
  const diasAteVencimento = Math.ceil(
    (dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
  );

  const mesParaExibir = cartao.mesExibicao || mesReferencia;
  const nomeMesFatura = mesParaExibir.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="cursor-pointer animate-fade-in"
      style={{ animationDelay: `${index * 0.08}s` }}
      onClick={onClick}
    >
      {/* Card Visual - Estilo cartão de crédito */}
      <div 
        className="rounded-2xl p-5 mb-4 text-white relative overflow-hidden h-44 transition-transform hover:scale-[1.02]"
        style={{ 
          background: `linear-gradient(135deg, ${cartao.cor || '#8B5CF6'} 0%, ${adjustColor(cartao.cor || '#8B5CF6', -30)} 100%)` 
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
        
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">
                {cartao.bandeira || "Crédito"}
              </p>
              <p className="text-lg font-bold">{cartao.nome}</p>
            </div>
            <Badge 
              variant={cartao.faturaAtualPaga ? "success" : "muted"}
              className={cn(
                "text-xs",
                cartao.faturaAtualPaga ? "bg-white/20 text-white border-0" : "bg-white/20 text-white border-0"
              )}
            >
              {cartao.faturaAtualPaga ? "Paga" : "Aberta"}
            </Badge>
          </div>
          
          <div>
            <p className="text-white/70 text-xs mb-1">Fatura {nomeMesFatura}</p>
            <p className="text-2xl font-bold">
              {formatCurrency(cartao.faturaExibida)}
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="p-4">
        {/* Datas */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Fecha em</p>
            <p className="text-sm font-semibold">{diasAteFechamento} dias</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted">
            <p className="text-xs text-muted-foreground">Vence em</p>
            <p className="text-sm font-semibold">{diasAteVencimento} dias</p>
          </div>
        </div>

        {/* Uso do Limite */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Limite usado</span>
            <span className="font-semibold">{cartao.percentualUsado.toFixed(0)}%</span>
          </div>
          <Progress
            value={cartao.percentualUsado}
            variant={cartao.percentualUsado > 80 ? "expense" : cartao.percentualUsado > 50 ? "warning" : "default"}
            className="h-2"
          />
        </div>

        {/* Valores */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Limite</p>
            <p className="text-sm font-semibold value-display">
              {formatCurrency(cartao.limite)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Usado</p>
            <p className="text-sm font-semibold text-warning value-display">
              {formatCurrency(cartao.limiteUsado)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Livre</p>
            <p className="text-sm font-semibold text-income value-display">
              {formatCurrency(cartao.limiteDisponivel)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Função auxiliar para ajustar cor
function adjustColor(color: string, amount: number): string {
  const clamp = (val: number) => Math.min(255, Math.max(0, val));
  
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  const r = clamp(parseInt(hex.slice(0, 2), 16) + amount);
  const g = clamp(parseInt(hex.slice(2, 4), 16) + amount);
  const b = clamp(parseInt(hex.slice(4, 6), 16) + amount);
  
  return `rgb(${r}, ${g}, ${b})`;
}
