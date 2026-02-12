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
      <DialogContent className="p-0 gap-0 border-0 overflow-hidden [&>button]:text-white [&>button]:hover:text-white/80">
        <div
          className="px-4 sm:px-5 pt-4 pb-4 bg-gradient-to-br from-violet-600 to-indigo-600"
        >
          <DialogHeader>
            <DialogTitle className="text-white">Excluir cartão</DialogTitle>
            <DialogDescription className="text-white/70">
              {cartao ? (
                <>
                  Tem certeza que deseja excluir o cartão{" "}
                  <strong className="text-white">{cartao.nome}</strong>?
                </>
              ) : (
                "Nenhum cartão selecionado."
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-4 sm:px-5 pb-4 pt-2 overflow-y-auto">
          {cartao && (
            <p className="text-destructive font-semibold text-sm mb-4">
              Essa ação não pode ser desfeita.
            </p>
          )}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
