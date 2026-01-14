import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scale, TrendingUp, TrendingDown, ArrowRight, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useSaldoInicial } from '@/hooks/useSaldoInicial';
import { cn } from '@/lib/utils';

interface AjustarSaldoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saldoRealCalculado: number;
  totalReceitas: number;
  totalDespesas: number;
}

export function AjustarSaldoDialog({ 
  open, 
  onOpenChange, 
  saldoRealCalculado,
  totalReceitas,
  totalDespesas,
}: AjustarSaldoDialogProps) {
  const { saldoInicial, atualizarSaldo, isUpdating } = useSaldoInicial();
  const [saldoInformado, setSaldoInformado] = useState('');

  // Reset quando abre o dialog
  useEffect(() => {
    if (open) {
      setSaldoInformado(saldoRealCalculado.toFixed(2));
    }
  }, [open, saldoRealCalculado]);

  const valorInformado = useMemo(() => {
    const parsed = parseFloat(saldoInformado.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }, [saldoInformado]);

  const diferenca = useMemo(() => {
    return valorInformado - saldoRealCalculado;
  }, [valorInformado, saldoRealCalculado]);

  // Novo saldo inicial = saldoInformado - totalReceitas + totalDespesas
  const novoSaldoInicial = useMemo(() => {
    return valorInformado - totalReceitas + totalDespesas;
  }, [valorInformado, totalReceitas, totalDespesas]);

  const handleSave = async () => {
    await atualizarSaldo(novoSaldoInicial);
    onOpenChange(false);
  };

  const temDiferenca = Math.abs(diferenca) >= 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Ajustar Saldo Real
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Saldo calculado pelo sistema */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">
              Saldo calculado pelo sistema
            </Label>
            <div className="p-3 bg-muted/50 rounded-lg">
              <span className={cn(
                "text-xl font-semibold",
                saldoRealCalculado >= 0 ? "text-emerald-600" : "text-red-600"
              )}>
                {formatCurrency(saldoRealCalculado)}
              </span>
            </div>
          </div>

          {/* Input para saldo real */}
          <div className="space-y-2">
            <Label htmlFor="saldo-real">
              Saldo real atual (extrato bancário)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="saldo-real"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={saldoInformado}
                onChange={(e) => setSaldoInformado(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Informe o saldo que consta no seu extrato bancário
            </p>
          </div>

          {/* Feedback da diferença */}
          {temDiferenca && (
            <div className={cn(
              "p-4 rounded-lg border",
              diferenca > 0 
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" 
                : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
            )}>
              <div className="flex items-center gap-2 mb-2">
                {diferenca > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className="font-medium">
                  Diferença: {diferenca > 0 ? '+' : ''}{formatCurrency(diferenca)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {diferenca > 0 
                  ? "Você tem mais dinheiro do que o sistema calculou"
                  : "Você tem menos dinheiro do que o sistema calculou"
                }
              </p>
            </div>
          )}

          {/* Explicação do ajuste */}
          {temDiferenca && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">O que será ajustado:</p>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Saldo base: {formatCurrency(saldoInicial)}</span>
                    <ArrowRight className="w-4 h-4" />
                    <span className="font-medium text-primary">
                      {formatCurrency(novoSaldoInicial)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button 
            onClick={handleSave}
            disabled={isUpdating || !temDiferenca}
            className="gradient-primary"
          >
            {isUpdating ? 'Ajustando...' : 'Ajustar Saldo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
