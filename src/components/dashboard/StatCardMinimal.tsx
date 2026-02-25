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
}: StatCardMinimalProps) {
  const getValueColor = () => {
    if (prefix === "-") return "text-[#DC2626]";
    if (prefix === "+") return "text-[#16A34A]";
    return value >= 0 ? "text-[#16A34A]" : "text-[#DC2626]";
  };

  const displayValue = formatValue ? formatValue(value) : formatCurrency(value);

  return (
    <div
      className={cn(
        "relative bg-white dark:bg-[#1a1a1a] border border-[#E5E7EB] dark:border-[#2a2a2a] rounded-[10px] p-4",
        "shadow-[0_1px_3px_rgba(0,0,0,0.07)] animate-fade-in-up transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
      )}
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
      onClick={onClick}
    >
      <Icon className="absolute top-4 right-4 h-4 w-4 text-foreground/30" />

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
