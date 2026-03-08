import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  AlertCircle,
  Bell,
  Calendar,
  Info,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Alerta } from "@/hooks/useDashboardCompleto";
import { useState } from "react";

const ICONE_MAP: Record<string, React.ReactNode> = {
  "alert-triangle": <AlertTriangle className="h-4 w-4" />,
  "alert-circle": <AlertCircle className="h-4 w-4" />,
  bell: <Bell className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
  "check-circle": <CheckCircle className="h-4 w-4" />,
};

const CORES_TIPO: Record<string, { borderL: string; iconBg: string; iconColor: string }> = {
  danger: {
    borderL: "border-l-red-500",
    iconBg: "bg-red-100 dark:bg-red-950",
    iconColor: "text-red-600 dark:text-red-400",
  },
  warning: {
    borderL: "border-l-amber-500",
    iconBg: "bg-amber-100 dark:bg-amber-950",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  info: {
    borderL: "border-l-blue-500",
    iconBg: "bg-blue-100 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  success: {
    borderL: "border-l-green-500",
    iconBg: "bg-green-100 dark:bg-green-950",
    iconColor: "text-green-600 dark:text-green-400",
  },
};

interface Props {
  alertas: Alerta[];
}

export function AlertasInteligentes({ alertas }: Props) {
  const [dispensados, setDispensados] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(true);

  const alertasVisiveis = alertas.filter((a) => !dispensados.includes(a.id));

  if (alertasVisiveis.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Bell className="h-4 w-4" />
        <span>Notificações ({alertasVisiveis.length})</span>
        {collapsed ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronUp className="h-4 w-4 ml-auto" />}
      </button>

      {!collapsed && alertasVisiveis.map((alerta) => {
        const cores = CORES_TIPO[alerta.tipo] || CORES_TIPO.info;

        return (
          <div
            key={alerta.id}
            className={`group bg-white dark:bg-card shadow-sm rounded-lg border border-l-[3px] ${cores.borderL} p-4 flex items-start justify-between gap-3 animate-fade-in`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cores.iconBg} ${cores.iconColor}`}>
                {ICONE_MAP[alerta.icone] || <Info className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{alerta.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {alerta.mensagem}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setDispensados((prev) => [...prev, alerta.id])}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
