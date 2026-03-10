import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, CreditCard, Building2, ArrowRightLeft, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AdminUser } from "@/hooks/useAdmin";
import type { UserDetails } from "@/hooks/useAdmin";

interface DetalhesUsuarioDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFetchDetails: (user_id: string) => Promise<UserDetails>;
}

export function DetalhesUsuarioDialog({ user, open, onOpenChange, onFetchDetails }: DetalhesUsuarioDialogProps) {
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setIsLoading(true);
      setDetails(null);
      onFetchDetails(user.id).then(setDetails).catch(console.error).finally(() => setIsLoading(false));
    }
  }, [open, user]);

  if (!user) return null;

  const items = [
    { icon: ArrowRightLeft, label: "Transações", value: details?.total_transacoes ?? "-" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
          <DialogDescription>{user.full_name || user.email}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {items.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-lg bg-muted p-3 text-center">
                  <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-muted p-3 flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Último acesso</p>
                <p className="font-medium">
                  {details?.last_sign_in_at
                    ? format(new Date(details.last_sign_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : "Nunca acessou"}
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
