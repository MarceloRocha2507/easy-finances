import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/formatters";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ParcelaFatura } from "@/services/compras-cartao";
import {
  Calendar,
  Check,
  Clock,
  Hash,
  Layers,
  Pencil,
  RefreshCw,
  Tag,
  User,
  CreditCard,
  DollarSign,
  X,
} from "lucide-react";

interface DetalhesCompraCartaoDialogProps {
  parcela: ParcelaFatura | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (parcela: ParcelaFatura) => void;
  corCartao?: string;
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={{ borderBottom: "1px solid #F9FAFB" }}
    >
      <div className="flex items-center gap-2">
        <Icon style={{ width: 16, height: 16, color: "#9CA3AF" }} />
        <span style={{ color: "#6B7280", fontSize: 13 }}>{label}</span>
      </div>
      <div style={{ color: "#111827", fontSize: 13, fontWeight: 600 }}>
        {children}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        letterSpacing: "0.05em",
        color: "#9CA3AF",
        textTransform: "uppercase" as const,
        paddingBottom: 8,
        marginBottom: 4,
        borderBottom: "1px solid #F3F4F6",
      }}
    >
      {children}
    </div>
  );
}

export function DetalhesCompraCartaoDialog({
  parcela,
  open,
  onOpenChange,
  onEdit,
}: DetalhesCompraCartaoDialogProps) {
  if (!parcela) return null;

  const isCredito = parcela.valor < 0;
  const isEstorno = parcela.tipo_lancamento === "estorno";
  const isAjuste = parcela.tipo_lancamento === "ajuste";

  const getTipoLabel = () => {
    if (parcela.total_parcelas > 1) return "Parcelada";
    if (parcela.tipo_lancamento === "fixa") return "Fixa";
    return "Única";
  };

  const valorTotal = Math.abs(parcela.valor) * parcela.total_parcelas;

  const formatDateOnly = (dateStr: string) =>
    format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR });

  const formatMesRef = (mesRef: string) =>
    format(parseISO(mesRef), "MMMM/yyyy", { locale: ptBR });

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(parcela);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 border-0 [&>button]:hidden"
        style={{
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          maxWidth: 440,
        }}
      >
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[85dvh]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 style={{ color: "#111827", fontWeight: 700, fontSize: 16 }}>
              Detalhes da Compra
            </h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="transition-colors"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                borderRadius: 6,
                color: "#9CA3AF",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>

          {/* Transaction header */}
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "#F3F4F6",
              }}
            >
              {parcela.categoria_cor ? (
                <Tag style={{ width: 20, height: 20, color: "#6B7280" }} />
              ) : (
                <CreditCard style={{ width: 20, height: 20, color: "#6B7280" }} />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p style={{ color: "#111827", fontWeight: 600, fontSize: 16 }}>
                  {parcela.descricao}
                </p>
                {isEstorno && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#065F46",
                      background: "#D1FAE5",
                      padding: "2px 8px",
                      borderRadius: 6,
                    }}
                  >
                    Estorno
                  </span>
                )}
                {isAjuste && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#1E40AF",
                      background: "#DBEAFE",
                      padding: "2px 8px",
                      borderRadius: 6,
                    }}
                  >
                    Ajuste
                  </span>
                )}
              </div>
              <p style={{ color: "#9CA3AF", fontSize: 12 }}>
                {parcela.categoria_nome || "Sem categoria"}
              </p>
            </div>
          </div>

          {/* Value hero */}
          <div>
            <p style={{ color: "#111827", fontWeight: 700, fontSize: 28, lineHeight: "32px" }}>
              {isCredito ? "- " : ""}
              {formatCurrency(Math.abs(parcela.valor))}
            </p>
            {parcela.total_parcelas > 1 && (
              <p style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>
                {parcela.total_parcelas}x de {formatCurrency(Math.abs(parcela.valor))}
              </p>
            )}
            <div style={{ height: 1, background: "#F3F4F6", marginTop: 16 }} />
          </div>

          {/* Informações da Parcela */}
          <div className="flex flex-col gap-1">
            <SectionLabel>Informações da Parcela</SectionLabel>

            <InfoRow icon={parcela.paga ? Check : Clock} label="Status">
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: 6,
                  padding: "2px 8px",
                  ...(parcela.paga
                    ? { color: "#065F46", background: "#D1FAE5" }
                    : { color: "#92400E", background: "#FEF3C7" }),
                }}
              >
                {parcela.paga ? "Paga" : "Pendente"}
              </span>
            </InfoRow>

            <InfoRow icon={Hash} label="Parcela">
              <span style={{ color: "#374151", fontWeight: 500 }}>
                {parcela.numero_parcela} de {parcela.total_parcelas}
              </span>
            </InfoRow>

            <InfoRow icon={DollarSign} label="Valor da parcela">
              {formatCurrency(Math.abs(parcela.valor))}
            </InfoRow>

            <InfoRow icon={Calendar} label="Mês referência">
              <span className="capitalize">{formatMesRef(parcela.mes_referencia)}</span>
            </InfoRow>
          </div>

          {/* Informações da Compra */}
          <div className="flex flex-col gap-1">
            <SectionLabel>Informações da Compra</SectionLabel>

            {parcela.data_compra && (
              <InfoRow icon={Calendar} label="Data da compra">
                {formatDateOnly(parcela.data_compra)}
              </InfoRow>
            )}

            {parcela.total_parcelas > 1 && (
              <InfoRow icon={DollarSign} label="Valor total">
                {formatCurrency(valorTotal)}
              </InfoRow>
            )}

            <InfoRow
              icon={parcela.total_parcelas > 1 ? Layers : RefreshCw}
              label="Tipo"
            >
              {getTipoLabel()}
            </InfoRow>

            {parcela.categoria_nome && (
              <InfoRow icon={Tag} label="Categoria">
                <div className="flex items-center gap-1.5">
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: parcela.categoria_cor || "#9CA3AF",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "#374151", fontWeight: 500 }}>
                    {parcela.categoria_nome}
                  </span>
                </div>
              </InfoRow>
            )}

            {(parcela.responsavel_nome || parcela.responsavel_apelido) && (
              <InfoRow icon={User} label="Responsável">
                {parcela.responsavel_apelido || parcela.responsavel_nome}
              </InfoRow>
            )}
          </div>

          {/* Registro */}
          <div className="flex flex-col gap-1">
            <SectionLabel>Registro</SectionLabel>
            {parcela.updated_at && (
              <div
                className="flex items-center justify-between py-2"
                style={{ borderBottom: "1px solid #F9FAFB" }}
              >
                <span style={{ color: "#9CA3AF", fontSize: 12 }}>Última alteração</span>
                <span style={{ color: "#6B7280", fontSize: 12, fontFamily: "monospace" }}>
                  {formatDistanceToNow(parseISO(parcela.updated_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span style={{ color: "#9CA3AF", fontSize: 12 }}>ID</span>
              <span
                className="truncate max-w-[180px]"
                style={{ color: "#D1D5DB", fontSize: 12, fontFamily: "monospace" }}
              >
                {parcela.id}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="transition-colors"
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
              Fechar
            </button>
            <button
              type="button"
              onClick={handleEdit}
              className="flex items-center gap-2 transition-colors"
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                background: "#111827",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1F2937")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#111827")}
            >
              <Pencil style={{ width: 14, height: 14 }} />
              Editar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
