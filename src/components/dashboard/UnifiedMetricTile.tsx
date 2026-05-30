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
  subInfo?: ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
  formatValue?: (value: number) => string;
  valueColor?: "income" | "expense" | "neutral";
  className?: string;
}

export function UnifiedMetricTile({
  title,
  value,
  icon: Icon,
  prefix,
  subInfo,
  onClick,
  isLoading,
  formatValue,
  valueColor,
  className,
}: UnifiedMetricTileProps) {
  const getValueColor = () => {
    if (valueColor === "expense") return "text-[#DC2626] dark:text-[#f87171]";
    if (valueColor === "income") return "text-[#16A34A] dark:text-[#4ade80]";
    if (prefix === "-") return "text-[#DC2626] dark:text-[#f87171]";
    if (prefix === "+") return "text-[#16A34A] dark:text-[#4ade80]";
    return value >= 0 ? "text-[#111827] dark:text-white" : "text-[#DC2626] dark:text-[#f87171]";
  };

  const getTileBg = () => {
    if (valueColor === "income" || prefix === "+") return "metric-tile-income";
    if (valueColor === "expense" || prefix === "-") return "metric-tile-expense";
    return "";
  };

  const displayValue = formatValue ? formatValue(value) : formatCurrency(value);

  return (
    <div
      className={cn(
        "relative p-4 sm:p-5 transition-all duration-200",
        getTileBg(),
        onClick && "cursor-pointer hover:brightness-[0.97] active:brightness-95",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-3 w-3 text-muted-foreground/50 shrink-0" />
        <p className="font-display font-semibold text-[10px] uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-7 w-24 bg-gray-200/60 dark:bg-gray-700/40 mb-1.5" />
      ) : (
        <p className={cn("text-xl sm:text-2xl font-display font-bold tabular-nums leading-tight", getValueColor())}>
          {prefix}{displayValue}
        </p>
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
