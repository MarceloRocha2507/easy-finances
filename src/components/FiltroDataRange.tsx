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
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal min-w-0 sm:min-w-[130px]",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1.5 sm:mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">
                {startDate ? format(startDate, "dd/MM/yy", { locale: ptBR }) : "Início"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
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

        <span className="text-muted-foreground text-xs sm:text-sm shrink-0">até</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal min-w-0 sm:min-w-[130px]",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1.5 sm:mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">
                {endDate ? format(endDate, "dd/MM/yy", { locale: ptBR }) : "Fim"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
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

        <div className={cn(
          "flex items-center gap-0.5 rounded-md border border-input px-1 h-8",
          isMesAtivo && "bg-accent border-accent"
        )}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleMesNavigation('prev')}
            className="h-6 w-6 p-0"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                onClick={handleResetMesAtual}
                className={cn(
                  "text-xs font-medium capitalize min-w-[110px] text-center select-none",
                  isMesAtivo && "text-accent-foreground",
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
            className="h-6 w-6 p-0"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
