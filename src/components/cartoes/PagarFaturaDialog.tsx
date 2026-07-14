import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, parseBrazilianCurrency } from "@/lib/formatters";
import { Cartao } from "@/services/cartoes";
import {
  ParcelaFatura,
  calcularResumoPorResponsavel,
  pagarFaturaComTransacao,
} from "@/services/compras-cartao";
import {
  CreditCard,
  User,
  Check,
  Wallet,
  AlertCircle,
  Loader2,
  Pencil,
} from "lucide-react";
import { BancoSelector } from "@/components/bancos/BancoSelector";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { pushMonitorHubEvent } from "@/lib/monitorhub";

interface Props {
  cartao: Cartao;
  mesReferencia: Date;
  parcelas: ParcelaFatura[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid: () => void;
}

interface Participante {
  responsavel_id: string;
  nome: string;
  is_titular: boolean;
  parteOriginal: number; // parte devida por essa pessoa (só referência)
  valor: number;         // quanto vai pagar ao banco
  editando: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const fmtInput = (n: number) => n.toFixed(2).replace(".", ",");

export function PagarFaturaDialog({
  cartao,
  mesReferencia,
  parcelas,
  open,
  onOpenChange,
  onPaid,
}: Props) {
  const queryClient = useQueryClient();
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [ajuste, setAjuste] = useState(0); // "sem-responsavel" (créditos/estornos)
  const [loading, setLoading] = useState(false);
  const [carregandoResumo, setCarregandoResumo] = useState(false);
  const [bancoIdSelecionado, setBancoIdSelecionado] = useState<string | null>(
    cartao?.banco_id || null,
  );

  const totalFatura = useMemo(
    () => round2(participantes.reduce((s, p) => s + p.parteOriginal, 0) + ajuste),
    [participantes, ajuste],
  );

  const somaAtual = useMemo(
    () => round2(participantes.reduce((s, p) => s + p.valor, 0)),
    [participantes],
  );

  const somaValida = Math.abs(somaAtual - totalFatura) < 0.01;

  const titular = participantes.find((p) => p.is_titular);
  const valorQueEuPago = titular?.valor ?? 0;

  useEffect(() => {
    if (!open || !cartao) return;
    let cancelado = false;

    async function carregar() {
      setCarregandoResumo(true);
      try {
        const resumo = await calcularResumoPorResponsavel(cartao.id, mesReferencia);
        if (cancelado) return;

        const semResp = resumo.find((r) => r.responsavel_id === "sem-responsavel");
        const ajusteVal = semResp ? round2(semResp.total) : 0;

        // Titular absorve o ajuste (créditos/estornos abatem da parte dele)
        const lista: Participante[] = resumo
          .filter((r) => r.responsavel_id !== "sem-responsavel")
          .map((r) => {
            const parte = r.is_titular ? round2(r.total + ajusteVal) : round2(r.total);
            return {
              responsavel_id: r.responsavel_id,
              nome: r.responsavel_apelido || r.responsavel_nome,
              is_titular: r.is_titular,
              parteOriginal: parte,
              valor: parte,
              editando: false,
            };
          });

        // Garantir que o titular exista
        if (!lista.some((p) => p.is_titular)) {
          lista.unshift({
            responsavel_id: "titular-implicito",
            nome: "Eu",
            is_titular: true,
            parteOriginal: 0,
            valor: 0,
            editando: false,
          });
        }

        // Titular sempre no topo
        lista.sort((a, b) => (a.is_titular === b.is_titular ? 0 : a.is_titular ? -1 : 1));

        setAjuste(0); // ajuste já foi absorvido no titular; total = soma das partes
        setParticipantes(lista);
      } catch (e) {
        console.error(e);
        toast.error("Erro ao carregar resumo de responsáveis");
      } finally {
        if (!cancelado) setCarregandoResumo(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [open, cartao?.id, mesReferencia]);

  // Redistribuição automática: ao alterar `idx`, ajusta os demais para que a soma = totalFatura
  function alterarValor(idx: number, novoValorStr: string) {
    setParticipantes((prev) => {
      const total = round2(prev.reduce((s, p) => s + p.parteOriginal, 0));
      const novo = round2(parseBrazilianCurrency(novoValorStr) || 0);

      // Trava: não permitir negativo ou maior que o total
      const clamped = Math.max(0, Math.min(novo, total));

      const restante = round2(total - clamped);
      const outros = prev.filter((_, i) => i !== idx);
      const somaOutrosAntigo = round2(outros.reduce((s, p) => s + p.valor, 0));

      return prev.map((p, i) => {
        if (i === idx) return { ...p, valor: clamped };
        if (outros.length === 1) {
          return { ...p, valor: restante };
        }
        // Distribuir proporcionalmente ao valor anterior; se todos zerados, dividir igualmente
        const proporcao =
          somaOutrosAntigo > 0 ? p.valor / somaOutrosAntigo : 1 / outros.length;
        return { ...p, valor: round2(restante * proporcao) };
      });
    });
  }

  function toggleEdicao(idx: number) {
    setParticipantes((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, editando: !p.editando } : p)),
    );
  }

  async function handleConfirmar() {
    if (!cartao) return;
    if (!somaValida) {
      toast.error("A soma dos valores deve ser igual ao total da fatura");
      return;
    }
    if (participantes.some((p) => p.valor < 0)) {
      toast.error("Valores negativos não são permitidos");
      return;
    }

    setLoading(true);
    try {
      const acertosRecebidos = participantes
        .filter((p) => !p.is_titular && p.responsavel_id !== "titular-implicito" && p.valor > 0)
        .map((p) => ({
          responsavel_id: p.responsavel_id,
          valor: round2(p.valor),
          nome: p.nome,
        }));

      await pagarFaturaComTransacao({
        cartaoId: cartao.id,
        nomeCartao: cartao.nome,
        mesReferencia,
        valorTotal: round2(valorQueEuPago),
        bancoId: bancoIdSelecionado,
        acertosRecebidos,
      });

      toast.success(`Fatura paga! Você pagou ${formatCurrency(valorQueEuPago)} ao banco.`);

      pushMonitorHubEvent("fatura_paga", round2(valorQueEuPago), {
        cartao_id: cartao.id,
        cartao: cartao.nome,
        mes_referencia: mesReferencia,
      });

      queryClient.invalidateQueries({ queryKey: ["complete-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-completo"] });
      queryClient.invalidateQueries({ queryKey: ["bancos"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });

      onPaid();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao pagar fatura:", error);
      toast.error("Erro ao registrar pagamento da fatura");
    } finally {
      setLoading(false);
    }
  }

  const mesLabel = mesReferencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const parcelasPendentes = parcelas.filter((p) => !p.paga);
  const temParcelasPendentes = parcelasPendentes.length > 0;

  if (!temParcelasPendentes) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" />
              Fatura já paga
            </DialogTitle>
            <DialogDescription>
              Todas as parcelas de {mesLabel} já foram pagas.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (totalFatura <= 0 && !carregandoResumo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              Fatura sem valor a pagar
            </DialogTitle>
            <DialogDescription>
              O total da fatura de <span className="capitalize">{mesLabel}</span> é{" "}
              <strong>{formatCurrency(totalFatura)}</strong> (provavelmente devido a estornos).
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden flex flex-col">
        <div className="px-5 pt-4 pb-4 bg-muted border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              Pagar Fatura - {cartao.nome}
            </DialogTitle>
            <DialogDescription className="capitalize">{mesLabel}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 py-4 overflow-y-auto min-h-0 max-h-[calc(90vh-80px)]">
          {carregandoResumo ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Total da fatura */}
              <div className="p-4 rounded-lg bg-muted/50 border flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Valor total da fatura</span>
                <span className="text-xl font-bold text-destructive">
                  {formatCurrency(totalFatura)}
                </span>
              </div>

              {/* Banco */}
              {!cartao.banco_id && (
                <BancoSelector
                  value={bancoIdSelecionado}
                  onChange={setBancoIdSelecionado}
                  label="Debitar do banco"
                  placeholder="Selecione o banco"
                  showAddButton={false}
                  autoSelectDefault
                />
              )}

              {/* Quem pagou quanto */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quem pagou quanto?</Label>
                <div className="space-y-2">
                  {participantes.map((p, idx) => (
                    <LinhaParticipante
                      key={p.responsavel_id}
                      p={p}
                      total={totalFatura}
                      onToggleEdit={() => toggleEdicao(idx)}
                      onChange={(v) => alterarValor(idx, v)}
                    />
                  ))}
                </div>

                {/* Totalizador */}
                <div
                  className={cn(
                    "p-3 rounded-lg border text-sm flex items-center justify-between",
                    somaValida
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                      : "bg-destructive/10 border-destructive/30 text-destructive",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {somaValida ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span>Total informado</span>
                  </div>
                  <span className="font-bold">
                    {formatCurrency(somaAtual)} / {formatCurrency(totalFatura)}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Resumo */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                <span className="font-medium">Valor que eu pago ao banco</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(valorQueEuPago)}
                </span>
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleConfirmar}
                disabled={loading || !somaValida}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Confirmar Pagamento
              </Button>

              {!somaValida && (
                <p className="text-xs text-destructive text-center">
                  A soma dos valores deve ser exatamente igual ao total da fatura
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LinhaParticipante({
  p,
  total,
  onToggleEdit,
  onChange,
}: {
  p: Participante;
  total: number;
  onToggleEdit: () => void;
  onChange: (v: string) => void;
}) {
  const [rascunho, setRascunho] = useState(fmtInput(p.valor));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!p.editando) setRascunho(fmtInput(p.valor));
  }, [p.valor, p.editando]);

  useEffect(() => {
    if (p.editando) inputRef.current?.focus();
  }, [p.editando]);

  const valorNum = parseBrazilianCurrency(rascunho) || 0;
  const invalido = valorNum < 0 || valorNum > total + 0.01;

  function confirmar() {
    if (invalido) {
      toast.error(`Valor inválido — deve estar entre R$ 0,00 e ${formatCurrency(total)}`);
      setRascunho(fmtInput(p.valor));
      onToggleEdit();
      return;
    }
    onChange(rascunho);
    onToggleEdit();
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
      <div
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
          p.is_titular ? "bg-primary/20" : "bg-primary/10",
        )}
      >
        {p.is_titular ? (
          <Wallet className="h-4 w-4 text-primary" />
        ) : (
          <User className="h-4 w-4 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {p.is_titular ? `Eu (${p.nome}) paguei` : `${p.nome} pagou`}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Parte devida: {formatCurrency(p.parteOriginal)}
        </p>
      </div>

      {p.editando ? (
        <div className="flex items-center gap-1.5">
          <Input
            ref={inputRef}
            inputMode="decimal"
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmar();
              if (e.key === "Escape") {
                setRascunho(fmtInput(p.valor));
                onToggleEdit();
              }
            }}
            className={cn(
              "h-8 w-24 text-sm text-right",
              invalido && "border-destructive focus-visible:ring-destructive",
            )}
          />
          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={confirmar}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold tabular-nums">
            {formatCurrency(p.valor)}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={onToggleEdit}
            aria-label="Editar valor"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      )}
    </div>
  );
}
