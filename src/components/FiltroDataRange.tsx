import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
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
  onRefresh,
  isLoading,
}: FiltroDataRangeProps) {
  const hoje = new Date();

  const handleHoje = () => {
    onStartDateChange(hoje);
    onEndDateChange(hoje);
  };

  const handleEstaSemana = () => {
    onStartDateChange(startOfWeek(hoje, { weekStartsOn: 1 }));
    onEndDateChange(endOfWeek(hoje, { weekStartsOn: 1 }));
  };

  const handleEsteMes = () => {
    onStartDateChange(startOfMonth(hoje));
    onEndDateChange(endOfMonth(hoje));
  };

  const handleUltimos30Dias = () => {
    onStartDateChange(subDays(hoje, 30));
    onEndDateChange(hoje);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2">
      {/* Linha de datas */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* Data Inicial */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal flex-1 sm:flex-none min-w-0 sm:min-w-[130px]",
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

        {/* Data Final */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal flex-1 sm:flex-none min-w-0 sm:min-w-[130px]",
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
      </div>

      {/* Atalhos + Refresh */}
      <div className="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleHoje} className="text-xs px-2 h-8">
            Hoje
          </Button>
          <Button variant="ghost" size="sm" onClick={handleEsteMes} className="text-xs px-2 h-8">
            Mês
          </Button>
          <Button variant="ghost" size="sm" onClick={handleEstaSemana} className="text-xs px-2 h-8 hidden sm:inline-flex">
            Semana
          </Button>
          <Button variant="ghost" size="sm" onClick={handleUltimos30Dias} className="text-xs px-2 h-8 hidden sm:inline-flex">
            30 dias
          </Button>
        </div>
        
        {onRefresh && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        )}
      </div>
    </div>
  );
}
