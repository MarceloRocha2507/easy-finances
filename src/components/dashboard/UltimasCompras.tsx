import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, CreditCard } from "lucide-react";
import { UltimaCompra } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  compras: UltimaCompra[];
}

export function UltimasCompras({ compras }: Props) {
  if (compras.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Últimas Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>Nenhuma compra registrada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Últimas Compras
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {compras.map((compra) => (
          <div
            key={compra.id}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium line-clamp-1">{compra.descricao}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CreditCard className="h-3 w-3" />
                  <span>{compra.cartaoNome}</span>
                  <span>•</span>
                  <span>
                    {compra.data.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold">{formatCurrency(compra.valor)}</p>
              {compra.parcelas > 1 && (
                <Badge variant="outline" className="text-xs">
                  {compra.parcelas}x
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}