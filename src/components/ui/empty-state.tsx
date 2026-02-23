import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-xl border border-dashed">
      <Icon className="h-12 w-12 text-muted-foreground/40 mb-4" strokeWidth={1.5} />
      {title && (
        <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      )}
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">{message}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
