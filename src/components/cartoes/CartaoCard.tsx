import { CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { listarParcelasDaFatura } from "@/services/compras-cartao";
import {
  calcularCicloAtualCartao,
  calcularDiasAte,
} from "@/lib/dateUtils";

type StatusFatura = "ABERTA" | "FECHADA";

interface CartaoCardProps {
  cartao: {
    id: string;
    nome: string;
    limite: number;
    bandeira?: string | null;
    dia_fechamento: number;
    dia_vencimento: number;
    cor?: string;
  };
  statusFatura: StatusFatura;
  onClick?: (mesSelecionado: Date) => void;
}

function formatarDataBR(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function monthLabel(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(d);
}

export function CartaoCard({ cartao, statusFatura, onClick }: CartaoCardProps) {
  const [mesRef, setMesRef] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [usado, setUsado] = useState(0);
  const [usadoTitular, setUsadoTitular] = useState(0);

  const limite = cartao.limite;
  const disponivel = Math.max(limite - usado, 0);

  useEffect(() => {
    async function carregarUso() {
      try {
        const parcelas = await listarParcelasDaFatura(cartao.id, mesRef);
        const naoPagas = parcelas.filter((p) => !p.paga);
        const total = naoPagas.reduce((sum, p) => sum + Math.abs(Number(p.valor) || 0), 0);
        const titular = naoPagas
          .filter((p) => p.is_titular === true || !p.responsavel_id)
          .reduce((sum, p) => sum + Math.abs(Number(p.valor) || 0), 0);
        setUsado(total);
        setUsadoTitular(titular);
      } catch (e) {
        console.error("Erro ao calcular uso do cartão:", e);
        setUsado(0);
        setUsadoTitular(0);
      }
    }
    carregarUso();
  }, [cartao.id, mesRef]);

  const percentualReal = limite > 0 ? Math.min((usado / limite) * 100, 100) : 0;

  const [percentualAnimado, setPercentualAnimado] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPercentualAnimado(percentualReal), 200);
    return () => clearTimeout(t);
  }, [percentualReal]);

  const corBarra =
    percentualReal > 85
      ? "hsl(0, 72%, 51%)"
      : percentualReal > 60
      ? "hsl(45, 93%, 47%)"
      : "hsl(142, 71%, 45%)";

  const { dataFechamento, dataVencimento, diasFechamento, diasVencimento } = useMemo(() => {
    const { dataFechamento: fechamento, dataVencimento: vencimento } =
      calcularCicloAtualCartao(cartao.dia_fechamento, cartao.dia_vencimento);

    return {
      dataFechamento: fechamento,
      dataVencimento: vencimento,
      diasFechamento: calcularDiasAte(fechamento),
      diasVencimento: calcularDiasAte(vencimento),
    };
  }, [cartao.dia_fechamento, cartao.dia_vencimento]);

  const statusBadge = percentualReal >= 90
    ? { label: "Limite crítico", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" }
    : statusFatura === "FECHADA"
    ? { label: "Fechada", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" }
    : { label: "Aberta", className: "bg-muted text-muted-foreground" };

  const usadoColor =
    percentualReal > 85
      ? "text-red-600 dark:text-red-400"
      : percentualReal > 60
      ? "text-amber-600 dark:text-amber-400"
      : "text-foreground";

  const disponivelColor =
    limite > 0 && disponivel / limite > 0.2
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-foreground";

  return (
    <div
      onClick={() => onClick?.(mesRef)}
      className="cursor-pointer bg-card border border-border rounded-[12px] shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all overflow-hidden"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[10px] flex items-center justify-center bg-muted">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{cartao.nome}</p>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {cartao.bandeira ?? "Crédito"}
              </p>
            </div>
          </div>

          <span className={`text-[11px] font-medium rounded-full px-2.5 py-0.5 ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Filtro de mês */}
        <div
          className="flex items-center justify-between mb-4 text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="p-1 hover:bg-muted rounded"
            onClick={() => setMesRef((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="capitalize font-medium">{monthLabel(mesRef)}</span>
          <button
            className="p-1 hover:bg-muted rounded"
            onClick={() => setMesRef((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Datas */}
        <div className="p-3 rounded-[10px] bg-muted/50 border border-border mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-muted-foreground">Fechamento</p>
              <p className="text-sm font-medium text-foreground">{formatarDataBR(dataFechamento)}</p>
              <p className="text-[11px] text-muted-foreground/70">
                em {diasFechamento} dia(s)
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Vencimento</p>
              <p className="text-sm font-medium text-foreground">{formatarDataBR(dataVencimento)}</p>
              <p className="text-[11px] text-muted-foreground/70">
                em {diasVencimento} dia(s)
              </p>
            </div>
          </div>
        </div>

        {/* Barra de uso */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Uso do limite</span>
            <span className="font-bold text-foreground">{percentualReal.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${percentualAnimado}%`,
                backgroundColor: corBarra,
              }}
            />
          </div>
        </div>

        {/* Valores */}
        <div className="grid grid-cols-2 gap-3 text-center text-sm">
          <div>
            <p className="text-[11px] text-muted-foreground">Limite</p>
            <p className="font-semibold text-foreground">R$ {limite.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Disponível</p>
            <p className={`font-semibold ${disponivelColor}`}>R$ {disponivel.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Total Fatura</p>
            <p className={`font-semibold ${usadoColor}`}>R$ {usado.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Meu (EU)</p>
            <p className="font-semibold text-blue-600 dark:text-blue-400">R$ {usadoTitular.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
