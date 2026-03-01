import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { CartaoDashboard, ResumoCartoes } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";
import { useIsMobile } from "@/hooks/use-mobile";

interface CartaoCardProps {
  cartao: CartaoDashboard;
  onClick: () => void;
}

function CartaoCard({ cartao, onClick }: CartaoCardProps) {
  const limiteAlto = cartao.usoPct >= 80;
  const limiteMedio = cartao.usoPct >= 60;
  const venceEmBreve = cartao.diasParaVencimento <= 3 && cartao.diasParaVencimento >= 0;

  const barColor = limiteAlto ? "#DC2626" : limiteMedio ? "#D97706" : "#16A34A";

  return (
    <div
      onClick={onClick}
      className="p-4 border border-[#E5E7EB] dark:border-[#2a2a2a] rounded-[10px] hover:bg-[#F9FAFB] dark:hover:bg-[#222] transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-[#F3F4F6] dark:bg-[#2a2a2a] flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-[#6B7280]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#111827] dark:text-white">{cartao.nome}</p>
            <p className="text-[11px] text-[#9CA3AF]">
              {cartao.bandeira || "Crédito"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {limiteAlto && (
            <span className="flex items-center gap-1 text-[11px] text-[#DC2626]">
              <AlertTriangle className="h-3 w-3" />
              {cartao.usoPct.toFixed(0)}%
            </span>
          )}
          {venceEmBreve && cartao.totalPendente > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-[#D97706]">
              <Clock className="h-3 w-3" />
              {cartao.diasParaVencimento === 0 ? "Hoje" : `${cartao.diasParaVencimento}d`}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#9CA3AF]">Fatura</span>
          <span className="font-bold text-[#DC2626]">
            {formatCurrency(cartao.totalPendente)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[#9CA3AF]">Disponível</span>
          <span className="font-bold text-[#16A34A]">
            {formatCurrency(cartao.disponivel)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-[#F3F4F6] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(cartao.usoPct, 100)}%`,
              backgroundColor: barColor,
            }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-[#9CA3AF]">
          <span>{cartao.usoPct.toFixed(0)}% do limite</span>
          <span>Venc. dia {cartao.dia_vencimento}</span>
        </div>
      </div>
    </div>
  );
}

function CartaoSkeleton() {
  return (
    <div className="p-4 border border-[#E5E7EB] rounded-[10px]">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-8 h-8 rounded-[6px]" />
        <div>
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-1 w-full" />
      </div>
    </div>
  );
}

interface Props {
  cartoes: CartaoDashboard[];
  resumo: ResumoCartoes;
  isLoading?: boolean;
  onCartaoClick: (cartao: CartaoDashboard) => void;
}

export function CartoesCredito({ cartoes, resumo, isLoading, onCartaoClick }: Props) {
  const isMobile = useIsMobile();
  const cartoesVisiveis = isMobile ? cartoes.slice(0, 2) : cartoes;

  return (
    <Card className="border border-[#E5E7EB] rounded-xl shadow-none bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[#9CA3AF]" />
          Cartões de Crédito
        </CardTitle>
      </CardHeader>

      <CardContent>
        {resumo.quantidadeCartoes > 0 && (
          <div className="flex flex-wrap sm:grid sm:grid-cols-3 gap-2 sm:gap-4 mb-4 py-2">
            <div className="text-center flex-1 min-w-[80px]">
              <p className="text-[11px] text-[#9CA3AF]">Faturas</p>
              <p className="text-sm font-bold text-[#DC2626] truncate">
                {formatCurrency(resumo.totalPendente)}
              </p>
            </div>
            <div className="text-center flex-1 min-w-[80px]">
              <p className="text-[11px] text-[#9CA3AF]">Limite</p>
              <p className="text-sm font-bold text-[#111827] dark:text-white truncate">
                {formatCurrency(resumo.limiteTotal)}
              </p>
            </div>
            <div className="text-center flex-1 min-w-[80px]">
              <p className="text-[11px] text-[#9CA3AF]">Disponível</p>
              <p className="text-sm font-bold text-[#16A34A] truncate">
                {formatCurrency(resumo.limiteDisponivel)}
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CartaoSkeleton />
            <CartaoSkeleton />
          </div>
        ) : cartoes.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-10 w-10 mx-auto mb-3 text-[#9CA3AF] opacity-40" />
            <p className="text-sm text-[#9CA3AF]">
              Nenhum cartão cadastrado
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cartoesVisiveis.map((cartao) => (
                <CartaoCard
                  key={cartao.id}
                  cartao={cartao}
                  onClick={() => onCartaoClick(cartao)}
                />
              ))}
            </div>
            {isMobile && cartoes.length > 2 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2 text-xs text-[#6B7280]"
                onClick={() => onCartaoClick(cartoes[0])}
              >
                Ver todos ({cartoes.length} cartões)
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
