import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface DaySelectorProps {
  value: number;
  onChange: (day: number) => void;
  label?: string;
  placeholder?: string;
}

export function DaySelector({
  value,
  onChange,
  label,
  placeholder = "Selecionar dia",
}: DaySelectorProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());

  // Navegar entre meses
  const goToPreviousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Nome do mês e ano
  const monthYearLabel = useMemo(() => {
    return viewDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }, [viewDate]);

  // Gerar dias do calendário
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // Primeiro dia do mês
    const firstDayOfMonth = new Date(year, month, 1);
    // Último dia do mês
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Dia da semana do primeiro dia (0 = domingo)
    const startWeekday = firstDayOfMonth.getDay();
    // Total de dias no mês
    const totalDays = lastDayOfMonth.getDate();
    
    // Dias do mês anterior para preencher
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const days: Array<{ day: number; isCurrentMonth: boolean; date: Date }> = [];
    
    // Dias do mês anterior
    for (let i = startWeekday - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i),
      });
    }
    
    // Dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }
    
    // Dias do próximo mês para completar 6 semanas (42 dias)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }
    
    return days;
  }, [viewDate]);

  const handleSelect = (day: number) => {
    onChange(day);
    setOpen(false);
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {value ? `Dia ${value}` : placeholder}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <div className="p-4">
            {/* Header com navegação de mês */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold capitalize">
                {monthYearLabel}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="h-8 flex items-center justify-center text-xs text-muted-foreground font-medium"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => item.isCurrentMonth && handleSelect(item.day)}
                  disabled={!item.isCurrentMonth}
                  className={cn(
                    "h-9 w-9 rounded-lg text-sm font-medium transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    item.isCurrentMonth
                      ? "hover:bg-accent hover:text-accent-foreground"
                      : "text-muted-foreground/40 cursor-not-allowed",
                    item.isCurrentMonth && value === item.day
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : ""
                  )}
                >
                  {item.day}
                </button>
              ))}
            </div>

            {/* Nota informativa */}
            <p className="text-xs text-muted-foreground text-center mt-4 pt-3 border-t">
              Selecione o dia que se repete todo mês
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}