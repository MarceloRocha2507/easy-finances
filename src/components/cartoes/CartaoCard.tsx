import { CreditCard, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { listarParcelasDaFatura } from "@/services/transactions";

/* ======================================================
   Tipos
====================================================== */

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

/* ======================================================
   Utils de Data
====================================================== */

function clampDiaNoMes(ano: number, mesIndex: number, dia: number) {
  const ultimoDia = new Date(ano, mesIndex + 1, 0).getDate();
  return Math.min(Math.max(dia, 1), ultimoDia);
}

function proximaOcorrenciaDia(dia: number, base = new Date()) {
  const ano = base.getFullYear();
  const mes = base.getMonth();
  const hoje = base.getDate();

  const diaAtual = clampDiaNoMes(ano, mes, dia);
  const dataAtual = new Date(ano, mes, diaAtual);

  if (dataAtual < new Date(ano, mes, hoje)) {
    const prox = new Date(ano, mes + 1, 1);
    const diaProx = clampDiaNoMes(prox.getFullYear(), prox.getMonth(), dia);
    return new Date(prox.getFullYear(), prox.getMonth(), diaProx);
  }

  return dataAtual;
}

function diasAte(data: Date) {
  const hoje = new Date();
  const inicioHoje = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );
  const diff = data.getTime() - inicioHoje.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
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

// Helper to convert hex to RGB values
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/* ======================================================
   Component
====================================================== */

export function CartaoCard({
  cartao,
  statusFatura,
  onClick,
}: CartaoCardProps) {
  const corCartao = cartao.cor || "#6366f1";
  const rgb = hexToRgb(corCartao);
  const rgbString = rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : "99, 102, 241";

  const [mesRef, setMesRef] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [usado, setUsado] = useState(0);

  const limite = cartao.limite;
  const disponivel = Math.max(limite - usado, 0);

  /* ======================================================
     🔑 BUSCA DO USO DO MÊS SELECIONADO
  ====================================================== */

  useEffect(() => {
    async function carregarUso() {
      try {
        const parcelas = await listarParcelasDaFatura(cartao.id, mesRef);

        const total = parcelas
          .filter((p) => !p.paga)
          .reduce((sum, p) => sum + Math.abs(Number(p.valor) || 0), 0);

        setUsado(total);
      } catch (e) {
        console.error("Erro ao calcular uso do cartão:", e);
        setUsado(0);
      }
    }

    carregarUso();
  }, [cartao.id, mesRef]);

  const percentualReal =
    limite > 0 ? Math.min((usado / limite) * 100, 100) : 0;

  const [percentualAnimado, setPercentualAnimado] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPercentualAnimado(percentualReal), 200);
    return () => clearTimeout(t);
  }, [percentualReal]);

  const corBarra =
    percentualReal < 60
      ? corCartao
      : percentualReal < 85
      ? "#facc15"
      : "#ef4444";

  const {
    dataFechamento,
    dataVencimento,
    diasFechamento,
    diasVencimento,
  } = useMemo(() => {
    const fechamento = proximaOcorrenciaDia(cartao.dia_fechamento);
    const vencimento = proximaOcorrenciaDia(cartao.dia_vencimento);

    return {
      dataFechamento: fechamento,
      dataVencimento: vencimento,
      diasFechamento: diasAte(fechamento),
      diasVencimento: diasAte(vencimento),
    };
  }, [cartao.dia_fechamento, cartao.dia_vencimento]);

  const statusVisual =
    percentualReal >= 90
      ? {
          label: "Limite crítico",
          className: "bg-red-500/15 text-red-300 border border-red-500/20",
        }
      : statusFatura === "ABERTA"
      ? {
          label: "Aberta",
          className: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20",
        }
      : {
          label: "Fechada",
          className: "bg-slate-500/15 text-slate-300 border border-slate-500/20",
        };

  return (
    <div
      onClick={() => onClick?.(mesRef)}
      className="
        relative cursor-pointer
        rounded-[28px] p-6
        text-slate-100
        shadow-xl
        hover:-translate-y-1 hover:shadow-2xl
        transition-all duration-300
        overflow-hidden
      "
      style={{
        background: `linear-gradient(135deg, rgb(15 23 42) 0%, rgb(15 23 42) 60%, rgba(${rgbString}, 0.3) 100%)`,
        boxShadow: `0 20px 40px -10px rgba(${rgbString}, 0.3)`,
      }}
    >
      {/* Glow */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: `linear-gradient(135deg, rgba(${rgbString}, 0.1) 0%, transparent 50%, rgba(${rgbString}, 0.05) 100%)`,
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div 
            className="h-12 w-12 rounded-2xl backdrop-blur flex items-center justify-center"
            style={{ backgroundColor: `rgba(${rgbString}, 0.2)` }}
          >
            <CreditCard className="h-6 w-6" style={{ color: corCartao }} />
          </div>

          <div>
            <p className="font-semibold tracking-tight">{cartao.nome}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              {cartao.bandeira ?? "Crédito"}
            </p>
          </div>
        </div>

        <span
          className={`text-[11px] font-semibold px-3 py-1 rounded-full backdrop-blur ${statusVisual.className}`}
        >
          {statusVisual.label}
        </span>
      </div>

      {/* 🔹 Filtro de mês no card */}
      <div
        className="relative flex items-center justify-between mb-4 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() =>
            setMesRef(
              (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)
            )
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="capitalize font-medium">
          {monthLabel(mesRef)}
        </span>

        <button
          onClick={() =>
            setMesRef(
              (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)
            )
          }
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Datas */}
      <div className="relative grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p className="text-slate-400">Fechamento</p>
          <p className="font-medium">
            {formatarDataBR(dataFechamento)}
          </p>
          <p className="text-xs text-slate-500">
            Fecha em {diasFechamento} dia(s)
          </p>
        </div>

        <div className="text-right">
          <p className="text-slate-400">Vencimento</p>
          <p className="font-medium">
            {formatarDataBR(dataVencimento)}
          </p>
          <p className="text-xs text-slate-500">
            Vence em {diasVencimento} dia(s)
          </p>
        </div>
      </div>

      {/* Uso do limite */}
      <div className="relative mb-6">
        <div className="flex justify-between text-xs mb-2 text-slate-400">
          <span>Uso do limite</span>
          <span>{percentualReal.toFixed(0)}%</span>
        </div>

        <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ 
              width: `${percentualAnimado}%`,
              backgroundColor: corBarra,
            }}
          />
        </div>

        {percentualReal >= 80 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-red-300">
            <AlertTriangle className="h-3 w-3" />
            Limite quase comprometido
          </div>
        )}
      </div>

      {/* Valores */}
      <div className="relative grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-slate-400">Limite</p>
          <p className="font-semibold">
            R$ {limite.toFixed(2)}
          </p>
        </div>

        <div>
          <p className="text-slate-400">Usado</p>
          <p className="font-semibold">
            R$ {usado.toFixed(2)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-slate-400">Disponível</p>
          <p className="font-semibold" style={{ color: corCartao }}>
            R$ {disponivel.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
