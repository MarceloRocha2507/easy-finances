import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { excluirFaturaDoMes } from "@/services/compras-cartao";
import { formatCurrency } from "@/lib/formatters";

interface ExcluirFaturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartaoId: string;
  cartaoNome: string;
  mesReferencia: Date;
  totalParcelas: number;
  valorTotal: number;
  onSuccess: () => void;
}

export function ExcluirFaturaDialog({
  open,
  onOpenChange,
  cartaoId,
  cartaoNome,
  mesReferencia,
  totalParcelas,
  valorTotal,
  onSuccess,
}: ExcluirFaturaDialogProps) {
  const [confirmacao, setConfirmacao] = useState("");
  const [loading, setLoading] = useState(false);

  const mesLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(mesReferencia);

  const textoConfirmacao = "EXCLUIR";

  async function handleExcluir() {
    if (confirmacao !== textoConfirmacao) {
      toast.error(`Digite "${textoConfirmacao}" para confirmar`);
      return;
    }

    setLoading(true);
    try {
      const resultado = await excluirFaturaDoMes(cartaoId, mesReferencia);
      
      toast.success(
        `Fatura excluída! ${resultado.parcelasExcluidas} parcelas e ${resultado.comprasExcluidas} compras removidas.`
      );
      setConfirmacao("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir fatura");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Fatura Inteira
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Você está prestes a excluir <strong>TODAS</strong> as compras da fatura de{" "}
                <strong className="capitalize">{mesLabel}</strong> do cartão{" "}
                <strong>{cartaoNome}</strong>.
              </p>
              
              <div className="p-3 bg-destructive/10 rounded-lg space-y-1 text-sm">
                <p><strong>{totalParcelas}</strong> parcelas serão excluídas</p>
                <p>Total: <strong className="text-destructive">{formatCurrency(valorTotal)}</strong></p>
              </div>

              <div className="p-3 bg-amber-100 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  ⚠️ Atenção: Esta ação também excluirá as compras originais e suas parcelas em outros meses!
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmacao">
                  Digite <strong>{textoConfirmacao}</strong> para confirmar:
                </Label>
                <Input
                  id="confirmacao"
                  value={confirmacao}
                  onChange={(e) => setConfirmacao(e.target.value.toUpperCase())}
                  placeholder={textoConfirmacao}
                  className="font-mono"
                  disabled={loading}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} onClick={() => setConfirmacao("")}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleExcluir}
            disabled={loading || confirmacao !== textoConfirmacao}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir Fatura"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
