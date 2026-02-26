import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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

const CATEGORY_EMOJI: Record<string, string> = {
  'moradia': '🏠', 'aluguel': '🏠',
  'energia': '⚡', 'luz': '⚡',
  'agua': '💧', 'água': '💧',
  'internet': '📡', 'telefone': '📡',
  'assinatura': '📺', 'streaming': '📺',
  'alimentação': '🍔', 'alimentacao': '🍔',
  'transporte': '🚗', 'educação': '📚', 'educacao': '📚',
  'saúde': '🏥', 'saude': '🏥', 'lazer': '🎮',
};

function getCategoryEmoji(categoryName: string | undefined): string {
  if (!categoryName) return '📌';
  const lower = categoryName.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '📌';
}

function getDueDateInfo(dueDateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dueDateStr + "T00:00:00");
  const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return { text: `Venceu há ${Math.abs(diffDays)} dia${Math.abs(diffDays) > 1 ? 's' : ''}`, className: 'text-red-600 font-medium' };
  if (diffDays === 0) return { text: 'Vence hoje!', className: 'text-orange-500 font-medium' };
  if (diffDays <= 3) return { text: `Vence em ${diffDays} dia${diffDays > 1 ? 's' : ''}`, className: 'text-yellow-600' };
  return { text: `Vence ${format(dueDate, 'dd/MM')}`, className: 'text-muted-foreground' };
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
  const [expanded, setExpanded] = useState(false);

  const inicioMes = `${mesReferencia.getFullYear()}-${String(mesReferencia.getMonth() + 1).padStart(2, "0")}-01`;
  const fimMes = (() => {
    const d = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  // Contas pendentes (transações)
  const { data: transactions, isLoading: isLoadingTx } = useTransactions({
    startDate: inicioMes,
    endDate: fimMes,
    type: "expense",
    status: "pending",
  });

  // Faturas de cartão
  const { data: todasFaturas, isLoading: isLoadingFaturas } = useFaturasNaListagem();

  const isLoading = isLoadingTx || isLoadingFaturas;

  // Filtrar faturas do mês de referência
  const mesRefStr = `${mesReferencia.getFullYear()}-${String(mesReferencia.getMonth() + 1).padStart(2, "0")}`;
  const faturasMes = (todasFaturas || []).filter(f => f.mesReferencia.startsWith(mesRefStr));

  // Contas pendentes ordenadas
  const contasPendentes = (transactions || []).sort(sortPendingExpenses);
  const displayedContas = expanded ? contasPendentes : contasPendentes.slice(0, 5);

  // Totais
  const totalCartoes = faturasMes.reduce((s, f) => s + f.amount, 0);
  const totalContas = contasPendentes.reduce((s, t) => s + t.amount, 0);
  const totalGeral = totalCartoes + totalContas;

  const pctRenda = rendaMensal > 0 ? (totalGeral / rendaMensal) * 100 : 0;
  const barColor = pctRenda > 80 ? '[&>div]:bg-red-500' : pctRenda > 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500';

  const mesNome = format(mesReferencia, "MMMM", { locale: ptBR });
  const isEmpty = faturasMes.length === 0 && contasPendentes.length === 0;

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
              Compromissos pendentes de {mesNome}
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
        ) : isEmpty ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Nenhum compromisso pendente este mês</p>
          </div>
        ) : (
          <>
            {/* BLOCO 1 — Faturas de Cartão */}
            {faturasMes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold mb-2">💳 Faturas de Cartão</p>
                <div className="space-y-1">
                  {faturasMes.map((f) => {
                    const overdue = isOverdue(f.due_date);
                    const dueDateInfo = getDueDateInfo(f.due_date);
                    return (
                      <div
                        key={f.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          overdue
                            ? 'bg-red-50 border-l-4 border-l-red-500'
                            : 'bg-yellow-50 border-l-4 border-l-yellow-400'
                        }`}
                      >
                        <CreditCard
                          className="w-4 h-4 shrink-0"
                          style={{ color: f.cartaoCor }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{f.cartaoNome}</p>
                        </div>
                        <span className={`text-xs whitespace-nowrap hidden sm:block ${dueDateInfo.className}`}>
                          {dueDateInfo.text}
                        </span>
                        <span className="text-sm font-semibold text-destructive whitespace-nowrap">
                          -{formatCurrency(f.amount)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0.5 ${
                            overdue
                              ? 'bg-red-100 text-red-700 border-red-200 animate-pulse'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          {overdue ? 'Vencido' : 'Pendente'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm font-semibold text-destructive mt-2 px-3">
                  Total em Cartões: -{formatCurrency(totalCartoes)}
                </p>
              </div>
            )}

            {/* Separador entre blocos */}
            {faturasMes.length > 0 && contasPendentes.length > 0 && (
              <Separator className="my-3" />
            )}

            {/* BLOCO 2 — Contas Pendentes */}
            {contasPendentes.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold mb-2">📋 Contas Pendentes</p>
                <div className="space-y-1">
                  {displayedContas.map((t) => {
                    const dueDate = t.due_date || t.date;
                    const overdue = isOverdue(dueDate);
                    const dueDateInfo = getDueDateInfo(dueDate);
                    const categoryName = t.category?.name;
                    const emoji = getCategoryEmoji(categoryName);

                    return (
                      <div
                        key={t.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          overdue
                            ? 'bg-red-50 border-l-4 border-l-red-500'
                            : 'bg-yellow-50 border-l-4 border-l-yellow-400'
                        }`}
                      >
                        <span className="text-base shrink-0">{emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {t.description || "Sem descrição"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {categoryName || "Sem categoria"}
                          </p>
                        </div>
                        <span className={`text-xs whitespace-nowrap hidden sm:block ${dueDateInfo.className}`}>
                          {dueDateInfo.text}
                        </span>
                        <span className="text-sm font-semibold text-destructive whitespace-nowrap">
                          -{formatCurrency(t.amount)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0.5 ${
                            overdue
                              ? 'bg-red-100 text-red-700 border-red-200 animate-pulse'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          {overdue ? 'Vencido' : 'Pendente'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                {contasPendentes.length > 5 && (
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
                        <>Mostrar mais ({contasPendentes.length - 5}) <ChevronDown className="w-3 h-3" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* BLOCO 3 — Totalizador Geral */}
            <Separator className="my-3" />

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
              {totalCartoes > 0 && (
                <span className="text-sm">
                  <span className="text-muted-foreground">💳 Total Cartões: </span>
                  <span className="font-semibold text-destructive">-{formatCurrency(totalCartoes)}</span>
                </span>
              )}
              {totalContas > 0 && (
                <span className="text-sm">
                  <span className="text-muted-foreground">📋 Total Contas: </span>
                  <span className="font-semibold text-destructive">-{formatCurrency(totalContas)}</span>
                </span>
              )}
              <span className="text-sm sm:ml-auto">
                <span className="text-muted-foreground">⚠️ Total a Pagar: </span>
                <span className="font-bold text-destructive text-base">-{formatCurrency(totalGeral)}</span>
              </span>
            </div>

            {rendaMensal > 0 && (
              <>
                <Progress
                  value={Math.min(pctRenda, 100)}
                  className={`h-2 ${barColor}`}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Seus compromissos pendentes representam {pctRenda.toFixed(0)}% da sua renda
                </p>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
