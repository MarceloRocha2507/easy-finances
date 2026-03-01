import { useState } from "react";
import { AlertTriangle, X, ChevronDown } from "lucide-react";
import { Alerta } from "@/hooks/useDashboardCompleto";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  alertas: Alerta[];
}

export function AlertasInteligentes({ alertas }: Props) {
  const [dispensados, setDispensados] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  const alertasVisiveis = alertas.filter((a) => !dispensados.includes(a.id));

  if (alertasVisiveis.length === 0) return null;

  const dismissAll = () => setDispensados((prev) => [...prev, ...alertasVisiveis.map(a => a.id)]);

  if (alertasVisiveis.length === 1) {
    const alerta = alertasVisiveis[0];
    return (
      <div className="flex items-center gap-3 bg-[#FFFBEB] border-l-[3px] border-l-[#D97706] rounded-r-lg px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-[#D97706] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[#92400E]">{alerta.titulo}</p>
          <p className="text-[12px] text-[#92400E]/70">{alerta.mensagem}</p>
        </div>
        <button
          onClick={() => setDispensados((prev) => [...prev, alerta.id])}
          className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="bg-[#FFFBEB] border-l-[3px] border-l-[#D97706] rounded-r-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-[#D97706] shrink-0" />
          <CollapsibleTrigger asChild>
            <button className="flex-1 text-left flex items-center gap-2 cursor-pointer">
              <span className="text-[13px] font-medium text-[#92400E]">
                {alertasVisiveis.length} alertas
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-[#92400E]/60 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <button
            onClick={dismissAll}
            className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <CollapsibleContent>
          <div className="mt-2 space-y-1.5 pl-7">
            {alertasVisiveis.map((alerta) => (
              <div key={alerta.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#92400E]">{alerta.titulo}</p>
                  <p className="text-[12px] text-[#92400E]/70">{alerta.mensagem}</p>
                </div>
                <button
                  onClick={() => setDispensados((prev) => [...prev, alerta.id])}
                  className="text-[#9CA3AF] hover:text-[#6B7280] transition-colors shrink-0 mt-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
