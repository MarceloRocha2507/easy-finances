import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarioEvento } from "@/hooks/useCalendarioEventos";

interface CalendarioGridProps {
  mesReferencia: Date;
  eventos: CalendarioEvento[];
  diaSelecionado: Date | null;
  onDiaClick: (dia: Date) => void;
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarioGrid({
  mesReferencia,
  eventos,
  diaSelecionado,
  onDiaClick,
}: CalendarioGridProps) {
  const dias = useMemo(() => {
    const start = startOfWeek(startOfMonth(mesReferencia), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(mesReferencia), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [mesReferencia]);

  const eventosPorDia = useMemo(() => {
    const map = new Map<string, CalendarioEvento[]>();
    eventos.forEach((e) => {
      const k = format(e.data, "yyyy-MM-dd");
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    });
    return map;
  }, [eventos]);

  const hoje = new Date();

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[14px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 border-b border-[#E5E7EB] bg-[#FAFAFA]">
        {DIAS_SEMANA.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-[10px] uppercase tracking-wider text-[#6B7280] font-semibold text-center"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7">
        {dias.map((dia, idx) => {
          const k = format(dia, "yyyy-MM-dd");
          const eventosDia = eventosPorDia.get(k) || [];
          const isMesAtual = isSameMonth(dia, mesReferencia);
          const isHoje = isSameDay(dia, hoje);
          const isSelecionado =
            diaSelecionado && isSameDay(dia, diaSelecionado);

          // Tipos únicos para os pontinhos (max 4)
          const tiposUnicos: { tipo: string; cor: string }[] = [];
          for (const ev of eventosDia) {
            if (!tiposUnicos.find((t) => t.cor === ev.cor)) {
              tiposUnicos.push({ tipo: ev.tipo, cor: ev.cor });
            }
            if (tiposUnicos.length >= 4) break;
          }
          const restantes = eventosDia.length - tiposUnicos.length;

          return (
            <button
              key={idx}
              onClick={() => onDiaClick(dia)}
              className={cn(
                "relative flex flex-col items-center justify-start gap-1 min-h-[72px] sm:min-h-[88px] p-1.5 sm:p-2",
                "border-r border-b border-[#F3F4F6] transition-colors text-left",
                "hover:bg-[#F9FAFB]",
                !isMesAtual && "bg-[#FAFAFA]",
                isSelecionado && "bg-[#EFF6FF]",
                (idx + 1) % 7 === 0 && "border-r-0"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center text-xs sm:text-sm tabular-nums",
                  "h-6 w-6 rounded-full",
                  !isMesAtual && "text-[#D1D5DB]",
                  isMesAtual && !isHoje && "text-[#111827]",
                  isHoje && "bg-[#111827] text-white font-semibold"
                )}
              >
                {format(dia, "d")}
              </div>

              {/* Pontinhos */}
              {tiposUnicos.length > 0 && (
                <div className="flex items-center gap-0.5 flex-wrap justify-center mt-auto">
                  {tiposUnicos.map((t, i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: t.cor }}
                    />
                  ))}
                  {restantes > 0 && (
                    <span className="text-[9px] text-[#6B7280] ml-0.5">
                      +{restantes}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
