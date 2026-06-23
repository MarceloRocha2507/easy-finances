import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Banknote, AlertCircle, Loader2, Info, HelpCircle } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const queryClient = useQueryClient();
  const [valor, setValor] = useState("");
  const [observacao, setObservacao] = useState("");
  const [marcarParcelas, setMarcarParcelas] = useState(false);
  const [desconsiderarCaixa, setDesconsiderarCaixa] = useState(false);
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
        desconsiderarCaixa: desconsiderarCaixa,
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
                queryClient.invalidateQueries({ queryKey: ["complete-stats"], refetchType: "active" });
                queryClient.invalidateQueries({ queryKey: ["dashboard-completo"], refetchType: "active" });
                queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
                queryClient.invalidateQueries({ queryKey: ["faturas-na-listagem"], refetchType: "active" });
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
      setDesconsiderarCaixa(false);
      
      onSuccess();
      queryClient.invalidateQueries({ queryKey: ["complete-stats"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["dashboard-completo"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
      queryClient.invalidateQueries({ queryKey: ["faturas-na-listagem"], refetchType: "active" });
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
      setDesconsiderarCaixa(false);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 pb-4 bg-muted border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-muted-foreground" />
              Adiantar Fatura
            </DialogTitle>
            <DialogDescription className="capitalize">
              {cartao.nome} - {mesLabel}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-4 sm:px-5 pb-4 pt-4 overflow-y-auto">
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
          
          {/* Nova opção: desconsiderar do caixa (não registrar como despesa) */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-amber-100 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-900/10">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="desconsiderar-caixa" className="cursor-pointer text-amber-900 dark:text-amber-200">
                  Desconsiderar do caixa
                </Label>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button className="text-amber-500 hover:text-amber-600">
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">Se ativado, este adiantamento reduzirá o valor da fatura mas NÃO será contado como uma despesa no seu saldo real do mês.</p>
                  </TooltipContent>
                </UITooltip>
              </div>
              <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70">
                Útil quando o saldo real já está zerado ou o dinheiro não saiu da conta principal.
              </p>
            </div>
            <Switch
              id="desconsiderar-caixa"
              checked={desconsiderarCaixa}
              onCheckedChange={setDesconsiderarCaixa}
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
