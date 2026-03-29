import { useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Receipt, Eye, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/useTransactions";
import { useFaturasNaListagem } from "@/hooks/useFaturasNaListagem";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TotalAPagarCardProps {
  mesReferencia: Date;
  isLoading?: boolean;
}

function getDueDateShort(dueDateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr + "T00:00:00");
  const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return `${Math.abs(diffDays)}d atrás`;
  if (diffDays === 0) return "Hoje";
  if (diffDays <= 7) return `${diffDays}d`;
  return format(dueDate, "dd/MM");
}

function getDueDateStatus(dueDateStr: string): "overdue" | "today" | "upcoming" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr + "T00:00:00");
  const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  return "upcoming";
}

export function TotalAPagarCard({ mesReferencia, isLoading: externalLoading }: TotalAPagarCardProps) {
  const [open, setOpen] = useState(false);

  const inicioMes = `${mesReferencia.getFullYear()}-${String(mesReferencia.getMonth() + 1).padStart(2, "0")}-01`;
  const fimMes = (() => {
    const d = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const { data: transactions, isLoading: isLoadingTx } = useTransactions({
    startDate: inicioMes,
    endDate: fimMes,
    type: "expense",
    status: "pending",
  });

  const { data: todasFaturas, isLoading: isLoadingFaturas } = useFaturasNaListagem(mesReferencia);

  const isLoading = isLoadingTx || isLoadingFaturas;

  const mesRefStr = `${mesReferencia.getFullYear()}-${String(mesReferencia.getMonth() + 1).padStart(2, "0")}`;
  const faturasMes = (todasFaturas || []).filter(f => f.mesReferencia.startsWith(mesRefStr) && f.statusFatura !== 'paga');

  const contasPendentes = (transactions || [])
    .filter(t => !t.desconsiderada)
    .sort((a, b) => {
      const dateA = new Date(a.due_date || a.date);
      const dateB = new Date(b.due_date || b.date);
      return dateA.getTime() - dateB.getTime();
    });

  const totalCartoes = faturasMes.reduce((s, f) => s + f.amount, 0);
  const totalContas = contasPendentes.reduce((s, t) => s + t.amount, 0);
  const totalGeral = totalCartoes + totalContas;

  return (
    <>
      {/* Card trigger */}
      <div
        className={cn(
          "relative h-full bg-white dark:bg-[#1a1a1a] border border-[#E5E7EB] dark:border-[#2a2a2a] rounded-[10px]",
          "shadow-[0_1px_3px_rgba(0,0,0,0.07)] animate-fade-in-up overflow-hidden",
          "cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200"
        )}
        style={{ animationDelay: "0.25s", opacity: 0 }}
      >
        <button className="w-full h-full text-left p-4" onClick={() => setOpen(true)}>
          <div className="absolute top-4 right-4">
            <Eye className="h-4 w-4 text-foreground/30" />
          </div>

          <p className="text-muted-foreground text-xs sm:text-sm mb-1">Total a Pagar</p>

          {isLoading ? (
            <Skeleton className="h-6 w-24 sm:h-7 sm:w-28 bg-muted/60" />
          ) : (
            <p className="text-lg sm:text-xl font-bold tabular-nums text-destructive">
              -{formatCurrency(totalGeral)}
            </p>
          )}

        </button>
      </div>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md overflow-hidden" noPadding>
          <div className="flex flex-col">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <p style={{ color: "#9CA3AF", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
                Total a Pagar
              </p>
              <p style={{ color: "#111827", fontSize: 26, fontWeight: 700, lineHeight: 1.1 }} className="tabular-nums">
                -{formatCurrency(totalGeral)}
              </p>
              <div className="flex items-center gap-2 mt-3">
                {contasPendentes.length > 0 && (
                  <span style={{ background: "#F3F4F6", color: "#374151", fontSize: 11, fontWeight: 500, borderRadius: 6, padding: "2px 8px" }}>
                    {contasPendentes.length} {contasPendentes.length === 1 ? "conta" : "contas"}
                  </span>
                )}
                {faturasMes.length > 0 && (
                  <span style={{ background: "#F3F4F6", color: "#374151", fontSize: 11, fontWeight: 500, borderRadius: 6, padding: "2px 8px" }}>
                    {faturasMes.length} {faturasMes.length === 1 ? "fatura" : "faturas"}
                  </span>
                )}
                {contasPendentes.length === 0 && faturasMes.length === 0 && (
                  <span className="flex items-center gap-1" style={{ fontSize: 11, color: "#9CA3AF" }}>
                    <CheckCircle2 className="w-3 h-3" style={{ color: "#16A34A" }} />
                    Nada pendente
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "#F3F4F6" }} />

            {/* Content */}
            <div className="overflow-y-auto max-h-[55vh]">
              {/* Contas Pendentes */}
              {contasPendentes.length > 0 && (
                <div className="px-6 pt-4 pb-2">
                  <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <div className="flex items-center gap-2">
                      <Receipt style={{ width: 16, height: 16, color: "#9CA3AF" }} />
                      <span style={{ color: "#374151", fontSize: 12, fontWeight: 700 }}>
                        Contas pendentes
                      </span>
                    </div>
                    <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }} className="tabular-nums">
                      -{formatCurrency(totalContas)}
                    </span>
                  </div>
                  <div>
                    {contasPendentes.map((t) => {
                      const dueDate = t.due_date || t.date;
                      const status = getDueDateStatus(dueDate);
                      const dueDateLabel = getDueDateShort(dueDate);
                      return (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 py-3"
                          style={{ borderBottom: "1px solid #F9FAFB" }}
                        >
                          {/* Status dot */}
                          <span
                            className="shrink-0 rounded-full"
                            style={{
                              width: 6,
                              height: 6,
                              background: status === "overdue" ? "#D97706" : "#D1D5DB",
                            }}
                          />
                          {/* Name + overdue label */}
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="truncate" style={{ color: "#111827", fontSize: 14 }}>
                              {t.description || "Sem descrição"}
                            </span>
                            {status === "overdue" && (
                              <span style={{ color: "#D97706", fontSize: 11, fontStyle: "italic", whiteSpace: "nowrap" }}>
                                {dueDateLabel}
                              </span>
                            )}
                          </div>
                          {/* Countdown for non-overdue */}
                          {status !== "overdue" && (
                            <span style={{ color: "#9CA3AF", fontSize: 12, whiteSpace: "nowrap" }}>
                              {dueDateLabel}
                            </span>
                          )}
                          {/* Value */}
                          <span className="tabular-nums" style={{ color: "#DC2626", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>
                            -{formatCurrency(t.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Separator between sections */}
              {contasPendentes.length > 0 && faturasMes.length > 0 && (
                <div style={{ height: 1, background: "#F3F4F6", margin: "0 24px" }} />
              )}

              {/* Fatura Cartão */}
              {faturasMes.length > 0 && (
                <div className="px-6 pt-4 pb-2">
                  <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <div className="flex items-center gap-2">
                      <CreditCard style={{ width: 16, height: 16, color: "#9CA3AF" }} />
                      <span style={{ color: "#374151", fontSize: 12, fontWeight: 700 }}>
                        Fatura cartão
                      </span>
                    </div>
                    <span style={{ color: "#111827", fontSize: 13, fontWeight: 700 }} className="tabular-nums">
                      -{formatCurrency(totalCartoes)}
                    </span>
                  </div>
                  <div>
                    {faturasMes.map((f) => {
                      const status = getDueDateStatus(f.due_date);
                      const dueDateLabel = getDueDateShort(f.due_date);
                      return (
                        <div
                          key={f.id}
                          className="flex items-center gap-3 py-3"
                          style={{ borderBottom: "1px solid #F9FAFB" }}
                        >
                          <span
                            className="shrink-0 rounded-full"
                            style={{
                              width: 6,
                              height: 6,
                              background: status === "overdue" ? "#D97706" : "#D1D5DB",
                            }}
                          />
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="truncate" style={{ color: "#111827", fontSize: 14 }}>
                              {f.cartaoNome}
                            </span>
                            {status === "overdue" && (
                              <span style={{ color: "#D97706", fontSize: 11, fontStyle: "italic", whiteSpace: "nowrap" }}>
                                {dueDateLabel}
                              </span>
                            )}
                          </div>
                          {status !== "overdue" && (
                            <span style={{ color: "#9CA3AF", fontSize: 12, whiteSpace: "nowrap" }}>
                              {dueDateLabel}
                            </span>
                          )}
                          <span className="tabular-nums" style={{ color: "#DC2626", fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>
                            -{formatCurrency(f.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {contasPendentes.length === 0 && faturasMes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                  <CheckCircle2 className="h-10 w-10 mb-3" style={{ color: "#16A34A", opacity: 0.5 }} strokeWidth={1.5} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 4 }}>Tudo em dia!</p>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>Nenhuma conta ou fatura pendente neste mês.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: "1px solid #E5E7EB" }}>
              <Link
                to="/transactions"
                onClick={() => setOpen(false)}
                style={{ color: "#6B7280", fontSize: 13, fontWeight: 400, textDecoration: "none" }}
                className="hover:underline"
              >
                Ver todas →
              </Link>
              <div className="flex items-center gap-1.5">
                <span style={{ color: "#6B7280", fontSize: 12 }}>Total:</span>
                <span className="tabular-nums" style={{ color: "#DC2626", fontSize: 14, fontWeight: 700 }}>
                  -{formatCurrency(totalGeral)}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
