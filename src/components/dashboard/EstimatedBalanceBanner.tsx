import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface EstimatedBalanceBannerProps {
  value: number;
  delay?: number;
  isLoading?: boolean;
}

export function EstimatedBalanceBanner({
  value,
  delay = 0,
  isLoading,
}: EstimatedBalanceBannerProps) {
  const isPositive = value >= 0;

  return (
    <Card
      className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06)] animate-fade-in-up"
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
    >
      <div className="flex items-center justify-between p-4 sm:p-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] text-muted-foreground">
              Saldo Estimado do Mês
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    <strong>Cálculo:</strong> Saldo real + receitas pendentes − despesas pendentes − fatura do cartão
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este valor representa sua projeção financeira considerando todos os lançamentos do mês.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {isLoading ? (
            <Skeleton className="h-7 w-40" />
          ) : (
            <p
              className={`text-2xl font-bold ${
                isPositive ? "text-[#16A34A]" : "text-destructive"
              }`}
            >
              {formatCurrency(value)}
            </p>
          )}
        </div>

        <div className="hidden sm:flex flex-col items-end text-[11px] text-muted-foreground/60 leading-relaxed">
          <span>saldo real + receitas pendentes</span>
          <span>− despesas pendentes − cartão</span>
        </div>
      </div>
    </Card>
  );
}
