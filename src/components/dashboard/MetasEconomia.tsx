import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Plus,
  Calendar,
  Check,
} from "lucide-react";
import { Meta } from "@/hooks/useDashboardCompleto";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  metas: Meta[];
  onNovaMeta?: () => void;
  onMetaClick?: (meta: Meta) => void;
}

export function MetasEconomia({ metas, onNovaMeta, onMetaClick }: Props) {
  return (
    <Card className="border rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Target className="h-4 w-4" />
          Metas de Economia
        </CardTitle>
        {onNovaMeta && (
          <Button variant="outline" size="sm" className="gap-1 h-8" onClick={onNovaMeta}>
            <Plus className="h-3.5 w-3.5" />
            Nova
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {metas.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground mb-4">
              Sem metas cadastradas
            </p>
            {onNovaMeta && (
              <Button variant="outline" size="sm" onClick={onNovaMeta}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Nova meta
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {metas.map((meta) => {
              const diasRestantes = meta.dataLimite
                ? Math.ceil(
                    (meta.dataLimite.getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null;

              const faltando = meta.valorAlvo - meta.valorAtual;
              const concluida = meta.progresso >= 100;

              return (
                <div
                  key={meta.id}
                  className={`p-4 rounded-md border cursor-pointer transition-colors ${
                    concluida
                      ? "bg-income/5 border-income/20"
                      : "hover:bg-secondary/50"
                  }`}
                  onClick={() => onMetaClick?.(meta)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: `${meta.cor}15` }}
                      >
                        <Target className="h-4 w-4" style={{ color: meta.cor }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{meta.titulo}</p>
                      {diasRestantes !== null && diasRestantes > 0 && !concluida && (
                        <p className="text-xs text-muted-foreground items-center gap-1 hidden sm:flex">
                          <Calendar className="h-3 w-3" />
                          {diasRestantes} dias restantes
                        </p>
                      )}
                    </div>
                    </div>

                    {concluida ? (
                      <Badge variant="outline" className="text-income border-income/30 gap-1">
                        <Check className="h-3 w-3" />
                        Concluída
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {meta.progresso.toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <Progress
                    value={meta.progresso}
                    className="h-1.5 mb-2"
                  />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {formatCurrency(meta.valorAtual)} de{" "}
                      {formatCurrency(meta.valorAlvo)}
                    </span>
                    {!concluida && (
                      <span className="hidden sm:inline">Faltam {formatCurrency(faltando)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
