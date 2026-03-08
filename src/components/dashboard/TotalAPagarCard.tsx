import { useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Receipt, Eye, CircleDot, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/useTransactions";
import { useFaturasNaListagem } from "@/hooks/useFaturasNaListagem";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TotalAPagarCardProps {
  mesReferencia: Date;
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

export function TotalAPagarCard({ mesReferencia }: TotalAPagarCardProps) {
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
  const faturasMes = (todasFaturas || []).filter(f => f.mesReferencia.startsWith(mesRefStr));

  const contasPendentes = (transactions || []).sort((a, b) => {
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
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="bg-muted/50 px-5 py-4 border-b border-border">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Total a Pagar
            </p>
            <p className="text-2xl font-bold text-destructive tabular-nums">
              -{formatCurrency(totalGeral)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {contasPendentes.length > 0 && (
                <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 rounded-md">
                  {contasPendentes.length} {contasPendentes.length === 1 ? "conta" : "contas"}
                </Badge>
              )}
              {faturasMes.length > 0 && (
                <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5 rounded-md">
                  {faturasMes.length} {faturasMes.length === 1 ? "fatura" : "faturas"}
                </Badge>
              )}
              {contasPendentes.length === 0 && faturasMes.length === 0 && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                  Nada pendente
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh]">
            {/* Contas Pendentes */}
            {contasPendentes.length > 0 && (
              <div className="px-5 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#F3F4F6] dark:bg-muted flex items-center justify-center">
                      <Receipt className="w-3.5 h-3.5 text-[#6B7280]" />
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Contas Pendentes
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-foreground tabular-nums">
                    -{formatCurrency(totalContas)}
                  </span>
                </div>
                <div className="space-y-0">
                  {contasPendentes.map((t) => {
                    const dueDate = t.due_date || t.date;
                    const status = getDueDateStatus(dueDate);
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/40 transition-colors border-b border-border/50 last:border-0"
                      >
                        <CircleDot className={cn(
                          "w-3 h-3 shrink-0",
                          status === "overdue" ? "text-destructive" : status === "today" ? "text-[#D97706]" : "text-muted-foreground/40"
                        )} />
                        <span className="text-sm text-foreground truncate flex-1">
                          {t.description || "Sem descrição"}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0 h-5 rounded-md border",
                            status === "overdue" && "border-destructive/30 text-destructive bg-destructive/5",
                            status === "today" && "border-[#D97706]/30 text-[#D97706] bg-[#D97706]/5",
                            status === "upcoming" && "border-border text-muted-foreground"
                          )}
                        >
                          {getDueDateShort(dueDate)}
                        </Badge>
                        <span className="text-sm font-semibold text-destructive whitespace-nowrap tabular-nums">
                          -{formatCurrency(t.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Separator */}
            {contasPendentes.length > 0 && faturasMes.length > 0 && (
              <div className="border-t border-border mx-5" />
            )}

            {/* Fatura Cartão */}
            {faturasMes.length > 0 && (
              <div className="px-5 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#F3F4F6] dark:bg-muted flex items-center justify-center">
                      <CreditCard className="w-3.5 h-3.5 text-[#6B7280]" />
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Fatura Cartão
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-destructive tabular-nums">
                    -{formatCurrency(totalCartoes)}
                  </span>
                </div>
                <div className="space-y-0">
                  {faturasMes.map((f) => {
                    const status = getDueDateStatus(f.due_date);
                    return (
                      <div
                        key={f.id}
                        className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-muted/40 transition-colors border-b border-border/50 last:border-0"
                      >
                        <CircleDot className={cn(
                          "w-3 h-3 shrink-0",
                          status === "overdue" ? "text-destructive" : status === "today" ? "text-[#D97706]" : "text-muted-foreground/40"
                        )} />
                        <span className="text-sm text-foreground truncate flex-1">{f.cartaoNome}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-medium px-1.5 py-0 h-5 rounded-md border",
                            status === "overdue" && "border-destructive/30 text-destructive bg-destructive/5",
                            status === "today" && "border-[#D97706]/30 text-[#D97706] bg-[#D97706]/5",
                            status === "upcoming" && "border-border text-muted-foreground"
                          )}
                        >
                          {getDueDateShort(f.due_date)}
                        </Badge>
                        <span className="text-sm font-semibold text-destructive whitespace-nowrap tabular-nums">
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
              <div className="flex flex-col items-center justify-center py-10 text-center px-5">
                <CheckCircle2 className="h-10 w-10 text-[#16A34A]/60 mb-3" strokeWidth={1.5} />
                <p className="text-sm font-medium text-foreground mb-1">Tudo em dia!</p>
                <p className="text-xs text-muted-foreground">Nenhuma conta ou fatura pendente neste mês.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-muted/30 px-5 py-3 flex items-center justify-between">
            <Link
              to="/transactions"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setOpen(false)}
            >
              Ver todas →
            </Link>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Total:</span>
              <span className="text-sm font-bold text-destructive tabular-nums">-{formatCurrency(totalGeral)}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
