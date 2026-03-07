import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CreditCard, ChevronDown, Receipt } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

function isOverdue(dueDateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDateStr + "T00:00:00") < today;
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
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "relative bg-white dark:bg-[#1a1a1a] border border-[#E5E7EB] dark:border-[#2a2a2a] rounded-[10px]",
          "shadow-[0_1px_3px_rgba(0,0,0,0.07)] animate-fade-in-up overflow-hidden"
        )}
        style={{ animationDelay: "0.25s", opacity: 0 }}
      >
        {/* Header - estilo StatCardMinimal */}
        <CollapsibleTrigger asChild>
          <button className="w-full text-left p-4 hover:bg-muted/30 transition-colors">
            <div className="absolute top-4 right-4 flex items-center gap-1">
              <ChevronDown className={cn("h-4 w-4 text-foreground/30 transition-transform duration-200", open && "rotate-180")} />
            </div>

            <p className="text-[#6B7280] text-xs sm:text-sm mb-1">Total a Pagar</p>

            {isLoading ? (
              <Skeleton className="h-6 w-24 sm:h-7 sm:w-28 bg-gray-200/60 dark:bg-gray-700/40" />
            ) : (
              <p className="text-lg sm:text-xl font-bold tabular-nums text-[#DC2626]">
                -{formatCurrency(totalGeral)}
              </p>
            )}

            {isLoading ? (
              <Skeleton className="h-3 w-40 mt-2 bg-gray-200/60 dark:bg-gray-700/40" />
            ) : (
              <div className="mt-2 space-y-0.5">
                <p className="text-[11px] text-[#6B7280] flex items-center gap-1.5">
                  <Receipt className="w-3 h-3" />
                  Contas pendentes: <span className="text-destructive font-medium">-{formatCurrency(totalContas)}</span>
                </p>
                <p className="text-[11px] text-[#6B7280] flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" />
                  Fatura do cartão: <span className="text-destructive font-medium">-{formatCurrency(totalCartoes)}</span>
                </p>
              </div>
            )}
          </button>
        </CollapsibleTrigger>

        {/* Conteúdo expandido */}
        <CollapsibleContent>
          <div className="border-t border-border">
            {/* Contas Pendentes */}
            {contasPendentes.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Contas Pendentes ({contasPendentes.length})
                  </span>
                </div>
                {contasPendentes.map((t) => {
                  const dueDate = t.due_date || t.date;
                  const overdue = isOverdue(dueDate);
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                      <Receipt className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate flex-1">
                        {t.description || "Sem descrição"}
                      </span>
                      <span className={cn("text-[11px]", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                        {getDueDateShort(dueDate)}
                      </span>
                      <span className="text-sm font-semibold text-destructive whitespace-nowrap">
                        -{formatCurrency(t.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Separador */}
            {contasPendentes.length > 0 && faturasMes.length > 0 && (
              <div className="border-t border-border mx-4" />
            )}

            {/* Fatura Cartão */}
            {faturasMes.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Fatura Cartão ({faturasMes.length})
                  </span>
                </div>
                {faturasMes.map((f) => {
                  const overdue = isOverdue(f.due_date);
                  return (
                    <div key={f.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                      <CreditCard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate flex-1">{f.cartaoNome}</span>
                      <span className={cn("text-[11px]", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                        {getDueDateShort(f.due_date)}
                      </span>
                      <span className="text-sm font-semibold text-destructive whitespace-nowrap">
                        -{formatCurrency(f.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rodapé */}
            <div className="border-t border-border px-4 py-3 flex items-center justify-between">
              <Link to="/transactions" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Ver todas →
              </Link>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Total:</span>
                <span className="text-sm font-bold text-destructive">-{formatCurrency(totalGeral)}</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
