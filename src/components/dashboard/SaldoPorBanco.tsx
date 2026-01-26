import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBancosComResumo, TIPOS_CONTA } from "@/services/bancos";
import { formatCurrency } from "@/lib/formatters";
import { Building2, ChevronRight, Wallet } from "lucide-react";

export function SaldoPorBanco() {
  const { data: bancos = [], isLoading } = useBancosComResumo();

  const totalSaldo = bancos.reduce((acc, b) => acc + b.saldoCalculado, 0);

  if (isLoading) {
    return (
      <Card className="border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Saldo por Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (bancos.length === 0) {
    return (
      <Card className="border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Saldo por Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mb-2">
            Nenhuma conta cadastrada
          </p>
          <Link
            to="/cartoes/bancos"
            className="text-sm text-primary hover:underline"
          >
            Cadastrar contas →
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Saldo por Conta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {bancos.slice(0, 5).map((banco) => {
            const tipoLabel = TIPOS_CONTA.find(t => t.value === banco.tipo_conta)?.label || "Conta";
            return (
              <div
                key={banco.id}
                className="flex items-center justify-between p-3 rounded-md hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: `${banco.cor}15` }}
                  >
                    <Building2 className="h-4 w-4" style={{ color: banco.cor }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{banco.nome}</p>
                    <p className="text-xs text-muted-foreground">{tipoLabel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${banco.saldoCalculado >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(banco.saldoCalculado)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Saldo Total</span>
            <span className={`font-semibold ${totalSaldo >= 0 ? 'text-income' : 'text-expense'}`}>
              {formatCurrency(totalSaldo)}
            </span>
          </div>
        </div>

        {/* Link */}
        <Link
          to="/cartoes/bancos"
          className="flex items-center justify-center gap-1 mt-4 pt-3 border-t text-sm text-primary hover:underline"
        >
          Ver todas as contas
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
