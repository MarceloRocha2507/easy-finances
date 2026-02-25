import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface StatCardSecondaryProps {
  title: string;
  value: number;
  icon: LucideIcon;
  status: "pending" | "warning" | "danger" | "info" | "success" | "neutral";
  subInfo?: ReactNode;
  delay?: number;
  onClick?: () => void;
  prefix?: string;
  formatValue?: (value: number) => string;
  isLoading?: boolean;
}

export function StatCardSecondary({
  title,
  value,
  icon: Icon,
  status,
  subInfo,
  delay = 0,
  onClick,
  prefix = "",
  formatValue,
  isLoading,
}: StatCardSecondaryProps) {
  const borderClasses = {
    pending: "border-l-4 border-l-blue-500",
    warning: "border-l-4 border-l-amber-500",
    danger: "border-l-4 border-l-red-500",
    info: "border-l-4 border-l-purple-500",
    success: "border-l-4 border-l-emerald-500",
    neutral: "border-l-4 border-l-slate-400",
  };

  const iconBgClasses = {
    pending: "bg-blue-100 dark:bg-blue-950",
    warning: "bg-amber-100 dark:bg-amber-950",
    danger: "bg-red-100 dark:bg-red-950",
    info: "bg-purple-100 dark:bg-purple-950",
    success: "bg-emerald-100 dark:bg-emerald-950",
    neutral: "bg-slate-100 dark:bg-slate-800",
  };

  const iconColorClasses = {
    pending: "text-blue-600",
    warning: "text-amber-600",
    danger: "text-red-600",
    info: "text-purple-600",
    success: "text-emerald-600",
    neutral: "text-slate-600 dark:text-slate-400",
  };

  const skeletonClasses = {
    pending: "bg-blue-200/50 dark:bg-blue-800/30",
    warning: "bg-amber-200/50 dark:bg-amber-800/30",
    danger: "bg-red-200/50 dark:bg-red-800/30",
    info: "bg-purple-200/50 dark:bg-purple-800/30",
    success: "bg-emerald-200/50 dark:bg-emerald-800/30",
    neutral: "bg-slate-200/50 dark:bg-slate-700/30",
  };

  const valueColorClasses = {
    pending: "text-blue-600",
    warning: "text-amber-600",
    danger: "text-red-600",
    info: "text-purple-600",
    success: "text-emerald-600",
    neutral: "text-foreground",
  };

  return (
    <Card
      className={cn(
        "border bg-card shadow-sm rounded-xl animate-fade-in-up transition-all duration-200",
        borderClasses[status],
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
      )}
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">{title}</p>
            {isLoading ? (
              <Skeleton className={cn("h-5 w-24 sm:h-6 sm:w-28", skeletonClasses[status])} />
            ) : (
              <p className={cn("text-base sm:text-xl font-semibold", valueColorClasses[status])}>
                {prefix}{formatValue ? formatValue(value) : formatCurrency(value)}
              </p>
            )}
            {isLoading ? (
              <Skeleton className={cn("h-3 w-16 mt-1", skeletonClasses[status])} />
            ) : (
              subInfo && (
                <p className="text-xs text-muted-foreground mt-1">{subInfo}</p>
              )
            )}
          </div>
          <div
            className={cn(
              "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center",
              iconBgClasses[status]
            )}
          >
            <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", iconColorClasses[status])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
