import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { criarResponsavel } from "@/services/responsaveis";
import { UserPlus, Loader2 } from "lucide-react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { PlanLimitAlert } from "@/components/ui/plan-limit-alert";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (responsavelId: string) => void;
}

export function NovoResponsavelDialog({ open, onOpenChange, onCreated }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    apelido: "",
    telefone: "",
  });

  const { canCreate, isLimitReached, usage, limits } = usePlanLimits();
  const limiteAtingido = isLimitReached("responsaveis");

  const resetForm = () => {
    setForm({ nome: "", apelido: "", telefone: "" });
  };

  async function handleSalvar() {
    if (!form.nome.trim()) {
      toast({ title: "Informe o nome", variant: "destructive" });
      return;
    }

    if (!canCreate("responsaveis")) {
      toast({ title: "Limite de responsáveis atingido", description: "Faça upgrade do seu plano.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const novo = await criarResponsavel({
        nome: form.nome.trim(),
        apelido: form.apelido.trim() || undefined,
        telefone: form.telefone.trim() || undefined,
      });

      toast({ title: "Pessoa adicionada!" });
      resetForm();
      onCreated(novo.id);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nova Pessoa
          </DialogTitle>
          <DialogDescription>
            Adicione uma pessoa que usa o cartão
          </DialogDescription>
        </DialogHeader>

        {limiteAtingido ? (
          <div className="py-4">
            <PlanLimitAlert
              recurso="responsáveis"
              usado={usage.responsaveis}
              limite={limits.responsaveis}
              onUpgrade={() => toast({ title: "Contate o administrador", description: "Para fazer upgrade do seu plano." })}
            />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input
                id="nome"
                placeholder="Ex: João da Silva"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apelido">Apelido (opcional)</Label>
              <Input
                id="apelido"
                placeholder="Ex: João"
                value={form.apelido}
                onChange={(e) => setForm({ ...form, apelido: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                O apelido será usado para exibição
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (opcional)</Label>
              <Input
                id="telefone"
                placeholder="Ex: (11) 99999-9999"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSalvar}
                disabled={loading || !form.nome.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Adicionar"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
