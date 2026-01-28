import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InsightEconomia } from "@/hooks/useEconomia";

interface Props {
  insights: InsightEconomia[];
}

export function InsightsEconomia({ insights }: Props) {
  if (insights.length === 0) {
    return (
      <Card className="shadow-sm rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">Continue registrando seus gastos</p>
            <p className="text-xs mt-1">para receber dicas personalizadas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="p-4 rounded-xl border shadow-sm"
            style={{
              backgroundColor: `${insight.cor}08`,
              borderColor: `${insight.cor}25`,
            }}
          >
            <p className="font-medium text-sm" style={{ color: insight.cor }}>
              {insight.titulo}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {insight.mensagem}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
