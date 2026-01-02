import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Target,
  Calendar as CalendarIcon,
  Palette,
  PiggyBank,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface NovaMetaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CORES_DISPONIVEIS = [
  "#6366f1", // Roxo
  "#22c55e", // Verde
  "#ef4444", // Vermelho
  "#f59e0b", // Amarelo
  "#3b82f6", // Azul
  "#ec4899", // Rosa
  "#14b8a6", // Teal
  "#8b5cf6", // Violeta
];

const ICONES_DISPONIVEIS = [
  { value: "piggy-bank", label: "🐷 Cofrinho" },
  { value: "home", label: "🏠 Casa" },
  { value: "car", label: "🚗 Carro" },
  { value: "plane", label: "✈️ Viagem" },
  { value: "graduation", label: "🎓 Educação" },
  { value: "heart", label: "❤️ Saúde" },
  { value: "gift", label: "🎁 Presente" },
  { value: "star", label: "⭐ Outro" },
];

export function NovaMetaDialog({ open, onOpenChange, onSuccess }: NovaMetaDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [titulo, setTitulo] = useState("");
  const [valorAlvo, setValorAlvo] = useState("");
  const [valorAtual, setValorAtual] = useState("");
  const [dataLimite, setDataLimite] = useState<Date | undefined>();
  const [cor, setCor] = useState(CORES_DISPONIVEIS[0]);
  const [icone, setIcone] = useState("piggy-bank");

  const criarMeta = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("metas").insert({
        user_id: user?.id,
        titulo,
        valor_alvo: parseFloat(valorAlvo) || 0,
        valor_atual: parseFloat(valorAtual) || 0,
        data_limite: dataLimite ? format(dataLimite, "yyyy-MM-dd") : null,
        cor,
        icone,
        concluida: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Meta criada!",
        description: "Sua meta de economia foi criada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard-completo"] });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar meta",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  function resetForm() {
    setTitulo("");
    setValorAlvo("");
    setValorAtual("");
    setDataLimite(undefined);
    setCor(CORES_DISPONIVEIS[0]);
    setIcone("piggy-bank");
  }

  function handleSubmit() {
    if (!titulo.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Digite um título para sua meta.",
        variant: "destructive",
      });
      return;
    }

    if (!valorAlvo || parseFloat(valorAlvo) <= 0) {
      toast({
        title: "Valor alvo obrigatório",
        description: "Digite quanto você quer economizar.",
        variant: "destructive",
      });
      return;
    }

    criarMeta.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Nova Meta de Economia
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Título */}
          <div className="space-y-2">
            <Label>Título da Meta</Label>
            <Input
              placeholder="Ex: Viagem de férias"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {/* Valor Alvo */}
          <div className="space-y-2">
            <Label>Quanto você quer economizar? (R$)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="10000,00"
              value={valorAlvo}
              onChange={(e) => setValorAlvo(e.target.value)}
            />
          </div>

          {/* Valor Atual */}
          <div className="space-y-2">
            <Label>Quanto você já tem? (R$)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={valorAtual}
              onChange={(e) => setValorAtual(e.target.value)}
            />
          </div>

          {/* Data Limite */}
          <div className="space-y-2">
            <Label>Data limite (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataLimite && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataLimite
                    ? format(dataLimite, "PPP", { locale: ptBR })
                    : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataLimite}
                  onSelect={setDataLimite}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Cor
            </Label>
            <div className="flex gap-2 flex-wrap">
              {CORES_DISPONIVEIS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    cor === c
                      ? "ring-2 ring-offset-2 ring-primary scale-110"
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setCor(c)}
                />
              ))}
            </div>
          </div>

          {/* Ícone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4" />
              Ícone
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {ICONES_DISPONIVEIS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={cn(
                    "p-2 rounded-lg border text-center transition-all text-sm",
                    icone === item.value
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted"
                  )}
                  onClick={() => setIcone(item.value)}
                >
                  {item.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-xl border bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                style={{ backgroundColor: `${cor}20` }}
              >
                {ICONES_DISPONIVEIS.find((i) => i.value === icone)?.label.split(" ")[0] || "🐷"}
              </div>
              <div>
                <p className="font-medium">{titulo || "Minha meta"}</p>
                <p className="text-xs text-muted-foreground">
                  R$ {parseFloat(valorAtual || "0").toFixed(2)} de R${" "}
                  {parseFloat(valorAlvo || "0").toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={criarMeta.isPending}
            className="gradient-primary"
          >
            {criarMeta.isPending ? "Criando..." : "Criar Meta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}