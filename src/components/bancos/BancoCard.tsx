import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BancoComResumo, TIPOS_CONTA } from "@/services/bancos";
import { formatCurrency } from "@/lib/formatters";
import { Building2, CreditCard, Edit2, Trash2, RefreshCw } from "lucide-react";

interface BancoCardProps {
  banco: BancoComResumo;
  onEdit: () => void;
  onDelete: () => void;
  onAjustarSaldo?: () => void;
}

export function BancoCard({ banco, onEdit, onDelete, onAjustarSaldo }: BancoCardProps) {
  const tipoContaLabel = TIPOS_CONTA.find(t => t.value === banco.tipo_conta)?.label || "Conta";

  return (
    <Card className="shadow-sm rounded-xl card-hover">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${banco.cor}15` }}
            >
              <Building2 className="h-6 w-6" style={{ color: banco.cor }} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{banco.nome}</h3>
              <p className="text-xs text-muted-foreground">{tipoContaLabel}</p>
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

        {/* Saldo da Conta */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Saldo da Conta</p>
              <p className="text-xl font-bold text-income">
                {formatCurrency(banco.saldoCalculado)}
              </p>
            </div>
            {onAjustarSaldo && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAjustarSaldo}
                className="h-8"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Ajustar
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Inicial: {formatCurrency(banco.saldo_inicial)}
          </p>
        </div>

        {/* Cartões Stats */}
        {banco.quantidadeCartoes > 0 && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-2 sm:mb-3">
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Cartões</p>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm sm:text-base">{banco.quantidadeCartoes}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Limite Total</p>
                <p className="font-semibold text-sm sm:text-base truncate">{formatCurrency(banco.limiteTotal)}</p>
              </div>
            </div>

            {/* Fatura e Disponível */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-2 sm:pt-3 border-t">
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Fatura</p>
                <p className="font-semibold text-sm sm:text-base text-expense truncate">{formatCurrency(banco.faturaTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Disponível</p>
                <p className="font-semibold text-sm sm:text-base text-income truncate">{formatCurrency(banco.disponivelTotal)}</p>
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
                  {((banco.faturaTotal / banco.limiteTotal) * 100).toFixed(0)}% do crédito utilizado
                </p>
              </div>
            )}
          </>
        )}

        {banco.quantidadeCartoes === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Nenhum cartão vinculado
          </p>
        )}

        {/* Info adicional */}
        {(banco.agencia || banco.conta) && (
          <div className="mt-3 pt-3 border-t items-center gap-4 text-xs text-muted-foreground hidden sm:flex">
            {banco.agencia && <span>Ag: {banco.agencia}</span>}
            {banco.conta && <span>Conta: {banco.conta}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
