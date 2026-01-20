import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DemoBannerProps {
  className?: string;
}

export function DemoBanner({ className }: DemoBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div 
      className={`bg-warning/15 border-b border-warning/30 px-4 py-2 flex items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
        <span className="text-foreground">
          <strong>Conta demonstrativa</strong> — Os dados são fictícios e resetados periodicamente.
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-warning hover:text-foreground hover:bg-warning/20"
        onClick={() => setDismissed(true)}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
