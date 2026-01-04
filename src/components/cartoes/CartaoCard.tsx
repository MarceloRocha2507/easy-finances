import { CreditCard, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { listarParcelasDaFatura } from "@/services/transactions";

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
  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
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

export function CartaoCard({ cartao, statusFatura, onClick }: CartaoCardProps) {
  const corCartao = cartao.cor || "#64748b";

  const [mesRef, setMesRef] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [usado, setUsado] = useState(0);

  const limite = cartao.limite;
  const disponivel = Math.max(limite - usado, 0);

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

  const percentualReal = limite > 0 ? Math.min((usado / limite) * 100, 100) : 0;

  const [percentualAnimado, setPercentualAnimado] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPercentualAnimado(percentualReal), 200);
    return () => clearTimeout(t);
  }, [percentualReal]);

  const corBarra =
    percentualReal < 60
      ? "hsl(152, 60%, 36%)"
      : percentualReal < 85
      ? "hsl(45, 93%, 47%)"
      : "hsl(0, 65%, 51%)";

  const { dataFechamento, dataVencimento, diasFechamento, diasVencimento } = useMemo(() => {
    const fechamento = proximaOcorrenciaDia(cartao.dia_fechamento);
    const vencimento = proximaOcorrenciaDia(cartao.dia_vencimento);

    return {
      dataFechamento: fechamento,
      dataVencimento: vencimento,
      diasFechamento: diasAte(fechamento),
      diasVencimento: diasAte(vencimento),
    };
  }, [cartao.dia_fechamento, cartao.dia_vencimento]);

  const statusLabel =
    percentualReal >= 90
      ? "Limite crítico"
      : statusFatura === "ABERTA"
      ? "Aberta"
      : "Fechada";

  return (
    <div
      onClick={() => onClick?.(mesRef)}
      className="p-5 border rounded-md bg-card cursor-pointer hover:bg-secondary/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-md flex items-center justify-center"
            style={{ backgroundColor: `${corCartao}15` }}
          >
            <CreditCard className="h-5 w-5" style={{ color: corCartao }} />
          </div>
          <div>
            <p className="text-sm font-medium">{cartao.nome}</p>
            <p className="text-xs text-muted-foreground uppercase">
              {cartao.bandeira ?? "Crédito"}
            </p>
          </div>
        </div>

        <span className="text-xs text-muted-foreground border rounded px-2 py-0.5">
          {statusLabel}
        </span>
      </div>

      {/* Filtro de mês */}
      <div
        className="flex items-center justify-between mb-4 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="p-1 hover:bg-secondary rounded"
          onClick={() => setMesRef((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="capitalize font-medium">{monthLabel(mesRef)}</span>

        <button
          className="p-1 hover:bg-secondary rounded"
          onClick={() => setMesRef((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Datas */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Fechamento</p>
          <p className="font-medium">{formatarDataBR(dataFechamento)}</p>
          <p className="text-xs text-muted-foreground">
            em {diasFechamento} dia(s)
          </p>
        </div>

        <div className="text-right">
          <p className="text-muted-foreground text-xs">Vencimento</p>
          <p className="font-medium">{formatarDataBR(dataVencimento)}</p>
          <p className="text-xs text-muted-foreground">
            em {diasVencimento} dia(s)
          </p>
        </div>
      </div>

      {/* Barra de uso */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5 text-muted-foreground">
          <span>Uso do limite</span>
          <span>{percentualReal.toFixed(0)}%</span>
        </div>

        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentualAnimado}%`,
              backgroundColor: corBarra,
            }}
          />
        </div>

        {percentualReal >= 80 && (
          <div className="flex items-center gap-1 mt-2 text-xs text-expense">
            <AlertTriangle className="h-3 w-3" />
            Limite alto
          </div>
        )}
      </div>

      {/* Valores */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Limite</p>
          <p className="font-medium">R$ {limite.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-muted-foreground text-xs">Usado</p>
          <p className="font-medium">R$ {usado.toFixed(2)}</p>
        </div>

        <div className="text-right">
          <p className="text-muted-foreground text-xs">Disponível</p>
          <p className="font-medium text-income">R$ {disponivel.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
