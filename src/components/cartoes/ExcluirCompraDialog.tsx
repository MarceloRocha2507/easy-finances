import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ParcelaFatura, excluirParcelas, EscopoExclusao } from "@/services/compras-cartao";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  parcela: ParcelaFatura | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
  corCartao?: string;
}

export function ExcluirCompraDialog({
  parcela,
  open,
  onOpenChange,
  onDeleted,
  corCartao,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [escopo, setEscopo] = useState<EscopoExclusao>("todas");
  const [etapaConfirmacao, setEtapaConfirmacao] = useState(false);

  // Reset estados quando abrir dialog
  useEffect(() => {
    if (open) {
      setEscopo("todas");
      setEtapaConfirmacao(false);
    }
  }, [open]);

  if (!parcela) return null;

  const temMultiplasParcelas = parcela.total_parcelas > 1;
  const naoEUltimaParcela = parcela.numero_parcela < parcela.total_parcelas;
  const parcelasRestantes = parcela.total_parcelas - parcela.numero_parcela + 1;
  const requerConfirmacaoExtra = escopo === "todas" && parcela.total_parcelas > 6;

  function handleClickExcluir() {
    if (requerConfirmacaoExtra && !etapaConfirmacao) {
      setEtapaConfirmacao(true);
    } else {
      handleExcluir();
    }
  }

  async function handleExcluir() {
    if (!parcela) return;

    setLoading(true);
    try {
      const qtdExcluidas = await excluirParcelas({
        compraId: parcela.compra_id,
        parcelaId: parcela.id,
        numeroParcela: parcela.numero_parcela,
        escopo,
      });

      const mensagens: Record<EscopoExclusao, string> = {
        parcela: "Parcela excluída!",
        restantes: `${qtdExcluidas} parcela(s) excluída(s)!`,
        todas: "Compra excluída!",
      };

      toast({ title: mensagens[escopo] });
      onDeleted();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao excluir",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="p-0 gap-0 border-0 overflow-hidden [&>button]:text-white [&>button]:hover:text-white/80">
        <div
          className="px-4 sm:px-5 pt-4 pb-4 bg-gradient-to-br from-violet-600 to-indigo-600"
        >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-white">
            <Trash2 className="h-5 w-5 text-white/80" />
            Excluir compra?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="font-medium text-foreground">{parcela.descricao}</p>
                <p className="text-sm text-muted-foreground">
                  {temMultiplasParcelas 
                    ? `Parcela ${parcela.numero_parcela}/${parcela.total_parcelas} • ${formatCurrency(parcela.valor)}`
                    : formatCurrency(parcela.valor)
                  }
                </p>
              </div>

              {temMultiplasParcelas && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">O que deseja excluir?</p>
                  
                  <RadioGroup 
                    value={escopo} 
                    onValueChange={(v) => setEscopo(v as EscopoExclusao)}
                    className="space-y-2"
                  >
                    {/* Opção 1: Apenas esta parcela */}
                    <div className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                      escopo === "parcela" ? "border-primary bg-primary/5" : "border-border"
                    }`}>
                      <RadioGroupItem value="parcela" id="excluir-parcela" className="mt-0.5" />
                      <Label htmlFor="excluir-parcela" className="flex-1 cursor-pointer">
                        <span className="font-medium">Apenas esta parcela</span>
                        <p className="text-sm text-muted-foreground">
                          Parcela {parcela.numero_parcela} • {formatCurrency(parcela.valor)}
                        </p>
                      </Label>
                    </div>
                    
                    {/* Opção 2: Parcelas restantes (só se não for última) */}
                    {naoEUltimaParcela && (
                      <div className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                        escopo === "restantes" ? "border-primary bg-primary/5" : "border-border"
                      }`}>
                        <RadioGroupItem value="restantes" id="excluir-restantes" className="mt-0.5" />
                        <Label htmlFor="excluir-restantes" className="flex-1 cursor-pointer">
                          <span className="font-medium">Esta e todas as futuras</span>
                          <p className="text-sm text-muted-foreground">
                            {parcelasRestantes} parcelas restantes • {formatCurrency(parcela.valor * parcelasRestantes)}
                          </p>
                        </Label>
                      </div>
                    )}
                    
                    {/* Opção 3: Todas */}
                    <div className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                      escopo === "todas" ? "border-destructive bg-destructive/5" : "border-border"
                    }`}>
                      <RadioGroupItem value="todas" id="excluir-todas" className="mt-0.5" />
                      <Label htmlFor="excluir-todas" className="flex-1 cursor-pointer">
                        <span className="font-medium">Excluir compra inteira</span>
                        <p className="text-sm text-muted-foreground">
                          Todas as {parcela.total_parcelas} parcelas • {formatCurrency(parcela.valor * parcela.total_parcelas)}
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {!temMultiplasParcelas && (
                <p className="text-sm text-muted-foreground">
                  Esta compra será excluída permanentemente.
                </p>
              )}

              {/* Confirmação extra para compras com muitas parcelas */}
              {etapaConfirmacao && (
                <div className="space-y-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">Atenção!</span>
                  </div>
                  <p className="text-sm">
                    Você está prestes a excluir <strong>"{parcela.descricao}"</strong> com{" "}
                    <strong>{parcela.total_parcelas} parcelas</strong> no total de{" "}
                    <strong>{formatCurrency(parcela.valor * parcela.total_parcelas)}</strong>.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tem certeza que deseja continuar? Esta ação é irreversível.
                  </p>
                </div>
              )}

              {!etapaConfirmacao && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        </div>
        <AlertDialogFooter className="px-4 sm:px-5 pb-4">
          {etapaConfirmacao ? (
            <>
              <Button
                variant="outline"
                onClick={() => setEtapaConfirmacao(false)}
                disabled={loading}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleExcluir}
                disabled={loading}
              >
                {loading ? "Excluindo..." : "Confirmar Exclusão"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleClickExcluir}
                disabled={loading}
              >
                {loading ? "Excluindo..." : "Excluir"}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
