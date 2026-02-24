import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { APP_VERSION, CHANGELOG, type ChangeType } from "@/lib/version";

const STORAGE_KEY = "app_last_seen_version";

const typeBadge: Record<ChangeType, { label: string; className: string }> = {
  feature: { label: "Novo", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" },
  fix: { label: "Correção", className: "bg-destructive/15 text-destructive border-destructive/20" },
  improvement: { label: "Melhoria", className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
};

export function WhatsNewDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const lastSeen = localStorage.getItem(STORAGE_KEY);
    if (lastSeen !== APP_VERSION) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, APP_VERSION);
    setIsOpen(false);
  };

  const latest = CHANGELOG[0];
  if (!latest) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="text-lg">O que há de novo</DialogTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="text-xs font-mono">v{latest.version}</Badge>
            <span>{new Date(latest.date).toLocaleDateString("pt-BR")}</span>
          </div>
          <p className="text-sm font-medium text-foreground pt-1">{latest.title}</p>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {latest.changes.map((change, i) => {
            const badge = typeBadge[change.type];
            return (
              <div key={i} className="flex items-start gap-2.5">
                <Badge variant="outline" className={`text-[10px] mt-0.5 shrink-0 ${badge.className}`}>
                  {badge.label}
                </Badge>
                <span className="text-sm text-foreground">{change.description}</span>
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2">
          <Button onClick={handleClose} className="w-full">Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
