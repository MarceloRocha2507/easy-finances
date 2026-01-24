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
import { Switch } from "@/components/ui/switch";
import { CalculatorPopover } from "@/components/ui/calculator-popover";
import { formatCurrency } from "@/lib/formatters";
import { Cartao } from "@/services/cartoes";
import { 
  adiantarFatura, 
  desfazerAdiantamento, 
  AdiantarFaturaResult 
} from "@/services/compras-cartao";
import { Banknote, AlertCircle, Loader2, Info } from "lucide-react";
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
  const [marcarParcelas, setMarcarParcelas] = useState(false);
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
      const result = await adiantarFatura({
        cartaoId: cartao.id,
        nomeCartao: cartao.nome,
        mesReferencia,
        valorAdiantamento: valorNumerico,
        observacao: observacao.trim() || undefined,
        marcarParcelasComoPagas: marcarParcelas,
      });

      // Toast com opção de desfazer
      toast.success(
        `Adiantamento de ${formatCurrency(valorNumerico)} registrado!`,
        {
          description: marcarParcelas && result.parcelasMarcardasPagas.length > 0
            ? `${result.parcelasMarcardasPagas.length} parcela(s) marcada(s) como paga(s).`
            : "O crédito foi aplicado na fatura.",
          action: {
            label: "Desfazer",
            onClick: async () => {
              try {
                await desfazerAdiantamento(result);
                toast.success("Adiantamento desfeito com sucesso!");
                onSuccess();
              } catch (error) {
                console.error("Erro ao desfazer adiantamento:", error);
                toast.error("Erro ao desfazer adiantamento");
              }
            },
          },
          duration: 8000,
        }
      );
      
      // Reset form
      setValor("");
      setObservacao("");
      setMarcarParcelas(false);
      
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
      setMarcarParcelas(false);
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

          {/* Opção avançada: marcar parcelas como pagas */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="marcar-parcelas" className="cursor-pointer">
                Marcar compras como pagas
              </Label>
              <p className="text-xs text-muted-foreground">
                Marca parcelas da mais antiga para a mais recente
              </p>
            </div>
            <Switch
              id="marcar-parcelas"
              checked={marcarParcelas}
              onCheckedChange={setMarcarParcelas}
            />
          </div>

          {/* Alerta informativo */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              O adiantamento cria uma <strong>despesa no saldo real</strong> e 
              aplica um <strong>crédito na fatura</strong> reduzindo o valor pendente.
              {marcarParcelas && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                  ⚠️ Compras marcadas como pagas sairão do filtro "Pendentes".
                </span>
              )}
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
