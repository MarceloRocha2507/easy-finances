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
import { useAssinaturas, Assinatura } from "@/hooks/useAssinaturas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assinatura: Assinatura | null;
}

export function ExcluirAssinaturaDialog({ open, onOpenChange, assinatura }: Props) {
  const { excluir } = useAssinaturas();

  if (!assinatura) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-xl max-h-[90vh]">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir assinatura</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir <strong>{assinatura.nome}</strong>? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => excluir.mutate(assinatura.id, { onSuccess: () => onOpenChange(false) })}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
