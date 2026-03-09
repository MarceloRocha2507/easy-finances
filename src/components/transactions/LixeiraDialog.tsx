import { useState } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useDeletedTransactions, useRestoreTransaction, usePermanentDeleteTransaction, useEmptyTrash } from '@/hooks/useTransactions';
import { formatCurrency } from '@/lib/formatters';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function LixeiraDialog() {
  const [open, setOpen] = useState(false);
  const { data: deletedTransactions, isLoading } = useDeletedTransactions();
  const restoreMutation = useRestoreTransaction();
  const permanentDeleteMutation = usePermanentDeleteTransaction();
  const emptyTrashMutation = useEmptyTrash();

  const count = deletedTransactions?.length || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Lixeira</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-muted-foreground" />
              Lixeira
            </DialogTitle>
            {count > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs">
                    Esvaziar tudo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Esvaziar lixeira?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todas as {count} transações serão excluídas permanentemente. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => emptyTrashMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Esvaziar tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : count === 0 ? (
          <EmptyState
            icon={Trash2}
            title="Lixeira vazia"
            message="Nenhuma transação excluída."
          />
        ) : (
          <div className="divide-y divide-border max-h-[60vh] overflow-y-auto -mx-4 sm:-mx-6">
            {deletedTransactions?.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {t.description || 'Sem descrição'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span className={cn(
                      "text-sm font-semibold tabular-nums",
                      t.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                    )}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                    {t.category && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 hidden sm:inline-flex">
                        {(t.category as any).name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {format(parseISO(t.date), "dd/MM/yyyy", { locale: ptBR })}
                    <span className="hidden sm:inline">
                      {' · Excluída em '}
                      {format(parseISO(t.deleted_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => restoreMutation.mutate(t.id)}
                    disabled={restoreMutation.isPending}
                    title="Restaurar"
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-600" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Excluir permanentemente">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{t.description || 'Sem descrição'}" será removida definitivamente. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => permanentDeleteMutation.mutate(t.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
