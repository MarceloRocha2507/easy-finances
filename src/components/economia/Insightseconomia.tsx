import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  Trophy,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Calculator,
  AlertOctagon,
  Sparkles,
} from "lucide-react";
import { InsightEconomia } from "@/hooks/useEconomia";

const ICONE_MAP: Record<string, React.ReactNode> = {
  "alert-triangle": <AlertTriangle className="h-5 w-5" />,
  "alert-circle": <AlertCircle className="h-5 w-5" />,
  "alert-octagon": <AlertOctagon className="h-5 w-5" />,
  lightbulb: <Lightbulb className="h-5 w-5" />,
  trophy: <Trophy className="h-5 w-5" />,
  "trending-up": <TrendingUp className="h-5 w-5" />,
  "trending-down": <TrendingDown className="h-5 w-5" />,
  "piggy-bank": <PiggyBank className="h-5 w-5" />,
  calculator: <Calculator className="h-5 w-5" />,
};

interface Props {
  insights: InsightEconomia[];
}

export function InsightsEconomia({ insights }: Props) {
  if (insights.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Insights de Economia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Continue registrando seus gastos</p>
            <p className="text-sm">para receber dicas personalizadas!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Insights de Economia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 rounded-xl border transition-all hover:shadow-md`}
            style={{
              backgroundColor: `${insight.cor}10`,
              borderColor: `${insight.cor}30`,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg shrink-0"
                style={{ backgroundColor: `${insight.cor}20`, color: insight.cor }}
              >
                {ICONE_MAP[insight.icone] || <Lightbulb className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold" style={{ color: insight.cor }}>
                  {insight.titulo}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {insight.mensagem}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}