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
    pending: "border-l-4 border-l-[#6B7280]",
    warning: "border-l-4 border-l-[#D97706]",
    danger: "border-l-4 border-l-[#DC2626]",
    info: "border-l-4 border-l-[#6B7280]",
    success: "border-l-4 border-l-[#16A34A]",
    neutral: "border-l-4 border-l-[#9CA3AF]",
  };

  const iconBgClasses = {
    pending: "bg-[#F3F4F6]",
    warning: "bg-[#FEF3C7]",
    danger: "bg-[#FEE2E2]",
    info: "bg-[#F3F4F6]",
    success: "bg-[#DCFCE7]",
    neutral: "bg-[#F3F4F6]",
  };

  const iconColorClasses = {
    pending: "text-[#6B7280]",
    warning: "text-[#D97706]",
    danger: "text-[#DC2626]",
    info: "text-[#6B7280]",
    success: "text-[#16A34A]",
    neutral: "text-[#6B7280]",
  };

  const skeletonClasses = {
    pending: "bg-[#E5E7EB]",
    warning: "bg-[#FDE68A]",
    danger: "bg-[#FECACA]",
    info: "bg-[#E5E7EB]",
    success: "bg-[#BBF7D0]",
    neutral: "bg-[#E5E7EB]",
  };

  const valueColorClasses = {
    pending: "text-[#111827]",
    warning: "text-[#D97706]",
    danger: "text-[#DC2626]",
    info: "text-[#111827]",
    success: "text-[#16A34A]",
    neutral: "text-[#111827]",
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
