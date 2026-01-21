import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useTransactions, useUpdateTransaction } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  Pause,
  Play,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteTransaction, Transaction } from "@/hooks/useTransactions";

export default function Recorrentes() {
  const { data: transactions, isLoading } = useTransactions({});
  const { data: categories } = useCategories();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  // Filtrar apenas transações recorrentes (fixas)
  const recorrentes = transactions?.filter(t => t.tipo_lancamento === "fixa") || [];
  
  // Separar por tipo
  const receitasFixas = recorrentes.filter(t => t.type === "income");
  const despesasFixas = recorrentes.filter(t => t.type === "expense");
  
  // Calcular totais
  const totalReceitasFixas = receitasFixas.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalDespesasFixas = despesasFixas.reduce((sum, t) => sum + Number(t.amount), 0);
  const saldoFixo = totalReceitasFixas - totalDespesasFixas;

  const getCategoryInfo = (categoryId: string | null | undefined) => {
    if (!categoryId || !categories) return null;
    return categories.find(c => c.id === categoryId);
  };

  const handleToggleActive = async (transactionId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      await updateTransaction.mutateAsync({
        id: transactionId,
        status: newStatus
      });
      toast.success(newStatus === "completed" ? "Lançamento ativado" : "Lançamento pausado");
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;
    try {
      await deleteTransaction.mutateAsync(selectedTransaction);
      toast.success("Lançamento recorrente excluído");
      setDeleteDialogOpen(false);
      setSelectedTransaction(null);
    } catch (error) {
      toast.error("Erro ao excluir lançamento");
    }
  };

  const formatDay = (day: number | null | undefined) => {
    if (!day) return "Todo mês";
    return `Dia ${day}`;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 md:p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <RefreshCw className="h-6 w-6" />
              Lançamentos Recorrentes
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie suas receitas e despesas fixas mensais
            </p>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas Fixas</p>
                  <p className="text-2xl font-bold text-income">
                    {formatCurrency(totalReceitasFixas)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {receitasFixas.length} lançamento(s)
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-income/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-income" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despesas Fixas</p>
                  <p className="text-2xl font-bold text-expense">
                    {formatCurrency(totalDespesasFixas)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {despesasFixas.length} lançamento(s)
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-expense/10 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-expense" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Fixo Mensal</p>
                  <p className={`text-2xl font-bold ${saldoFixo >= 0 ? "text-income" : "text-expense"}`}>
                    {formatCurrency(saldoFixo)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Projeção mensal
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Receitas Fixas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-income" />
              Receitas Fixas
            </CardTitle>
            <CardDescription>
              Entradas programadas todo mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            {receitasFixas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma receita fixa cadastrada
              </p>
            ) : (
              <div className="space-y-3">
                {receitasFixas.map((transaction) => {
                  const category = getCategoryInfo(transaction.category_id);
                  const isActive = transaction.status === "completed";
                  
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-sm"
                          style={{ 
                            backgroundColor: category?.color ? `${category.color}20` : 'hsl(var(--muted))',
                            color: category?.color || 'hsl(var(--muted-foreground))'
                          }}
                        >
                          {category?.icon || "💰"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDay(transaction.recurrence_day)}</span>
                            {category && (
                              <>
                                <span>•</span>
                                <span>{category.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <p className="font-semibold text-income">
                          +{formatCurrency(Number(transaction.amount))}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => handleToggleActive(transaction.id, transaction.status)}
                          />
                          <span className="text-xs text-muted-foreground w-12">
                            {isActive ? "Ativo" : "Pausado"}
                          </span>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedTransaction(transaction.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Despesas Fixas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-expense" />
              Despesas Fixas
            </CardTitle>
            <CardDescription>
              Saídas programadas todo mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            {despesasFixas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma despesa fixa cadastrada
              </p>
            ) : (
              <div className="space-y-3">
                {despesasFixas.map((transaction) => {
                  const category = getCategoryInfo(transaction.category_id);
                  const isActive = transaction.status === "completed";
                  
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-sm"
                          style={{ 
                            backgroundColor: category?.color ? `${category.color}20` : 'hsl(var(--muted))',
                            color: category?.color || 'hsl(var(--muted-foreground))'
                          }}
                        >
                          {category?.icon || "💸"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDay(transaction.recurrence_day)}</span>
                            {category && (
                              <>
                                <span>•</span>
                                <span>{category.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <p className="font-semibold text-expense">
                          -{formatCurrency(Number(transaction.amount))}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isActive}
                            onCheckedChange={() => handleToggleActive(transaction.id, transaction.status)}
                          />
                          <span className="text-xs text-muted-foreground w-12">
                            {isActive ? "Ativo" : "Pausado"}
                          </span>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedTransaction(transaction.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dica */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Dica</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Lançamentos recorrentes são automaticamente criados todo mês. 
                  Você pode pausar temporariamente ou excluir permanentemente a qualquer momento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento recorrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lançamento será removido permanentemente 
              e não será mais gerado nos próximos meses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
