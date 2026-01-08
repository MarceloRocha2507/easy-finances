import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Key, Copy, Check, AlertTriangle } from "lucide-react";
import type { AdminUser } from "@/hooks/useAdmin";

interface ResetarSenhaDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: (user_id: string) => Promise<string>;
}

export function ResetarSenhaDialog({ user, open, onOpenChange, onReset }: ResetarSenhaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleReset() {
    if (!user) return;

    setIsLoading(true);
    try {
      const password = await onReset(user.id);
      setNewPassword(password);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopy() {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      setNewPassword(null);
      setCopied(false);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Resetar Senha
          </DialogTitle>
          <DialogDescription>
            {newPassword 
              ? "A nova senha foi gerada. Copie e envie para o usuário."
              : `Você está prestes a resetar a senha de ${user?.email}.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {!newPassword ? (
            <>
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-3 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Uma nova senha será gerada automaticamente. Você precisará informá-la ao usuário.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => handleClose(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleReset} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Gerar Nova Senha
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Nova senha</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPassword}
                    readOnly
                    className="font-mono"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Senha resetada com sucesso! Lembre-se de informar a nova senha ao usuário.
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => handleClose(false)}>
                  Fechar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
