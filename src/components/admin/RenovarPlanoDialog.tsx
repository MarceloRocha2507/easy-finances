import { useState } from "react";
import { AdminUser, TipoPlano } from "@/hooks/useAdmin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw } from "lucide-react";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RenovarPlanoDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (user_id: string, tipo_plano: TipoPlano) => Promise<void>;
}

const planosDias: Record<TipoPlano, number | null> = {
  teste: 7,
  mensal: 30,
  anual: 365,
  ilimitado: null,
};

export function RenovarPlanoDialog({ user, open, onOpenChange, onConfirm }: RenovarPlanoDialogProps) {
  const [tipoPlano, setTipoPlano] = useState<TipoPlano>("mensal");
  const [isLoading, setIsLoading] = useState(false);

  const novaExpiracao = planosDias[tipoPlano] 
    ? format(addDays(new Date(), planosDias[tipoPlano]!), "dd/MM/yyyy", { locale: ptBR })
    : "Sem limite";

  async function handleConfirm() {
    if (!user) return;
    setIsLoading(true);
    try {
      await onConfirm(user.id, tipoPlano);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Renovar Plano
          </DialogTitle>
          <DialogDescription>
            Renovar o plano de <strong>{user.full_name || user.email}</strong>. 
            A nova validade será calculada a partir de hoje.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Novo Plano</Label>
            <Select value={tipoPlano} onValueChange={(v) => setTipoPlano(v as TipoPlano)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teste">Período de Teste (7 dias)</SelectItem>
                <SelectItem value="mensal">Mensal (30 dias)</SelectItem>
                <SelectItem value="anual">Anual (365 dias)</SelectItem>
                <SelectItem value="ilimitado">Ilimitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-md bg-muted">
            <p className="text-sm text-muted-foreground">Nova validade:</p>
            <p className="text-lg font-semibold">{novaExpiracao}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Renovar Plano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
