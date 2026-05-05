import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CreditCard, Receipt, Wallet, ChevronRight, Users, 
  Package, TrendingDown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface DetalhesTotalDespesasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mesReferencia: Date;
}

interface ResponsavelStats {
  id: string;
  nome: string;
  is_titular: boolean;
  totalFatura: number;
  totalAvulso: number; // No momento apenas titular tem avulso (pendente/completed) no sistema
}

export function DetalhesTotalDespesasDialog({
  open,
  onOpenChange,
  mesReferencia,
}: DetalhesTotalDespesasDialogProps) {
  const { user } = useAuth();

  const inicioMes = format(
    new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1),
    "yyyy-MM-dd"
  );
  const fimMes = format(
    new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0),
    "yyyy-MM-dd"
  );

  const { data: responsaveisData, isLoading } = useQuery({
    queryKey: ["detalhes-total-despesas", user?.id, inicioMes],
    queryFn: async () => {
      if (!user) return [];

      // 1. Buscar responsáveis
      const { data: responsaveis, error: respError } = await supabase
        .from("responsaveis")
        .select("id, nome, is_titular")
        .eq("user_id", user.id)
        .eq("ativo", true);

      if (respError) throw respError;

      // 2. Buscar parcelas do mês para faturas
      const { data: parcelas, error: parcError } = await supabase
        .from("parcelas_cartao")
        .select(`
          valor,
          compra:compras_cartao!inner(responsavel_id)
        `)
        .eq("mes_referencia", inicioMes)
        .eq("ativo", true);

      if (parcError) throw parcError;

      // 3. Buscar despesas avulsas do titular (completed + pending do mês)
      // Transações avulsas são vinculadas apenas ao user_id, sem responsavel_id na tabela
      const { data: transacoes, error: transError } = await supabase
        .from("transactions")
        .select("amount, type, status, category_id")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .is("deleted_at", null)
        .or(`and(status.eq.completed,date.gte.${inicioMes},date.lte.${fimMes}),and(status.eq.pending,due_date.gte.${inicioMes},due_date.lte.${fimMes})`);

      if (transError) throw transError;

      // Categorias de fatura (para não contar em dobro)
      const { data: faturaCats } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", "Fatura do Cartão");
      
      const faturaCatIds = new Set(faturaCats?.map(c => c.id) || []);

      const totalAvulsoTitular = (transacoes || [])
        .filter(t => !faturaCatIds.has(t.category_id))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Processar dados por responsável
      const titular = responsaveis?.find(r => r.is_titular);
      const titularId = titular?.id;

      const statsMap = new Map<string, ResponsavelStats>();

      // Inicializar responsáveis
      (responsaveis || []).forEach(r => {
        statsMap.set(r.id, {
          id: r.id,
          nome: r.nome,
          is_titular: r.is_titular,
          totalFatura: 0,
          totalAvulso: r.is_titular ? totalAvulsoTitular : 0
        });
      });

      // Se houver parcelas sem responsável, atribuir ao titular
      let totalSemResponsavel = 0;

      // Distribuir parcelas de faturas
      (parcelas || []).forEach((p: any) => {
        const respId = p.compra?.responsavel_id;
        if (respId && statsMap.has(respId)) {
          const s = statsMap.get(respId)!;
          s.totalFatura += Number(p.valor);
        } else if (!respId && titularId) {
          const s = statsMap.get(titularId)!;
          s.totalFatura += Number(p.valor);
        } else if (!respId && !titularId) {
          totalSemResponsavel += Number(p.valor);
        }
      });

      const result = Array.from(statsMap.values()).sort((a, b) => (b.is_titular ? 1 : -1));
      
      // Se tiver valor sem responsável e sem titular definido (raro), cria um item "Outros"
      if (totalSemResponsavel > 0 && !titularId) {
        result.push({ id: 'others', nome: 'Outros', is_titular: false, totalFatura: totalSemResponsavel, totalAvulso: 0 });
      }

      return result;
    },
    enabled: open && !!user,
  });

  const totalGeral = (responsaveisData || []).reduce((sum, r) => sum + r.totalFatura + r.totalAvulso, 0);
  const mesFormatado = format(mesReferencia, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden p-0 gap-0 border-none sm:rounded-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 bg-white dark:bg-[#1a1a1a]">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TrendingDown className="w-5 h-5 text-expense" />
            Detalhamento de Despesas
          </DialogTitle>
          <p className="text-sm text-muted-foreground capitalize">{mesFormatado}</p>
        </DialogHeader>

        <Separator className="bg-border/50" />

        <ScrollArea className="max-h-[60vh] px-6 py-4 bg-white dark:bg-[#1a1a1a]">
          {isLoading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {(responsaveisData || []).map((resp) => {
                const totalResp = resp.totalFatura + resp.totalAvulso;
                if (totalResp <= 0) return null;

                return (
                  <div key={resp.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          resp.is_titular ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {resp.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-1.5">
                            {resp.nome}
                            {resp.is_titular && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-normal border-primary/20 text-primary">
                                Titular
                              </Badge>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {resp.is_titular ? "Faturas + Despesas Avulsas" : "Apenas Faturas"}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold tabular-nums">
                        {formatCurrency(totalResp)}
                      </span>
                    </div>

                    <div className="pl-10 space-y-1.5">
                      {resp.totalFatura > 0 && (
                        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 opacity-60" />
                            <span>Faturas de Cartão</span>
                          </div>
                          <span className="tabular-nums">{formatCurrency(resp.totalFatura)}</span>
                        </div>
                      )}
                      {resp.totalAvulso > 0 && (
                        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-3.5 h-3.5 opacity-60" />
                            <span>Contas e Lançamentos</span>
                          </div>
                          <span className="tabular-nums">{formatCurrency(resp.totalAvulso)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {(!responsaveisData || responsaveisData.length === 0 || totalGeral === 0) && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma despesa identificada.</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <Separator className="bg-border/50" />

        <div className="p-6 bg-muted/20 dark:bg-muted/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-muted-foreground">Compromisso Total</span>
            <span className="text-lg font-bold text-expense tabular-nums">
              {formatCurrency(totalGeral)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Soma de todas as faturas e despesas de todos os responsáveis no período.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
