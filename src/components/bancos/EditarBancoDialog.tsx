import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Banco, useAtualizarBanco } from "@/services/bancos";
import { Check, Building2 } from "lucide-react";

const CORES_PREDEFINIDAS = [
  "#820AD1", "#FF7A00", "#003399", "#CC092F", "#FFCD00",
  "#CC0000", "#0070C0", "#242424", "#1A1A2E", "#6366f1",
  "#10b981", "#f59e0b",
];

interface EditarBancoDialogProps {
  banco: Banco | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditarBancoDialog({
  banco,
  open,
  onOpenChange,
  onSaved,
}: EditarBancoDialogProps) {
  const atualizarBanco = useAtualizarBanco();

  const [form, setForm] = useState({
    nome: "",
    codigo: "",
    cor: "#6366f1",
    ativo: true,
  });

  useEffect(() => {
    if (banco) {
      setForm({
        nome: banco.nome,
        codigo: banco.codigo || "",
        cor: banco.cor,
        ativo: banco.ativo,
      });
    }
  }, [banco]);

  const handleSalvar = async () => {
    if (!banco || !form.nome.trim()) return;

    await atualizarBanco.mutateAsync({
      id: banco.id,
      dados: {
        nome: form.nome.trim(),
        codigo: form.codigo.trim() || undefined,
        cor: form.cor,
        ativo: form.ativo,
      },
    });

    onSaved();
    onOpenChange(false);
  };

  if (!banco) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Banco</DialogTitle>
          <DialogDescription>Atualize as informações do banco</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
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

          {/* Status */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="ativo">Status</Label>
              <p className="text-xs text-muted-foreground">
                {form.ativo ? "Banco ativo e visível" : "Banco desativado"}
              </p>
            </div>
            <Switch
              id="ativo"
              checked={form.ativo}
              onCheckedChange={(checked) => setForm({ ...form, ativo: checked })}
            />
          </div>

          {/* Preview */}
          <div
            className={`p-4 rounded-lg text-white ${!form.ativo ? "opacity-50" : ""}`}
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
            disabled={!form.nome.trim() || atualizarBanco.isPending}
          >
            {atualizarBanco.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
