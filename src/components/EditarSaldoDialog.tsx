import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaldoInicial } from '@/hooks/useSaldoInicial';
import { formatCurrency } from '@/lib/formatters';
import { Wallet } from 'lucide-react';

interface EditarSaldoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditarSaldoDialog({ open, onOpenChange }: EditarSaldoDialogProps) {
  const { saldoInicial, atualizarSaldo, isUpdating } = useSaldoInicial();
  const [valor, setValor] = useState('');

  useEffect(() => {
    if (open) {
      setValor(saldoInicial.toString());
    }
  }, [open, saldoInicial]);

  const handleSave = async () => {
    const novoSaldo = parseFloat(valor.replace(',', '.')) || 0;
    await atualizarSaldo(novoSaldo);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Configurar Saldo Inicial
          </DialogTitle>
          <DialogDescription>
            Informe o saldo atual da sua conta bancária. Este valor será usado como base para todos os cálculos de saldo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="saldo">Saldo Atual na Conta</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                R$
              </span>
              <Input
                id="saldo"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="pl-10"
              />
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> Consulte seu extrato bancário para obter o saldo exato. 
              Este valor serve como ponto de partida para calcular seu saldo real.
            </p>
          </div>

          {saldoInicial > 0 && (
            <div className="text-sm text-muted-foreground">
              Saldo atual configurado: <strong>{formatCurrency(saldoInicial)}</strong>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
