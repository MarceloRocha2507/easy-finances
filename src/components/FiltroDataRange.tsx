import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FiltroDataRangeProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function FiltroDataRange({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: FiltroDataRangeProps) {
  const hoje = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));

  const isMesAtivo = (() => {
    if (!startDate || !endDate) return false;
    const inicioMes = startOfMonth(startDate);
    const fimMes = endOfMonth(startDate);
    return isSameDay(startDate, inicioMes) && isSameDay(endDate, fimMes);
  })();

  const handleMesNavigation = (direcao: 'prev' | 'next') => {
    const novoMes = direcao === 'next' ? addMonths(mesSelecionado, 1) : subMonths(mesSelecionado, 1);
    setMesSelecionado(novoMes);
    onStartDateChange(startOfMonth(novoMes));
    onEndDateChange(endOfMonth(novoMes));
  };

  const mesLabel = format(mesSelecionado, "MMMM yyyy", { locale: ptBR });

  const isMesAtual = mesSelecionado.getFullYear() === hoje.getFullYear()
    && mesSelecionado.getMonth() === hoje.getMonth();

  const handleResetMesAtual = () => {
    if (isMesAtual) return;
    const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    setMesSelecionado(mesAtual);
    onStartDateChange(startOfMonth(mesAtual));
    onEndDateChange(endOfMonth(mesAtual));
  };

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-gray-50/50 rounded-lg border border-gray-100 w-full">
        <div className="flex items-center gap-1 rounded-md bg-white border border-gray-200 px-1.5 h-9 shadow-sm shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMesNavigation('prev')}
            className="h-7 w-7 p-0 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                onClick={handleResetMesAtual}
                className={cn(
                  "text-[13px] font-semibold capitalize min-w-[100px] text-center select-none text-gray-700",
                  !isMesAtual && "cursor-pointer hover:text-primary",
                  isMesAtual && "cursor-default"
                )}
              >
                {mesLabel}
              </span>
            </TooltipTrigger>
            {!isMesAtual && (
              <TooltipContent>Voltar para o mês atual</TooltipContent>
            )}
          </Tooltip>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMesNavigation('next')}
            className="h-7 w-7 p-0 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </Button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 sm:ml-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 px-2 text-[13px] font-medium text-gray-600 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-400 shrink-0" />
                  <span className="tabular-nums">
                    {startDate ? format(startDate, "dd/MM/yy", { locale: ptBR }) : "Início"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50 bg-popover shadow-xl border-gray-200" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={onStartDateChange}
                  initialFocus
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <span className="text-gray-400 text-[11px] font-medium uppercase tracking-wider">até</span>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 px-2 text-[13px] font-medium text-gray-600 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-gray-400 shrink-0" />
                  <span className="tabular-nums">
                    {endDate ? format(endDate, "dd/MM/yy", { locale: ptBR }) : "Fim"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50 bg-popover shadow-xl border-gray-200" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={onEndDateChange}
                  initialFocus
                  locale={ptBR}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
