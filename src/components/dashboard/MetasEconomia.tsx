import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  PiggyBank,
  Target,
  Plus,
  Calendar,
  TrendingUp,
  Sparkles,
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
    <Card className="border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas de Economia
        </CardTitle>
        {onNovaMeta && (
          <Button variant="outline" size="sm" className="gap-1" onClick={onNovaMeta}>
            <Plus className="h-4 w-4" />
            Nova
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {metas.length === 0 ? (
          <div className="text-center py-6">
            <PiggyBank className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground mb-3">
              Nenhuma meta criada ainda
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie metas para acompanhar sua economia!
            </p>
            {onNovaMeta && (
              <Button variant="outline" className="gap-2" onClick={onNovaMeta}>
                <Plus className="h-4 w-4" />
                Criar primeira meta
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
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
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    concluida
                      ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/15"
                      : "hover:bg-muted/50 hover:shadow-md"
                  }`}
                  onClick={() => onMetaClick?.(meta)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${meta.cor}20` }}
                      >
                        {concluida ? (
                          <Sparkles className="h-5 w-5" style={{ color: meta.cor }} />
                        ) : (
                          <PiggyBank className="h-5 w-5" style={{ color: meta.cor }} />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{meta.titulo}</p>
                        {diasRestantes !== null && diasRestantes > 0 && !concluida && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {diasRestantes} dias restantes
                          </p>
                        )}
                      </div>
                    </div>

                    {concluida ? (
                      <Badge className="bg-emerald-500 text-white">
                        Concluída! 🎉
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {meta.progresso.toFixed(0)}%
                      </Badge>
                    )}
                  </div>

                  <Progress
                    value={meta.progresso}
                    className={`h-2 mb-2 ${
                      concluida ? "[&>div]:bg-emerald-500" : ""
                    }`}
                    style={
                      !concluida
                        ? ({ "--progress-color": meta.cor } as any)
                        : undefined
                    }
                  />

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatCurrency(meta.valorAtual)} de{" "}
                      {formatCurrency(meta.valorAlvo)}
                    </span>
                    {!concluida && (
                      <span className="text-muted-foreground">
                        Faltam {formatCurrency(faltando)}
                      </span>
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