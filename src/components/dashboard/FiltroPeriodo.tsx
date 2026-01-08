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
}

function getMesOptions() {
  const options = [];
  const hoje = new Date();

  for (let i = 0; i < 24; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const value = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(data);

    options.push({ value, label, date: data });
  }

  return options;
}

export function FiltroPeriodo({ mesAtual, onMesChange, onRefresh, isLoading, onResetToCurrentMonth }: Props) {
  const mesOptions = getMesOptions();
  
  const mesValue = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, "0")}`;
  
  // Verificar se está no mês atual
  const hoje = new Date();
  const isMesAtual = mesAtual.getFullYear() === hoje.getFullYear() && mesAtual.getMonth() === hoje.getMonth();

  function handleResetToCurrentMonth() {
    if (!isMesAtual) {
      const mesAtualDate = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      onMesChange(mesAtualDate);
      onResetToCurrentMonth?.();
    }
  }

  function handleMesAnterior() {
    const novoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() - 1, 1);
    onMesChange(novoMes);
  }

  function handleProximoMes() {
    const novoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1);
    const hoje = new Date();
    if (novoMes <= hoje) {
      onMesChange(novoMes);
    }
  }

  function handleSelectChange(value: string) {
    const [ano, mes] = value.split("-");
    onMesChange(new Date(Number(ano), Number(mes) - 1, 1));
  }

  const podeAvancar = mesAtual < new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleMesAnterior}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Select value={mesValue} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-[180px]">
          <Calendar className="h-4 w-4 mr-2" />
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
          className="text-xs text-muted-foreground hover:text-foreground"
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
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {onRefresh && (
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-9 w-9"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      )}
    </div>
  );
}