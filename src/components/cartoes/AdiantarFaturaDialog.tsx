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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CalculatorPopover } from "@/components/ui/calculator-popover";
import { formatCurrency } from "@/lib/formatters";
import { Cartao } from "@/services/cartoes";
import { adiantarFatura } from "@/services/compras-cartao";
import { Banknote, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  cartao: Cartao;
  mesReferencia: Date;
  totalPendente: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AdiantarFaturaDialog({
  cartao,
  mesReferencia,
  totalPendente,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const [valor, setValor] = useState("");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);

  // Formatar mês
  const mesLabel = mesReferencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // Parsear valor
  function parseValor(str: string): number {
    const cleaned = str.replace(/[^\d,.-]/g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  }

  const valorNumerico = parseValor(valor);
  const valorValido = valorNumerico > 0 && valorNumerico <= totalPendente;

  async function handleConfirmar() {
    if (!valorValido) {
      toast.error("Valor inválido");
      return;
    }

    setLoading(true);
    try {
      await adiantarFatura({
        cartaoId: cartao.id,
        nomeCartao: cartao.nome,
        mesReferencia,
        valorAdiantamento: valorNumerico,
        observacao: observacao.trim() || undefined,
      });

      toast.success(`Adiantamento de ${formatCurrency(valorNumerico)} registrado!`);
      
      // Reset form
      setValor("");
      setObservacao("");
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao adiantar fatura:", error);
      toast.error("Erro ao registrar adiantamento");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setValor("");
      setObservacao("");
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Adiantar Fatura
          </DialogTitle>
          <DialogDescription className="capitalize">
            {cartao.nome} - {mesLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Valor pendente */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Valor pendente
              </span>
              <span className="text-xl font-bold text-destructive">
                {formatCurrency(totalPendente)}
              </span>
            </div>
          </div>

          <Separator />

          {/* Valor do adiantamento */}
          <div className="space-y-2">
            <Label htmlFor="valor-adiantamento">Valor do adiantamento (R$)</Label>
            <div className="flex gap-2">
              <Input
                id="valor-adiantamento"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="flex-1"
              />
              <CalculatorPopover
                onResult={(result) => {
                  setValor(result.toFixed(2).replace(".", ","));
                }}
              />
            </div>
            {valor && !valorValido && (
              <p className="text-xs text-destructive">
                {valorNumerico > totalPendente
                  ? "Valor maior que o pendente"
                  : "Informe um valor válido"}
              </p>
            )}
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao-adiantamento">
              Observação (opcional)
            </Label>
            <Textarea
              id="observacao-adiantamento"
              placeholder="Ex: Adiantamento parcial"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
            />
          </div>

          {/* Alerta */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Isso criará uma despesa de{" "}
              <strong>{formatCurrency(valorNumerico || 0)}</strong> no seu saldo
              real e marcará as parcelas como pagas (da mais antiga para a mais
              recente).
            </p>
          </div>

          {/* Resumo */}
          {valorValido && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor pendente atual</span>
                <span>{formatCurrency(totalPendente)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Adiantamento</span>
                <span className="text-emerald-600">
                  - {formatCurrency(valorNumerico)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-medium">Restante após adiantamento</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(totalPendente - valorNumerico)}
                </span>
              </div>
            </div>
          )}

          {/* Botão de confirmação */}
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleConfirmar}
            disabled={loading || !valorValido}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Banknote className="h-4 w-4" />
            )}
            Confirmar Adiantamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
