import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard } from "lucide-react";

import { criarCompraParcelada } from "@/services/transactions";
import { Cartao } from "@/services/cartoes";

interface Props {
  cartao: Cartao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function NovaCompraCartaoDialog({
  cartao,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const { toast } = useToast();

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState<number>(0);
  const [parcelas, setParcelas] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // valor por parcela (apenas para preview)
  const valorParcela =
    parcelas > 0 ? Number((valor / parcelas).toFixed(2)) : valor;

  async function salvar() {
    if (loading) return;

    try {
      setLoading(true);

      await criarCompraParcelada({
        cartaoId: cartao.id,
        descricao: descricao.trim(),
        valorTotal: Number(valor),
        parcelas,
        diaFechamento: cartao.dia_fechamento,
      });

      toast({
        title: "Compra registrada",
        description:
          parcelas > 1
            ? `Compra parcelada em ${parcelas}x de R$ ${valorParcela.toFixed(
                2
              )}`
            : "Compra adicionada à fatura atual",
      });

      // limpa formulário
      setDescricao("");
      setValor(0);
      setParcelas(1);

      onOpenChange(false);
      onSaved();
    } catch (error: any) {
      console.error("Erro ao registrar compra:", error);

      toast({
        title: "Erro ao registrar compra",
        description:
          error?.message ||
          error?.error_description ||
          "Não foi possível registrar a compra no cartão.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const disabled =
    loading ||
    !descricao.trim() ||
    valor <= 0 ||
    parcelas < 1 ||
    parcelas > 24;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-indigo-300" />
              </div>
              Nova compra
            </DialogTitle>

            <DialogDescription className="text-slate-300">
              Registrar compra no cartão{" "}
              <strong>{cartao.nome}</strong>
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-5">
          <Input
            placeholder="Descrição da compra"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          <Input
            type="number"
            inputMode="decimal"
            placeholder="Valor total (R$)"
            value={valor}
            onChange={(e) => setValor(Number(e.target.value))}
          />

          {/* Parcelamento */}
          <div>
            <label className="text-sm font-medium">
              Parcelamento
            </label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={parcelas}
              onChange={(e) =>
                setParcelas(Number(e.target.value))
              }
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}x
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          {valor > 0 && (
            <div className="rounded-xl bg-slate-50 border p-4 text-sm">
              {parcelas === 1 ? (
                <p>
                  Compra à vista de{" "}
                  <strong>R$ {valor.toFixed(2)}</strong>
                </p>
              ) : (
                <p>
                  {parcelas}x de{" "}
                  <strong>
                    R$ {valorParcela.toFixed(2)}
                  </strong>{" "}
                  <span className="text-muted-foreground">
                    (total R$ {valor.toFixed(2)})
                  </span>
                </p>
              )}
            </div>
          )}

          <Button
            className="w-full"
            onClick={salvar}
            disabled={disabled}
          >
            {loading ? "Salvando..." : "Salvar compra"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
