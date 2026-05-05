import { cn } from "@/lib/utils";
import { CalendarioEventoTipo } from "@/hooks/useCalendarioEventos";

export type FiltroTipo = "todos" | CalendarioEventoTipo;
export type FiltroStatus = "todos" | "pendente" | "concluido";

interface FiltrosCalendarioProps {
  filtroTipo: FiltroTipo;
  setFiltroTipo: (v: FiltroTipo) => void;
  filtroStatus: FiltroStatus;
  setFiltroStatus: (v: FiltroStatus) => void;
}

const TIPOS: { value: FiltroTipo; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "receita", label: "Receitas" },
  { value: "despesa", label: "Despesas" },
  { value: "fatura", label: "Faturas" },
  { value: "assinatura", label: "Assinaturas" },
  { value: "meta", label: "Metas" },
  { value: "investimento", label: "Investimentos" },
];

const STATUS: { value: FiltroStatus; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendente", label: "Pendentes" },
  { value: "concluido", label: "Concluídos" },
];

function Pill<T extends string>({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap",
        active
          ? "bg-[#111827] text-white"
          : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
      )}
    >
      {label}
    </button>
  );
}

export function FiltrosCalendario({
  filtroTipo,
  setFiltroTipo,
  filtroStatus,
  setFiltroStatus,
}: FiltrosCalendarioProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {TIPOS.map((t) => (
          <Pill
            key={t.value}
            active={filtroTipo === t.value}
            label={t.label}
            onClick={() => setFiltroTipo(t.value)}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {STATUS.map((s) => (
          <Pill
            key={s.value}
            active={filtroStatus === s.value}
            label={s.label}
            onClick={() => setFiltroStatus(s.value)}
          />
        ))}
      </div>
    </div>
  );
}
