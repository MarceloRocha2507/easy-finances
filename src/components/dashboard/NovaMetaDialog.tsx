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
  "#64748b",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
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

  const criarMeta = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("metas").insert({
        user_id: user?.id,
        titulo,
        valor_alvo: parseFloat(valorAlvo) || 0,
        valor_atual: parseFloat(valorAtual) || 0,
        data_limite: dataLimite ? format(dataLimite, "yyyy-MM-dd") : null,
        cor,
        icone: "target",
        concluida: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Meta criada",
        description: "Sua meta foi criada com sucesso.",
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
          <DialogTitle className="flex items-center gap-2 text-base font-medium">
            <Target className="w-4 h-4" />
            Nova Meta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Título */}
          <div className="space-y-2">
            <Label className="text-sm">Título</Label>
            <Input
              placeholder="Ex: Viagem de férias"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {/* Valor Alvo */}
          <div className="space-y-2">
            <Label className="text-sm">Valor alvo (R$)</Label>
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
            <Label className="text-sm">Valor atual (R$)</Label>
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
            <Label className="text-sm">Data limite (opcional)</Label>
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
            <Label className="text-sm flex items-center gap-2">
              <Palette className="w-3.5 h-3.5" />
              Cor
            </Label>
            <div className="flex gap-2 flex-wrap">
              {CORES_DISPONIVEIS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "w-7 h-7 rounded-full transition-all",
                    cor === c ? "ring-2 ring-offset-2 ring-primary" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setCor(c)}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 rounded-md border bg-secondary/30">
            <p className="text-xs text-muted-foreground mb-2">Prévia</p>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ backgroundColor: `${cor}15` }}
              >
                <Target className="h-4 w-4" style={{ color: cor }} />
              </div>
              <div>
                <p className="text-sm font-medium">{titulo || "Minha meta"}</p>
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
          <Button onClick={handleSubmit} disabled={criarMeta.isPending}>
            {criarMeta.isPending ? "Criando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
