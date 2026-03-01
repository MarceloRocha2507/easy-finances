import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, CreditCard, ChevronDown, Receipt, AlertCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
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

function getDueDateText(dueDateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr + "T00:00:00");
  const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return `Venceu há ${Math.abs(diffDays)}d`;
  if (diffDays === 0) return 'Vence hoje';
  if (diffDays <= 3) return `Vence em ${diffDays}d`;
  return `Vence ${format(dueDate, 'dd/MM')}`;
}

function isOverdue(dueDateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDateStr + "T00:00:00") < today;
}

function sortPendingExpenses(a: Transaction, b: Transaction): number {
  const aOverdue = isOverdue(a.due_date || a.date);
  const bOverdue = isOverdue(b.due_date || b.date);
  if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
  const dateA = new Date(a.due_date || a.date);
  const dateB = new Date(b.due_date || b.date);
  return dateA.getTime() - dateB.getTime();
}

export function ContasAPagar({ mesReferencia, rendaMensal }: ContasAPagarProps) {
  const [faturasOpen, setFaturasOpen] = useState(false);
  const [contasOpen, setContasOpen] = useState(false);
  const [contasExpanded, setContasExpanded] = useState(false);

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

  const contasPendentes = (transactions || []).sort(sortPendingExpenses);
  const displayedContas = contasExpanded ? contasPendentes : contasPendentes.slice(0, 5);

  const totalCartoes = faturasMes.reduce((s, f) => s + f.amount, 0);
  const totalContas = contasPendentes.reduce((s, t) => s + t.amount, 0);
  const totalGeral = totalCartoes + totalContas;

  const mesNome = format(mesReferencia, "MMMM", { locale: ptBR });
  const isEmpty = faturasMes.length === 0 && contasPendentes.length === 0;

  return (
    <div className="bg-white border border-[hsl(220,13%,91%)] rounded-[12px] p-4 sm:p-6 mb-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[hsl(220,13%,91%)]">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[hsl(220,9%,64%)] shrink-0" />
            <span className="text-[16px] sm:text-sm font-bold text-[hsl(220,13%,10%)]">Contas a Pagar</span>
          </div>
          <p className="text-[12px] text-[hsl(220,9%,64%)] capitalize">
            Compromissos pendentes de {mesNome}
          </p>
        </div>
        <Link to="/transactions" className="text-xs text-[hsl(220,9%,46%)] hover:text-[hsl(220,13%,10%)] transition-colors shrink-0 ml-3">
          Ver todas →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="text-center py-6 text-sm text-[hsl(220,9%,64%)]">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 text-[hsl(220,9%,64%)] opacity-30" />
          <p>Nenhum compromisso pendente este mês</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* BLOCO 1 — Faturas de Cartão */}
          {faturasMes.length > 0 && (
            <Collapsible open={faturasOpen} onOpenChange={setFaturasOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer bg-[hsl(210,20%,98%)] hover:bg-[hsl(220,14%,96%)] rounded-[10px] px-4 py-3 transition-colors">
                  <div className="w-6 h-6 rounded-[6px] bg-white border border-[hsl(220,13%,91%)] flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-[hsl(220,9%,64%)]" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[14px] font-bold text-[hsl(220,13%,10%)] truncate">
                      Faturas de Cartão
                    </span>
                    <span className="text-[12px] text-[hsl(220,9%,64%)]">
                      {faturasMes.length} {faturasMes.length === 1 ? 'fatura' : 'faturas'}
                    </span>
                  </div>
                  <span className="text-[14px] font-bold text-[hsl(0,84%,60%)] whitespace-nowrap shrink-0">
                    -{formatCurrency(totalCartoes)}
                  </span>
                  <div className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white transition-colors shrink-0">
                    <ChevronDown className={`w-4 h-4 text-[hsl(220,9%,64%)] transition-transform duration-300 ${faturasOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1">
                  {faturasMes.map((f) => {
                    const overdue = isOverdue(f.due_date);
                    return (
                      <div
                        key={f.id}
                        className="flex items-center gap-2 sm:gap-3 px-3 py-2.5 border-b border-[hsl(210,20%,98%)] hover:bg-[hsl(210,20%,98%)] transition-colors"
                      >
                        <div className="w-6 h-6 rounded-[6px] bg-[hsl(220,14%,96%)] flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4 text-[hsl(220,9%,64%)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[hsl(220,13%,10%)] truncate">{f.cartaoNome}</p>
                        </div>
                        <span className="text-xs text-[hsl(220,9%,64%)] whitespace-nowrap hidden sm:block">
                          {getDueDateText(f.due_date)}
                        </span>
                        <span className="text-sm font-bold text-[hsl(0,84%,60%)] whitespace-nowrap shrink-0">
                          -{formatCurrency(f.amount)}
                        </span>
                        <span className={`text-[11px] font-medium rounded-[6px] px-2 py-0.5 shrink-0 ${
                          overdue
                            ? 'bg-[hsl(0,93%,94%)] text-[hsl(0,74%,35%)]'
                            : 'bg-[hsl(48,96%,89%)] text-[hsl(32,95%,29%)]'
                        }`}>
                          {overdue ? 'Vencido' : 'Pendente'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Divider between blocks */}
          {faturasMes.length > 0 && contasPendentes.length > 0 && (
            <div className="border-b border-[hsl(220,13%,91%)]" />
          )}

          {/* BLOCO 2 — Contas Pendentes */}
          {contasPendentes.length > 0 && (
            <Collapsible open={contasOpen} onOpenChange={setContasOpen}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer bg-[hsl(210,20%,98%)] hover:bg-[hsl(220,14%,96%)] rounded-[10px] px-4 py-3 transition-colors">
                  <div className="w-6 h-6 rounded-[6px] bg-white border border-[hsl(220,13%,91%)] flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4 text-[hsl(220,9%,64%)]" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="text-[14px] font-bold text-[hsl(220,13%,10%)] truncate">
                      Contas Pendentes
                    </span>
                    <span className="text-[12px] text-[hsl(220,9%,64%)]">
                      {contasPendentes.length} {contasPendentes.length === 1 ? 'conta' : 'contas'}
                    </span>
                  </div>
                  <span className="text-[14px] font-bold text-[hsl(0,84%,60%)] whitespace-nowrap shrink-0">
                    -{formatCurrency(totalContas)}
                  </span>
                  <div className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white transition-colors shrink-0">
                    <ChevronDown className={`w-4 h-4 text-[hsl(220,9%,64%)] transition-transform duration-300 ${contasOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1">
                  {displayedContas.map((t) => {
                    const dueDate = t.due_date || t.date;
                    const overdue = isOverdue(dueDate);
                    const categoryName = t.category?.name;

                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-2 sm:gap-3 px-3 py-2.5 border-b border-[hsl(210,20%,98%)] hover:bg-[hsl(210,20%,98%)] transition-colors"
                      >
                        <div className="w-6 h-6 rounded-[6px] bg-[hsl(220,14%,96%)] flex items-center justify-center shrink-0">
                          <Receipt className="w-4 h-4 text-[hsl(220,9%,64%)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[hsl(220,13%,10%)] truncate">
                            {t.description || "Sem descrição"}
                          </p>
                          <p className="text-xs text-[hsl(220,9%,64%)] truncate">
                            {categoryName || "Sem categoria"}
                          </p>
                        </div>
                        <span className="text-xs text-[hsl(220,9%,64%)] whitespace-nowrap hidden sm:block">
                          {getDueDateText(dueDate)}
                        </span>
                        <span className="text-sm font-bold text-[hsl(0,84%,60%)] whitespace-nowrap shrink-0">
                          -{formatCurrency(t.amount)}
                        </span>
                        <span className={`text-[11px] font-medium rounded-[6px] px-2 py-0.5 shrink-0 ${
                          overdue
                            ? 'bg-[hsl(0,93%,94%)] text-[hsl(0,74%,35%)]'
                            : 'bg-[hsl(48,96%,89%)] text-[hsl(32,95%,29%)]'
                        }`}>
                          {overdue ? 'Vencido' : 'Pendente'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {contasPendentes.length > 5 && (
                  <div className="flex justify-center mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-[hsl(220,9%,46%)] gap-1"
                      onClick={() => setContasExpanded(!contasExpanded)}
                    >
                      {contasExpanded ? (
                        <>Mostrar menos <ChevronDown className="w-3 h-3 rotate-180" /></>
                      ) : (
                        <>Mostrar mais ({contasPendentes.length - 5}) <ChevronDown className="w-3 h-3" /></>
                      )}
                    </Button>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Footer totals */}
          <div className="border-t-2 border-[hsl(220,13%,91%)] pt-4 mt-1">
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-4">
              {totalCartoes > 0 && (
                <span className="text-[13px]">
                  <span className="text-[hsl(220,9%,46%)]">Total Cartões: </span>
                  <span className="font-semibold text-[hsl(0,84%,60%)]">-{formatCurrency(totalCartoes)}</span>
                </span>
              )}
              {totalContas > 0 && (
                <span className="text-[13px]">
                  <span className="text-[hsl(220,9%,46%)]">Total Contas: </span>
                  <span className="font-semibold text-[hsl(0,84%,60%)]">-{formatCurrency(totalContas)}</span>
                </span>
              )}
            </div>
            <div className="mt-3 sm:mt-2 bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg p-3 flex items-center gap-1.5 w-full">
              <AlertCircle className="w-4 h-4 text-[hsl(0,84%,60%)] shrink-0" />
              <span className="text-[14px] text-[hsl(220,9%,46%)]">Total a Pagar: </span>
              <span className="text-[15px] sm:text-[15px] font-bold text-[hsl(0,84%,60%)]">-{formatCurrency(totalGeral)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
