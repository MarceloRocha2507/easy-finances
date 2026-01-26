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
import { BancoComResumo, useAtualizarBanco } from "@/services/bancos";
import { formatCurrency } from "@/lib/formatters";
import { Building2, ArrowRight, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AjustarSaldoBancoDialogProps {
  banco: BancoComResumo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function AjustarSaldoBancoDialog({
  banco,
  open,
  onOpenChange,
  onSaved,
}: AjustarSaldoBancoDialogProps) {
  const atualizarBanco = useAtualizarBanco();
  const { toast } = useToast();

  const [saldoExtrato, setSaldoExtrato] = useState("");
  const [observacao, setObservacao] = useState("");

  if (!banco) return null;

  const saldoExtratoNum = parseFloat(saldoExtrato.replace(/\./g, "").replace(",", ".")) || 0;
  
  // Diferença entre transações (saldoCalculado - saldo_inicial)
  const transacoesVinculadas = banco.saldoCalculado - banco.saldo_inicial;
  
  // Novo saldo inicial = saldo do extrato - transações vinculadas
  const novoSaldoInicial = saldoExtratoNum - transacoesVinculadas;
  
  const diferenca = saldoExtratoNum - banco.saldoCalculado;

  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/[^\d]/g, "");
    if (!numbers) return "";
    const amount = parseInt(numbers, 10) / 100;
    return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSalvar = async () => {
    if (!saldoExtrato) return;

    await atualizarBanco.mutateAsync({
      id: banco.id,
      dados: {
        saldo_inicial: novoSaldoInicial,
      },
    });

    toast({
      title: "Saldo ajustado",
      description: `O saldo da conta ${banco.nome} foi ajustado com sucesso.`,
    });

    setSaldoExtrato("");
    setObservacao("");
    onSaved();
    onOpenChange(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setSaldoExtrato("");
      setObservacao("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Saldo da Conta</DialogTitle>
          <DialogDescription>
            Informe o saldo atual conforme seu extrato bancário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Banco selecionado */}
          <div
            className="p-3 rounded-lg flex items-center gap-3"
            style={{ backgroundColor: `${banco.cor}10` }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${banco.cor}20` }}
            >
              <Building2 className="h-5 w-5" style={{ color: banco.cor }} />
            </div>
            <div>
              <p className="font-medium">{banco.nome}</p>
              <p className="text-sm text-muted-foreground">
                Saldo atual: {formatCurrency(banco.saldoCalculado)}
              </p>
            </div>
          </div>

          {/* Saldo do extrato */}
          <div className="space-y-2">
            <Label htmlFor="saldo_extrato">Saldo no extrato bancário</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                id="saldo_extrato"
                placeholder="0,00"
                className="pl-10 text-lg"
                value={saldoExtrato}
                onChange={(e) => setSaldoExtrato(formatCurrencyInput(e.target.value))}
                autoFocus
              />
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              placeholder="Ex: Ajuste conforme extrato de janeiro..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
            />
          </div>

          {/* Preview do ajuste */}
          {saldoExtrato && (
            <div className="p-4 rounded-lg border bg-secondary/30">
              <div className="flex items-center justify-between mb-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Saldo Atual</p>
                  <p className="font-medium">{formatCurrency(banco.saldoCalculado)}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Novo Saldo</p>
                  <p className="font-medium text-primary">{formatCurrency(saldoExtratoNum)}</p>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Diferença</span>
                  <span className={diferenca >= 0 ? "text-income font-medium" : "text-expense font-medium"}>
                    {diferenca >= 0 ? "+" : ""}{formatCurrency(diferenca)}
                  </span>
                </div>
              </div>

              {Math.abs(diferenca) > 1000 && (
                <div className="flex items-start gap-2 mt-3 p-2 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p className="text-xs">
                    Diferença significativa detectada. Verifique se o valor está correto.
                  </p>
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSalvar}
            disabled={!saldoExtrato || atualizarBanco.isPending}
          >
            {atualizarBanco.isPending ? "Ajustando..." : "Confirmar Ajuste"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
