import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface StatCardSecondaryProps {
  title: string;
  value: number;
  icon: LucideIcon;
  status: "pending" | "warning" | "danger" | "info";
  subInfo?: string;
  delay?: number;
  onClick?: () => void;
  prefix?: string;
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
}: StatCardSecondaryProps) {
  const borderClasses = {
    pending: "border-l-4 border-l-blue-500",
    warning: "border-l-4 border-l-amber-500",
    danger: "border-l-4 border-l-red-500",
    info: "border-l-4 border-l-purple-500",
  };

  const iconBgClasses = {
    pending: "bg-blue-100 dark:bg-blue-950",
    warning: "bg-amber-100 dark:bg-amber-950",
    danger: "bg-red-100 dark:bg-red-950",
    info: "bg-purple-100 dark:bg-purple-950",
  };

  const iconColorClasses = {
    pending: "text-blue-600",
    warning: "text-amber-600",
    danger: "text-red-600",
    info: "text-purple-600",
  };

  const valueColorClasses = {
    pending: "text-blue-600",
    warning: "text-amber-600",
    danger: "text-red-600",
    info: "text-purple-600",
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
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className={cn("text-xl font-semibold", valueColorClasses[status])}>
              {prefix}{formatCurrency(value)}
            </p>
            {subInfo && (
              <p className="text-xs text-muted-foreground mt-1">{subInfo}</p>
            )}
          </div>
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              iconBgClasses[status]
            )}
          >
            <Icon className={cn("w-5 h-5", iconColorClasses[status])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
