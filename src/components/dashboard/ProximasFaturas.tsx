import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CreditCard, Clock } from "lucide-react";
import { ProximaFatura } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  faturas: ProximaFatura[];
  onCartaoClick?: (cartaoId: string) => void;
}

export function ProximasFaturas({ faturas, onCartaoClick }: Props) {
  const isMobile = useIsMobile();
  const faturasPendentes = faturas.filter(f => f.valor > 0);
  const limite = isMobile ? 3 : 4;

  if (faturasPendentes.length === 0) {
    return (
      <Card className="border border-[#E5E7EB] rounded-xl shadow-none bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#9CA3AF]" />
            Próximas Faturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-[#9CA3AF]">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma fatura pendente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-[#E5E7EB] rounded-xl shadow-none bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
      <CardHeader>
        <CardTitle className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#9CA3AF]" />
          Próximas Faturas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-[#F3F4F6]">
          {faturasPendentes.slice(0, limite).map((fatura) => {
            const vencido = fatura.diasRestantes < 0;

            return (
              <div
                key={fatura.cartaoId}
                className="flex items-center justify-between py-3 cursor-pointer transition-colors hover:bg-[#F9FAFB] -mx-2 px-2 rounded-lg first:pt-0"
                onClick={() => onCartaoClick?.(fatura.cartaoId)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[6px] bg-[#F3F4F6] flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-[#6B7280]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827] dark:text-white">{fatura.cartaoNome}</p>
                    <p className="text-[11px] text-[#9CA3AF] flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {fatura.dataVencimento.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <p className="font-bold text-[#DC2626] text-sm">
                    {formatCurrency(fatura.valor)}
                  </p>
                  <span
                    className={`text-[11px] font-medium rounded-full px-2 py-0.5 ${
                      vencido
                        ? "bg-[#FEF2F2] text-[#DC2626]"
                        : "bg-[#F3F4F6] text-[#374151]"
                    }`}
                  >
                    {fatura.diasRestantes === 0
                      ? "Hoje"
                      : fatura.diasRestantes === 1
                      ? "Amanhã"
                      : vencido
                      ? `${Math.abs(fatura.diasRestantes)}d atrás`
                      : `${fatura.diasRestantes} dias`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
