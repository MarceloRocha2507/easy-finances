import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/formatters";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Check,
  Clock,
  AlertTriangle,
  RefreshCw,
  Layers,
  Hash,
  Pencil,
  Package,
  DollarSign,
  Wallet,
  Briefcase,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Heart,
  GraduationCap,
  Gift,
  Plane,
  Gamepad2,
  Shirt,
  Pill,
  Book,
  Zap,
  Tag,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  "dollar-sign": DollarSign,
  wallet: Wallet,
  briefcase: Briefcase,
  "shopping-cart": ShoppingCart,
  home: Home,
  car: Car,
  utensils: Utensils,
  heart: Heart,
  "graduation-cap": GraduationCap,
  gift: Gift,
  plane: Plane,
  gamepad: Gamepad2,
  shirt: Shirt,
  pill: Pill,
  book: Book,
  package: Package,
  zap: Zap,
  "trending-up": TrendingUp,
  tag: Tag,
};

function getIconComponent(iconValue: string) {
  return ICON_MAP[iconValue] || Package;
}

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description?: string | null;
  date: string;
  status?: string | null;
  due_date?: string | null;
  paid_date?: string | null;
  is_recurring?: boolean | null;
  recurrence_day?: number | null;
  tipo_lancamento?: string | null;
  numero_parcela?: number | null;
  total_parcelas?: number | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
  } | null;
}

interface TransactionDetailsDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (transaction: Transaction) => void;
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
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
      <div style={{ color: "#111827", fontSize: 13, fontWeight: 600 }}>{children}</div>
    </div>
  );
}

export function TransactionDetailsDialog({
  transaction,
  open,
  onOpenChange,
  onEdit,
}: TransactionDetailsDialogProps) {
  if (!transaction) return null;

  const IconComponent = getIconComponent(transaction.category?.icon || "package");
  const isPending = transaction.status === "pending";
  const today = new Date().toISOString().split("T")[0];
  const isOverdue = isPending && transaction.due_date && transaction.due_date < today;

  const getTipoLancamentoLabel = (tipo: string | null | undefined) => {
    switch (tipo) {
      case "parcelada":
        return "Parcelada";
      case "fixa":
        return "Fixa";
      default:
        return "Única";
    }
  };

  const getStatusLabel = () => {
    if (isOverdue) return "Vencida";
    if (isPending) return "Pendente";
    return "Concluída";
  };

  const getStatusStyle = (): React.CSSProperties => {
    if (isOverdue)
      return { background: "#FEE2E2", color: "#DC2626", fontSize: 11, fontWeight: 500, borderRadius: 6, padding: "2px 8px" };
    if (isPending)
      return { background: "#FEF3C7", color: "#92400E", fontSize: 11, fontWeight: 500, borderRadius: 6, padding: "2px 8px" };
    return { background: "#DCFCE7", color: "#15803D", fontSize: 11, fontWeight: 500, borderRadius: 6, padding: "2px 8px" };
  };

  const formatDateTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatDateOnly = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(transaction);
  };

  const showLancamento =
    (transaction.tipo_lancamento && transaction.tipo_lancamento !== "unica") ||
    transaction.is_recurring;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md !p-0 !gap-0">
        <div className="flex flex-col p-6 gap-0">
          {/* Header title */}
          <p style={{ color: "#111827", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            Detalhes da Transação
          </p>

          {/* Transaction identity */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: 44, height: 44, borderRadius: 8, background: "#F3F4F6" }}
            >
              <IconComponent style={{ width: 20, height: 20, color: "#6B7280" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ color: "#111827", fontSize: 15, fontWeight: 700 }} className="truncate">
                {transaction.description || transaction.category?.name || "Sem descrição"}
              </p>
              <p style={{ color: "#9CA3AF", fontSize: 12 }}>
                {transaction.category?.name || "Sem categoria"}
              </p>
            </div>
          </div>

          {/* Value block */}
          <div className="text-center py-4">
            <span style={{ color: "#111827", fontSize: 28, fontWeight: 700 }} className="tabular-nums">
              {transaction.type === "income" ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </span>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#F3F4F6", marginBottom: 16 }} />

          {/* Informações section */}
          <div className="mb-4">
            <div className="pb-2 mb-1" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <span style={{ color: "#374151", fontSize: 12, fontWeight: 700 }}>Informações</span>
            </div>

            <InfoRow icon={transaction.type === "income" ? TrendingUp : TrendingDown} label="Tipo">
              {transaction.type === "income" ? "Receita" : "Despesa"}
            </InfoRow>

            <InfoRow icon={Calendar} label="Data">
              {formatDateOnly(transaction.date)}
            </InfoRow>

            <InfoRow icon={isOverdue ? AlertTriangle : isPending ? Clock : Check} label="Status">
              <span style={getStatusStyle()}>{getStatusLabel()}</span>
            </InfoRow>

            {transaction.due_date && isPending && (
              <InfoRow icon={AlertTriangle} label="Vencimento">
                <span style={isOverdue ? { color: "#DC2626" } : {}}>
                  {formatDateOnly(transaction.due_date)}
                </span>
              </InfoRow>
            )}

            {transaction.paid_date && transaction.status === "completed" && (
              <InfoRow icon={Check} label="Pago em">
                {formatDateOnly(transaction.paid_date)}
              </InfoRow>
            )}
          </div>

          {/* Lançamento section */}
          {showLancamento && (
            <div className="mb-4">
              <div className="pb-2 mb-1" style={{ borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ color: "#374151", fontSize: 12, fontWeight: 700 }}>Lançamento</span>
              </div>

              <InfoRow
                icon={transaction.tipo_lancamento === "fixa" ? RefreshCw : Layers}
                label="Tipo"
              >
                {getTipoLancamentoLabel(transaction.tipo_lancamento)}
              </InfoRow>

              {transaction.tipo_lancamento === "parcelada" &&
                transaction.numero_parcela &&
                transaction.total_parcelas && (
                  <InfoRow icon={Hash} label="Parcela">
                    <span
                      style={{
                        background: "#F3F4F6",
                        color: "#374151",
                        fontSize: 11,
                        fontWeight: 500,
                        borderRadius: 6,
                        padding: "2px 8px",
                      }}
                    >
                      {transaction.numero_parcela} de {transaction.total_parcelas}
                    </span>
                  </InfoRow>
                )}

              {transaction.is_recurring && transaction.recurrence_day && (
                <InfoRow icon={RefreshCw} label="Dia da Recorrência">
                  Dia {transaction.recurrence_day}
                </InfoRow>
              )}
            </div>
          )}

          {/* Registro section */}
          <div className="mb-4">
            <div className="pb-2 mb-1" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <span style={{ color: "#374151", fontSize: 12, fontWeight: 700 }}>Registro</span>
            </div>

            <div
              className="flex items-center justify-between py-2"
              style={{ borderBottom: "1px solid #F9FAFB" }}
            >
              <span style={{ color: "#9CA3AF", fontSize: 12 }}>Criado em</span>
              <span style={{ color: "#6B7280", fontSize: 12 }}>{formatDateTime(transaction.created_at)}</span>
            </div>
            <div
              className="flex items-center justify-between py-2"
              style={{ borderBottom: "1px solid #F9FAFB" }}
            >
              <span style={{ color: "#9CA3AF", fontSize: 12 }}>Atualizado em</span>
              <span style={{ color: "#6B7280", fontSize: 12 }}>{formatDateTime(transaction.updated_at)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span style={{ color: "#9CA3AF", fontSize: 12 }}>ID</span>
              <span
                className="truncate max-w-[180px] font-mono"
                style={{ color: "#9CA3AF", fontSize: 11 }}
              >
                {transaction.id}
              </span>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 mt-2">
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
              <Pencil style={{ width: 14, height: 14, color: "#fff" }} />
              Editar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
