import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  AlertCircle,
  Calendar,
  Info,
  CheckCircle,
  X,
} from "lucide-react";
import { Alerta } from "@/hooks/useDashboardCompleto";
import { useState } from "react";

const ICONE_MAP: Record<string, React.ReactNode> = {
  "alert-triangle": <AlertTriangle className="h-4 w-4" />,
  "alert-circle": <AlertCircle className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
  "check-circle": <CheckCircle className="h-4 w-4" />,
};

const CORES_TIPO: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  danger: {
    bg: "bg-expense/5",
    border: "border-expense/20",
    text: "text-expense",
    icon: "text-expense",
  },
  warning: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    text: "text-amber-600 dark:text-amber-500",
    icon: "text-amber-500",
  },
  info: {
    bg: "bg-primary/5",
    border: "border-primary/20",
    text: "text-primary",
    icon: "text-primary",
  },
  success: {
    bg: "bg-income/5",
    border: "border-income/20",
    text: "text-income",
    icon: "text-income",
  },
};

interface Props {
  alertas: Alerta[];
}

export function AlertasInteligentes({ alertas }: Props) {
  const [dispensados, setDispensados] = useState<string[]>([]);

  const alertasVisiveis = alertas.filter((a) => !dispensados.includes(a.id));

  if (alertasVisiveis.length === 0) return null;

  return (
    <div className="space-y-2">
      {alertasVisiveis.map((alerta) => {
        const cores = CORES_TIPO[alerta.tipo] || CORES_TIPO.info;

        return (
          <Card
            key={alerta.id}
            className={`${cores.bg} ${cores.border} border`}
          >
            <CardContent className="p-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={cores.icon}>
                  {ICONE_MAP[alerta.icone] || <Info className="h-4 w-4" />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${cores.text}`}>{alerta.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {alerta.mensagem}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setDispensados((prev) => [...prev, alerta.id])}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
