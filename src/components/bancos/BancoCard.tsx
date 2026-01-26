import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BancoComResumo } from "@/services/bancos";
import { formatCurrency } from "@/lib/formatters";
import { Building2, CreditCard, Edit2, Power, Trash2 } from "lucide-react";

interface BancoCardProps {
  banco: BancoComResumo;
  onEdit: () => void;
  onDelete: () => void;
}

export function BancoCard({ banco, onEdit, onDelete }: BancoCardProps) {
  return (
    <Card className="border card-hover">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${banco.cor}15` }}
            >
              <Building2 className="h-6 w-6" style={{ color: banco.cor }} />
            </div>
            <div>
              <h3 className="font-medium text-foreground">{banco.nome}</h3>
              {banco.codigo && (
                <p className="text-xs text-muted-foreground">Código: {banco.codigo}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Cartões</p>
            <div className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{banco.quantidadeCartoes}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Limite Total</p>
            <p className="font-medium">{formatCurrency(banco.limiteTotal)}</p>
          </div>
        </div>

        {/* Fatura e Disponível */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Fatura</p>
            <p className="font-medium text-expense">{formatCurrency(banco.faturaTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Disponível</p>
            <p className="font-medium text-income">{formatCurrency(banco.disponivelTotal)}</p>
          </div>
        </div>

        {/* Barra de uso */}
        {banco.limiteTotal > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((banco.faturaTotal / banco.limiteTotal) * 100, 100)}%`,
                  backgroundColor: banco.cor,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {((banco.faturaTotal / banco.limiteTotal) * 100).toFixed(0)}% utilizado
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
