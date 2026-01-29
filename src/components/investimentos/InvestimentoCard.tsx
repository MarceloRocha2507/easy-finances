import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Investimento, TIPOS_INVESTIMENTO } from "@/hooks/useInvestimentos";
import { formatCurrency } from "@/lib/formatters";
import { differenceInDays, parseISO } from "date-fns";
import {
  PiggyBank,
  Landmark,
  Building2,
  Building,
  TrendingUp,
  Layers,
  Bitcoin,
  Wallet,
  Plus,
  Eye,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "piggy-bank": PiggyBank,
  landmark: Landmark,
  "building-2": Building2,
  building: Building,
  "trending-up": TrendingUp,
  layers: Layers,
  bitcoin: Bitcoin,
  wallet: Wallet,
};

interface InvestimentoCardProps {
  investimento: Investimento;
  onAportar: () => void;
  onDetalhes: () => void;
}

export function InvestimentoCard({
  investimento,
  onAportar,
  onDetalhes,
}: InvestimentoCardProps) {
  const tipoInfo = TIPOS_INVESTIMENTO.find((t) => t.value === investimento.tipo);
  const IconComponent = iconMap[investimento.icone] || PiggyBank;

  const rendimento = investimento.valorAtual - investimento.valorInicial;
  const percentualRendimento = investimento.valorInicial > 0
    ? ((rendimento / investimento.valorInicial) * 100).toFixed(2)
    : "0.00";

  const diasParaVencimento = investimento.dataVencimento
    ? differenceInDays(parseISO(investimento.dataVencimento), new Date())
    : null;

  const isPositive = rendimento >= 0;

  return (
    <Card
      className={cn(
        "group cursor-pointer shadow-sm rounded-xl card-hover border-l-4 transition-all duration-200",
        !investimento.ativo && "opacity-60",
        isPositive ? "border-l-emerald-500" : "border-l-rose-500"
      )}
      onClick={onDetalhes}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          {/* Ícone */}
          <div
            className="p-3 rounded-xl shrink-0"
            style={{ backgroundColor: `${investimento.cor}20` }}
          >
            <IconComponent
              className="h-6 w-6"
              style={{ color: investimento.cor }}
            />
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {investimento.nome}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {tipoInfo?.label || investimento.tipo}
                  </Badge>
                  {investimento.instituicao && (
                    <span className="text-xs text-muted-foreground truncate">
                      {investimento.instituicao}
                    </span>
                  )}
                </div>
              </div>
              {!investimento.ativo && (
                <Badge variant="outline" className="shrink-0">
                  Encerrado
                </Badge>
              )}
            </div>

            {/* Valor atual */}
            <div className="mt-3">
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(investimento.valorAtual)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isPositive ? "text-income" : "text-expense"
                  )}
                >
                  {isPositive ? "+" : ""}
                  {formatCurrency(rendimento)} ({isPositive ? "+" : ""}
                  {percentualRendimento}%)
                </span>
              </div>
            </div>

            {/* Info adicional - esconder em mobile */}
            <div className="items-center gap-4 mt-3 text-xs text-muted-foreground hidden sm:flex">
              {investimento.rentabilidadeAnual && (
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {investimento.rentabilidadeAnual}% a.a.
                </span>
              )}
              {diasParaVencimento !== null && diasParaVencimento > 0 && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {diasParaVencimento} dias
                </span>
              )}
              {diasParaVencimento !== null && diasParaVencimento <= 0 && (
                <Badge variant="destructive" className="text-xs">
                  Vencido
                </Badge>
              )}
            </div>

            {/* Botões */}
            {investimento.ativo && (
              <div className="flex gap-2 mt-3 sm:mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs sm:text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAportar();
                  }}
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Aportar</span>
                  <span className="sm:hidden">+</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs sm:text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDetalhes();
                  }}
                >
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Detalhes</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
