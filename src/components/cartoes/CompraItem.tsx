import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { Transaction } from "@/services/transactions";

export function CompraItem({
  compra,
  onEdit,
  onDelete,
}: {
  compra: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span>{compra.description}</span>
      <div className="flex items-center gap-2">
        <span>R$ {compra.amount.toFixed(2)}</span>
        <Button size="icon" variant="ghost" onClick={onEdit}>
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive"
          onClick={onDelete}
        >
          <Trash className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
