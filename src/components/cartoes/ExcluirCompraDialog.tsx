import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { excluirCompraCartao } from "@/services/transactions";

interface Props {
  compra: {
    compra_id: string;      // ✅ ID DA COMPRA (OBRIGATÓRIO)
    descricao?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function ExcluirCompraDialog({
  compra,
  open,
  onOpenChange,
  onDeleted,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (loading) return;

    try {
      setLoading(true);

      // 🔑 EXCLUI A COMPRA (PAI)
      await excluirCompraCartao(compra.compra_id);

      toast({
        title: "Compra excluída",
        description: "A compra e todas as parcelas foram removidas.",
      });

      onDeleted();
    } catch (error) {
      console.error("Erro ao excluir compra:", error);

      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a compra.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir compra</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja excluir esta compra?
          <br />
          <strong>Todas as parcelas serão removidas.</strong>
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
