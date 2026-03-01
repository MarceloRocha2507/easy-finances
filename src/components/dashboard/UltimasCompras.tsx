import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, CreditCard } from "lucide-react";
import { UltimaCompra } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";
import { Link } from "react-router-dom";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
  "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
  "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
];

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % AVATAR_COLORS.length;
}

interface Props {
  compras: UltimaCompra[];
}

export function UltimasCompras({ compras }: Props) {
  if (compras.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
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
        <CardTitle className="text-base flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          Últimas Compras
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {compras.slice(0, 4).map((compra) => {
          const colorClass = AVATAR_COLORS[getColorIndex(compra.descricao)];

          return (
            <div
              key={compra.id}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${colorClass}`}>
                  {getInitials(compra.descricao)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{compra.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    <CreditCard className="h-3 w-3 inline mr-1" />
                    {compra.cartaoNome} · {compra.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <p className="text-sm font-semibold">{formatCurrency(compra.valor)}</p>
                {compra.parcelas > 1 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {compra.parcelas}x
                  </Badge>
                )}
              </div>
            </div>
          );
        })}

        {compras.length > 4 && (
          <Link
            to="/cartoes"
            className="block text-center text-xs text-primary hover:underline pt-1"
          >
            Ver todas
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
