import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface Transaction {
  id: string;
  parent_id?: string | null;
  date: string;
  tipo_lancamento?: string | null;
}

interface RecurringEditDialogProps {
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: (mode: 'single' | 'future') => void;
}

export function RecurringEditDialog({ transaction, onClose, onConfirm }: RecurringEditDialogProps) {
  const groupId = transaction?.parent_id || transaction?.id;

  const { data: futureCount, isLoading } = useQuery({
    queryKey: ['recurring-edit-count', groupId, transaction?.date],
    queryFn: async () => {
      if (!groupId || !transaction?.date) return 0;

      const { data, error } = await supabase
        .from('transactions')
        .select('id')
        .or(`parent_id.eq.${groupId},id.eq.${groupId}`)
        .gte('date', transaction.date)
        .is('deleted_at', null);

      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!transaction,
  });

  const count = isLoading ? '...' : futureCount;

  return (
    <AlertDialog open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Editar lançamento recorrente</AlertDialogTitle>
          <AlertDialogDescription>
            Este lançamento faz parte de uma série {transaction?.tipo_lancamento === 'parcelada' ? 'parcelada' : 'recorrente'} com {count} lançamento{typeof count === 'number' && count !== 1 ? 's' : ''} a partir desta data. O que deseja fazer?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="default"
            onClick={() => onConfirm('single')}
          >
            Editar apenas este mês (1 lançamento)
          </Button>
          <Button
            variant="default"
            onClick={() => onConfirm('future')}
          >
            Editar este e todos os seguintes ({count} lançamento{typeof count === 'number' && count !== 1 ? 's' : ''})
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
