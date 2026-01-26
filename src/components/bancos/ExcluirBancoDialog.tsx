import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Banco, useExcluirBanco } from "@/services/bancos";
import { Building2 } from "lucide-react";

interface ExcluirBancoDialogProps {
  banco: Banco | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ExcluirBancoDialog({
  banco,
  open,
  onOpenChange,
  onConfirm,
}: ExcluirBancoDialogProps) {
  const excluirBanco = useExcluirBanco();

  const handleConfirm = async () => {
    if (!banco) return;
    await excluirBanco.mutateAsync(banco.id);
    onConfirm();
    onOpenChange(false);
  };

  if (!banco) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Desativar banco?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div
              className="p-3 rounded-lg flex items-center gap-3"
              style={{ backgroundColor: `${banco.cor}15` }}
            >
              <Building2 className="h-5 w-5" style={{ color: banco.cor }} />
              <span className="font-medium" style={{ color: banco.cor }}>
                {banco.nome}
              </span>
            </div>
            <p>
              O banco será desativado e não aparecerá mais nas seleções.
              Os cartões vinculados continuarão funcionando normalmente.
            </p>
            <p className="text-sm">
              Você pode reativar o banco a qualquer momento.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={excluirBanco.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {excluirBanco.isPending ? "Desativando..." : "Desativar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
