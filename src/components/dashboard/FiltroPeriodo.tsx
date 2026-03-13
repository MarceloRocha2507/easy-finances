import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface Props {
  mesAtual: Date;
  onMesChange: (mes: Date) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  onResetToCurrentMonth?: () => void;
  mesesDisponiveis?: string[]; // format: "YYYY-MM"
}

function buildOptions(mesesDisponiveis?: string[]) {
  const hoje = new Date();
  const mesAtualKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  let keys: string[];

  if (mesesDisponiveis && mesesDisponiveis.length > 0) {
    // Ensure current month is always included
    const set = new Set(mesesDisponiveis);
    set.add(mesAtualKey);
    keys = Array.from(set).sort();
  } else {
    // Fallback: current month + 12 future + 24 past
    const set = new Set<string>();
    for (let i = -24; i <= 12; i++) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    keys = Array.from(set).sort();
  }

  return keys.map((value) => {
    const [ano, mes] = value.split("-");
    const date = new Date(Number(ano), Number(mes) - 1, 1);
    const label = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(date);
    return { value, label, date };
  });
}

export function FiltroPeriodo({ mesAtual, onMesChange, onRefresh, isLoading, onResetToCurrentMonth, mesesDisponiveis }: Props) {
  const mesOptions = useMemo(() => buildOptions(mesesDisponiveis), [mesesDisponiveis]);
  
  const mesValue = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, "0")}`;
  
  const hoje = new Date();
  const isMesAtual = mesAtual.getFullYear() === hoje.getFullYear() && mesAtual.getMonth() === hoje.getMonth();

  function handleResetToCurrentMonth() {
    if (!isMesAtual) {
      const mesAtualDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      onMesChange(mesAtualDate);
      onResetToCurrentMonth?.();
    }
  }

  const currentIndex = mesOptions.findIndex((o) => o.value === mesValue);

  function handleMesAnterior() {
    if (currentIndex > 0) {
      const prev = mesOptions[currentIndex - 1];
      onMesChange(prev.date);
    }
  }

  function handleProximoMes() {
    if (currentIndex < mesOptions.length - 1) {
      const next = mesOptions[currentIndex + 1];
      onMesChange(next.date);
    }
  }

  function handleSelectChange(value: string) {
    const [ano, mes] = value.split("-");
    onMesChange(new Date(Number(ano), Number(mes) - 1, 1));
  }

  const podeVoltar = currentIndex > 0;
  const podeAvancar = currentIndex < mesOptions.length - 1;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <Button
        variant="outline"
        size="icon"
        onClick={handleMesAnterior}
        disabled={!podeVoltar}
        className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Select value={mesValue} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-[140px] sm:w-[180px] h-8 sm:h-9">
          <Calendar className="h-4 w-4 mr-2 shrink-0" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {mesOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <span className="capitalize">{opt.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!isMesAtual && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetToCurrentMonth}
          className="text-xs text-muted-foreground hover:text-foreground h-8 sm:h-9 px-2"
          title="Voltar ao mês atual"
        >
          Hoje
        </Button>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={handleProximoMes}
        disabled={!podeAvancar}
        className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {onRefresh && (
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      )}
    </div>
  );
}
