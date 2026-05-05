import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { CalendarioEvento } from "@/hooks/useCalendarioEventos";
import { EventoItem } from "./EventoItem";

interface DiaDetalhesSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dia: Date | null;
  eventos: CalendarioEvento[];
  onEventoClick: (e: CalendarioEvento) => void;
}

export function DiaDetalhesSheet({
  open,
  onOpenChange,
  dia,
  eventos,
  onEventoClick,
}: DiaDetalhesSheetProps) {
  if (!dia) return null;
  const dataISO = format(dia, "yyyy-MM-dd");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-[#F3F4F6]">
          <p className="text-[11px] uppercase tracking-wider text-[#6B7280]">
            {format(dia, "EEEE", { locale: ptBR })}
          </p>
          <SheetTitle className="text-2xl font-bold text-[#111827]">
            {format(dia, "d 'de' MMMM", { locale: ptBR })}
          </SheetTitle>
          <p className="text-sm text-[#6B7280]">
            {eventos.length === 0
              ? "Nenhum compromisso"
              : `${eventos.length} compromisso${eventos.length > 1 ? "s" : ""}`}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {eventos.length === 0 ? (
            <div className="text-center py-12 px-5">
              <p className="text-sm text-[#6B7280] mb-4">
                Você não tem compromissos para este dia.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {eventos.map((ev) => (
                <EventoItem key={ev.id} evento={ev} onClick={onEventoClick} />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#F3F4F6] p-4">
          <Link to={`/transactions?date=${dataISO}`} onClick={() => onOpenChange(false)}>
            <Button className="w-full gap-2" variant="outline">
              <Plus className="h-4 w-4" />
              Novo registro neste dia
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
