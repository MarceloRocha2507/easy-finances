import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  Undo2,
  FileText,
} from "lucide-react";
import { regenerarParcelasFaltantes } from "@/services/compras-cartao";
import { useRegenerarParcelas } from "@/hooks/useRegenerarParcelas";
import { formatCurrency } from "@/lib/formatters";
import { useCartoes, usePrevisaoPorResponsavel, CartaoComResumo } from "@/services/cartoes";
import { NovoCartaoDialog } from "@/components/cartoes/NovoCartaoDialog";
import { DetalhesCartaoDialog } from "@/components/cartoes/DetalhesCartaoDialog";
import { DesfazerAlteracaoDialog } from "@/components/cartoes/DesfazerAlteracaoDialog";
import { GerarMensagensLoteDialog } from "@/components/cartoes/GerarMensagensLoteDialog";
import { cn } from "@/lib/utils";
import {
  calcularProximaOcorrenciaDia,
  calcularDataVencimentoCartao,
  calcularDiasAte,
} from "@/lib/dateUtils";

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

  // Verificação automática silenciosa ao carregar a página (com debounce)
  useEffect(() => {
    // Evitar múltiplas execuções
    if (verificacaoExecutada.current) return;
    verificacaoExecutada.current = true;

    // Esperar 2 segundos após a página carregar para não bloquear a navegação
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

  const getTotalFatura = (offset: number): number => {
    const mesKey = getMesKey(offset);
    return Object.values(previsao).reduce((sum, respData) => {
      return sum + ((respData as Record<string, number>)[mesKey] || 0);
    }, 0);
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
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Cartões</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Gerencie seus cartões e acompanhe as faturas
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile: dropdown com ações */}
            <div className="flex sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
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
                    onClick={async () => {
                      await regenerarParcelas.mutateAsync();
                      refetch();
                    }}
                    disabled={regenerarParcelas.isPending}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", regenerarParcelas.isPending && "animate-spin")} />
                    {regenerarParcelas.isPending ? "Verificando..." : "Verificar Parcelas"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Desktop: botões individuais */}
            <div className="hidden sm:flex items-center gap-2">
              {cartoes.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLoteOpen(true)}
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  Gerar Mensagens
                </Button>
              )}
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
                {regenerarParcelas.isPending ? "Verificando..." : "Verificar Parcelas"}
              </Button>
            </div>
            
            <NovoCartaoDialog onSaved={() => refetch()} />
          </div>
        </div>

        {/* Previsão de Faturas */}
        <Card className="shadow-lg rounded-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="font-semibold">Previsão de Faturas</h2>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-center">
                  {[0, 1, 2, 3].map((offset) => (
                    <div key={offset} className={cn(
                      "p-2 sm:p-4 rounded-xl transition-all",
                      offset === 0 
                        ? "bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm" 
                        : "bg-muted/50"
                    )}>
                      <p className="text-xs text-muted-foreground capitalize">{getMesLabel(offset)}</p>
                      <p className={cn(
                        "text-sm sm:text-lg font-bold value-display mt-1 truncate",
                        offset === 0 ? "text-primary" : "text-foreground"
                      )}>
                        {formatCurrency(getFaturaDoMes(titular.id, offset))}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Navegação de Mês */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={irMesAnterior}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium capitalize min-w-[140px] text-center">
            {nomeMes}
          </span>
          <Button variant="outline" size="icon" onClick={irProximoMes}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Lista de Cartões */}
        {cartoes.length === 0 ? (
          <Card className="shadow-sm rounded-xl">
            <CardContent className="py-16 text-center">
              <CreditCard className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" strokeWidth={1.5} />
              <p className="text-muted-foreground mb-4">
                Nenhum cartão cadastrado
              </p>
              <p className="text-sm text-muted-foreground">
                Clique em "Novo Cartão" acima para adicionar
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
   Componente CartaoCard
====================================================== */

interface CartaoCardProps {
  cartao: CartaoComResumo;
  mesReferencia: Date;
  onClick: () => void;
  index: number;
}

function CartaoCard({ cartao, mesReferencia, onClick, index }: CartaoCardProps) {
  // Calcular datas usando helpers centralizados
  const dataFechamento = calcularProximaOcorrenciaDia(cartao.dia_fechamento);
  const dataVencimento = calcularDataVencimentoCartao(
    dataFechamento,
    cartao.dia_fechamento,
    cartao.dia_vencimento
  );
  const diasAteFechamento = calcularDiasAte(dataFechamento);
  const diasAteVencimento = calcularDiasAte(dataVencimento);

  // Usar o mês que deve ser exibido (atual ou próximo se pago)
  const mesParaExibir = cartao.mesExibicao || mesReferencia;
  const nomeMesFatura = mesParaExibir.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card
      className="cursor-pointer shadow-sm rounded-xl card-hover fade-in overflow-hidden"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    >
      {/* Header com cor do cartão */}
      <div
        className="h-2"
        style={{ backgroundColor: cartao.cor || "#6366f1" }}
      />

      <CardContent className="p-6">
        {/* Info do Cartão */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${cartao.cor || "#6366f1"}15` }}
            >
              <CreditCard
                className="h-6 w-6"
                style={{ color: cartao.cor || "#6366f1" }}
                strokeWidth={1.75}
              />
            </div>
            <div>
              <p className="font-semibold">{cartao.nome}</p>
              <p className="text-xs text-muted-foreground uppercase">
                {cartao.bandeira || "Crédito"}
              </p>
            </div>
          </div>
          <Badge 
            variant={cartao.faturaAtualPaga ? "default" : "outline"} 
            className={cn(
              "text-xs",
              cartao.faturaAtualPaga && "bg-emerald-500 hover:bg-emerald-600"
            )}
          >
            {cartao.faturaAtualPaga ? "Paga" : "Aberta"}
          </Badge>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4 mb-4 p-4 rounded-xl bg-muted/50">
          <div>
            <p className="text-xs text-muted-foreground">Fechamento</p>
            <p className="text-sm font-medium">
              {dataFechamento.toLocaleDateString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground">
              em {diasAteFechamento} dia(s)
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Vencimento</p>
            <p className="text-sm font-medium">
              {dataVencimento.toLocaleDateString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground">
              em {diasAteVencimento} dia(s)
            </p>
          </div>
        </div>

        {/* Uso do Limite */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Uso do limite</span>
            <span className="font-medium">{cartao.percentualUsado.toFixed(0)}%</span>
          </div>
          <Progress
            value={cartao.percentualUsado}
            className={cn(
              "h-2",
              cartao.percentualUsado > 80 && "[&>div]:bg-red-500",
              cartao.percentualUsado > 50 && cartao.percentualUsado <= 80 && "[&>div]:bg-amber-500"
            )}
          />
        </div>

        {/* Valores do Limite */}
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Limite</p>
            <p className="text-sm font-semibold value-display">
              {formatCurrency(cartao.limite)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Usado</p>
            <p className="text-sm font-semibold value-display text-amber-600">
              {formatCurrency(cartao.limiteUsado)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Disponível</p>
            <p className="text-sm font-semibold value-display text-emerald-600">
              {formatCurrency(cartao.limiteDisponivel)}
            </p>
          </div>
        </div>

        {/* Fatura do Mês - Destaque */}
        <div className={cn(
          "p-4 rounded-xl border",
          cartao.faturaAtualPaga 
            ? "bg-emerald-500/5 border-emerald-500/20" 
            : "bg-red-500/5 border-red-500/20"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className={cn(
                "h-4 w-4",
                cartao.faturaAtualPaga ? "text-emerald-500" : "text-red-500"
              )} />
              <span className="text-sm font-medium capitalize">Fatura {nomeMesFatura}</span>
            </div>
            <span className={cn(
              "text-lg font-bold value-display",
              cartao.faturaAtualPaga ? "text-emerald-600" : "text-red-600"
            )}>
              {formatCurrency(cartao.faturaExibida)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
