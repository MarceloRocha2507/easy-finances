import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Check, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Layers,
  Hash,
  Pencil,
  Package,
  DollarSign,
  Wallet,
  Briefcase,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Heart,
  GraduationCap,
  Gift,
  Plane,
  Gamepad2,
  Shirt,
  Pill,
  Book,
  Zap,
  Tag
} from "lucide-react";

// Mapa de ícones para renderização
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'dollar-sign': DollarSign,
  'wallet': Wallet,
  'briefcase': Briefcase,
  'shopping-cart': ShoppingCart,
  'home': Home,
  'car': Car,
  'utensils': Utensils,
  'heart': Heart,
  'graduation-cap': GraduationCap,
  'gift': Gift,
  'plane': Plane,
  'gamepad': Gamepad2,
  'shirt': Shirt,
  'pill': Pill,
  'book': Book,
  'package': Package,
  'zap': Zap,
  'trending-up': TrendingUp,
  'tag': Tag,
};

function getIconComponent(iconValue: string): React.ComponentType<{ className?: string }> {
  return ICON_MAP[iconValue] || Package;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description?: string | null;
  date: string;
  status?: string | null;
  due_date?: string | null;
  paid_date?: string | null;
  is_recurring?: boolean | null;
  recurrence_day?: number | null;
  tipo_lancamento?: string | null;
  numero_parcela?: number | null;
  total_parcelas?: number | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
  } | null;
}

interface TransactionDetailsDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionDetailsDialog({ 
  transaction, 
  open, 
  onOpenChange,
  onEdit 
}: TransactionDetailsDialogProps) {
  if (!transaction) return null;

  const IconComponent = getIconComponent(transaction.category?.icon || 'package');
  const isPending = transaction.status === 'pending';
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = isPending && transaction.due_date && transaction.due_date < today;

  const getTipoLancamentoLabel = (tipo: string | null | undefined) => {
    switch (tipo) {
      case 'parcelada': return 'Parcelada';
      case 'fixa': return 'Fixa';
      default: return 'Única';
    }
  };

  const getStatusLabel = () => {
    if (isOverdue) return 'Vencida';
    if (isPending) return 'Pendente';
    return 'Concluída';
  };

  const getStatusColor = () => {
    if (isOverdue) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    if (isPending) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
  };

  const formatDateTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatDateOnly = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(transaction);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes da Transação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cabeçalho com ícone, descrição e categoria */}
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              transaction.type === 'income' 
                ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'
            )}>
              <IconComponent className={cn(
                "w-6 h-6",
                transaction.type === 'income' 
                  ? 'text-emerald-600' 
                  : 'text-red-600'
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-lg">
                {transaction.description || transaction.category?.name || 'Sem descrição'}
              </p>
              <p className="text-sm text-muted-foreground">
                {transaction.category?.name || 'Sem categoria'}
              </p>
            </div>
          </div>

          {/* Valor em destaque */}
          <div className={cn(
            "text-center py-4 rounded-xl",
            transaction.type === 'income' 
              ? 'bg-emerald-50 dark:bg-emerald-950/30' 
              : 'bg-red-50 dark:bg-red-950/30'
          )}>
            <span className={cn(
              "text-3xl font-bold",
              transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
            )}>
              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </span>
          </div>

          <Separator />

          {/* Informações Principais */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Informações</h4>
            
            <div className="grid gap-2">
              {/* Tipo */}
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {transaction.type === 'income' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>Tipo</span>
                </div>
                <span className="text-sm font-medium">
                  {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                </span>
              </div>

              {/* Data */}
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Data</span>
                </div>
                <span className="text-sm font-medium">
                  {formatDateOnly(transaction.date)}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isOverdue ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : isPending ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Status</span>
                </div>
                <Badge variant="secondary" className={cn("text-xs", getStatusColor())}>
                  {getStatusLabel()}
                </Badge>
              </div>

              {/* Vencimento (se pendente) */}
              {transaction.due_date && isPending && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Vencimento</span>
                  </div>
                  <span className={cn("text-sm font-medium", isOverdue && "text-red-600")}>
                    {formatDateOnly(transaction.due_date)}
                  </span>
                </div>
              )}

              {/* Data de Pagamento (se paga) */}
              {transaction.paid_date && transaction.status === 'completed' && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4" />
                    <span>Pago em</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatDateOnly(transaction.paid_date)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Informações de Parcelamento/Recorrência (se aplicável) */}
          {(transaction.tipo_lancamento && transaction.tipo_lancamento !== 'unica') || transaction.is_recurring ? (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Lançamento</h4>
                
                <div className="grid gap-2">
                  {/* Tipo de Lançamento */}
                  <div className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {transaction.tipo_lancamento === 'fixa' ? (
                        <RefreshCw className="w-4 h-4" />
                      ) : (
                        <Layers className="w-4 h-4" />
                      )}
                      <span>Tipo</span>
                    </div>
                    <span className="text-sm font-medium">
                      {getTipoLancamentoLabel(transaction.tipo_lancamento)}
                    </span>
                  </div>

                  {/* Número da Parcela (se parcelada) */}
                  {transaction.tipo_lancamento === 'parcelada' && transaction.numero_parcela && transaction.total_parcelas && (
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Hash className="w-4 h-4" />
                        <span>Parcela</span>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                        {transaction.numero_parcela} de {transaction.total_parcelas}
                      </Badge>
                    </div>
                  )}

                  {/* Dia de Recorrência (se recorrente) */}
                  {transaction.is_recurring && transaction.recurrence_day && (
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="w-4 h-4" />
                        <span>Dia da Recorrência</span>
                      </div>
                      <span className="text-sm font-medium">
                        Dia {transaction.recurrence_day}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}

          <Separator />

          {/* Informações de Registro */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Registro</h4>
            
            <div className="grid gap-2 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Criado em</span>
                <span className="font-mono">{formatDateTime(transaction.created_at)}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Atualizado em</span>
                <span className="font-mono">{formatDateTime(transaction.updated_at)}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-muted-foreground/70 truncate max-w-[180px]">
                  {transaction.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleEdit} className="gap-2">
            <Pencil className="w-4 h-4" />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
