import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, AlertTriangle } from "lucide-react";

import { ParcelaFatura, estornarCompra } from "@/services/compras-cartao";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

const motivosEstorno = [
  { value: "cancelamento", label: "Cancelamento da compra" },
  { value: "devolucao", label: "Devolução de produto" },
  { value: "cobranca_indevida", label: "Cobrança indevida" },
  { value: "garantia", label: "Acionamento de garantia" },
  { value: "outro", label: "Outro" },
] as const;

const estornoSchema = z.object({
  valor: z.string().min(1, "Informe o valor do estorno"),
  motivo: z.string().min(1, "Selecione um motivo"),
  escopo: z.enum(["parcela", "todas"]),
  observacao: z.string().optional(),
});

type EstornoFormData = z.infer<typeof estornoSchema>;

interface Props {
  parcela: ParcelaFatura | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEstornado: () => void;
  corCartao?: string;
}

export function EstornarCompraDialog({
  parcela,
  open,
  onOpenChange,
  onEstornado,
  corCartao,
}: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm<EstornoFormData>({
    resolver: zodResolver(estornoSchema),
    defaultValues: {
      valor: "",
      motivo: "",
      escopo: "parcela",
      observacao: "",
    },
  });

  // Reset form when dialog opens with new parcela
  const valorParcela = parcela ? Math.abs(parcela.valor) : 0;
  const parcelasRestantes = parcela
    ? parcela.total_parcelas - parcela.numero_parcela + 1
    : 0;
  const valorTodasRestantes = valorParcela * parcelasRestantes;

  // Reset form values when parcela changes
  if (open && parcela && !form.getValues("valor")) {
    form.setValue("valor", valorParcela.toFixed(2).replace(".", ","));
  }

  async function onSubmit(data: EstornoFormData) {
    if (!parcela) return;
    
    // Proteção contra cliques duplos
    if (loading) return;

    try {
      setLoading(true);

      const valorNumerico = parseFloat(
        data.valor.replace(/\./g, "").replace(",", ".")
      );

      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        toast.error("Valor inválido");
        return;
      }

      const valorMaximo =
        data.escopo === "todas" ? valorTodasRestantes : valorParcela;

      if (valorNumerico > valorMaximo) {
        toast.error(
          `Valor não pode exceder ${formatCurrency(valorMaximo)}`
        );
        return;
      }

      await estornarCompra({
        parcelaId: parcela.id,
        compraId: parcela.compra_id,
        valor: valorNumerico,
        motivo: data.motivo,
        escopoEstorno: data.escopo,
        observacao: data.observacao,
      });

      toast.success("Estorno registrado com sucesso!");
      form.reset();
      onOpenChange(false);
      onEstornado();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar estorno");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      form.reset();
    }
    onOpenChange(isOpen);
  }

  if (!parcela) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 pb-4 bg-muted border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
              Estornar Compra
            </DialogTitle>
            <DialogDescription>
              Registre um estorno para esta compra
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 sm:px-5 pb-4 pt-4 overflow-y-auto">
          {/* Info da compra */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <p className="font-medium">{parcela.descricao}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                Parcela {parcela.numero_parcela}/{parcela.total_parcelas}
              </Badge>
              <span>•</span>
              <span>Valor: {formatCurrency(valorParcela)}</span>
            </div>
            {parcela.responsavel_nome && (
              <p className="text-sm text-muted-foreground">
                Responsável: {parcela.responsavel_apelido || parcela.responsavel_nome}
              </p>
            )}
          </div>

          {/* Valor do estorno */}
          <div className="space-y-2">
            <Label>Valor do estorno</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                R$
              </span>
              <Input
                {...form.register("valor")}
                placeholder="0,00"
                className="pl-10"
              />
            </div>
            {form.formState.errors.valor && (
              <p className="text-sm text-destructive">
                {form.formState.errors.valor.message}
              </p>
            )}
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label>Motivo do estorno</Label>
            <Select
              value={form.watch("motivo")}
              onValueChange={(v) => form.setValue("motivo", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um motivo" />
              </SelectTrigger>
              <SelectContent>
                {motivosEstorno.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.motivo && (
              <p className="text-sm text-destructive">
                {form.formState.errors.motivo.message}
              </p>
            )}
          </div>

          {/* Escopo do estorno */}
          {parcela.total_parcelas > 1 && parcela.numero_parcela < parcela.total_parcelas && (
            <div className="space-y-3">
              <Label>Aplicar estorno em</Label>
              <RadioGroup
                value={form.watch("escopo")}
                onValueChange={(v) => form.setValue("escopo", v as "parcela" | "todas")}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="parcela" id="parcela" />
                  <Label htmlFor="parcela" className="flex-1 cursor-pointer">
                    <span>Apenas esta parcela</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({formatCurrency(valorParcela)})
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="todas" id="todas" />
                  <Label htmlFor="todas" className="flex-1 cursor-pointer">
                    <span>Todas as parcelas restantes ({parcelasRestantes})</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({formatCurrency(valorTodasRestantes)})
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Observação */}
          <div className="space-y-2">
            <Label>Observação (opcional)</Label>
            <Textarea
              {...form.register("observacao")}
              placeholder="Detalhes adicionais sobre o estorno..."
              rows={2}
            />
          </div>

          {/* Aviso */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              O estorno será registrado como um crédito na fatura atual. O
              histórico da compra original será mantido.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processando..." : "Confirmar estorno"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
