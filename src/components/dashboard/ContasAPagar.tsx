import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContasAPagarProps {
  mesReferencia: Date;
}

function getStatusInfo(t: Transaction) {
  if (t.status === "completed") {
    return { label: "Pago", order: 2, className: "bg-green-100 text-green-700 border-green-200" };
  }
  const dueDate = t.due_date || t.date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  if (due < today) {
    return { label: "Vencido", order: 0, className: "bg-red-100 text-red-700 border-red-200" };
  }
  return { label: "Pendente", order: 1, className: "bg-yellow-100 text-yellow-700 border-yellow-200" };
}

function sortExpenses(a: Transaction, b: Transaction): number {
  const statusA = getStatusInfo(a);
  const statusB = getStatusInfo(b);
  if (statusA.order !== statusB.order) return statusA.order - statusB.order;
  const dateA = new Date(a.due_date || a.date);
  const dateB = new Date(b.due_date || b.date);
  return dateA.getTime() - dateB.getTime();
}

export function ContasAPagar({ mesReferencia }: ContasAPagarProps) {
  const [expanded, setExpanded] = useState(false);

  const inicioMes = `${mesReferencia.getFullYear()}-${String(mesReferencia.getMonth() + 1).padStart(2, "0")}-01`;
  const fimMes = (() => {
    const d = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const { data: transactions, isLoading } = useTransactions({
    startDate: inicioMes,
    endDate: fimMes,
    type: "expense",
  });

  const expenses = (transactions || []).filter(t => t.status !== "cancelled").sort(sortExpenses);
  const displayedExpenses = expanded ? expenses : expenses.slice(0, 5);

  const totalPago = expenses.filter(t => t.status === "completed").reduce((s, t) => s + t.amount, 0);
  const totalPendente = expenses.filter(t => t.status !== "completed").reduce((s, t) => s + t.amount, 0);
  const total = totalPago + totalPendente;
  const percentPago = total > 0 ? (totalPago / total) * 100 : 0;

  const mesNome = format(mesReferencia, "MMMM", { locale: ptBR });

  return (
    <Card className="rounded-xl border shadow-sm mb-4 animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Contas a Pagar
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              Resumo das despesas de {mesNome}
            </p>
          </div>
          <Link to="/transactions">
            <Button variant="ghost" size="sm" className="text-xs">
              Ver todas →
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Nenhuma despesa registrada neste mês</p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {displayedExpenses.map((t) => {
                const status = getStatusInfo(t);
                const dueDate = t.due_date || t.date;
                const categoryColor = t.category?.color || "#94a3b8";
                const categoryName = t.category?.name || "Sem categoria";

                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Category color dot */}
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: categoryColor }}
                    />

                    {/* Name + Category */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {t.description || "Sem descrição"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {categoryName}
                      </p>
                    </div>

                    {/* Due date */}
                    <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                      Vence {format(new Date(dueDate + "T00:00:00"), "dd/MM")}
                    </span>

                    {/* Amount */}
                    <span className="text-sm font-semibold text-destructive whitespace-nowrap">
                      -{formatCurrency(t.amount)}
                    </span>

                    {/* Status badge */}
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0.5 ${status.className}`}
                    >
                      {status.label}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* Show more button */}
            {expenses.length > 5 && (
              <div className="flex justify-center mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? (
                    <>Mostrar menos <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Mostrar mais ({expenses.length - 5}) <ChevronDown className="w-3 h-3" /></>
                  )}
                </Button>
              </div>
            )}

            {/* Footer */}
            <Separator className="my-3" />

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-2">
              <span className="text-sm">
                <span className="text-muted-foreground">Total Pago: </span>
                <span className="font-semibold text-green-600">{formatCurrency(totalPago)}</span>
              </span>
              <span className="text-sm">
                <span className="text-muted-foreground">Total Pendente: </span>
                <span className="font-semibold text-amber-600">{formatCurrency(totalPendente)}</span>
              </span>
            </div>

            <Progress
              value={percentPago}
              className="h-2 [&>div]:bg-green-500"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              {percentPago.toFixed(0)}% pago
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
