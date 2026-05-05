import { CalendarioEvento, LABELS_TIPO } from "@/hooks/useCalendarioEventos";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface EventoItemProps {
  evento: CalendarioEvento;
  onClick?: (e: CalendarioEvento) => void;
  compact?: boolean;
}

export function EventoItem({ evento, onClick, compact }: EventoItemProps) {
  const isPaid = evento.status === "concluido";
  return (
    <button
      onClick={() => onClick?.(evento)}
      className={cn(
        "w-full flex items-center gap-3 py-2.5 px-3 rounded-lg text-left transition-colors",
        "hover:bg-[#F9FAFB]"
      )}
    >
      <span
        className={cn(
          "shrink-0 rounded-full",
          compact ? "h-2 w-2" : "h-2.5 w-2.5",
          isPaid && "ring-2 ring-offset-0"
        )}
        style={{
          backgroundColor: isPaid ? "transparent" : evento.cor,
          borderColor: evento.cor,
          borderWidth: isPaid ? 1.5 : 0,
          borderStyle: "solid",
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-[#9CA3AF] font-medium">
            {LABELS_TIPO[evento.tipo]}
          </span>
          {isPaid && (
            <span className="text-[10px] text-[#22C55E] font-medium">
              ✓ pago
            </span>
          )}
        </div>
        <p className="text-sm text-[#111827] truncate font-medium">
          {evento.titulo}
        </p>
      </div>
      {evento.valor !== undefined && evento.valor > 0 && (
        <span
          className={cn(
            "text-sm font-semibold tabular-nums shrink-0",
            evento.tipo === "receita" ? "text-[#22C55E]" : "text-[#111827]"
          )}
        >
          {formatCurrency(evento.valor)}
        </span>
      )}
    </button>
  );
}
