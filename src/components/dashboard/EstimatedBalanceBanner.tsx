import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface EstimatedBalanceBannerProps {
  value: number;
  delay?: number;
}

export function EstimatedBalanceBanner({
  value,
  delay = 0,
}: EstimatedBalanceBannerProps) {
  const isPositive = value >= 0;

  return (
    <Card
      className="overflow-hidden rounded-xl shadow-lg animate-fade-in-up border-0"
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
    >
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <CardContent className="p-4 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center mb-3 sm:mb-4">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>

            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <p className="text-xs sm:text-sm font-medium text-white/70">
                Saldo Estimado do Mês
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-white/50 hover:text-white/80 transition-colors">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      <strong>Cálculo:</strong> Saldo real + receitas pendentes - despesas pendentes - fatura do cartão
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Este valor representa sua projeção financeira considerando todos os lançamentos do mês.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <p
              className={cn(
                "text-2xl sm:text-3xl md:text-4xl font-bold",
                isPositive ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {formatCurrency(value)}
            </p>

            <p className="text-xs text-white/50 mt-2 sm:mt-3 hidden sm:block">
              saldo real + receitas pendentes - despesas pendentes - cartão
            </p>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
