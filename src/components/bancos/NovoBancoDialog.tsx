import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCriarBanco } from "@/services/bancos";
import { Check, Building2 } from "lucide-react";

// Bancos brasileiros populares
const BANCOS_SUGERIDOS = [
  { nome: "Nubank", codigo: "260", cor: "#820AD1" },
  { nome: "Inter", codigo: "077", cor: "#FF7A00" },
  { nome: "Itaú", codigo: "341", cor: "#003399" },
  { nome: "Bradesco", codigo: "237", cor: "#CC092F" },
  { nome: "Banco do Brasil", codigo: "001", cor: "#FFCD00" },
  { nome: "Santander", codigo: "033", cor: "#CC0000" },
  { nome: "Caixa", codigo: "104", cor: "#0070C0" },
  { nome: "C6 Bank", codigo: "336", cor: "#242424" },
  { nome: "BTG", codigo: "208", cor: "#1A1A2E" },
  { nome: "XP", codigo: "102", cor: "#000000" },
];

const CORES_PREDEFINIDAS = [
  "#820AD1", "#FF7A00", "#003399", "#CC092F", "#FFCD00",
  "#CC0000", "#0070C0", "#242424", "#1A1A2E", "#6366f1",
  "#10b981", "#f59e0b",
];

interface NovoBancoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function NovoBancoDialog({ open, onOpenChange, onSaved }: NovoBancoDialogProps) {
  const criarBanco = useCriarBanco();
  
  const [form, setForm] = useState({
    nome: "",
    codigo: "",
    cor: "#6366f1",
  });

  const handleBancoSugerido = (banco: typeof BANCOS_SUGERIDOS[0]) => {
    setForm({
      nome: banco.nome,
      codigo: banco.codigo,
      cor: banco.cor,
    });
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) return;

    await criarBanco.mutateAsync({
      nome: form.nome.trim(),
      codigo: form.codigo.trim() || undefined,
      cor: form.cor,
    });

    setForm({ nome: "", codigo: "", cor: "#6366f1" });
    onSaved();
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setForm({ nome: "", codigo: "", cor: "#6366f1" });
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Banco</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Sugestões rápidas */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Seleção rápida</Label>
            <div className="flex flex-wrap gap-1.5">
              {BANCOS_SUGERIDOS.map((banco) => (
                <button
                  key={banco.codigo}
                  type="button"
                  onClick={() => handleBancoSugerido(banco)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                    form.nome === banco.nome
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  }`}
                  style={{
                    borderColor: form.nome === banco.nome ? banco.cor : undefined,
                    backgroundColor: form.nome === banco.nome ? `${banco.cor}15` : undefined,
                    color: form.nome === banco.nome ? banco.cor : undefined,
                  }}
                >
                  {banco.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do banco *</Label>
            <Input
              id="nome"
              placeholder="Ex: Nubank, Inter, Itaú..."
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </div>

          {/* Código */}
          <div className="space-y-2">
            <Label htmlFor="codigo">Código do banco (opcional)</Label>
            <Input
              id="codigo"
              placeholder="Ex: 260, 077, 341..."
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            />
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label>Cor de identificação</Label>
            <div className="grid grid-cols-6 gap-2">
              {CORES_PREDEFINIDAS.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setForm({ ...form, cor })}
                  className="relative w-10 h-10 rounded-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                  style={{ backgroundColor: cor }}
                >
                  {form.cor === cor && (
                    <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div
            className="p-4 rounded-lg text-white"
            style={{
              background: `linear-gradient(135deg, ${form.cor} 0%, ${form.cor}99 100%)`,
            }}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6" />
              <div>
                <p className="font-semibold">{form.nome || "Nome do Banco"}</p>
                {form.codigo && (
                  <p className="text-xs opacity-80">Código: {form.codigo}</p>
                )}
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSalvar}
            disabled={!form.nome.trim() || criarBanco.isPending}
          >
            {criarBanco.isPending ? "Salvando..." : "Salvar banco"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
