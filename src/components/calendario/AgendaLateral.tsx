import { useMemo } from "react";
import { format, isSameDay, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays } from "lucide-react";
import { CalendarioEvento } from "@/hooks/useCalendarioEventos";
import { EventoItem } from "./EventoItem";

interface AgendaLateralProps {
  eventos: CalendarioEvento[];
  onEventoClick: (e: CalendarioEvento) => void;
}

function labelDia(d: Date) {
  if (isToday(d)) return "Hoje";
  if (isTomorrow(d)) return "Amanhã";
  return format(d, "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function AgendaLateral({ eventos, onEventoClick }: AgendaLateralProps) {
  const agrupados = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const futuros = eventos.filter((e) => e.data >= hoje);
    const grupos = new Map<string, CalendarioEvento[]>();
    futuros.forEach((e) => {
      const k = format(e.data, "yyyy-MM-dd");
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k)!.push(e);
    });
    return Array.from(grupos.entries()).slice(0, 30);
  }, [eventos]);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-[#F3F4F6]">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
          Agenda
        </h3>
        <p className="text-sm text-[#111827] mt-0.5">Próximos compromissos</p>
      </div>

      <ScrollArea className="flex-1">
        {agrupados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
            <CalendarDays className="h-8 w-8 text-[#D1D5DB] mb-2" />
            <p className="text-sm text-[#6B7280]">
              Nenhum compromisso futuro neste período
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {agrupados.map(([key, eventosDia]) => {
              const data = eventosDia[0].data;
              return (
                <div key={key} className="px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wider text-[#9CA3AF] font-medium px-2 mb-1.5">
                    {labelDia(data)}
                  </p>
                  <div className="space-y-0.5">
                    {eventosDia.map((ev) => (
                      <EventoItem
                        key={ev.id}
                        evento={ev}
                        onClick={onEventoClick}
                        compact
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
