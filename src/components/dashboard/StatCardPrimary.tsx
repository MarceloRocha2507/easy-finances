import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface StatCardPrimaryProps {
  title: string;
  value: number;
  icon: LucideIcon;
  type: "income" | "expense" | "neutral";
  subInfo?: React.ReactNode;
  delay?: number;
  actions?: React.ReactNode;
  isLoading?: boolean;
}

export function StatCardPrimary({
  title,
  value,
  icon: Icon,
  type,
  subInfo,
  delay = 0,
  actions,
  isLoading,
}: StatCardPrimaryProps) {
  const gradientClasses = {
    income: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-l-4 border-l-emerald-500 card-glow-income",
    expense: "bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 border-l-4 border-l-rose-500 card-glow-expense",
    neutral: "bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-800/50 dark:to-slate-900/50",
  };

  const iconBgClasses = {
    income: "bg-emerald-100 dark:bg-emerald-900/50",
    expense: "bg-rose-100 dark:bg-rose-900/50",
    neutral: "bg-slate-100 dark:bg-slate-700/50",
  };

  const iconColorClasses = {
    income: "text-emerald-600 dark:text-emerald-400",
    expense: "text-rose-600 dark:text-rose-400",
    neutral: "text-slate-600 dark:text-slate-400",
  };

  const skeletonClasses = {
    income: "bg-emerald-200/60 dark:bg-emerald-800/40",
    expense: "bg-rose-200/60 dark:bg-rose-800/40",
    neutral: "bg-slate-200/60 dark:bg-slate-700/40",
  };

  const valueColorClasses = {
    income: "text-income",
    expense: "text-expense",
    neutral: value >= 0 ? "text-income" : "text-expense",
  };

  return (
    <Card
      className={cn(
        "rounded-xl border-0 animate-fade-in-up overflow-hidden",
        gradientClasses[type]
      )}
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
    >
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-display text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1 sm:mb-2">
              {title}
            </p>
            {isLoading ? (
              <Skeleton className={cn("h-8 w-28 sm:h-10 sm:w-36", skeletonClasses[type])} />
            ) : (
              <p className={cn("text-2xl sm:text-3xl md:text-4xl font-display font-bold tabular-nums", valueColorClasses[type])}>
                {formatCurrency(value)}
              </p>
            )}
            {isLoading ? (
              <Skeleton className={cn("h-3 w-20 mt-1 sm:mt-2", skeletonClasses[type])} />
            ) : (
              subInfo && <div className="mt-1 sm:mt-2 text-sm">{subInfo}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <div
              className={cn(
                "w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center drop-shadow-sm",
                iconBgClasses[type]
              )}
            >
              <Icon className={cn("w-5 h-5 sm:w-7 sm:h-7", iconColorClasses[type])} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
