import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { ParcelaFatura, excluirParcelas, EscopoExclusao } from "@/services/compras-cartao";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  parcela: ParcelaFatura | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
  corCartao?: string;
}

function RadioOption({
  selected,
  onClick,
  label,
  sublabel,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  sublabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-[10px] px-4 py-3.5 text-left transition-all"
      style={{
        border: selected ? "1.5px solid #111827" : "1px solid #E5E7EB",
        background: "#fff",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "#D1D5DB";
          e.currentTarget.style.background = "#F9FAFB";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "#E5E7EB";
          e.currentTarget.style.background = "#fff";
        }
      }}
    >
      {/* Custom radio dot */}
      <span
        className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: 18,
          height: 18,
          border: selected ? "1.5px solid #111827" : "1.5px solid #D1D5DB",
        }}
      >
        {selected && (
          <span
            className="rounded-full"
            style={{ width: 8, height: 8, background: "#111827" }}
          />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p style={{ color: "#111827", fontWeight: 600, fontSize: 14, lineHeight: "20px" }}>
          {label}
        </p>
        <p style={{ color: "#9CA3AF", fontSize: 12, lineHeight: "16px", marginTop: 2 }}>
          {sublabel}
        </p>
      </div>
    </button>
  );
}

export function ExcluirCompraDialog({
  parcela,
  open,
  onOpenChange,
  onDeleted,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [escopo, setEscopo] = useState<EscopoExclusao>("todas");
  const [etapaConfirmacao, setEtapaConfirmacao] = useState(false);

  useEffect(() => {
    if (open) {
      setEscopo("todas");
      setEtapaConfirmacao(false);
    }
  }, [open]);

  if (!parcela) return null;

  const temMultiplasParcelas = parcela.total_parcelas > 1;
  const naoEUltimaParcela = parcela.numero_parcela < parcela.total_parcelas;
  const parcelasRestantes = parcela.total_parcelas - parcela.numero_parcela + 1;
  const requerConfirmacaoExtra = escopo === "todas" && parcela.total_parcelas > 6;

  function handleClickExcluir() {
    if (requerConfirmacaoExtra && !etapaConfirmacao) {
      setEtapaConfirmacao(true);
    } else {
      handleExcluir();
    }
  }

  async function handleExcluir() {
    if (!parcela) return;
    setLoading(true);
    try {
      const qtdExcluidas = await excluirParcelas({
        compraId: parcela.compra_id,
        parcelaId: parcela.id,
        numeroParcela: parcela.numero_parcela,
        escopo,
      });
      const mensagens: Record<EscopoExclusao, string> = {
        parcela: "Parcela excluída!",
        restantes: `${qtdExcluidas} parcela(s) excluída(s)!`,
        todas: "Compra excluída!",
      };
      toast({ title: mensagens[escopo] });
      onDeleted();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao excluir",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="p-0 gap-0 border-0"
        style={{
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          maxWidth: 440,
        }}
      >
        <div className="p-6 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#F3F4F6",
              }}
            >
              <Trash2 style={{ width: 20, height: 20, color: "#6B7280" }} />
            </span>
            <h2 style={{ color: "#111827", fontWeight: 700, fontSize: 18, lineHeight: "24px" }}>
              Excluir compra?
            </h2>
          </div>

          {/* Transaction info */}
          <div
            className="flex flex-col gap-0.5"
            style={{
              background: "#F9FAFB",
              borderRadius: 8,
              border: "1px solid #E5E7EB",
              padding: "12px 14px",
            }}
          >
            <p style={{ color: "#111827", fontWeight: 600, fontSize: 14 }}>
              {parcela.descricao}
            </p>
            <p style={{ color: "#6B7280", fontSize: 13 }}>
              {temMultiplasParcelas
                ? `Parcela ${parcela.numero_parcela}/${parcela.total_parcelas} • ${formatCurrency(parcela.valor)}`
                : formatCurrency(parcela.valor)}
            </p>
          </div>

          {/* Radio options */}
          {temMultiplasParcelas && !etapaConfirmacao && (
            <div className="flex flex-col gap-2">
              <p style={{ color: "#374151", fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                O que deseja excluir?
              </p>

              <RadioOption
                selected={escopo === "parcela"}
                onClick={() => setEscopo("parcela")}
                label="Apenas esta parcela"
                sublabel={`Parcela ${parcela.numero_parcela} • ${formatCurrency(parcela.valor)}`}
              />

              {naoEUltimaParcela && (
                <RadioOption
                  selected={escopo === "restantes"}
                  onClick={() => setEscopo("restantes")}
                  label="Esta e todas as futuras"
                  sublabel={`${parcelasRestantes} parcelas restantes • ${formatCurrency(parcela.valor * parcelasRestantes)}`}
                />
              )}

              <RadioOption
                selected={escopo === "todas"}
                onClick={() => setEscopo("todas")}
                label="Excluir compra inteira"
                sublabel={`Todas as ${parcela.total_parcelas} parcelas • ${formatCurrency(parcela.valor * parcela.total_parcelas)}`}
              />
            </div>
          )}

          {!temMultiplasParcelas && !etapaConfirmacao && (
            <p style={{ color: "#6B7280", fontSize: 13 }}>
              Esta compra será excluída permanentemente.
            </p>
          )}

          {/* Extra confirmation step */}
          {etapaConfirmacao && (
            <div
              className="flex flex-col gap-2"
              style={{
                background: "#F9FAFB",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                padding: "14px 16px",
              }}
            >
              <p style={{ color: "#111827", fontWeight: 600, fontSize: 14 }}>
                Atenção
              </p>
              <p style={{ color: "#374151", fontSize: 13, lineHeight: "18px" }}>
                Você está prestes a excluir <strong>"{parcela.descricao}"</strong> com{" "}
                <strong>{parcela.total_parcelas} parcelas</strong> no total de{" "}
                <strong>{formatCurrency(parcela.valor * parcela.total_parcelas)}</strong>.
              </p>
              <p style={{ color: "#6B7280", fontSize: 13 }}>
                Tem certeza que deseja continuar? Esta ação é irreversível.
              </p>
            </div>
          )}

          {/* Warning line */}
          {!etapaConfirmacao && (
            <div className="flex items-center gap-2 mt-1">
              <AlertTriangle style={{ width: 16, height: 16, color: "#D97706", flexShrink: 0 }} />
              <p style={{ color: "#6B7280", fontSize: 13 }}>
                Esta ação não pode ser desfeita.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-1">
            {etapaConfirmacao ? (
              <>
                <button
                  type="button"
                  onClick={() => setEtapaConfirmacao(false)}
                  disabled={loading}
                  className="transition-colors disabled:opacity-50"
                  style={{
                    height: 40,
                    padding: "0 16px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#6B7280",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleExcluir}
                  disabled={loading}
                  className="transition-colors disabled:opacity-50"
                  style={{
                    height: 40,
                    padding: "0 20px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    background: "#DC2626",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#B91C1C")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#DC2626")}
                >
                  {loading ? "Excluindo..." : "Confirmar Exclusão"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="transition-colors disabled:opacity-50"
                  style={{
                    height: 40,
                    padding: "0 16px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#6B7280",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleClickExcluir}
                  disabled={loading}
                  className="transition-colors disabled:opacity-50"
                  style={{
                    height: 40,
                    padding: "0 20px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    background: "#DC2626",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#B91C1C")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#DC2626")}
                >
                  {loading ? "Excluindo..." : "Excluir"}
                </button>
              </>
            )}
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
