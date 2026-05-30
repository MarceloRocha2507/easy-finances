import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  calcularFaturaPicpay,
  formatBRL,
  type FaturaPicpayBreakdown as Breakdown,
} from "@/lib/picpayFaturaCalc";
import type { CompraExtraida } from "./RevisarComprasLoteDialog";

interface Props {
  compras: CompraExtraida[];
  saldoAnteriorInicial: number | null;
  lancamentosResumoInicial: number | null;
}

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

function parseValor(s: string): number {
  if (!s.trim()) return 0;
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return isFinite(n) ? n : 0;
}

function Linha({
  label,
  count,
  total,
  hint,
}: {
  label: string;
  count: number;
  total: number;
  hint?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 10px",
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 8,
        fontSize: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ color: "#111827", fontWeight: 600 }}>{label}</span>
        {hint && <span style={{ color: "#9CA3AF", fontSize: 11 }}>{hint}</span>}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "#111827", fontWeight: 600 }}>{formatBRL(total)}</div>
        <div style={{ color: "#9CA3AF", fontSize: 11 }}>{count} item(ns)</div>
      </div>
    </div>
  );
}

export function FaturaPicpayBreakdown({
  compras,
  saldoAnteriorInicial,
  lancamentosResumoInicial,
}: Props) {
  const [saldoAnteriorStr, setSaldoAnteriorStr] = useState(() =>
    saldoAnteriorInicial != null ? saldoAnteriorInicial.toFixed(2).replace(".", ",") : "0,00",
  );
  const [lancamentosStr, setLancamentosStr] = useState(() =>
    lancamentosResumoInicial != null ? lancamentosResumoInicial.toFixed(2).replace(".", ",") : "",
  );
  const [pagamentoManualStr, setPagamentoManualStr] = useState("0,00");
  const [expandDescartados, setExpandDescartados] = useState(false);

  const saldoAnterior = parseValor(saldoAnteriorStr);
  const pagamentoManual = parseValor(pagamentoManualStr);
  const lancamentos = lancamentosStr.trim() ? parseValor(lancamentosStr) : null;

  const breakdown: Breakdown = useMemo(
    () => calcularFaturaPicpay(compras, saldoAnterior, pagamentoManual),
    [compras, saldoAnterior, pagamentoManual],
  );

  const diff = lancamentos != null ? breakdown.total_calculado - lancamentos : null;
  const bate = diff != null && Math.abs(diff) < 0.02;

  const totalDescartados = breakdown.ignorados.descartados.length;

  return (
    <div
      style={{
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: 12,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>
          Cálculo da fatura PicPay
        </span>
        <span style={{ fontSize: 10, color: "#6B7280" }}>compras normais</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <label style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>
            Saldo fatura anterior
          </label>
          <input
            inputMode="decimal"
            value={saldoAnteriorStr}
            onChange={(e) => setSaldoAnteriorStr(e.target.value)}
            style={inputStyle}
            placeholder="0,00"
          />
        </div>
        <div>
          <label style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>
            Lançamentos (Resumo)
          </label>
          <input
            inputMode="decimal"
            value={lancamentosStr}
            onChange={(e) => setLancamentosStr(e.target.value)}
            style={inputStyle}
            placeholder="opcional"
          />
        </div>
      </div>

      {breakdown.regra5_pagamentos.itens.length === 0 && (
        <div>
          <label style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>
            Pagamento recebido nesta fatura
            <span style={{ color: "#DC2626", marginLeft: 4 }}>
              (IA não detectou — preencha manualmente se houver)
            </span>
          </label>
          <input
            inputMode="decimal"
            value={pagamentoManualStr}
            onChange={(e) => setPagamentoManualStr(e.target.value)}
            style={inputStyle}
            placeholder="0,00"
          />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Linha
          label="1. Compras à vista"
          count={breakdown.regra1_avista.itens.length}
          total={breakdown.regra1_avista.total}
        />
        <Linha
          label="2. Parcelas de compras anteriores"
          count={breakdown.regra2_parcelas.itens.length}
          total={breakdown.regra2_parcelas.total}
        />
        <Linha
          label="3. Fin (1ª parcela) + IOF"
          count={breakdown.regra3_fin_iof.itens.length}
          total={breakdown.regra3_fin_iof.total}
          hint="Novos parcelamentos PicPay"
        />
        <Linha
          label="4. − Pagamentos"
          count={breakdown.regra5_pagamentos.itens.filter((p) => p.status === "aplicado").length}
          total={-breakdown.regra5_pagamentos.total}
          hint={
            breakdown.regra5_pagamentos.itens.some((p) => p.status === "ignorado")
              ? "1 pagamento ignorado (quitou fatura anterior)"
              : undefined
          }
        />
      </div>

      {/* Card final: total calculado vs lançamentos */}
      <div
        style={{
          marginTop: 4,
          padding: 10,
          borderRadius: 10,
          background: lancamentos == null ? "#F9FAFB" : bate ? "#ECFDF5" : "#FEF2F2",
          border: `1px solid ${lancamentos == null ? "#E5E7EB" : bate ? "#A7F3D0" : "#FECACA"}`,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>Total calculado</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
            {formatBRL(breakdown.total_calculado)}
          </span>
        </div>
        {lancamentos != null && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#6B7280" }}>Resumo do banco (Lançamentos)</span>
            <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>
              {formatBRL(lancamentos)}
            </span>
          </div>
        )}
        {lancamentos != null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 2,
              fontSize: 11,
              fontWeight: 700,
              color: bate ? "#047857" : "#DC2626",
            }}
            title={
              bate
                ? undefined
                : "Verifique se todas as compras riscadas foram detectadas pela IA e se o Pagamento de Fatura foi extraído."
            }
          >
            {bate ? (
              <>
                <CheckCircle2 style={{ width: 12, height: 12 }} /> Bate com o Resumo
              </>
            ) : (
              <>
                <AlertTriangle style={{ width: 12, height: 12 }} />
                Divergência de {formatBRL(diff ?? 0)}
              </>
            )}
          </div>
        )}
      </div>

      {totalDescartados > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setExpandDescartados((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              padding: 0,
              fontSize: 11,
              color: "#6B7280",
              cursor: "pointer",
            }}
          >
            {expandDescartados ? (
              <ChevronUp style={{ width: 12, height: 12 }} />
            ) : (
              <ChevronDown style={{ width: 12, height: 12 }} />
            )}
            Itens descartados (riscados + créditos/estornos): {totalDescartados}
          </button>
          {expandDescartados && (
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
              {breakdown.ignorados.descartados.map((c, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 11,
                    color: "#6B7280",
                    padding: "4px 8px",
                    background: "#F9FAFB",
                    borderRadius: 6,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{c.estabelecimento || c.linha_original || "—"}</span>
                  <span>{formatBRL(typeof c.valor === "number" ? c.valor : 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
