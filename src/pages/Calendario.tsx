import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { addMonths, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  useCalendarioEventos,
  CalendarioEvento,
  CORES_TIPO,
  LABELS_TIPO,
} from "@/hooks/useCalendarioEventos";
import {
  CalendarioGrid,
  AgendaLateral,
  DiaDetalhesSheet,
  FiltrosCalendario,
  FiltroTipo,
  FiltroStatus,
} from "@/components/calendario";

export default function Calendario() {
  const navigate = useNavigate();
  const [mesReferencia, setMesReferencia] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("todos");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");

  const { data: eventos = [], isLoading } = useCalendarioEventos(mesReferencia);

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => {
      if (filtroTipo !== "todos" && e.tipo !== filtroTipo) return false;
      if (filtroStatus !== "todos" && e.status !== filtroStatus) return false;
      return true;
    });
  }, [eventos, filtroTipo, filtroStatus]);

  const eventosDoDia = useMemo(() => {
    if (!diaSelecionado) return [];
    const k = format(diaSelecionado, "yyyy-MM-dd");
    return eventosFiltrados.filter(
      (e) => format(e.data, "yyyy-MM-dd") === k
    );
  }, [eventosFiltrados, diaSelecionado]);

  function handleDiaClick(dia: Date) {
    setDiaSelecionado(dia);
    setSheetOpen(true);
  }

  function handleEventoClick(e: CalendarioEvento) {
    setSheetOpen(false);
    switch (e.tipo) {
      case "fatura":
      case "fechamento":
        navigate(`/cartoes/${e.origemId}/despesas`);
        break;
      case "assinatura":
        navigate("/assinaturas");
        break;
      case "meta":
        navigate("/economia/metas");
        break;
      case "investimento":
        navigate("/economia/investimentos");
        break;
      case "acerto":
        navigate("/cartoes/responsaveis");
        break;
      case "receita":
      case "despesa":
        navigate(`/transactions?id=${e.origemId}`);
        break;
    }
  }

  const tiposLegenda: { tipo: keyof typeof CORES_TIPO; label: string }[] = [
    { tipo: "receita", label: "Receita" },
    { tipo: "despesa", label: "Despesa" },
    { tipo: "fatura", label: "Fatura" },
    { tipo: "fechamento", label: "Fechamento" },
    { tipo: "assinatura", label: "Assinatura" },
    { tipo: "meta", label: "Meta" },
    { tipo: "investimento", label: "Investimento" },
  ];

  return (
    <Layout>
      <div className="page-enter max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#111827]" />
              <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
                Calendário
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMesReferencia(new Date())}
                className="text-xs"
              >
                Hoje
              </Button>
              <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-full px-1 py-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={() => setMesReferencia((m) => subMonths(m, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-[#111827] px-2 capitalize min-w-[140px] text-center">
                  {format(mesReferencia, "MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={() => setMesReferencia((m) => addMonths(m, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <FiltrosCalendario
            filtroTipo={filtroTipo}
            setFiltroTipo={setFiltroTipo}
            filtroStatus={filtroStatus}
            setFiltroStatus={setFiltroStatus}
          />
        </div>

        {/* Conteúdo: grid + agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-fade-in">
          <div className="lg:col-span-3">
            {isLoading ? (
              <Skeleton className="w-full h-[500px] rounded-[14px]" />
            ) : (
              <CalendarioGrid
                mesReferencia={mesReferencia}
                eventos={eventosFiltrados}
                diaSelecionado={diaSelecionado}
                onDiaClick={handleDiaClick}
              />
            )}

            {/* Legenda */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#6B7280]">
              {tiposLegenda.map((t) => (
                <div key={t.tipo} className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: CORES_TIPO[t.tipo] }}
                  />
                  {t.label}
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full border border-[#9CA3AF]"
                  style={{ backgroundColor: "transparent" }}
                />
                Concluído
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 lg:max-h-[calc(100vh-180px)]">
            {isLoading ? (
              <Skeleton className="w-full h-[500px] rounded-[14px]" />
            ) : (
              <AgendaLateral
                eventos={eventosFiltrados}
                onEventoClick={handleEventoClick}
              />
            )}
          </div>
        </div>

        <DiaDetalhesSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          dia={diaSelecionado}
          eventos={eventosDoDia}
          onEventoClick={handleEventoClick}
        />
      </div>
    </Layout>
  );
}
