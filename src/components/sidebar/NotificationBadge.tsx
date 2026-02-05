import React, { memo } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlertasCount } from "@/hooks/useAlertasCount";

interface NotificationBadgeProps {
  onClick?: () => void;
}

export const NotificationBadge = memo(function NotificationBadge({ onClick }: NotificationBadgeProps) {
  const { total: alertasCount, hasDanger, hasWarning } = useAlertasCount();

  // Determina a cor do badge baseado na prioridade: danger > warning > info/success
  const badgeColor = hasDanger 
    ? "bg-destructive" 
    : hasWarning 
      ? "bg-amber-500" 
      : "bg-primary";

  return (
    <Link 
      to="/notificacoes" 
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <Bell className="h-4 w-4 text-muted-foreground" />
      {alertasCount > 0 && (
        <span 
          className={cn(
            "absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full text-[9px] font-bold text-white px-1",
            badgeColor
          )}
        >
          {alertasCount > 9 ? "9+" : alertasCount}
        </span>
      )}
    </Link>
  );
});
