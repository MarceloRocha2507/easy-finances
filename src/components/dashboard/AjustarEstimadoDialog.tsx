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
import { useAjusteEstimado } from '@/hooks/useAjusteEstimado';
import { formatCurrency } from '@/lib/formatters';
import { Calculator } from 'lucide-react';

interface AjustarEstimadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseCurrencyInput(value: string): number {
  const normalized = value.trim();
  if (!normalized) return 0;

  if (normalized.includes(',')) {
    return parseFloat(normalized.replace(/\./g, '').replace(',', '.')) || 0;
  }

  return parseFloat(normalized) || 0;
}

export function AjustarEstimadoDialog({ open, onOpenChange }: AjustarEstimadoDialogProps) {
  const { ajusteEstimado, atualizarAjuste, isUpdating } = useAjusteEstimado();
  const [valor, setValor] = useState('');

  useEffect(() => {
    if (open) {
      setValor(ajusteEstimado.toFixed(2).replace('.', ','));
    }
  }, [open, ajusteEstimado]);

  const handleSave = async () => {
    const novoAjuste = parseCurrencyInput(valor);
    await atualizarAjuste(novoAjuste);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Ajustar Saldo Estimado
          </DialogTitle>
          <DialogDescription>
            Adicione ou subtraia um valor manual do cálculo do saldo estimado. 
            Use valores negativos para subtrair.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ajuste">Valor do Ajuste (Manual)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                R$
              </span>
              <Input
                id="ajuste"
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                className="pl-10"
              />
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> Este ajuste é útil para desconsiderar estornos ou lançamentos que ainda não foram processados pelo sistema mas você já sabe que ocorrerão.
            </p>
          </div>

          {ajusteEstimado !== 0 && (
            <div className="text-sm text-muted-foreground">
              Ajuste atual: <strong>{formatCurrency(ajusteEstimado)}</strong>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? 'Salvando...' : 'Salvar Ajuste'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
