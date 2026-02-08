import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AdminUser, TipoPlano } from "@/hooks/useAdmin";

interface EditarUsuarioDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (user_id: string, data: { email?: string; full_name?: string; tipo_plano?: TipoPlano; dispositivos_extras?: number }) => Promise<void>;
}

const MAX_DISPOSITIVOS_EXTRAS = 5;

const PLANOS = {
  teste: { label: "Período de Teste", dias: 7 },
  mensal: { label: "Mensal", dias: 30 },
  anual: { label: "Anual", dias: 365 },
  ilimitado: { label: "Ilimitado", dias: null },
} as const;

export function EditarUsuarioDialog({ user, open, onOpenChange, onSave }: EditarUsuarioDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [tipoPlano, setTipoPlano] = useState<TipoPlano>("mensal");
  const [dispositivosExtras, setDispositivosExtras] = useState(0);

  useEffect(() => {
    if (user) {
      setEmail(user.email || "");
      setFullName(user.full_name || "");
      setTipoPlano(user.tipo_plano || "mensal");
      setDispositivosExtras((user as any).dispositivos_extras ?? 0);
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      await onSave(user.id, {
        email,
        full_name: fullName,
        tipo_plano: tipoPlano,
        dispositivos_extras: dispositivosExtras,
      });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }

  function getNovaExpiracao() {
    const plano = PLANOS[tipoPlano];
    if (!plano.dias) return "Sem limite";
    const novaData = new Date();
    novaData.setDate(novaData.getDate() + plano.dias);
    return format(novaData, "dd/MM/yyyy", { locale: ptBR });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-full-name">Nome completo</Label>
            <Input
              id="edit-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nome do usuário"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">E-mail</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Plano</Label>
            <Select value={tipoPlano} onValueChange={(v) => setTipoPlano(v as TipoPlano)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teste">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Período de Teste (7 dias)
                  </div>
                </SelectItem>
                <SelectItem value="mensal">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Mensal (30 dias)
                  </div>
                </SelectItem>
                <SelectItem value="anual">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Anual (365 dias)
                  </div>
                </SelectItem>
                <SelectItem value="ilimitado">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Ilimitado
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <p className="text-sm text-muted-foreground">
              Nova expiração: <strong>{getNovaExpiracao()}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-dispositivos">Dispositivos Extras</Label>
            <Input
              id="edit-dispositivos"
              type="number"
              min={0}
              max={MAX_DISPOSITIVOS_EXTRAS}
              value={dispositivosExtras}
              onChange={(e) => setDispositivosExtras(Math.min(MAX_DISPOSITIVOS_EXTRAS, Math.max(0, parseInt(e.target.value) || 0)))}
            />
            <p className="text-sm text-muted-foreground">
              Limite total: <strong>base do plano + {dispositivosExtras} extra(s)</strong>
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
