import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Undo2, AlertTriangle, Clock, FileText, Trash2, Edit, Plus } from "lucide-react";
import {
  useUltimaAlteracao,
  useDesfazerAlteracao,
  formatarAcao,
  formatarTabela,
  formatarTempoRelativo,
  UltimaAlteracao,
} from "@/hooks/useUltimaAlteracao";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface DesfazerAlteracaoDialogProps {
  onSuccess?: () => void;
}

export function DesfazerAlteracaoDialog({ onSuccess }: DesfazerAlteracaoDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: ultimaAlteracao, isLoading } = useUltimaAlteracao();
  const desfazerMutation = useDesfazerAlteracao();

  const handleDesfazer = async () => {
    if (!ultimaAlteracao) return;
    
    await desfazerMutation.mutateAsync(ultimaAlteracao);
    setOpen(false);
    onSuccess?.();
  };

  const getDescricaoAlteracao = (registro: UltimaAlteracao): string => {
    const dados = registro.acao === "DELETE" 
      ? registro.dados_anteriores 
      : registro.dados_novos;

    if (!dados) return "Registro";

    // Para compras_cartao
    if (registro.tabela === "compras_cartao") {
      const descricao = (dados as Record<string, unknown>).descricao as string;
      const valor = (dados as Record<string, unknown>).valor_total as number;
      return `${descricao || "Compra"} - ${formatCurrency(valor || 0)}`;
    }

    // Para parcelas_cartao
    if (registro.tabela === "parcelas_cartao") {
      const numero = (dados as Record<string, unknown>).numero_parcela as number;
      const total = (dados as Record<string, unknown>).total_parcelas as number;
      const valor = (dados as Record<string, unknown>).valor as number;
      return `Parcela ${numero}/${total} - ${formatCurrency(valor || 0)}`;
    }

    return "Registro";
  };

  const getIconeAcao = (acao: string) => {
    switch (acao) {
      case "INSERT":
        return <Plus className="h-4 w-4" />;
      case "UPDATE":
        return <Edit className="h-4 w-4" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getCorAcao = (acao: string) => {
    switch (acao) {
      case "INSERT":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "UPDATE":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "DELETE":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted";
    }
  };

  const getMensagemConfirmacao = (registro: UltimaAlteracao): string => {
    switch (registro.acao) {
      case "INSERT":
        if (registro.tabela === "compras_cartao") {
          return "Esta ação irá remover a compra e todas as parcelas associadas.";
        }
        return "Esta ação irá remover o registro criado.";
      case "UPDATE":
        return "Esta ação irá restaurar os valores anteriores do registro.";
      case "DELETE":
        if (registro.tabela === "compras_cartao") {
          return "Esta ação irá restaurar a compra e suas parcelas.";
        }
        return "Esta ação irá restaurar o registro excluído.";
      default:
        return "";
    }
  };

  const temAlteracao = !isLoading && ultimaAlteracao;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={!temAlteracao}
          className={cn(!temAlteracao && "opacity-50")}
        >
          <Undo2 className="h-4 w-4 mr-2" />
          Desfazer
        </Button>
      </DialogTrigger>
      
      {temAlteracao && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Undo2 className="h-5 w-5 text-primary" />
              Desfazer Última Alteração
            </DialogTitle>
            <DialogDescription>
              Reverta a última modificação feita nos cartões
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Alerta */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-700">Você está prestes a desfazer:</p>
              </div>
            </div>

            {/* Detalhes da alteração */}
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              {/* Ação */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ação:</span>
                <Badge variant="outline" className={cn("gap-1", getCorAcao(ultimaAlteracao.acao))}>
                  {getIconeAcao(ultimaAlteracao.acao)}
                  {formatarAcao(ultimaAlteracao.acao)}
                </Badge>
              </div>

              {/* Tipo */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <span className="text-sm font-medium">{formatarTabela(ultimaAlteracao.tabela)}</span>
              </div>

              {/* Descrição */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Registro:</span>
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {getDescricaoAlteracao(ultimaAlteracao)}
                </span>
              </div>

              {/* Tempo */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Realizada:</span>
                <span className="text-sm flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatarTempoRelativo(ultimaAlteracao.created_at)}
                </span>
              </div>
            </div>

            {/* Mensagem de confirmação */}
            <p className="text-sm text-muted-foreground text-center">
              {getMensagemConfirmacao(ultimaAlteracao)}
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={desfazerMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDesfazer}
              disabled={desfazerMutation.isPending}
              className="gap-2"
            >
              {desfazerMutation.isPending ? (
                <>
                  <Undo2 className="h-4 w-4 animate-spin" />
                  Desfazendo...
                </>
              ) : (
                <>
                  <Undo2 className="h-4 w-4" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
