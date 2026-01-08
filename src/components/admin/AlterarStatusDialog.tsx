import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import type { AdminUser } from "@/hooks/useAdmin";

interface AlterarStatusDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (user_id: string, ativo: boolean, motivo?: string) => Promise<void>;
}

export function AlterarStatusDialog({ user, open, onOpenChange, onConfirm }: AlterarStatusDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [motivo, setMotivo] = useState("");

  const isDesativando = user?.ativo === true;

  async function handleConfirm() {
    if (!user) return;
    if (isDesativando && !motivo.trim()) return;

    setIsLoading(true);
    try {
      await onConfirm(user.id, !user.ativo, isDesativando ? motivo : undefined);
      setMotivo("");
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDesativando ? (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Desativar Usuário
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Reativar Usuário
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isDesativando
              ? `Você está prestes a desativar o acesso de ${user?.email}. O usuário não conseguirá mais fazer login.`
              : `Você está prestes a reativar o acesso de ${user?.email}. O usuário poderá fazer login novamente.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {isDesativando && (
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da desativação *</Label>
              <Textarea
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Informe o motivo da desativação..."
                rows={3}
              />
            </div>
          )}

          {!isDesativando && user?.motivo_desativacao && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Motivo anterior da desativação:</strong><br />
                {user.motivo_desativacao}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={isLoading || (isDesativando && !motivo.trim())}
              variant={isDesativando ? "destructive" : "default"}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isDesativando ? "Desativar" : "Reativar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
