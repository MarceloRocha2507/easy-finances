import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, RotateCcw, Trash2, History } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SimulacaoSalva, DadosSimulacao, FormaPagamento } from "@/hooks/useSimuladorCompra";

interface Props {
  simulacoes: SimulacaoSalva[];
  onRecarregar: (dados: DadosSimulacao) => void;
  onExcluir: (id: string) => void;
}

const formaLabels: Record<string, string> = {
  a_vista: "À vista",
  parcelado_cartao: "Cartão",
  boleto_parcelado: "Boleto",
};

export function HistoricoSimulacoes({ simulacoes, onRecarregar, onExcluir }: Props) {
  if (simulacoes.length === 0) return null;

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between mb-2">
          <span className="flex items-center gap-2 text-sm">
            <History className="w-4 h-4" />
            Simulações salvas ({simulacoes.length})
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2">
        {simulacoes.map((sim) => (
          <Card key={sim.id} className="border rounded-lg">
            <CardContent className="py-3 px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{sim.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(sim.valor_total)} • {formaLabels[sim.forma_pagamento] || sim.forma_pagamento}
                  {sim.parcelas > 1 ? ` ${sim.parcelas}x` : ""} •{" "}
                  {format(new Date(sim.created_at), "dd/MM/yy", { locale: ptBR })}
                </p>
                {sim.veredicto && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {sim.veredicto.substring(0, 80)}...
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onRecarregar({
                      nome: sim.nome,
                      valorTotal: sim.valor_total,
                      formaPagamento: sim.forma_pagamento as FormaPagamento,
                      parcelas: sim.parcelas,
                      cartaoId: sim.cartao_id,
                      categoryId: sim.category_id,
                      dataPrevista: new Date(sim.data_prevista + "T12:00:00"),
                      valorSeguranca: sim.valor_seguranca,
                    })
                  }
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Recarregar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onExcluir(sim.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
