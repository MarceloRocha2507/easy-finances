import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Repeat, Calendar, Hash } from "lucide-react";

import { criarCompra, TipoLancamento } from "@/services/comprasCartao";
import { gerarMesesDisponiveis, formatarMesAno } from "@/lib/dateUtils";
import { Cartao } from "@/services/cartoes";

interface Props {
  cartao: Cartao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const TIPOS_LANCAMENTO = [
  { value: "unica", label: "Avulsa", description: "Compra única" },
  { value: "parcelada", label: "Parcelada", description: "Dividida em parcelas" },
  { value: "fixa", label: "Fixa mensal", description: "Repete todo mês" },
] as const;

export function NovaCompraCartaoDialog({
  cartao,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const { toast } = useToast();

  // Estados do formulário
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState<number>(0);
  const [tipoLancamento, setTipoLancamento] = useState<TipoLancamento>("unica");
  const [parcelas, setParcelas] = useState<number>(2);
  const [parcelaInicial, setParcelaInicial] = useState<number>(1);
  const [mesInicio, setMesInicio] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  // Meses disponíveis para seleção
  const mesesDisponiveis = useMemo(() => gerarMesesDisponiveis(12), []);

  // Valor por parcela (para preview)
  const valorParcela = useMemo(() => {
    if (tipoLancamento === "fixa") return valor;
    if (tipoLancamento === "unica") return valor;
    return parcelas > 0 ? Number((valor / parcelas).toFixed(2)) : valor;
  }, [valor, parcelas, tipoLancamento]);

  // Quantidade de parcelas que serão criadas
  const parcelasACriar = useMemo(() => {
    if (tipoLancamento === "unica") return 1;
    if (tipoLancamento === "fixa") return 12;
    return parcelas - parcelaInicial + 1;
  }, [tipoLancamento, parcelas, parcelaInicial]);

  async function handleSalvar() {
    if (loading) return;

    try {
      setLoading(true);

      await criarCompra({
        cartaoId: cartao.id,
        descricao: descricao.trim(),
        valorTotal: valor,
        tipoLancamento,
        mesInicio,
        parcelas: tipoLancamento === "parcelada" ? parcelas : undefined,
        parcelaInicial: tipoLancamento === "parcelada" ? parcelaInicial : undefined,
      });

      toast({
        title: "Compra registrada",
        description: getDescricaoSucesso(),
      });

      // Limpa formulário
      resetForm();
      onOpenChange(false);
      onSaved();
    } catch (error: unknown) {
      console.error("Erro ao registrar compra:", error);
      const message = error instanceof Error ? error.message : "Não foi possível registrar a compra";
      toast({
        title: "Erro ao registrar compra",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function getDescricaoSucesso(): string {
    const mesFormatado = formatarMesAno(mesInicio);
    
    switch (tipoLancamento) {
      case "unica":
        return `Compra de R$ ${valor.toFixed(2)} na fatura de ${mesFormatado}`;
      case "parcelada":
        if (parcelaInicial > 1) {
          return `${parcelasACriar} parcelas de R$ ${valorParcela.toFixed(2)} (${parcelaInicial}/${parcelas} a ${parcelas}/${parcelas})`;
        }
        return `${parcelas}x de R$ ${valorParcela.toFixed(2)} a partir de ${mesFormatado}`;
      case "fixa":
        return `Despesa fixa de R$ ${valor.toFixed(2)}/mês a partir de ${mesFormatado}`;
      default:
        return "Compra registrada";
    }
  }

  function resetForm() {
    setDescricao("");
    setValor(0);
    setTipoLancamento("unica");
    setParcelas(2);
    setParcelaInicial(1);
    setMesInicio(new Date());
  }

  const disabled =
    loading ||
    !descricao.trim() ||
    valor <= 0 ||
    (tipoLancamento === "parcelada" && (parcelas < 2 || parcelaInicial > parcelas));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              Nova compra
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/70">
              Registrar compra no cartão <strong>{cartao.nome}</strong>
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Formulário */}
        <div className="p-6 space-y-5">
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              placeholder="Ex: Supermercado, Netflix..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={valor || ""}
              onChange={(e) => setValor(Number(e.target.value))}
            />
          </div>

          {/* Mês da Fatura */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Mês da fatura
            </Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm capitalize"
              value={mesInicio.toISOString()}
              onChange={(e) => setMesInicio(new Date(e.target.value))}
            >
              {mesesDisponiveis.map((mes) => (
                <option key={mes.value.toISOString()} value={mes.value.toISOString()}>
                  {mes.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Lançamento */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              Tipo de lançamento
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {TIPOS_LANCAMENTO.map((tipo) => (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => {
                    setTipoLancamento(tipo.value);
                    if (tipo.value !== "parcelada") {
                      setParcelaInicial(1);
                    }
                  }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-sm transition-colors ${
                    tipoLancamento === tipo.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="font-medium">{tipo.label}</span>
                  <span className="text-xs text-muted-foreground">{tipo.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Configurações de Parcelamento */}
          {tipoLancamento === "parcelada" && (
            <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  Número de parcelas
                </Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={parcelas}
                  onChange={(e) => {
                    const novoParcelas = Number(e.target.value);
                    setParcelas(novoParcelas);
                    if (parcelaInicial > novoParcelas) {
                      setParcelaInicial(1);
                    }
                  }}
                >
                  {Array.from({ length: 23 }).map((_, i) => (
                    <option key={i + 2} value={i + 2}>
                      {i + 2}x
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Começar na parcela</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={parcelaInicial}
                  onChange={(e) => setParcelaInicial(Number(e.target.value))}
                >
                  {Array.from({ length: parcelas }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}ª parcela
                    </option>
                  ))}
                </select>
                {parcelaInicial > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Serão criadas {parcelasACriar} parcelas ({parcelaInicial}/{parcelas} até {parcelas}/{parcelas})
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Info Fixa Mensal */}
          {tipoLancamento === "fixa" && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm text-muted-foreground">
                Será lançado R$ {valor.toFixed(2)} mensalmente nos próximos 12 meses.
                Você pode encerrar a qualquer momento.
              </p>
            </div>
          )}

          {/* Preview */}
          {valor > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium mb-1">Resumo</p>
              <p className="text-sm text-muted-foreground">
                {tipoLancamento === "unica" && (
                  <>
                    Compra avulsa de <strong className="text-foreground">R$ {valor.toFixed(2)}</strong> na fatura de{" "}
                    <strong className="text-foreground capitalize">{formatarMesAno(mesInicio)}</strong>
                  </>
                )}
                {tipoLancamento === "parcelada" && (
                  <>
                    <strong className="text-foreground">{parcelasACriar}x</strong> de{" "}
                    <strong className="text-foreground">R$ {valorParcela.toFixed(2)}</strong>
                    {parcelaInicial > 1 && (
                      <> (parcelas {parcelaInicial} a {parcelas})</>
                    )}
                    {" "}a partir de <strong className="text-foreground capitalize">{formatarMesAno(mesInicio)}</strong>
                    <span className="block text-xs mt-1">Total: R$ {valor.toFixed(2)}</span>
                  </>
                )}
                {tipoLancamento === "fixa" && (
                  <>
                    Despesa fixa de <strong className="text-foreground">R$ {valor.toFixed(2)}/mês</strong> a partir de{" "}
                    <strong className="text-foreground capitalize">{formatarMesAno(mesInicio)}</strong>
                  </>
                )}
              </p>
            </div>
          )}

          {/* Botão Salvar */}
          <Button
            className="w-full"
            onClick={handleSalvar}
            disabled={disabled}
          >
            {loading ? "Salvando..." : "Salvar compra"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
