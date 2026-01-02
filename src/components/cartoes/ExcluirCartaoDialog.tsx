import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cartao, excluirCartao } from "@/services/cartoes";

type Props = {
  cartao: Cartao | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
};

export function ExcluirCartaoDialog({
  cartao,
  open,
  onOpenChange,
  onDeleted,
}: Props) {
  async function handleExcluir() {
    if (!cartao) return;

    try {
      await excluirCartao(cartao.id);
      onDeleted();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir cartão");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir cartão</DialogTitle>
          <DialogDescription>
            {cartao ? (
              <>
                Tem certeza que deseja excluir o cartão{" "}
                <strong>{cartao.nome}</strong>?
                <br />
                <span className="text-destructive font-semibold">
                  Essa ação não pode ser desfeita.
                </span>
              </>
            ) : (
              "Nenhum cartão selecionado."
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>

          <Button
            variant="destructive"
            onClick={handleExcluir}
            disabled={!cartao}
          >
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
