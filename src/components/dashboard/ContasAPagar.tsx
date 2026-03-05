import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, CreditCard, ChevronDown, Receipt } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions, Transaction } from "@/hooks/useTransactions";
import { useFaturasNaListagem, FaturaVirtual } from "@/hooks/useFaturasNaListagem";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContasAPagarProps {
  mesReferencia: Date;
  rendaMensal: number;
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

export function ContasAPagar({ mesReferencia }: ContasAPagarProps) {
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

  const { data: todasFaturas, isLoading: isLoadingFaturas } = useFaturasNaListagem();

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
  const totalItens = faturasMes.length + contasPendentes.length;

  const isEmpty = totalItens === 0;

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Nenhuma conta pendente</span>
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card border border-border rounded-xl mb-4 overflow-hidden">
        {/* Header compacto */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left">
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-sm font-semibold text-foreground flex-1">Contas a Pagar</span>
            <Badge variant="secondary" className="text-[11px] px-2 py-0.5 font-medium">
              {totalItens}
            </Badge>
            <span className="text-sm font-bold text-destructive whitespace-nowrap">
              -{formatCurrency(totalGeral)}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>

        {/* Conteúdo expandido */}
        <CollapsibleContent>
          <div className="border-t border-border">
            {/* Faturas de Cartão */}
            {faturasMes.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Faturas ({faturasMes.length})
                  </span>
                </div>
                {faturasMes.map((f) => {
                  const overdue = isOverdue(f.due_date);
                  return (
                    <div key={f.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                      <CreditCard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate flex-1">{f.cartaoNome}</span>
                      <span className={`text-[11px] ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
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

            {/* Separador */}
            {faturasMes.length > 0 && contasPendentes.length > 0 && (
              <div className="border-t border-border mx-4" />
            )}

            {/* Contas Pendentes */}
            {contasPendentes.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Contas ({contasPendentes.length})
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
                      <span className={`text-[11px] ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
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

            {/* Rodapé com total */}
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
