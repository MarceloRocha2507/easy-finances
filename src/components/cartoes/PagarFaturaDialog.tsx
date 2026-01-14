import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters";
import { Cartao } from "@/services/cartoes";
import { ParcelaFatura } from "@/services/compras-cartao";
import { calcularResumoPorResponsavel, ResumoResponsavel } from "@/services/compras-cartao";
import { pagarFaturaComTransacao } from "@/services/compras-cartao";
import { CreditCard, User, Check, Wallet, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  cartao: Cartao;
  mesReferencia: Date;
  parcelas: ParcelaFatura[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid: () => void;
}

type ModoPagamento = "eu_pago_tudo" | "cada_um_pagou";

interface ResponsavelPagamento {
  responsavel_id: string;
  responsavel_nome: string;
  responsavel_apelido: string | null;
  is_titular: boolean;
  total: number;
  qtd_compras: number;
  recebido: boolean;
}

export function PagarFaturaDialog({
  cartao,
  mesReferencia,
  parcelas,
  open,
  onOpenChange,
  onPaid,
}: Props) {
  const [modo, setModo] = useState<ModoPagamento>("eu_pago_tudo");
  const [responsaveis, setResponsaveis] = useState<ResponsavelPagamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [carregandoResumo, setCarregandoResumo] = useState(false);

  // Calcular resumo por responsável quando abrir
  useEffect(() => {
    if (!open || !cartao) return;

    async function carregarResumo() {
      setCarregandoResumo(true);
      try {
        const resumo = await calcularResumoPorResponsavel(cartao.id, mesReferencia);
        setResponsaveis(
          resumo.map((r) => ({
            ...r,
            recebido: false,
          }))
        );
      } catch (error) {
        console.error("Erro ao carregar resumo:", error);
        toast.error("Erro ao carregar resumo de responsáveis");
      } finally {
        setCarregandoResumo(false);
      }
    }

    carregarResumo();
    setModo("eu_pago_tudo");
  }, [open, cartao?.id, mesReferencia]);

  // Encontrar o titular
  const titular = useMemo(() => {
    return responsaveis.find((r) => r.is_titular);
  }, [responsaveis]);

  // Outros responsáveis (não titulares)
  const outrosResponsaveis = useMemo(() => {
    return responsaveis.filter((r) => !r.is_titular);
  }, [responsaveis]);

  // Total geral da fatura
  const totalFatura = useMemo(() => {
    return responsaveis.reduce((sum, r) => sum + r.total, 0);
  }, [responsaveis]);

  // Total que terceiros pagaram (quando "cada um pagou sua parte")
  const totalRecebido = useMemo(() => {
    if (modo === "eu_pago_tudo") return 0;
    return responsaveis
      .filter((r) => !r.is_titular && r.recebido)
      .reduce((sum, r) => sum + r.total, 0);
  }, [responsaveis, modo]);

  // Valor que EU (titular) vou pagar ao banco
  const valorQueEuPago = useMemo(() => {
    if (modo === "eu_pago_tudo") {
      return totalFatura;
    }
    // Se cada um pagou sua parte, eu pago o total menos o que os outros pagaram
    return totalFatura - totalRecebido;
  }, [modo, totalFatura, totalRecebido]);

  // Toggle recebimento de um responsável
  function toggleRecebido(responsavelId: string) {
    setResponsaveis((prev) =>
      prev.map((r) =>
        r.responsavel_id === responsavelId ? { ...r, recebido: !r.recebido } : r
      )
    );
  }

  // Confirmar pagamento
  async function handleConfirmar() {
    if (!cartao) return;

    setLoading(true);
    try {
      // Preparar dados dos acertos (quem pagou)
      const acertosRecebidos = modo === "cada_um_pagou"
        ? responsaveis
            .filter((r) => !r.is_titular && r.recebido)
            .map((r) => ({
              responsavel_id: r.responsavel_id,
              valor: r.total,
            }))
        : [];

      await pagarFaturaComTransacao({
        cartaoId: cartao.id,
        nomeCartao: cartao.nome,
        mesReferencia,
        valorTotal: valorQueEuPago,
        acertosRecebidos,
      });

      toast.success(
        modo === "eu_pago_tudo"
          ? "Fatura paga! Você pagou tudo ao banco."
          : `Fatura paga! Você pagou ${formatCurrency(valorQueEuPago)} ao banco.`
      );

      onPaid();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao pagar fatura:", error);
      toast.error("Erro ao registrar pagamento da fatura");
    } finally {
      setLoading(false);
    }
  }

  // Formatar mês
  const mesLabel = mesReferencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const parcelasPendentes = parcelas.filter((p) => !p.paga);
  const temParcelasPendentes = parcelasPendentes.length > 0;

  if (!temParcelasPendentes) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-500" />
              Fatura já paga
            </DialogTitle>
            <DialogDescription>
              Todas as parcelas de {mesLabel} já foram pagas.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" style={{ color: cartao.cor }} />
            Pagar Fatura - {cartao.nome}
          </DialogTitle>
          <DialogDescription className="capitalize">
            {mesLabel}
          </DialogDescription>
        </DialogHeader>

        {carregandoResumo ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total da fatura */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Valor total da fatura
                </span>
                <span className="text-xl font-bold text-destructive">
                  {formatCurrency(totalFatura)}
                </span>
              </div>
            </div>

            {/* Responsáveis com débito */}
            {outrosResponsaveis.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Responsáveis com débito
                </Label>
                <ScrollArea className="max-h-[150px]">
                  <div className="space-y-2">
                    {outrosResponsaveis.map((r) => (
                      <div
                        key={r.responsavel_id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-colors",
                          modo === "cada_um_pagou" && r.recebido
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {r.responsavel_apelido || r.responsavel_nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r.qtd_compras} compra{r.qtd_compras > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-destructive">
                            {formatCurrency(r.total)}
                          </span>
                          {modo === "cada_um_pagou" && (
                            <Button
                              size="sm"
                              variant={r.recebido ? "default" : "outline"}
                              className={cn(
                                "h-7 text-xs gap-1",
                                r.recebido && "bg-emerald-600 hover:bg-emerald-700"
                              )}
                              onClick={() => toggleRecebido(r.responsavel_id)}
                            >
                              {r.recebido ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  Recebido
                                </>
                              ) : (
                                "Receber"
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Parte do titular */}
            {titular && (
              <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5 border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Eu ({titular.responsavel_apelido || titular.responsavel_nome})
                    </p>
                    <p className="text-xs text-muted-foreground">Titular</p>
                  </div>
                </div>
                <span className="text-sm font-semibold">
                  {formatCurrency(titular.total)}
                </span>
              </div>
            )}

            <Separator />

            {/* Modo de pagamento */}
            {outrosResponsaveis.length > 0 ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Quem vai pagar ao banco?
                </Label>
                <RadioGroup
                  value={modo}
                  onValueChange={(v) => setModo(v as ModoPagamento)}
                  className="space-y-2"
                >
                  <div
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      modo === "eu_pago_tudo"
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setModo("eu_pago_tudo")}
                  >
                    <RadioGroupItem value="eu_pago_tudo" id="eu_pago_tudo" />
                    <Label
                      htmlFor="eu_pago_tudo"
                      className="flex-1 cursor-pointer"
                    >
                      <p className="font-medium">Eu pago tudo</p>
                      <p className="text-xs text-muted-foreground">
                        Pago {formatCurrency(totalFatura)} ao banco. Outros me
                        devem.
                      </p>
                    </Label>
                  </div>
                  <div
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      modo === "cada_um_pagou"
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setModo("cada_um_pagou")}
                  >
                    <RadioGroupItem value="cada_um_pagou" id="cada_um_pagou" />
                    <Label
                      htmlFor="cada_um_pagou"
                      className="flex-1 cursor-pointer"
                    >
                      <p className="font-medium">Cada um pagou sua parte</p>
                      <p className="text-xs text-muted-foreground">
                        Marque quem já me pagou acima
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Todas as compras são suas. Valor integral será debitado.
              </div>
            )}

            {/* Resumo do pagamento */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total da fatura</span>
                <span>{formatCurrency(totalFatura)}</span>
              </div>
              {modo === "cada_um_pagou" && totalRecebido > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Recebido de terceiros
                  </span>
                  <span className="text-emerald-600">
                    - {formatCurrency(totalRecebido)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-medium">Valor que eu pago</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(valorQueEuPago)}
                </span>
              </div>
            </div>

            {/* Botão de confirmação */}
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleConfirmar}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Confirmar Pagamento
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
