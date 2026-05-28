import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Cartao } from "@/services/cartoes";
import { criarCompraCartao } from "@/services/compras-cartao";
import { calcularMesFaturaCartaoStr } from "@/lib/dateUtils";
import { CheckCircle2, Loader2, Sparkles, Trash2, X, AlertTriangle, Download, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FaturaPicpayBreakdown } from "./FaturaPicpayBreakdown";
import { useResponsaveis } from "@/services/responsaveis";

export interface CompraExtraida {
  valor: number | null;
  estabelecimento: string | null;
  data: string | null;
  parcelas: number;
  parcela_atual?: number;
  valor_eh_parcela?: boolean;
  linha_original?: string | null;
  valor_texto?: string | null;
  tipo?: "compra" | "iof" | "encargo" | "anuidade" | "juros" | "seguro" | "estorno" | "estorno_parcelamento" | "compra_substituida" | "pagamento_fatura" | "outro";
  sinal?: "debito" | "credito";
  riscada?: boolean;
  riscada_sem_credito?: boolean;
  ignorar?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartao: Cartao;
  responsavelId: string;
  categoriaId?: string;
  compras: CompraExtraida[];
  onSaved: () => void;
  isPicpay?: boolean;
  resumoPicpay?: { saldoAnterior: number | null; lancamentosResumo: number | null };
}

type LinhaCompra = {
  incluir: boolean;
  descricao: string;
  valor: string;
  data: string;
  parcelas: string;
  parcelaAtual: string;
  tipo: string;
  sinal: "debito" | "credito";
  valorEhParcela: boolean;
  responsavelId: string;
  possivelDuplicada?: boolean;
  creditoParcelamentoGenerico?: boolean;
  estornoParcelamento?: boolean;
  compraSubstituida?: boolean;
  riscadaSemCredito?: boolean;
};

const inputStyle: React.CSSProperties = {
  border: "1px solid #E5E7EB",
  borderRadius: 6,
  padding: "6px 8px",
  fontSize: 13,
  color: "#111827",
  background: "#fff",
  outline: "none",
  width: "100%",
};

const isCreditoParcelamentoGenerico = (descricao?: string | null, tipo?: string, sinal?: "debito" | "credito") => {
  const texto = (descricao || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  // Legado: só vale para "estorno" genérico (sem o novo tipo dedicado)
  return sinal === "credito" && tipo === "estorno" && texto.includes("credito parcelamento compra");
};

export function RevisarComprasLoteDialog({
  open,
  onOpenChange,
  cartao,
  responsavelId,
  categoriaId,
  compras,
  onSaved,
  isPicpay = false,
  resumoPicpay,
}: Props) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { data: responsaveis = [] } = useResponsaveis();
  const [salvando, setSalvando] = useState(false);
  const [progresso, setProgresso] = useState<{ atual: number; total: number } | null>(null);
  const [buscandoDuplicadas, setBuscandoDuplicadas] = useState(true);
  const [responsavelLote, setResponsavelLote] = useState("");

  const [linhas, setLinhas] = useState<LinhaCompra[]>(() => {
    const hoje = new Date().toISOString().split("T")[0];
    return compras.map((c) => {
      const total = Math.min(Math.max(c.parcelas || 1, 1), 24);
      const atual = Math.min(Math.max(c.parcela_atual || 1, 1), total);
      const sinal = c.sinal || "debito";
      const tipo = c.tipo || "compra";
      const estornoParcelamento = sinal === "credito" && tipo === "estorno_parcelamento";
      const compraSubstituida = c.ignorar === true || tipo === "compra_substituida";
      const creditoParcelamentoGenerico = !estornoParcelamento && isCreditoParcelamentoGenerico(c.estabelecimento, tipo, sinal);
      const ehPagamento = tipo === "pagamento_fatura";

      // Padrão: incluir tudo exceto compras substituídas, créditos genéricos legados e pagamentos de fatura
      let incluir = true;
      if (compraSubstituida) incluir = false;
      else if (creditoParcelamentoGenerico) incluir = false;
      else if (ehPagamento) incluir = false;

      // Preferir a data vinda do extrato (CSV Nubank, etc.); fallback para hoje
      const dataLinha = c.data && /^\d{4}-\d{2}-\d{2}$/.test(c.data) ? c.data : hoje;

      return {
        incluir,
        descricao: c.estabelecimento?.trim() || "",
        valor: typeof c.valor === "number" && c.valor > 0 ? c.valor.toFixed(2).replace(".", ",") : "",
        data: dataLinha,
        parcelas: String(total),
        parcelaAtual: String(atual),
        tipo,
        sinal,
        valorEhParcela: c.valor_eh_parcela === true,
        responsavelId,
        creditoParcelamentoGenerico,
        estornoParcelamento,
        compraSubstituida,
        riscadaSemCredito: c.riscada_sem_credito === true,
      };
    });
  });

  // Verificar duplicatas no banco ao abrir
  useEffect(() => {
    async function verificarDuplicatas() {
      if (!open || compras.length === 0) return;

      setBuscandoDuplicadas(true);
      try {
        // Buscar compras deste cartão dos últimos 90 dias (cobre faturas parceladas de meses anteriores)
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 90);
        const dataLimiteStr = dataLimite.toISOString().split("T")[0];

        const { data: existentes, error } = await supabase
          .from("compras_cartao")
          .select("valor_total, parcelas, descricao, data_compra")
          .eq("cartao_id", cartao.id)
          .gte("data_compra", dataLimiteStr);

        if (error) throw error;

        if (existentes && existentes.length > 0) {
          setLinhas(prev => prev.map(l => {
            const valorNum = parseFloat(l.valor.replace(",", ".")) || 0;
            const numParcelas = Math.min(Math.max(parseInt(l.parcelas) || 1, 1), 24);

            // Calcular o valorTotal como será salvo no banco:
            // valorEhParcela=true → valor é da parcela → total = valor × parcelas
            // valorEhParcela=false → valor já é o total
            const valorTotalCalculado = l.valorEhParcela ? valorNum * numParcelas : valorNum;
            const valorBusca = l.sinal === "credito" ? -valorTotalCalculado : valorTotalCalculado;

            // Critério de duplicidade: mesmo valor_total E descrição parecida OU mesma data de compra
            const ehDuplicada = existentes.some(ex => {
              const mesmoValor = Math.abs(Number(ex.valor_total) - valorBusca) < 0.02;
              const mesmaDescricao =
                (ex.descricao?.toLowerCase() || "").includes(l.descricao.toLowerCase().slice(0, 10)) ||
                l.descricao.toLowerCase().includes((ex.descricao?.toLowerCase() || "").slice(0, 10));
              const mesmaData = ex.data_compra === l.data;

              return mesmoValor && (mesmaDescricao || mesmaData);
            });

            return {
              ...l,
              possivelDuplicada: ehDuplicada,
              // Desmarcar por padrão se for duplicada
              incluir: ehDuplicada ? false : l.incluir
            };
          }));
        }
      } catch (err) {
        console.error("Erro ao verificar duplicatas:", err);
      } finally {
        setBuscandoDuplicadas(false);
      }
    }

    verificarDuplicatas();
  }, [open, cartao.id]);

  const atualizar = (i: number, patch: Partial<LinhaCompra>) =>
    setLinhas((arr) => arr.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const remover = (i: number) =>
    setLinhas((arr) => arr.filter((_, idx) => idx !== i));

  const selecionadas = useMemo(() => linhas.filter((l) => l.incluir), [linhas]);

  // Quanto cada linha vai pesar na FATURA DESTE MÊS (igual ao total mostrado pelo banco)
  const valorEsteMes = (l: LinhaCompra): number => {
    const v = parseFloat(l.valor.replace(",", ".")) || 0;
    const p = Math.min(Math.max(parseInt(l.parcelas) || 1, 1), 24);
    if (l.valorEhParcela) return v; // valor já é da parcela do mês
    if (p > 1) return v / p; // valor é total da compra → divide
    return v;
  };

  const { totalSelecionado, totalDebitos, totalCreditos, totalCreditosPendentes, totalPagamentosExcluidos } = useMemo(() => {
    let deb = 0;
    let cre = 0;
    let crePend = 0;
    let pagamentos = 0;
    for (const l of selecionadas) {
      const v = valorEsteMes(l);
      if (l.sinal === "credito") cre += v;
      else deb += v;
    }
    for (const l of linhas) {
      if (!l.creditoParcelamentoGenerico || l.incluir) continue;
      crePend += valorEsteMes(l);
    }
    // Soma os pagamentos excluídos por padrão (pagamento_fatura)
    for (const l of linhas) {
      if (l.tipo === "pagamento_fatura" && !l.incluir) {
        pagamentos += valorEsteMes(l);
      }
    }
    return {
      totalDebitos: deb,
      totalCreditos: cre,
      totalSelecionado: deb - cre,
      totalCreditosPendentes: crePend,
      totalPagamentosExcluidos: pagamentos,
    };
  }, [selecionadas, linhas]);


  async function handleSalvarTudo() {
    if (salvando) return;
    if (selecionadas.length === 0) {
      toast({ title: "Selecione ao menos uma compra", variant: "destructive" });
      return;
    }
    // valida
    for (const [i, l] of linhas.entries()) {
      if (!l.incluir) continue;
      if (!l.descricao.trim()) {
        toast({ title: `Compra #${i + 1} sem descrição`, variant: "destructive" });
        return;
      }
      const v = parseFloat(l.valor.replace(",", "."));
      if (isNaN(v) || v <= 0) {
        toast({ title: `Compra #${i + 1} com valor inválido`, variant: "destructive" });
        return;
      }
    }

    // Determinar o mês de fatura dominante a partir dos itens selecionados.
    //
    // Problema: numa fatura de cartão (Inter, Nubank, etc.) aparecem parcelas cujas
    // datas são a data da COMPRA ORIGINAL (meses atrás). Ao aplicar
    // calcularMesFaturaCartaoStr nessas datas antigas, o sistema colocaria cada
    // parcela em um mês diferente (a parcela 3 de um compra de março iria para março,
    // a parcela 7 de outubro iria para outubro/novembro, etc.).
    //
    // Solução: calcular o mês mais frequente entre os ITENS DE PRIMEIRA PARCELA
    // (parcela_atual = 1 ou à vista). Esses itens têm data do ciclo atual e
    // produzem o mês correto da fatura. Depois forçamos esse mês dominante em:
    //   a) todos os créditos (que podem cair no mês anterior pelo fechamento)
    //   b) todos os débitos com parcela_atual > 1 (data é de um ciclo anterior)
    const contagemMes: Record<string, number> = {};
    for (const l of selecionadas) {
      const parcelaAtualNum = parseInt(l.parcelaAtual) || 1;
      // Usar apenas itens de primeira parcela/à vista para determinar o mês correto
      const ehPrimeiraParcela = parcelaAtualNum === 1;
      if (l.sinal !== "credito" && ehPrimeiraParcela && l.data) {
        const d = new Date(l.data + "T12:00:00");
        const m = calcularMesFaturaCartaoStr(d, cartao.dia_fechamento);
        contagemMes[m] = (contagemMes[m] || 0) + 1;
      }
    }
    let mesDominante: string | null = null;
    {
      let maxCount = 0;
      for (const [m, count] of Object.entries(contagemMes)) {
        if (count > maxCount) { maxCount = count; mesDominante = m; }
      }
    }

    setSalvando(true);
    const total = selecionadas.length;
    let sucessos = 0;
    let erros = 0;
    try {
      let idx = 0;
      for (const l of linhas) {
        if (!l.incluir) continue;
        idx++;
        setProgresso({ atual: idx, total });
        try {
          const valorInformado = parseFloat(l.valor.replace(",", "."));
          const numParcelas = Math.min(Math.max(parseInt(l.parcelas) || 1, 1), 24);
          const parcelaInicial = Math.min(Math.max(parseInt(l.parcelaAtual) || 1, 1), numParcelas);
          // Se o valor extraído é de UMA parcela (extrato de fatura), converte para total
          let valor = l.valorEhParcela ? valorInformado * numParcelas : valorInformado;
          if (l.sinal === "credito") valor = -valor;
          const dataCompra = new Date(l.data + "T12:00:00");
          let mesFaturaStr = calcularMesFaturaCartaoStr(dataCompra, cartao.dia_fechamento);
          // Forçar mês dominante em dois casos:
          // 1. Créditos — a data pode ser anterior ao fechamento → cairiam no mês errado
          // 2. Débitos com parcela_atual > 1 — a data é da compra original (mês anterior)
          //    e não do ciclo atual, então calcularMesFaturaCartaoStr retorna o mês errado
          if (mesDominante && mesFaturaStr !== mesDominante) {
            const parcelaAtualNum = parseInt(l.parcelaAtual) || 1;
            const ehParcelaAnterior = l.valorEhParcela && parcelaAtualNum > 1;
            if (l.sinal === "credito" || ehParcelaAnterior) {
              mesFaturaStr = mesDominante;
            }
          }
          const [ano, mes] = mesFaturaStr.split("-").map(Number);

          await criarCompraCartao({
            cartaoId: cartao.id,
            descricao: l.descricao.trim(),
            valorTotal: valor,
            parcelas: numParcelas,
            parcelaInicial,
            mesFatura: new Date(ano, mes - 1, 1),
            tipoLancamento: numParcelas > 1 ? "parcelada" : "unica",
            dataCompra,
            categoriaId: categoriaId && categoriaId !== "none" ? categoriaId : undefined,
            responsavelId: l.responsavelId || responsavelId,
            nomeFatura: l.descricao.trim().toUpperCase(),
          });
          sucessos++;
        } catch (e) {
          console.error("Erro ao salvar compra:", e);
          erros++;
        }
      }

      if (sucessos > 0) {
        toast({
          title: `${sucessos} compra(s) registrada(s)`,
          description: erros > 0 ? `${erros} falharam.` : undefined,
        });
        onSaved();
      } else {
        toast({ title: "Nenhuma compra foi salva", variant: "destructive" });
      }
    } finally {
      setSalvando(false);
      setProgresso(null);
    }
  }

  function handleExportarCsv() {
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    // Converte valor BR "1.234,56" → número → string com ponto decimal para não quebrar o CSV
    const fmtNum = (v: string) => {
      const n = parseFloat(v.replace(/\./g, "").replace(",", "."));
      return isFinite(n) ? n.toFixed(2) : v;
    };
    const header = [
      "#", "incluir", "descricao", "data", "valor_original", "valor_parcela_mes",
      "parcelas", "parcela_atual", "valor_eh_parcela", "tipo", "sinal",
    ].join(",");

    const rows = linhas.map((l, i) => {
      const vMes = valorEsteMes(l).toFixed(2); // ponto decimal, não vírgula
      return [
        i + 1,
        l.incluir ? "sim" : "nao",
        esc(l.descricao),
        l.data,
        fmtNum(l.valor),  // ponto decimal
        vMes,
        l.parcelas,
        l.parcelaAtual,
        l.valorEhParcela ? "sim" : "nao",
        l.tipo,
        l.sinal,
      ].join(",");
    });

    const csv = [header, ...rows].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analise-ia-${cartao.nome.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !salvando && onOpenChange(o)}>
      <DialogContent
        noPadding
        className={cn(
          "gap-0 border-0 [&>button]:hidden flex flex-col rounded-2xl",
          isMobile
            ? "!w-auto max-w-none fixed !translate-x-0 !translate-y-0"
            : "w-[calc(100%-2rem)] max-w-[640px]",
        )}
        style={
          isMobile
            ? {
                borderRadius: 16,
                left: "max(1.25rem, env(safe-area-inset-left))",
                right: "max(1.25rem, env(safe-area-inset-right))",
                top: "1rem",
                maxHeight: "calc(100dvh - 2rem)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              }
            : { borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", maxHeight: "90dvh" }
        }
      >
        {isMobile && (
          <div className="flex justify-center pt-2 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
        )}

        <div
          className={cn(
            "flex items-start justify-between shrink-0 bg-white z-10",
            isMobile ? "sticky top-0 px-5 pt-2 pb-2 rounded-t-2xl" : "px-6 pt-6 pb-0",
          )}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles style={{ width: 18, height: 18, color: "#4F46E5" }} />
            <div>
              <h2 style={{ color: "#111827", fontWeight: 700, fontSize: 16, lineHeight: "20px" }}>
                Revisar compras detectadas
              </h2>
              <p style={{ color: "#9CA3AF", fontSize: 12, marginTop: 2 }}>
                {compras.length} transação(ões) detectada(s) · Cartão {cartao.nome}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !salvando && onOpenChange(false)}
            disabled={salvando}
            style={{ background: "none", border: "none", cursor: salvando ? "not-allowed" : "pointer", padding: 4, borderRadius: 6, color: "#9CA3AF" }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden min-h-0 flex flex-col gap-2",
            isMobile ? "px-5 pt-2 pb-2" : "px-6 pt-4 pb-4",
          )}
        >
          {isPicpay && compras.length > 0 && (
            <FaturaPicpayBreakdown
              compras={compras}
              saldoAnteriorInicial={resumoPicpay?.saldoAnterior ?? null}
              lancamentosResumoInicial={resumoPicpay?.lancamentosResumo ?? null}
            />
          )}

          {linhas.length === 0 && (
            <p style={{ fontSize: 13, color: "#6B7280", textAlign: "center", padding: 24 }}>
              Nenhuma compra restante.
            </p>
          )}

          {linhas.map((l, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #F3F4F6",
                borderRadius: 10,
                padding: 10,
                background: l.incluir ? "#fff" : "#F9FAFB",
                opacity: l.incluir ? 1 : 0.55,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={l.incluir}
                  onChange={(e) => atualizar(i, { incluir: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: "#111827" }}
                />
                <span style={{ fontSize: 11, color: "#6B7280", fontWeight: 500 }}>#{i + 1}</span>
                
                {l.tipo && l.tipo !== "compra" && l.tipo !== "estorno_parcelamento" && l.tipo !== "compra_substituida" && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: l.tipo === "estorno" ? "#DCFCE7" : "#F3F4F6",
                      color: l.tipo === "estorno" ? "#166534" : "#4B5563",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {l.tipo}
                  </span>
                )}

                {l.sinal === "credito" && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "#ECFDF5",
                      color: "#059669",
                      fontWeight: 700,
                    }}
                  >
                    CRÉDITO
                  </span>
                )}

                {l.valorEhParcela && parseInt(l.parcelas) > 1 && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "#EEF2FF",
                      color: "#4338CA",
                      fontWeight: 600,
                    }}
                    title="Valor mostrado é de UMA parcela. Total da compra será calculado automaticamente."
                  >
                    VALOR DA PARCELA
                  </span>
                )}

                {l.possivelDuplicada && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "#FEF3C7",
                      color: "#92400E",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 3
                    }}
                  >
                    <AlertTriangle style={{ width: 10, height: 10 }} />
                    JÁ EXISTE?
                  </span>
                )}

                {l.estornoParcelamento && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "#DCFCE7",
                      color: "#166534",
                      fontWeight: 700,
                    }}
                    title="Crédito que compensa a compra original já lançada como parcelamento. Deve ser incluído."
                  >
                    COMPENSA PARCELAMENTO
                  </span>
                )}

                {l.compraSubstituida && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "#F3F4F6",
                      color: "#6B7280",
                      fontWeight: 700,
                    }}
                    title="Esta compra já foi substituída pelas parcelas 'Fin ...'. Não importar."
                  >
                    JÁ VIROU PARCELAMENTO
                  </span>
                )}

                {l.riscadaSemCredito && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "#FEF3C7",
                      color: "#92400E",
                      fontWeight: 700,
                    }}
                    title="Aparece riscada na fatura mas ainda não tem crédito de estorno. O valor cheio continua sendo cobrado."
                  >
                    RISCADA SEM CRÉDITO
                  </span>
                )}

                {l.creditoParcelamentoGenerico && !l.estornoParcelamento && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "#FEF3C7",
                      color: "#92400E",
                      fontWeight: 700,
                    }}
                  >
                    REVISAR MANUALMENTE
                  </span>
                )}

                <div style={{ flex: 1 }} />
                <button
                  type="button"
                  onClick={() => remover(i)}
                  disabled={salvando}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#9CA3AF" }}
                  title="Remover"
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
              <input
                placeholder="Estabelecimento / descrição"
                value={l.descricao}
                onChange={(e) => atualizar(i, { descricao: e.target.value })}
                style={{ ...inputStyle, marginBottom: 6, fontWeight: 500 }}
              />
              {responsaveis.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2">
                  <User style={{ width: 12, height: 12, color: "#9CA3AF", flexShrink: 0 }} />
                  <select
                    value={l.responsavelId}
                    onChange={(e) => atualizar(i, { responsavelId: e.target.value })}
                    style={{ ...inputStyle, fontSize: 12, padding: "4px 6px", color: "#374151" }}
                  >
                    {responsaveis.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.apelido || r.nome}{r.is_titular ? " (eu)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>Valor (R$)</label>
                  <input
                    inputMode="decimal"
                    placeholder="0,00"
                    value={l.valor}
                    onChange={(e) => atualizar(i, { valor: e.target.value })}
                    style={{
                      ...inputStyle,
                      color: l.sinal === "credito" ? "#059669" : "#111827",
                      fontWeight: l.sinal === "credito" ? 600 : 400,
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>Parc. atual</label>
                  <input
                    type="number"
                    min={1}
                    max={parseInt(l.parcelas) || 1}
                    value={l.parcelaAtual}
                    onChange={(e) => atualizar(i, { parcelaAtual: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>Total parc.</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={l.parcelas}
                    onChange={(e) => atualizar(i, { parcelas: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              {parseInt(l.parcelas) > 1 && (
                <label
                  className="flex items-center gap-1.5 mt-2 cursor-pointer select-none"
                  style={{ fontSize: 11, color: "#6B7280" }}
                  title="Marque se o valor digitado é o de UMA parcela (extrato de fatura). Desmarque se é o valor TOTAL da compra."
                >
                  <input
                    type="checkbox"
                    checked={l.valorEhParcela}
                    onChange={(e) => atualizar(i, { valorEhParcela: e.target.checked })}
                    style={{ width: 13, height: 13, accentColor: "#4338CA" }}
                  />
                  Valor digitado é de UMA parcela (não o total da compra)
                </label>
              )}
              {l.estornoParcelamento && (
                <p style={{ fontSize: 11, color: "#166534", marginTop: 8 }}>
                  Crédito que compensa a compra original (PicPay): incluído por padrão para a soma bater com a fatura.
                </p>
              )}
              {l.compraSubstituida && (
                <p style={{ fontSize: 11, color: "#6B7280", marginTop: 8 }}>
                  Esta compra original já foi convertida em parcelas (Fin ...). Desmarcada por padrão.
                </p>
              )}
              {l.creditoParcelamentoGenerico && !l.estornoParcelamento && (
                <p style={{ fontSize: 11, color: "#92400E", marginTop: 8 }}>
                  Crédito genérico de parcelamento foi desmarcado por padrão para não reduzir a fatura indevidamente.
                </p>
              )}
            </div>
          ))}
        </div>

        <div
          className={cn(
            "shrink-0 bg-white border-t border-border/50",
            isMobile ? "sticky bottom-0 px-5 pt-2 z-10 rounded-b-2xl" : "px-6 pt-3 pb-5",
          )}
          style={isMobile ? { paddingBottom: "max(12px, env(safe-area-inset-bottom))" } : undefined}
        >
          <div className="flex items-center justify-between mb-1" style={{ fontSize: 13 }}>
            <span style={{ color: "#6B7280" }}>
              {selecionadas.length} selecionada(s)
            </span>
            <span style={{ color: "#111827", fontWeight: 600 }}>
              Total fatura deste mês: R$ {totalSelecionado.toFixed(2).replace(".", ",")}
            </span>
          </div>
          {(totalDebitos > 0 || totalCreditos > 0) && (
            <div className="flex items-center justify-end gap-3 mb-2" style={{ fontSize: 11, color: "#6B7280" }}>
              <span>Débitos: R$ {totalDebitos.toFixed(2).replace(".", ",")}</span>
              <span style={{ color: "#059669" }}>Créditos: −R$ {totalCreditos.toFixed(2).replace(".", ",")}</span>
            </div>
          )}
          {totalCreditosPendentes > 0 && (
            <p style={{ fontSize: 11, color: "#92400E", marginBottom: 4, textAlign: "right" }}>
              Créditos genéricos de parcelamento fora do total: R$ {totalCreditosPendentes.toFixed(2).replace(".", ",")}
            </p>
          )}
          {totalPagamentosExcluidos > 0 && (
            <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 8, textAlign: "right" }}>
              Pagamentos recebidos excluídos: −R$ {totalPagamentosExcluidos.toFixed(2).replace(".", ",")}
              <span style={{ marginLeft: 4, color: "#9CA3AF" }}>
                (saldo esperado no Nubank: R$ {Math.max(0, totalSelecionado - totalPagamentosExcluidos).toFixed(2).replace(".", ",")})
              </span>
            </p>
          )}
          {responsaveis.length > 1 && (
            <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <User style={{ width: 13, height: 13, color: "#6B7280", flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>Aplicar a todos:</span>
              <select
                value={responsavelLote}
                onChange={(e) => setResponsavelLote(e.target.value)}
                style={{ ...inputStyle, fontSize: 12, padding: "4px 6px", flex: 1 }}
              >
                <option value="">— selecione —</option>
                {responsaveis.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.apelido || r.nome}{r.is_titular ? " (eu)" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!responsavelLote}
                onClick={() => {
                  if (!responsavelLote) return;
                  setLinhas((prev) => prev.map((l) => ({ ...l, responsavelId: responsavelLote })));
                  setResponsavelLote("");
                }}
                style={{
                  height: 30,
                  paddingInline: 10,
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#fff",
                  background: responsavelLote ? "#111827" : "#D1D5DB",
                  border: "none",
                  cursor: responsavelLote ? "pointer" : "not-allowed",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Aplicar
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportarCsv}
              disabled={salvando || linhas.length === 0}
              title="Exportar todas as linhas detectadas como CSV para verificação"
              className="flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 shrink-0"
              style={{
                height: 48,
                paddingInline: 14,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                background: "#F3F4F6",
                border: "1px solid #E5E7EB",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <Download style={{ width: 15, height: 15 }} />
              Exportar CSV
            </button>

            <button
              type="button"
              onClick={handleSalvarTudo}
              disabled={salvando || selecionadas.length === 0}
              className="flex-1 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                color: "#fff",
                background: "#111827",
                border: "none",
                cursor: salvando ? "not-allowed" : "pointer",
              }}
            >
              {salvando ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} />
                  Salvando {progresso ? `${progresso.atual}/${progresso.total}` : ""}
                </>
              ) : (
                <>
                  <CheckCircle2 style={{ width: 16, height: 16 }} />
                  Salvar {selecionadas.length} compra(s)
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
