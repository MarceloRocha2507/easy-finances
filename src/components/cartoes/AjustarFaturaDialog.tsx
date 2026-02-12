import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ResponsavelSelector } from "@/components/ui/responsavel-selector";
import { useCategories } from "@/hooks/useCategories";
import { criarAjusteFatura } from "@/services/compras-cartao";
import { toast } from "sonner";
import { Scale, ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";

const ajusteSchema = z.object({
  tipo: z.enum(["credito", "debito"]),
  valor: z.string().min(1, "Informe o valor"),
  descricao: z.string().min(1, "Informe a descrição"),
  categoriaId: z.string().optional(),
  responsavelId: z.string().optional(),
  observacao: z.string().optional(),
});

type AjusteFormData = z.infer<typeof ajusteSchema>;

const tiposAjusteRapido = [
  { label: "Estorno", tipo: "credito" as const },
  { label: "Cashback", tipo: "credito" as const },
  { label: "Crédito promocional", tipo: "credito" as const },
  { label: "Taxa bancária", tipo: "debito" as const },
  { label: "Juros por atraso", tipo: "debito" as const },
  { label: "Anuidade", tipo: "debito" as const },
];

interface AjustarFaturaDialogProps {
  cartaoId: string;
  mesReferencia: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  corCartao?: string;
}

export function AjustarFaturaDialog({
  cartaoId,
  mesReferencia,
  open,
  onOpenChange,
  onSuccess,
  corCartao,
}: AjustarFaturaDialogProps) {
  const [loading, setLoading] = useState(false);
  const { data: categories = [] } = useCategories();

  const form = useForm<AjusteFormData>({
    resolver: zodResolver(ajusteSchema),
    defaultValues: {
      tipo: "credito",
      valor: "",
      descricao: "",
      categoriaId: "",
      responsavelId: "",
      observacao: "",
    },
  });

  const tipoSelecionado = form.watch("tipo");

  function handleTipoRapido(label: string, tipo: "credito" | "debito") {
    form.setValue("descricao", label);
    form.setValue("tipo", tipo);
  }

  async function onSubmit(data: AjusteFormData) {
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

      await criarAjusteFatura({
        cartao_id: cartaoId,
        valor: valorNumerico,
        tipo: data.tipo,
        descricao: data.descricao,
        mes_referencia: mesReferencia,
        categoria_id: data.categoriaId || undefined,
        responsavel_id: data.responsavelId || undefined,
        observacao: data.observacao || undefined,
      });

      toast.success(
        data.tipo === "credito"
          ? "Crédito adicionado à fatura!"
          : "Débito adicionado à fatura!"
      );

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao registrar ajuste");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 border-0 overflow-hidden [&>button]:text-white [&>button]:hover:text-white/80">
        <div
          className="px-4 sm:px-5 pt-4 pb-4 bg-gradient-to-br from-violet-600 to-indigo-600"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Scale className="h-5 w-5 text-white/80" />
              Ajustar Fatura
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 sm:px-5 pb-4 pt-4 overflow-y-auto">
          {/* Tipo de ajuste */}
          <div className="space-y-2">
            <Label>Tipo de ajuste</Label>
            <RadioGroup
              value={tipoSelecionado}
              onValueChange={(v) => form.setValue("tipo", v as "credito" | "debito")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credito" id="credito" />
                <Label
                  htmlFor="credito"
                  className="flex items-center gap-1.5 cursor-pointer text-emerald-600"
                >
                  <ArrowDownCircle className="h-4 w-4" />
                  Crédito (reduz fatura)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="debito" id="debito" />
                <Label
                  htmlFor="debito"
                  className="flex items-center gap-1.5 cursor-pointer text-destructive"
                >
                  <ArrowUpCircle className="h-4 w-4" />
                  Débito (aumenta fatura)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Sugestões rápidas */}
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Sugestões rápidas</Label>
            <div className="flex flex-wrap gap-1.5">
              {tiposAjusteRapido.map((t) => (
                <Button
                  key={t.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={`text-xs h-7 ${
                    t.tipo === "credito"
                      ? "border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      : "border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                  }`}
                  onClick={() => handleTipoRapido(t.label, t.tipo)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                R$
              </span>
              <Input
                id="valor"
                placeholder="0,00"
                className="pl-9"
                {...form.register("valor")}
              />
            </div>
            {form.formState.errors.valor && (
              <p className="text-xs text-destructive">
                {form.formState.errors.valor.message}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              placeholder="Ex: Estorno compra X, Cashback..."
              {...form.register("descricao")}
            />
            {form.formState.errors.descricao && (
              <p className="text-xs text-destructive">
                {form.formState.errors.descricao.message}
              </p>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria (opcional)</Label>
            <Select
              value={form.watch("categoriaId") || ""}
              onValueChange={(v) => form.setValue("categoriaId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((c) => c.type === "expense")
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span>{c.icon}</span>
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label>Responsável (opcional)</Label>
            <ResponsavelSelector
              value={form.watch("responsavelId") || null}
              onChange={(v) => form.setValue("responsavelId", v || "")}
            />
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              placeholder="Detalhes adicionais..."
              rows={2}
              {...form.register("observacao")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar ajuste"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
