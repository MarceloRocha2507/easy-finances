import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ParcelaFatura, excluirCompra } from "@/services/compras-cartao";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle } from "lucide-react";

interface Props {
  parcela: ParcelaFatura | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function ExcluirCompraDialog({
  parcela,
  open,
  onOpenChange,
  onDeleted,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleExcluir() {
    if (!parcela) return;

    setLoading(true);
    try {
      await excluirCompra(parcela.compra_id);
      toast({ title: "Compra excluída!" });
      onDeleted();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao excluir",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!parcela) return null;

  const temParcelas = parcela.total_parcelas > 1;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Excluir compra?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Você está prestes a excluir a compra{" "}
                <strong>"{parcela.descricao}"</strong>.
              </p>

              {temParcelas && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Esta compra possui <strong>{parcela.total_parcelas} parcelas</strong>.
                    Todas as parcelas serão excluídas.
                  </p>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleExcluir}
            disabled={loading}
          >
            {loading ? "Excluindo..." : "Excluir compra"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}