import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, parseBrazilianCurrency } from "@/lib/formatters";
import { Cartao } from "@/services/cartoes";
import { ParcelaFatura } from "@/services/compras-cartao";
import { calcularResumoPorResponsavel } from "@/services/compras-cartao";
import { pagarFaturaComTransacao } from "@/services/compras-cartao";
import { CreditCard, User, Check, Wallet, AlertCircle, Loader2, SplitSquareHorizontal } from "lucide-react";
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

type ModoPagamento = "eu_pago_tudo" | "cada_um_pagou" | "dividir_valores";

interface ResponsavelPagamento {
  responsavel_id: string;
  responsavel_nome: string;
  responsavel_apelido: string | null;
  is_titular: boolean;
  total: number;
  qtd_compras: number;
  recebido: boolean;
  valorCustom: string;
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
            valorCustom: r.total.toFixed(2).replace(".", ","),
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

  // Total informado no modo dividir_valores
  const totalDividido = useMemo(() => {
    if (modo !== "dividir_valores") return 0;
    return responsaveis.reduce((sum, r) => {
      const val = parseBrazilianCurrency(r.valorCustom);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [responsaveis, modo]);

  const dividirValido = useMemo(() => {
    if (modo !== "dividir_valores") return true;
    return Math.abs(totalDividido - totalFatura) < 0.01;
  }, [modo, totalDividido, totalFatura]);

  // Valor que EU (titular) vou pagar ao banco
  const valorQueEuPago = useMemo(() => {
    if (modo === "eu_pago_tudo") {
      return totalFatura;
    }
    if (modo === "dividir_valores") {
      const titularVal = titular ? parseBrazilianCurrency(titular.valorCustom) : 0;
      return isNaN(titularVal) ? 0 : titularVal;
    }
    return totalFatura - totalRecebido;
  }, [modo, totalFatura, totalRecebido, titular, responsaveis]);

  // Toggle recebimento de um responsável
  function toggleRecebido(responsavelId: string) {
    setResponsaveis((prev) =>
      prev.map((r) =>
        r.responsavel_id === responsavelId ? { ...r, recebido: !r.recebido } : r
      )
    );
  }

  // Atualizar valor custom
  function updateValorCustom(responsavelId: string, valor: string) {
    setResponsaveis((prev) =>
      prev.map((r) =>
        r.responsavel_id === responsavelId ? { ...r, valorCustom: valor } : r
      )
    );
  }

  // Confirmar pagamento
  async function handleConfirmar() {
    if (!cartao) return;

    setLoading(true);
    try {
      let acertosRecebidos: { responsavel_id: string; valor: number }[] = [];

      if (modo === "cada_um_pagou") {
        acertosRecebidos = responsaveis
          .filter((r) => !r.is_titular && r.recebido)
          .map((r) => ({
            responsavel_id: r.responsavel_id,
            valor: r.total,
          }));
      } else if (modo === "dividir_valores") {
        acertosRecebidos = responsaveis
          .filter((r) => !r.is_titular)
          .map((r) => ({
            responsavel_id: r.responsavel_id,
            valor: parseFloat(parseBrazilianCurrency(r.valorCustom).toFixed(2)),
          }))
          .filter((a) => a.valor > 0);
      }

      await pagarFaturaComTransacao({
        cartaoId: cartao.id,
        nomeCartao: cartao.nome,
        mesReferencia,
        valorTotal: parseFloat(valorQueEuPago.toFixed(2)),
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

  const canConfirm = modo !== "dividir_valores" || dividirValido;

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
            {outrosResponsaveis.length > 0 && modo !== "dividir_valores" && (
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

            {/* Dividir valores - inputs por pessoa */}
            {modo === "dividir_valores" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Quanto cada um pagou?
                </Label>
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-2">
                    {responsaveis.map((r) => (
                      <div
                        key={r.responsavel_id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: r.is_titular ? "hsl(var(--primary) / 0.2)" : "hsl(var(--primary) / 0.1)" }}
                        >
                          {r.is_titular ? (
                            <Wallet className="h-4 w-4 text-primary" />
                          ) : (
                            <User className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {r.is_titular ? `Eu (${r.responsavel_apelido || r.responsavel_nome})` : (r.responsavel_apelido || r.responsavel_nome)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Deve: {formatCurrency(r.total)}
                          </p>
                        </div>
                        <div className="w-28 shrink-0">
                          <Input
                            inputMode="decimal"
                            placeholder={r.total.toFixed(2).replace(".", ",")}
                            value={r.valorCustom}
                            onChange={(e) => updateValorCustom(r.responsavel_id, e.target.value)}
                            className="h-8 text-sm text-right"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Totalizador */}
                <div className={cn(
                  "p-3 rounded-lg border text-sm flex items-center justify-between",
                  dividirValido
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                )}>
                  <span className="flex items-center gap-1.5">
                    {dividirValido ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    Total informado
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(totalDividido)} / {formatCurrency(totalFatura)}
                  </span>
                </div>
              </div>
            )}

            {/* Parte do titular (só nos modos não-dividir) */}
            {titular && modo !== "dividir_valores" && (
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
                  <div
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      modo === "dividir_valores"
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setModo("dividir_valores")}
                  >
                    <RadioGroupItem value="dividir_valores" id="dividir_valores" />
                    <Label
                      htmlFor="dividir_valores"
                      className="flex-1 cursor-pointer"
                    >
                      <p className="font-medium">Dividir valores</p>
                      <p className="text-xs text-muted-foreground">
                        Informe quanto cada pessoa pagou
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
              {modo === "dividir_valores" && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Pago por terceiros
                  </span>
                  <span className="text-emerald-600">
                    - {formatCurrency(Math.max(0, totalDividido - valorQueEuPago))}
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
              disabled={loading || !canConfirm}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Confirmar Pagamento
            </Button>

            {modo === "dividir_valores" && !dividirValido && (
              <p className="text-xs text-destructive text-center">
                A soma dos valores deve ser igual ao total da fatura
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
