import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Cartao } from "@/services/cartoes";
import { criarCompraCartao } from "@/services/compras-cartao";
import { calcularMesFaturaCartaoStr } from "@/lib/dateUtils";
import { CheckCircle2, Loader2, Sparkles, Trash2, X } from "lucide-react";

export interface CompraExtraida {
  valor: number | null;
  estabelecimento: string | null;
  data: string | null;
  parcelas: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartao: Cartao;
  responsavelId: string;
  categoriaId?: string;
  compras: CompraExtraida[];
  onSaved: () => void;
}

type LinhaCompra = {
  incluir: boolean;
  descricao: string;
  valor: string;
  data: string;
  parcelas: string;
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

export function RevisarComprasLoteDialog({
  open,
  onOpenChange,
  cartao,
  responsavelId,
  categoriaId,
  compras,
  onSaved,
}: Props) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [salvando, setSalvando] = useState(false);
  const [progresso, setProgresso] = useState<{ atual: number; total: number } | null>(null);

  const [linhas, setLinhas] = useState<LinhaCompra[]>(() =>
    compras.map((c) => ({
      incluir: true,
      descricao: c.estabelecimento?.trim() || "",
      valor: typeof c.valor === "number" && c.valor > 0 ? c.valor.toFixed(2).replace(".", ",") : "",
      data: c.data && /^\d{4}-\d{2}-\d{2}$/.test(c.data) ? c.data : new Date().toISOString().split("T")[0],
      parcelas: String(Math.min(Math.max(c.parcelas || 1, 1), 24)),
    })),
  );

  const atualizar = (i: number, patch: Partial<LinhaCompra>) =>
    setLinhas((arr) => arr.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const remover = (i: number) =>
    setLinhas((arr) => arr.filter((_, idx) => idx !== i));

  const selecionadas = useMemo(() => linhas.filter((l) => l.incluir), [linhas]);

  const totalSelecionado = useMemo(
    () => selecionadas.reduce((s, l) => s + (parseFloat(l.valor.replace(",", ".")) || 0), 0),
    [selecionadas],
  );

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
          const valor = parseFloat(l.valor.replace(",", "."));
          const numParcelas = Math.min(Math.max(parseInt(l.parcelas) || 1, 1), 24);
          const dataCompra = new Date(l.data + "T12:00:00");
          const mesFaturaStr = calcularMesFaturaCartaoStr(dataCompra, cartao.dia_fechamento);
          const [ano, mes] = mesFaturaStr.split("-").map(Number);

          await criarCompraCartao({
            cartaoId: cartao.id,
            descricao: l.descricao.trim(),
            valorTotal: valor,
            parcelas: numParcelas,
            parcelaInicial: 1,
            mesFatura: new Date(ano, mes - 1, 1),
            tipoLancamento: numParcelas > 1 ? "parcelada" : "unica",
            dataCompra,
            categoriaId: categoriaId && categoriaId !== "none" ? categoriaId : undefined,
            responsavelId,
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
                {compras.length} compra(s) na imagem · Cartão {cartao.nome}
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
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>Valor (R$)</label>
                  <input
                    inputMode="decimal"
                    placeholder="0,00"
                    value={l.valor}
                    onChange={(e) => atualizar(i, { valor: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>Data</label>
                  <input
                    type="date"
                    value={l.data}
                    onChange={(e) => atualizar(i, { data: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>Parcelas</label>
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
          <div className="flex items-center justify-between mb-2" style={{ fontSize: 13 }}>
            <span style={{ color: "#6B7280" }}>
              {selecionadas.length} selecionada(s)
            </span>
            <span style={{ color: "#111827", fontWeight: 600 }}>
              Total: R$ {totalSelecionado.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSalvarTudo}
            disabled={salvando || selecionadas.length === 0}
            className="w-full flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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
      </DialogContent>
    </Dialog>
  );
}
