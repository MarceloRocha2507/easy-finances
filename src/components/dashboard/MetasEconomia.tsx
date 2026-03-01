import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <Card className="border border-[#E5E7EB] rounded-xl shadow-none bg-white dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
          <Target className="h-4 w-4 text-[#9CA3AF]" />
          Metas de Economia
        </CardTitle>
        {onNovaMeta && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 h-8 text-[#6B7280] hover:text-[#111827]"
            onClick={onNovaMeta}
          >
            <Plus className="h-3.5 w-3.5" />
            Nova
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {metas.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-10 w-10 mx-auto mb-3 text-[#9CA3AF] opacity-40" />
            <p className="text-sm text-[#9CA3AF] mb-4">
              Sem metas cadastradas
            </p>
            {onNovaMeta && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[#6B7280] hover:text-[#111827]"
                onClick={onNovaMeta}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Nova meta
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {metas.map((meta) => {
              const diasRestantes = meta.dataLimite
                ? Math.ceil(
                    (meta.dataLimite.getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null;

              const faltando = meta.valorAlvo - meta.valorAtual;
              const concluida = meta.progresso >= 100;
              const nearComplete = meta.progresso >= 80;

              return (
                <div
                  key={meta.id}
                  className="py-3 cursor-pointer transition-colors hover:bg-[#F9FAFB] -mx-2 px-2 rounded-lg first:pt-0"
                  onClick={() => onMetaClick?.(meta)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-[6px] bg-[#F3F4F6] flex items-center justify-center">
                        <Target className="h-3.5 w-3.5 text-[#6B7280]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111827] dark:text-white">{meta.titulo}</p>
                        {diasRestantes !== null && diasRestantes > 0 && !concluida && (
                          <p className="text-[11px] text-[#9CA3AF] items-center gap-1 hidden sm:flex">
                            <Calendar className="h-3 w-3" />
                            {diasRestantes} dias restantes
                          </p>
                        )}
                      </div>
                    </div>

                    {concluida ? (
                      <span className="text-[11px] font-medium text-[#16A34A] flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Concluída
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#9CA3AF]">
                        {meta.progresso.toFixed(0)}%
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 w-full bg-[#F3F4F6] rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(meta.progresso, 100)}%`,
                        backgroundColor: concluida || nearComplete ? "#16A34A" : "#111827",
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[12px]">
                    <span className="text-[#6B7280]">
                      {formatCurrency(meta.valorAtual)} de{" "}
                      {formatCurrency(meta.valorAlvo)}
                    </span>
                    {!concluida && (
                      <span className="text-[#9CA3AF] hidden sm:inline">Faltam {formatCurrency(faltando)}</span>
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
