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
  "alert-triangle": <AlertTriangle className="h-5 w-5" />,
  "alert-circle": <AlertCircle className="h-5 w-5" />,
  calendar: <Calendar className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
  "check-circle": <CheckCircle className="h-5 w-5" />,
};

const CORES_TIPO: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  danger: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-600 dark:text-red-400",
    icon: "text-red-500",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-500",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-600 dark:text-blue-400",
    icon: "text-blue-500",
  },
  success: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: "text-emerald-500",
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
    <div className="space-y-3">
      {alertasVisiveis.map((alerta) => {
        const cores = CORES_TIPO[alerta.tipo] || CORES_TIPO.info;

        return (
          <Card
            key={alerta.id}
            className={`${cores.bg} ${cores.border} border shadow-sm`}
          >
            <CardContent className="p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={cores.icon}>
                  {ICONE_MAP[alerta.icone] || <Info className="h-5 w-5" />}
                </div>
                <div>
                  <p className={`font-semibold ${cores.text}`}>{alerta.titulo}</p>
                  <p className="text-sm text-muted-foreground">
                    {alerta.mensagem}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setDispensados((prev) => [...prev, alerta.id])}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}