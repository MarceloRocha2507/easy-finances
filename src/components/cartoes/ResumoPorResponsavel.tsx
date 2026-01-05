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
    // Agrupar por responsável
    const porResponsavel: Record<string, ResumoItem> = {};
    let totalGeral = 0;

    parcelas.forEach((p) => {
      const valor = Math.abs(p.valor);
      totalGeral += valor;

      const respId = p.responsavel_id || "sem-responsavel";

      if (!porResponsavel[respId]) {
        porResponsavel[respId] = {
          responsavelId: respId,
          nome: p.responsavel_nome || "Sem responsável",
          apelido: p.responsavel_apelido || null,
          isTitular: false, // TODO: verificar
          total: 0,
          percentual: 0,
          valorPago: 0,
          status: "pendente",
        };
      }

      porResponsavel[respId].total += valor;
    });

    // Calcular percentuais e status de acerto
    Object.values(porResponsavel).forEach((item) => {
      item.percentual = totalGeral > 0 ? (item.total / totalGeral) * 100 : 0;

      // Buscar acerto existente
      const acerto = acertos.find((a) => a.responsavel_id === item.responsavelId);
      if (acerto) {
        item.valorPago = acerto.valor_pago;
        item.status = acerto.status as "pendente" | "parcial" | "quitado";
      }
    });

    // Ordenar por valor (maior primeiro)
    return Object.values(porResponsavel).sort((a, b) => b.total - a.total);
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
                <span className="font-medium truncate">
                  {item.apelido || item.nome}
                </span>
                {/* Status de acerto */}
                {item.status === "quitado" ? (
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Quitado
                  </Badge>
                ) : item.status === "parcial" ? (
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-0">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Parcial
                  </Badge>
                ) : !item.isTitular && item.total > 0 ? (
                  <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-0">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                ) : null}
              </div>

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
              <p className="font-semibold value-display">
                {formatCurrency(item.total)}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.percentual.toFixed(0)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}