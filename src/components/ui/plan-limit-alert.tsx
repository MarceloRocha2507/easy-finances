import { AlertCircle, Crown, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PlanLimitAlertProps {
  recurso: string;
  usado: number;
  limite: number;
  showProgress?: boolean;
  compact?: boolean;
  onUpgrade?: () => void;
}

export function PlanLimitAlert({
  recurso,
  usado,
  limite,
  showProgress = true,
  compact = false,
  onUpgrade,
}: PlanLimitAlertProps) {
  const isUnlimited = limite === Infinity;
  const isLimitReached = !isUnlimited && usado >= limite;
  const percentage = isUnlimited ? 0 : Math.min(100, (usado / limite) * 100);
  const isNearLimit = percentage >= 80 && !isLimitReached;

  if (isUnlimited) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-sm px-3 py-1.5 rounded-md",
        isLimitReached 
          ? "bg-destructive/10 text-destructive" 
          : isNearLimit 
            ? "bg-warning/10 text-warning" 
            : "bg-muted text-muted-foreground"
      )}>
        {isLimitReached ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          <AlertCircle className="h-3.5 w-3.5" />
        )}
        <span>
          {recurso}: {usado}/{limite}
          {isLimitReached && " (limite atingido)"}
        </span>
      </div>
    );
  }

  return (
    <Alert 
      variant={isLimitReached ? "destructive" : "default"}
      className={cn(
        "border",
        isLimitReached 
          ? "border-destructive/50 bg-destructive/10" 
          : isNearLimit 
            ? "border-warning/50 bg-warning/10" 
            : "border-muted"
      )}
    >
      <div className="flex items-start gap-3 w-full">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isLimitReached 
            ? "bg-destructive/20 text-destructive" 
            : "bg-primary/20 text-primary"
        )}>
          {isLimitReached ? (
            <Lock className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
        </div>
        
        <div className="flex-1 space-y-2">
          <AlertDescription className="text-foreground font-medium">
            {isLimitReached 
              ? `Limite de ${recurso} atingido` 
              : `Uso de ${recurso}`}
          </AlertDescription>
          
          {showProgress && (
            <div className="space-y-1">
              <Progress 
                value={percentage} 
                className={cn(
                  "h-2",
                  isLimitReached && "[&>div]:bg-destructive",
                  isNearLimit && "[&>div]:bg-warning"
                )}
              />
              <p className="text-xs text-muted-foreground">
                {usado} de {limite} {recurso} utilizados
              </p>
            </div>
          )}
          
          {isLimitReached && onUpgrade && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onUpgrade}
              className="mt-2"
            >
              <Crown className="h-3.5 w-3.5 mr-1.5" />
              Fazer upgrade
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}

interface PlanLimitBadgeProps {
  usado: number;
  limite: number;
  className?: string;
}

export function PlanLimitBadge({ usado, limite, className }: PlanLimitBadgeProps) {
  const isUnlimited = limite === Infinity;
  const isLimitReached = !isUnlimited && usado >= limite;
  const percentage = isUnlimited ? 0 : (usado / limite) * 100;
  const isNearLimit = percentage >= 80 && !isLimitReached;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      isLimitReached 
        ? "bg-destructive/10 text-destructive" 
        : isNearLimit 
          ? "bg-warning/10 text-warning" 
          : "bg-muted text-muted-foreground",
      className
    )}>
      {isLimitReached && <Lock className="h-3 w-3" />}
      {isUnlimited ? `${usado} (∞)` : `${usado}/${limite}`}
    </span>
  );
}
