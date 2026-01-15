import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Investimento,
  TIPOS_INVESTIMENTO,
  useMovimentacoesInvestimento,
  useExcluirInvestimento,
  useAtualizarInvestimento,
  useExcluirMovimentacao,
} from "@/hooks/useInvestimentos";
import { formatCurrency } from "@/lib/formatters";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  PiggyBank,
  Landmark,
  Building2,
  Building,
  TrendingUp,
  Layers,
  Bitcoin,
  Wallet,
  Plus,
  Minus,
  TrendingUp as TrendingUpIcon,
  Calendar,
  Trash2,
  Edit,
  Power,
  Loader2,
} from "lucide-react";
import { NovoAporteDialog } from "./NovoAporteDialog";
import { NovoResgateDialog } from "./NovoResgateDialog";
import { RegistrarRendimentoDialog } from "./RegistrarRendimentoDialog";
import { EditarInvestimentoDialog } from "./EditarInvestimentoDialog";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "piggy-bank": PiggyBank,
  landmark: Landmark,
  "building-2": Building2,
  building: Building,
  "trending-up": TrendingUp,
  layers: Layers,
  bitcoin: Bitcoin,
  wallet: Wallet,
};

interface DetalhesInvestimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investimento: Investimento | null;
}

export function DetalhesInvestimentoDialog({
  open,
  onOpenChange,
  investimento,
}: DetalhesInvestimentoDialogProps) {
  const [aporteOpen, setAporteOpen] = useState(false);
  const [resgateOpen, setResgateOpen] = useState(false);
  const [rendimentoOpen, setRendimentoOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);
  const [excluirOpen, setExcluirOpen] = useState(false);
  const [movimentacaoExcluir, setMovimentacaoExcluir] = useState<string | null>(null);

  const { data: movimentacoes = [], isLoading } = useMovimentacoesInvestimento(
    investimento?.id || null
  );
  const excluirInvestimento = useExcluirInvestimento();
  const atualizarInvestimento = useAtualizarInvestimento();
  const excluirMovimentacao = useExcluirMovimentacao();

  if (!investimento) return null;

  const tipoInfo = TIPOS_INVESTIMENTO.find((t) => t.value === investimento.tipo);
  const IconComponent = iconMap[investimento.icone] || PiggyBank;

  const rendimento = investimento.valorAtual - investimento.valorInicial;
  const percentualRendimento = investimento.valorInicial > 0
    ? ((rendimento / investimento.valorInicial) * 100).toFixed(2)
    : "0.00";

  const handleExcluir = async () => {
    await excluirInvestimento.mutateAsync(investimento.id);
    setExcluirOpen(false);
    onOpenChange(false);
  };

  const handleToggleAtivo = async () => {
    await atualizarInvestimento.mutateAsync({
      id: investimento.id,
      ativo: !investimento.ativo,
    });
  };

  const handleExcluirMovimentacao = async () => {
    if (!movimentacaoExcluir) return;
    await excluirMovimentacao.mutateAsync({
      id: movimentacaoExcluir,
      investimentoId: investimento.id,
    });
    setMovimentacaoExcluir(null);
  };

  const getMovimentacaoIcon = (tipo: string) => {
    switch (tipo) {
      case "aporte":
        return <Plus className="h-4 w-4 text-green-600" />;
      case "resgate":
        return <Minus className="h-4 w-4 text-orange-600" />;
      case "rendimento":
        return <TrendingUpIcon className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getMovimentacaoLabel = (tipo: string) => {
    switch (tipo) {
      case "aporte":
        return "Aporte";
      case "resgate":
        return "Resgate";
      case "rendimento":
        return "Rendimento";
      default:
        return tipo;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-xl shrink-0"
                style={{ backgroundColor: `${investimento.cor}20` }}
              >
                <IconComponent
                  className="h-8 w-8"
                  style={{ color: investimento.cor }}
                />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl">{investimento.nome}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {tipoInfo?.label || investimento.tipo}
                  </Badge>
                  {investimento.instituicao && (
                    <span className="text-sm text-muted-foreground">
                      {investimento.instituicao}
                    </span>
                  )}
                  {!investimento.ativo && (
                    <Badge variant="outline">Encerrado</Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="resumo" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="flex-1 overflow-auto space-y-4 mt-4">
              {/* Cards de resumo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Saldo atual</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(investimento.valorAtual)}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Rendimento total</p>
                  <p
                    className={`text-2xl font-bold ${
                      rendimento >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {rendimento >= 0 ? "+" : ""}
                    {formatCurrency(rendimento)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {rendimento >= 0 ? "+" : ""}
                    {percentualRendimento}%
                  </p>
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor inicial</span>
                  <span>{formatCurrency(investimento.valorInicial)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Data de início</span>
                  <span>
                    {format(parseISO(investimento.dataInicio), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                {investimento.dataVencimento && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vencimento</span>
                    <span>
                      {format(parseISO(investimento.dataVencimento), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                )}
                {investimento.rentabilidadeAnual && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rentabilidade</span>
                    <span>{investimento.rentabilidadeAnual}% a.a.</span>
                  </div>
                )}
                {investimento.observacao && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Observação</p>
                    <p className="text-sm">{investimento.observacao}</p>
                  </div>
                )}
              </div>

              {/* Ações */}
              {investimento.ativo && (
                <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-col h-auto py-3"
                    onClick={() => setAporteOpen(true)}
                  >
                    <Plus className="h-5 w-5 text-green-600 mb-1" />
                    <span className="text-xs">Aportar</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-col h-auto py-3"
                    onClick={() => setResgateOpen(true)}
                  >
                    <Minus className="h-5 w-5 text-orange-600 mb-1" />
                    <span className="text-xs">Resgatar</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-col h-auto py-3"
                    onClick={() => setRendimentoOpen(true)}
                  >
                    <TrendingUpIcon className="h-5 w-5 text-blue-600 mb-1" />
                    <span className="text-xs">Rendimento</span>
                  </Button>
                </div>
              )}

              {/* Botões de gerenciamento */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditarOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleAtivo}
                  disabled={atualizarInvestimento.isPending}
                >
                  <Power className="h-4 w-4 mr-1" />
                  {investimento.ativo ? "Encerrar" : "Reativar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setExcluirOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="historico" className="flex-1 overflow-hidden mt-4">
              <ScrollArea className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : movimentacoes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma movimentação registrada
                  </div>
                ) : (
                  <div className="space-y-2 pr-4">
                    {movimentacoes.map((mov) => (
                      <div
                        key={mov.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
                      >
                        <div className="p-2 rounded-full bg-background">
                          {getMovimentacaoIcon(mov.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {getMovimentacaoLabel(mov.tipo)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(mov.data), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          {mov.observacao && (
                            <p className="text-xs text-muted-foreground truncate">
                              {mov.observacao}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              mov.tipo === "resgate"
                                ? "text-orange-600"
                                : "text-green-600"
                            }`}
                          >
                            {mov.tipo === "resgate" ? "-" : "+"}
                            {formatCurrency(mov.valor)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setMovimentacaoExcluir(mov.id)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Dialogs de ações */}
      <NovoAporteDialog
        open={aporteOpen}
        onOpenChange={setAporteOpen}
        investimento={investimento}
      />
      <NovoResgateDialog
        open={resgateOpen}
        onOpenChange={setResgateOpen}
        investimento={investimento}
      />
      <RegistrarRendimentoDialog
        open={rendimentoOpen}
        onOpenChange={setRendimentoOpen}
        investimento={investimento}
      />
      <EditarInvestimentoDialog
        open={editarOpen}
        onOpenChange={setEditarOpen}
        investimento={investimento}
      />

      {/* Confirmação de exclusão do investimento */}
      <AlertDialog open={excluirOpen} onOpenChange={setExcluirOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir investimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O investimento "{investimento.nome}"
              e todo seu histórico de movimentações serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluirInvestimento.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação de exclusão de movimentação */}
      <AlertDialog
        open={!!movimentacaoExcluir}
        onOpenChange={() => setMovimentacaoExcluir(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir movimentação?</AlertDialogTitle>
            <AlertDialogDescription>
              O valor será revertido no saldo do investimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirMovimentacao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluirMovimentacao.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
