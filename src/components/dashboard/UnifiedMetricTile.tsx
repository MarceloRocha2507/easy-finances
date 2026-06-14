import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface UnifiedMetricTileProps {
  title: string;
  value: number;
  icon: LucideIcon;
  prefix?: string;
  valueContent?: ReactNode;
  subInfo?: ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
  formatValue?: (value: number) => string;
  valueColor?: "income" | "expense" | "neutral" | "violet";
  className?: string;
}

export function UnifiedMetricTile({
  title,
  value,
  icon: Icon,
  prefix,
  valueContent,
  subInfo,
  onClick,
  isLoading,
  formatValue,
  valueColor,
  className,
}: UnifiedMetricTileProps) {
  const getValueColor = () => {
    if (valueColor === "violet") return "text-violet-600 dark:text-violet-400";
    if (valueColor === "expense") return "text-[#DC2626] dark:text-[#DC2626]";
    if (valueColor === "income") return "text-[#16A34A] dark:text-[#16A34A]";
    if (prefix === "-") return "text-[#DC2626] dark:text-[#DC2626]";
    if (prefix === "+") return "text-[#16A34A] dark:text-[#16A34A]";
    return value >= 0 ? "text-[#111827] dark:text-white" : "text-[#DC2626] dark:text-[#DC2626]";
  };

  const getTileBg = () => {
    if (valueColor === "violet") return "metric-tile-violet";
    if (valueColor === "income" || prefix === "+") return "metric-tile-income";
    if (valueColor === "expense" || prefix === "-") return "metric-tile-expense";
    return "";
  };

  const getIconTone = () => {
    if (valueColor === "violet") return "text-violet-500/70";
    if (valueColor === "income" || prefix === "+") return "text-emerald-500/70";
    if (valueColor === "expense" || prefix === "-") return "text-rose-500/70";
    return "text-muted-foreground/50";
  };

  const displayValue = formatValue ? formatValue(value) : formatCurrency(value);

  return (
    <div
      className={cn(
        "relative min-w-0 p-4 sm:p-5 transition-all duration-200",
        getTileBg(),
        onClick && "cursor-pointer hover:brightness-[0.97] active:brightness-95",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={cn("h-3 w-3 shrink-0", getIconTone())} />
        <p className="font-display font-semibold text-[10px] uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-7 w-24 bg-gray-200/60 dark:bg-gray-700/40 mb-1.5" />
      ) : (
        valueContent ?? (
          <p className={cn("min-w-0 break-words text-[clamp(1.125rem,5vw,1.5rem)] sm:text-2xl font-display font-bold tabular-nums leading-tight", getValueColor())}>
            {prefix}{displayValue}
          </p>
        )
      )}

      {isLoading ? (
        <Skeleton className="h-3 w-14 mt-1.5 bg-gray-200/60 dark:bg-gray-700/40" />
      ) : (
        subInfo && (
          <div className="text-[10px] sm:text-[11px] text-muted-foreground/70 mt-1.5 leading-tight">
            {subInfo}
          </div>
        )
      )}
    </div>
  );
}
