import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, CreditCard } from "lucide-react";
import { UltimaCompra } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  compras: UltimaCompra[];
}

export function UltimasCompras({ compras }: Props) {
  const isMobile = useIsMobile();
  const limite = isMobile ? 3 : 5;

  if (compras.length === 0) {
    return (
      <Card className="border border-[#E5E7EB] rounded-xl shadow-none bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-[#9CA3AF]" />
            Últimas Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-[#9CA3AF]">
            <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma compra registrada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-[#E5E7EB] rounded-xl shadow-none bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
      <CardHeader>
        <CardTitle className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-[#9CA3AF]" />
          Últimas Compras
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-[#F3F4F6]">
          {compras.slice(0, limite).map((compra) => (
            <div
              key={compra.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[6px] bg-[#F3F4F6] flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-[#6B7280]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111827] dark:text-white line-clamp-1">{compra.descricao}</p>
                  <div className="flex items-center gap-2 text-[12px] text-[#9CA3AF]">
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

              <div className="text-right flex items-center gap-2">
                <p className="font-bold text-[#111827] dark:text-white text-sm">{formatCurrency(compra.valor)}</p>
                {compra.parcelas > 1 && (
                  <Badge variant="outline" className="text-[11px] text-[#6B7280] border-[#E5E7EB]">
                    {compra.parcelas}x
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
