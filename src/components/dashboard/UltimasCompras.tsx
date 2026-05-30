import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, CreditCard } from "lucide-react";
import { UltimaCompra } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";
import { Link } from "react-router-dom";

const AVATAR_COLORS = [
  "bg-[#F3F4F6] text-[#374151]",
  "bg-[#DCFCE7] text-[#16A34A]",
  "bg-[#F3F4F6] text-[#6B7280]",
  "bg-[#FEF3C7] text-[#D97706]",
  "bg-[#FEE2E2] text-[#DC2626]",
  "bg-[#F9FAFB] text-[#374151]",
  "bg-[#F3F4F6] text-[#111827]",
  "bg-[#F9FAFB] text-[#6B7280]",
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
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${colorClass}`}>
                  {getInitials(compra.descricao)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate max-w-[120px] sm:max-w-[180px]">{compra.descricao}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    <CreditCard className="h-3 w-3 inline mr-1" />
                    {compra.cartaoNome} · {compra.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <p className="text-xs sm:text-sm font-semibold">{formatCurrency(compra.valor)}</p>
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
            className="block text-center text-xs text-primary hover:underline pt-2 pb-1"
          >
            Ver todas
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
