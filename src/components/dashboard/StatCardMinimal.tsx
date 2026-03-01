import { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface StatCardMinimalProps {
  title: string;
  value: number;
  icon: LucideIcon;
  prefix?: string;
  subInfo?: ReactNode;
  delay?: number;
  onClick?: () => void;
  isLoading?: boolean;
  formatValue?: (value: number) => string;
  actions?: ReactNode;
  valueColor?: "income" | "expense" | "neutral";
}

export function StatCardMinimal({
  title,
  value,
  icon: Icon,
  prefix,
  subInfo,
  delay = 0,
  onClick,
  isLoading,
  formatValue,
  actions,
  valueColor,
}: StatCardMinimalProps) {
  const getValueColor = () => {
    if (valueColor === "expense") return "text-[#DC2626]";
    if (valueColor === "income") return "text-[#16A34A]";
    if (prefix === "-") return "text-[#DC2626]";
    if (prefix === "+") return "text-[#16A34A]";
    return value >= 0 ? "text-[#16A34A]" : "text-[#DC2626]";
  };

  const displayValue = formatValue ? formatValue(value) : formatCurrency(value);

  return (
    <div
      className={cn(
        "relative bg-white dark:bg-[#1a1a1a] border border-[#E5E7EB] dark:border-[#2a2a2a] rounded-[10px] p-4",
        "animate-fade-in-up transition-all duration-200",
        "hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
        onClick && "cursor-pointer hover:-translate-y-0.5"
      )}
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
      onClick={onClick}
    >
      <div className="absolute top-4 right-4 flex items-center gap-1">
        {actions}
        <div className="w-7 h-7 rounded-[6px] bg-[#F3F4F6] dark:bg-[#2a2a2a] flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-[#9CA3AF]" />
        </div>
      </div>

      <p className="text-[#6B7280] text-xs sm:text-sm mb-1">{title}</p>

      {isLoading ? (
        <Skeleton className="h-6 w-24 sm:h-7 sm:w-28 bg-gray-200/60 dark:bg-gray-700/40" />
      ) : (
        <p className={cn("text-lg sm:text-xl font-bold tabular-nums", getValueColor())}>
          {prefix}{displayValue}
        </p>
      )}

      {isLoading ? (
        <Skeleton className="h-3 w-16 mt-1 bg-gray-200/60 dark:bg-gray-700/40" />
      ) : (
        subInfo && (
          <p className="text-[11px] text-[#6B7280] mt-1">{subInfo}</p>
        )
      )}
    </div>
  );
}
