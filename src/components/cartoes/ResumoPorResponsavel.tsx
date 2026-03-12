import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { ParcelaFatura } from "@/services/compras-cartao";
import { AcertoFatura } from "@/services/acertos";
import { User, Crown, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  parcelas: ParcelaFatura[];
  acertos: AcertoFatura[];
  className?: string;
}

type ResumoItem = {
  responsavelId: string;
  nome: string;
  apelido: string | null;
  isTitular: boolean;
  total: number;
  percentual: number;
  valorPago: number;
  status: "pendente" | "parcial" | "quitado";
};

export function ResumoPorResponsavel({ parcelas, acertos, className }: Props) {
  const resumo = useMemo(() => {
    const porResponsavel: Record<string, ResumoItem> = {};
    let totalGeral = 0;

    parcelas.forEach((p) => {
      const valor = Math.abs(p.valor);
      totalGeral += valor;

      const isTitular = p.is_titular === true || !p.responsavel_id;
      const respId = p.responsavel_id || "titular";

      if (!porResponsavel[respId]) {
        porResponsavel[respId] = {
          responsavelId: respId,
          nome: isTitular ? "EU (Titular)" : (p.responsavel_nome || "Sem responsável"),
          apelido: isTitular ? null : (p.responsavel_apelido || null),
          isTitular,
          total: 0,
          percentual: 0,
          valorPago: 0,
          status: "pendente",
        };
      }

      porResponsavel[respId].total += valor;
    });

    // Calcular percentuais e status de acerto
    let totalPagoOutros = 0;
    Object.values(porResponsavel).forEach((item) => {
      item.percentual = totalGeral > 0 ? (item.total / totalGeral) * 100 : 0;

      // Buscar acerto existente para não-titulares
      if (!item.isTitular) {
        const acerto = acertos.find((a) => a.responsavel_id === item.responsavelId);
        if (acerto) {
          item.valorPago = acerto.valor_pago;
          item.status = acerto.status as "pendente" | "parcial" | "quitado";
          totalPagoOutros += acerto.valor_pago;
        }
      }
    });

    // Calcular quanto o titular pagou ao banco (total fatura - o que terceiros reembolsaram)
    const faturaFoiPaga = parcelas.some((p) => p.paga);
    const titularItem = Object.values(porResponsavel).find((item) => item.isTitular);
    if (titularItem && faturaFoiPaga) {
      titularItem.valorPago = totalGeral - totalPagoOutros;
    }

    // Ordenar: titular primeiro, depois por valor
    return Object.values(porResponsavel).sort((a, b) => {
      if (a.isTitular !== b.isTitular) return a.isTitular ? -1 : 1;
      return b.total - a.total;
    });
  }, [parcelas, acertos]);

  if (resumo.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Por responsável
      </h3>

      <div className="space-y-2">
        {resumo.map((item) => (
          <div
            key={item.responsavelId}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            {/* Ícone */}
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                item.isTitular
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {item.isTitular ? (
                <Crown className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate text-sm">
                  {item.apelido || item.nome}
                </span>
                {/* Status de acerto */}
                {item.status === "quitado" ? (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Quitado
                  </Badge>
                ) : item.status === "parcial" ? (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-0 text-[10px]">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Parcial
                  </Badge>
                ) : !item.isTitular && item.total > 0 ? (
                  <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-0 text-[10px]">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                ) : null}
              </div>

              {/* Valor pago - titular e não-titulares */}
              {item.isTitular && item.valorPago > 0 && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Pagou {formatCurrency(item.valorPago)} ao banco
                </p>
              )}
              {!item.isTitular && item.valorPago > 0 && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Pagou {formatCurrency(item.valorPago)} de {formatCurrency(item.total)}
                </p>
              )}
              {!item.isTitular && item.valorPago === 0 && item.total > 0 && (
                <p className="text-[11px] text-destructive mt-0.5">
                  Nenhum pagamento registrado
                </p>
              )}

              {/* Barra de progresso */}
              <div className="mt-1.5">
                <Progress
                  value={item.percentual}
                  className="h-1.5"
                />
              </div>
            </div>

            {/* Valor */}
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-sm value-display">
                {formatCurrency(item.total)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {item.percentual.toFixed(0)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
