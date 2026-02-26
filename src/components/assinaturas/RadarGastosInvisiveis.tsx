import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NovaAssinaturaDialog } from "./NovaAssinaturaDialog";
import { useRadarGastos, DeteccaoRadar } from "@/hooks/useRadarGastos";
import { formatCurrency } from "@/lib/formatters";
import { Sparkles, Plus, X, RefreshCw, CheckCircle2 } from "lucide-react";

const freqLabel: Record<string, string> = {
  semanal: "Semanal",
  mensal: "Mensal",
  trimestral: "Trimestral",
  anual: "Anual",
};

export function RadarGastosInvisiveis() {
  const { deteccoes, totalDetectados, isLoading, ignorar, analisarAgora } = useRadarGastos();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preFill, setPreFill] = useState<{ nome: string; valor: string; frequencia: string } | null>(null);

  const handleAdicionar = (d: DeteccaoRadar) => {
    setPreFill({
      nome: d.descricao,
      valor: String(Math.round(d.valorMedio * 100) / 100),
      frequencia: d.frequenciaEstimada === "semanal" ? "mensal" : d.frequenciaEstimada,
    });
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (totalDetectados === 0) {
    return (
      <Card className="border rounded-xl bg-muted/30">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">
              Nenhum gasto invisível detectado. Suas assinaturas estão em dia!
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={analisarAgora} className="gap-1.5 flex-shrink-0">
            <RefreshCw className="h-3.5 w-3.5" /> Analisar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alert card */}
      <Card className="border rounded-xl bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-sm">
              A <strong>Fina IA</strong> analisou suas transações e encontrou{" "}
              <strong>{totalDetectados}</strong> possíve{totalDetectados === 1 ? "l" : "is"} assinatura{totalDetectados === 1 ? "" : "s"} não cadastrada{totalDetectados === 1 ? "" : "s"}.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={analisarAgora} className="gap-1.5 w-full sm:w-auto flex-shrink-0">
            <RefreshCw className="h-3.5 w-3.5" /> Analisar agora
          </Button>
        </CardContent>
      </Card>

      {/* Detection list */}
      <div className="grid gap-3">
        {deteccoes.map((d) => (
          <Card key={d.descricao} className="border rounded-xl">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{d.descricao}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {freqLabel[d.frequenciaEstimada] || d.frequenciaEstimada}
                    </Badge>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                    <span>Valor médio: {formatCurrency(d.valorMedio)}</span>
                    <span>{d.totalOcorrencias}x nos últimos 12 meses</span>
                    <span>Total: {formatCurrency(d.totalGasto12Meses)}</span>
                  </div>
                  <p className="text-base font-bold text-primary">
                    {formatCurrency(d.custoAnualEstimado)}<span className="text-xs font-normal text-muted-foreground">/ano estimado</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => ignorar.mutate(d.descricao)}
                    disabled={ignorar.isPending}
                    className="gap-1 flex-1 sm:flex-initial"
                  >
                    <X className="h-3.5 w-3.5" /> Ignorar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAdicionar(d)}
                    className="gap-1 flex-1 sm:flex-initial"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <NovaAssinaturaDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setPreFill(null);
        }}
        prefill={preFill}
      />
    </div>
  );
}
