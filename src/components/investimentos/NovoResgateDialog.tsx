import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Investimento, useCriarMovimentacao } from "@/hooks/useInvestimentos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, Minus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface NovoResgateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investimento: Investimento | null;
}

export function NovoResgateDialog({
  open,
  onOpenChange,
  investimento,
}: NovoResgateDialogProps) {
  const [valor, setValor] = useState("");
  const [data, setData] = useState<Date>(new Date());
  const [observacao, setObservacao] = useState("");

  const criarMovimentacao = useCriarMovimentacao();

  const valorNumerico = parseFloat(valor.replace(",", ".") || "0");
  const novoSaldo = investimento
    ? Math.max(0, investimento.valorAtual - valorNumerico)
    : 0;
  const resgateTotal = investimento && valorNumerico >= investimento.valorAtual;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!investimento || !valor) return;

    await criarMovimentacao.mutateAsync({
      investimentoId: investimento.id,
      tipo: "resgate",
      valor: valorNumerico,
      data,
      observacao: observacao.trim() || undefined,
    });

    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setValor("");
    setData(new Date());
    setObservacao("");
  };

  const handleResgatarTudo = () => {
    if (investimento) {
      setValor(investimento.valorAtual.toString().replace(".", ","));
    }
  };

  if (!investimento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Minus className="h-5 w-5 text-orange-600" />
            Registrar Resgate
          </DialogTitle>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-sm text-muted-foreground">Investimento</p>
          <p className="font-semibold">{investimento.nome}</p>
          <p className="text-sm text-muted-foreground">
            Saldo disponível: {formatCurrency(investimento.valorAtual)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Valor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="valor">Valor do resgate *</Label>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={handleResgatarTudo}
              >
                Resgatar tudo
              </Button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                R$
              </span>
              <Input
                id="valor"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="pl-10 text-lg"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label>Data do resgate</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data
                    ? format(data, "dd/MM/yyyy", { locale: ptBR })
                    : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data}
                  onSelect={(date) => date && setData(date)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              placeholder="Opcional..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
            />
          </div>

          {/* Aviso de resgate total */}
          {resgateTotal && (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-200 dark:border-amber-900 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  Resgate total
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  O investimento será marcado como encerrado.
                </p>
              </div>
            </div>
          )}

          {/* Novo saldo */}
          {valor && !resgateTotal && (
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 border border-orange-200 dark:border-orange-900">
              <p className="text-sm text-orange-700 dark:text-orange-400">
                Saldo após resgate:
              </p>
              <p className="font-bold text-orange-700 dark:text-orange-400">
                {formatCurrency(novoSaldo)}
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-600 hover:bg-orange-700"
              disabled={criarMovimentacao.isPending || valorNumerico <= 0}
            >
              {criarMovimentacao.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Registrar resgate"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
