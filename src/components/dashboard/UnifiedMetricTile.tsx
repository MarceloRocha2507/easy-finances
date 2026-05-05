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
}

/**
 * Tile compacto usado dentro de um painel unificado.
 * Sem borda/sombra própria — divisores vêm do container pai.
 */
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
}: UnifiedMetricTileProps) {
  const getValueColor = () => {
    if (valueColor === "expense") return "text-[#DC2626]";
    if (valueColor === "income") return "text-[#16A34A]";
    if (prefix === "-") return "text-[#DC2626]";
    if (prefix === "+") return "text-[#16A34A]";
    return value >= 0 ? "text-[#111827] dark:text-white" : "text-[#DC2626]";
  };

  const displayValue = formatValue ? formatValue(value) : formatCurrency(value);

  return (
    <div
      className={cn(
        "relative p-3 sm:p-4 transition-colors",
        onClick && "cursor-pointer hover:bg-[#FAFAFA] dark:hover:bg-[#1f1f1f]"
      )}
      onClick={onClick}
    >
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
        <Icon className="h-3.5 w-3.5 text-foreground/30" />
      </div>

      <p className="text-[#6B7280] text-[11px] sm:text-xs mb-1 pr-5">{title}</p>

      {isLoading ? (
        <Skeleton className="h-5 w-20 bg-gray-200/60 dark:bg-gray-700/40" />
      ) : (
        <p className={cn("text-base sm:text-lg font-bold tabular-nums", getValueColor())}>
          {prefix}{displayValue}
        </p>
      )}

      {isLoading ? (
        <Skeleton className="h-3 w-14 mt-1 bg-gray-200/60 dark:bg-gray-700/40" />
      ) : (
        subInfo && (
          <div className="text-[10px] sm:text-[11px] text-[#6B7280] mt-1 leading-tight">
            {subInfo}
          </div>
        )
      )}
    </div>
  );
}
