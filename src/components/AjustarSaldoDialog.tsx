import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scale, TrendingUp, TrendingDown, ArrowRight, AlertCircle, History, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useSaldoInicial } from '@/hooks/useSaldoInicial';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface AjustarSaldoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saldoRealCalculado: number;
  totalReceitas: number;
  totalDespesas: number;
}

interface HistoricoAjuste {
  id: string;
  saldo_anterior: number;
  saldo_novo: number;
  diferenca: number;
  saldo_inicial_anterior: number;
  saldo_inicial_novo: number;
  observacao: string | null;
  created_at: string;
}

export function AjustarSaldoDialog({ 
  open, 
  onOpenChange, 
  saldoRealCalculado,
  totalReceitas,
  totalDespesas,
}: AjustarSaldoDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { saldoInicial, atualizarSaldo, isUpdating } = useSaldoInicial();
  const [saldoInformado, setSaldoInformado] = useState('');
  const [observacao, setObservacao] = useState('');
  const [activeTab, setActiveTab] = useState('ajustar');

  // Buscar histórico de ajustes
  const { data: historico = [], isLoading: isLoadingHistorico } = useQuery({
    queryKey: ['historico-ajustes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historico_ajustes_saldo')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as HistoricoAjuste[];
    },
    enabled: !!user && open,
  });

  // Mutation para excluir ajuste do histórico
  const { mutate: excluirAjuste, isPending: isDeleting } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('historico_ajustes_saldo')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historico-ajustes'] });
      toast.success('Registro excluído do histórico');
    },
    onError: () => {
      toast.error('Erro ao excluir registro');
    },
  });

  // Reset quando abre o dialog
  useEffect(() => {
    if (open) {
      setSaldoInformado(saldoRealCalculado.toFixed(2));
      setObservacao('');
      setActiveTab('ajustar');
    }
  }, [open, saldoRealCalculado]);

  const valorInformado = useMemo(() => {
    const parsed = parseFloat(saldoInformado.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }, [saldoInformado]);

  const diferenca = useMemo(() => {
    return valorInformado - saldoRealCalculado;
  }, [valorInformado, saldoRealCalculado]);

  // Novo saldo inicial = saldoInformado - totalReceitas + totalDespesas
  const novoSaldoInicial = useMemo(() => {
    return valorInformado - totalReceitas + totalDespesas;
  }, [valorInformado, totalReceitas, totalDespesas]);

  const handleSave = async () => {
    // Salvar no histórico
    const { error } = await supabase
      .from('historico_ajustes_saldo')
      .insert({
        user_id: user!.id,
        saldo_anterior: saldoRealCalculado,
        saldo_novo: valorInformado,
        diferenca: diferenca,
        saldo_inicial_anterior: saldoInicial,
        saldo_inicial_novo: novoSaldoInicial,
        observacao: observacao.trim() || null,
      });
    
    if (error) {
      toast.error('Erro ao salvar histórico do ajuste');
      return;
    }

    // Atualizar saldo inicial
    await atualizarSaldo(novoSaldoInicial);
    queryClient.invalidateQueries({ queryKey: ['historico-ajustes'] });
    onOpenChange(false);
  };

  const temDiferenca = Math.abs(diferenca) >= 0.01;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Ajustar Saldo Real
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ajustar" className="flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Ajustar
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico
              {historico.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {historico.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ajustar" className="space-y-4 mt-4">
            {/* Saldo calculado pelo sistema */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Saldo calculado pelo sistema
              </Label>
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className={cn(
                  "text-xl font-semibold",
                  saldoRealCalculado >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {formatCurrency(saldoRealCalculado)}
                </span>
              </div>
            </div>

            {/* Input para saldo real */}
            <div className="space-y-2">
              <Label htmlFor="saldo-real">
                Saldo real atual (extrato bancário)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  id="saldo-real"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={saldoInformado}
                  onChange={(e) => setSaldoInformado(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Informe o saldo que consta no seu extrato bancário
              </p>
            </div>

            {/* Observação */}
            <div className="space-y-2">
              <Label htmlFor="observacao">
                Observação (opcional)
              </Label>
              <Textarea
                id="observacao"
                placeholder="Ex: Ajuste referente ao extrato de janeiro..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>

            {/* Feedback da diferença */}
            {temDiferenca && (
              <div className={cn(
                "p-4 rounded-lg border",
                diferenca > 0 
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" 
                  : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {diferenca > 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-medium">
                    Diferença: {diferenca > 0 ? '+' : ''}{formatCurrency(diferenca)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {diferenca > 0 
                    ? "Você tem mais dinheiro do que o sistema calculou"
                    : "Você tem menos dinheiro do que o sistema calculou"
                  }
                </p>
              </div>
            )}

            {/* Explicação do ajuste */}
            {temDiferenca && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">O que será ajustado:</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Saldo base: {formatCurrency(saldoInicial)}</span>
                      <ArrowRight className="w-4 h-4" />
                      <span className="font-medium text-primary">
                        {formatCurrency(novoSaldoInicial)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button 
                onClick={handleSave}
                disabled={isUpdating || !temDiferenca}
                className="gradient-primary"
              >
                {isUpdating ? 'Ajustando...' : 'Ajustar Saldo'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            {isLoadingHistorico ? (
              <div className="py-8 text-center text-muted-foreground">
                Carregando histórico...
              </div>
            ) : historico.length === 0 ? (
              <div className="py-8 text-center">
                <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  Nenhum ajuste realizado ainda
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Os ajustes de saldo aparecerão aqui
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {historico.map((ajuste) => (
                    <div 
                      key={ajuste.id}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {ajuste.diferenca > 0 ? (
                              <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-600 flex-shrink-0" />
                            )}
                            <span className={cn(
                              "font-medium",
                              ajuste.diferenca > 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {ajuste.diferenca > 0 ? '+' : ''}{formatCurrency(ajuste.diferenca)}
                            </span>
                          </div>
                          
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <span>{formatCurrency(ajuste.saldo_anterior)}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span className="font-medium text-foreground">
                              {formatCurrency(ajuste.saldo_novo)}
                            </span>
                          </div>

                          {ajuste.observacao && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {ajuste.observacao}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {format(new Date(ajuste.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => excluirAjuste(ajuste.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
