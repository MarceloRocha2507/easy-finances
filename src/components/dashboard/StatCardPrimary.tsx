import { Card, CardContent } from "@/components/ui/card";
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
}

export function StatCardPrimary({
  title,
  value,
  icon: Icon,
  type,
  subInfo,
  delay = 0,
  actions,
}: StatCardPrimaryProps) {
  const gradientClasses = {
    income: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-l-4 border-l-emerald-500",
    expense: "bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 border-l-4 border-l-rose-500",
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

  const valueColorClasses = {
    income: "text-income",
    expense: "text-expense",
    neutral: value >= 0 ? "text-income" : "text-expense",
  };

  return (
    <Card
      className={cn(
        "shadow-lg rounded-xl border-0 animate-fade-in-up overflow-hidden",
        gradientClasses[type]
      )}
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {title}
            </p>
            <p className={cn("text-2xl sm:text-3xl font-bold", valueColorClasses[type])}>
              {formatCurrency(value)}
            </p>
            {subInfo && <div className="mt-2">{subInfo}</div>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                iconBgClasses[type]
              )}
            >
              <Icon className={cn("w-6 h-6", iconColorClasses[type])} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
