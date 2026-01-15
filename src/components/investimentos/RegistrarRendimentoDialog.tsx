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
import { CalendarIcon, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";

interface RegistrarRendimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investimento: Investimento | null;
}

export function RegistrarRendimentoDialog({
  open,
  onOpenChange,
  investimento,
}: RegistrarRendimentoDialogProps) {
  const [valor, setValor] = useState("");
  const [data, setData] = useState<Date>(new Date());
  const [observacao, setObservacao] = useState("");

  const criarMovimentacao = useCriarMovimentacao();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!investimento || !valor) return;

    await criarMovimentacao.mutateAsync({
      investimentoId: investimento.id,
      tipo: "rendimento",
      valor: parseFloat(valor.replace(",", ".")),
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

  if (!investimento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Registrar Rendimento
          </DialogTitle>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-sm text-muted-foreground">Investimento</p>
          <p className="font-semibold">{investimento.nome}</p>
          <p className="text-sm text-muted-foreground">
            Saldo atual: {formatCurrency(investimento.valorAtual)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor do rendimento *</Label>
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
            <p className="text-xs text-muted-foreground">
              Informe o rendimento acumulado desde a última atualização.
            </p>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label>Data de referência</Label>
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
              placeholder="Ex: Rendimento de janeiro..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
            />
          </div>

          {/* Novo saldo */}
          {valor && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Novo saldo após rendimento:
              </p>
              <p className="font-bold text-blue-700 dark:text-blue-400">
                {formatCurrency(
                  investimento.valorAtual +
                    parseFloat(valor.replace(",", ".") || "0")
                )}
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
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={criarMovimentacao.isPending}
            >
              {criarMovimentacao.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Registrar rendimento"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
