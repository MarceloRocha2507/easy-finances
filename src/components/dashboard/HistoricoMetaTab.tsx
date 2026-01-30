import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Minus, History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { useHistoricoMeta, MovimentacaoMeta } from "@/hooks/useHistoricoMeta";

interface Props {
  metaId: string;
  metaTitulo: string;
}

function MovimentacaoItem({ item }: { item: MovimentacaoMeta }) {
  const config = {
    deposito: {
      icon: Plus,
      label: "Depósito",
      bgClass: "bg-emerald-500/10",
      iconClass: "text-emerald-500",
      valueClass: "text-emerald-600",
      prefix: "+",
    },
    retirada: {
      icon: Minus,
      label: "Retirada",
      bgClass: "bg-rose-500/10",
      iconClass: "text-rose-500",
      valueClass: "text-rose-600",
      prefix: "-",
    },
  };

  const cfg = config[item.tipo];
  const Icon = cfg.icon;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", cfg.bgClass)}>
          <Icon className={cn("h-4 w-4", cfg.iconClass)} />
        </div>
        <div>
          <p className="text-sm font-medium">{cfg.label}</p>
          <p className="text-xs text-muted-foreground">
            {format(item.data, "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("font-semibold", cfg.valueClass)}>
          {cfg.prefix}{formatCurrency(item.valor)}
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="p-3 rounded-full bg-muted/50 mb-3">
        <History className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        Nenhuma movimentação ainda
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Depósitos e retiradas aparecerão aqui
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

export function HistoricoMetaTab({ metaId, metaTitulo }: Props) {
  const { data: movimentacoes, isLoading } = useHistoricoMeta(metaId, metaTitulo);

  // Agrupar por mês
  const movimentacoesPorMes = useMemo(() => {
    const grupos = new Map<string, MovimentacaoMeta[]>();
    
    movimentacoes?.forEach(mov => {
      const chave = format(mov.data, "MMMM 'de' yyyy", { locale: ptBR });
      const capitalizedChave = chave.charAt(0).toUpperCase() + chave.slice(1);
      
      if (!grupos.has(capitalizedChave)) {
        grupos.set(capitalizedChave, []);
      }
      grupos.get(capitalizedChave)!.push(mov);
    });
    
    return grupos;
  }, [movimentacoes]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!movimentacoes || movimentacoes.length === 0) {
    return <EmptyState />;
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {Array.from(movimentacoesPorMes.entries()).map(([mes, items]) => (
          <div key={mes}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 sticky top-0 bg-background py-1">
              📅 {mes}
            </h4>
            <div className="space-y-2">
              {items.map(item => (
                <MovimentacaoItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
