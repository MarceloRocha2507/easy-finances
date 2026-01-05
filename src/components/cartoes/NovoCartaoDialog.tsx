import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { criarCartao } from "@/services/cartoes";
import { useToast } from "@/components/ui/use-toast";
import { DaySelector } from "@/components/ui/day-selector";
import { Check, Plus } from "lucide-react";

const CORES_PREDEFINIDAS = [
  { nome: "Inter", cor: "#00A859" },
  { nome: "Nubank", cor: "#820AD1" },
  { nome: "Itaú", cor: "#003399" },
  { nome: "Santander", cor: "#CC0000" },
  { nome: "Bradesco", cor: "#CC092F" },
  { nome: "BB", cor: "#FFCD00" },
  { nome: "Caixa", cor: "#0070C0" },
  { nome: "C6", cor: "#242424" },
  { nome: "Next", cor: "#D50032" },
  { nome: "PAN", cor: "#F37021" },
  { nome: "Índigo", cor: "#6366f1" },
  { nome: "Esmeralda", cor: "#10b981" },
];

interface NovoCartaoDialogProps {
  onSaved: () => void;
}

export function NovoCartaoDialog({ onSaved }: NovoCartaoDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    bandeira: "",
    limite: 0,
    dia_fechamento: 5,
    dia_vencimento: 12,
    cor: "#6366f1",
  });

  async function salvar() {
    if (!form.nome.trim()) {
      toast({ title: "Informe o nome do cartão", variant: "destructive" });
      return;
    }

    if (form.limite <= 0) {
      toast({ title: "Informe o limite do cartão", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await criarCartao(form);
      toast({ title: "Cartão cadastrado com sucesso" });
      setOpen(false);
      setForm({
        nome: "",
        bandeira: "",
        limite: 0,
        dia_fechamento: 5,
        dia_vencimento: 12,
        cor: "#6366f1",
      });
      onSaved();
    } catch {
      toast({ title: "Erro ao salvar cartão", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Cartão
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Cartão</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Adicione as informações do seu cartão de crédito
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do cartão</Label>
            <Input
              id="nome"
              placeholder="Ex: Nubank, Inter, Itaú..."
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bandeira">Bandeira</Label>
            <Input
              id="bandeira"
              placeholder="Ex: Mastercard, Visa..."
              value={form.bandeira}
              onChange={(e) => setForm({ ...form, bandeira: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limite">Limite (R$)</Label>
            <Input
              id="limite"
              type="number"
              placeholder="0,00"
              value={form.limite || ""}
              onChange={(e) => setForm({ ...form, limite: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DaySelector
              label="Dia de fechamento"
              value={form.dia_fechamento}
              onChange={(day) => setForm({ ...form, dia_fechamento: day })}
            />
            <DaySelector
              label="Dia de vencimento"
              value={form.dia_vencimento}
              onChange={(day) => setForm({ ...form, dia_vencimento: day })}
            />
          </div>

          {/* Seletor de Cor */}
          <div className="space-y-2">
            <Label>Cor do cartão</Label>
            <div className="grid grid-cols-6 gap-2">
              {CORES_PREDEFINIDAS.map((item) => (
                <button
                  key={item.cor}
                  type="button"
                  onClick={() => setForm({ ...form, cor: item.cor })}
                  className="relative w-10 h-10 rounded-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                  style={{ backgroundColor: item.cor }}
                  title={item.nome}
                >
                  {form.cor === item.cor && (
                    <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview do card */}
          <div
            className="p-4 rounded-lg text-white text-center"
            style={{
              background: `linear-gradient(135deg, rgb(15 23 42) 0%, rgb(15 23 42) 60%, ${form.cor}50 100%)`,
            }}
          >
            <p className="text-xs opacity-70 mb-1">Preview</p>
            <p className="font-semibold">{form.nome || "Nome do Cartão"}</p>
            {form.bandeira && (
              <p className="text-xs opacity-70 uppercase mt-1">{form.bandeira}</p>
            )}
          </div>

          <Button className="w-full" onClick={salvar} disabled={loading}>
            {loading ? "Salvando..." : "Salvar cartão"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}