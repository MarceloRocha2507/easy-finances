import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2 } from "lucide-react";
import type { AdminUser } from "@/hooks/useAdmin";

interface ExcluirUsuarioDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (user_id: string) => Promise<void>;
}

export function ExcluirUsuarioDialog({ user, open, onOpenChange, onConfirm }: ExcluirUsuarioDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const canConfirm = confirmText === "EXCLUIR";

  async function handleConfirm() {
    if (!user || !canConfirm) return;
    setIsLoading(true);
    try {
      await onConfirm(user.id);
      setConfirmText("");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose(v: boolean) {
    if (!v) setConfirmText("");
    onOpenChange(v);
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir Usuário
          </DialogTitle>
          <DialogDescription>
            Esta ação é <strong>irreversível</strong>. Todos os dados de <strong>{user.full_name || user.email}</strong> serão permanentemente removidos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Digite <strong>EXCLUIR</strong> para confirmar:
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="EXCLUIR"
            className="font-mono"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>Cancelar</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isLoading || !canConfirm}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Excluir Permanentemente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
