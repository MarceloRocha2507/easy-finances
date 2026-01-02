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
import { Cartao, atualizarCartao } from "@/services/cartoes";
import { useToast } from "@/components/ui/use-toast";
import { Check } from "lucide-react";

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

interface Props {
  cartao: Cartao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditarCartaoDialog({
  cartao,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const { toast } = useToast();

  const [form, setForm] = useState({
    nome: "",
    bandeira: "",
    limite: 0,
    dia_fechamento: 1,
    dia_vencimento: 1,
    cor: "#6366f1",
  });

  // 🔥 ESSENCIAL: sincroniza o form sempre que o cartão mudar
  useEffect(() => {
    if (!cartao) return;

    setForm({
      nome: cartao.nome,
      bandeira: cartao.bandeira ?? "",
      limite: cartao.limite,
      dia_fechamento: cartao.dia_fechamento,
      dia_vencimento: cartao.dia_vencimento,
      cor: cartao.cor || "#6366f1",
    });
  }, [cartao, open]);

  async function salvar() {
    try {
      await atualizarCartao(cartao.id, {
        nome: form.nome,
        bandeira: form.bandeira,
        limite: Number(form.limite),
        dia_fechamento: form.dia_fechamento,
        dia_vencimento: form.dia_vencimento,
        cor: form.cor,
      });

      toast({
        title: "Cartão atualizado",
        description: "As informações foram salvas com sucesso.",
      });

      onSaved();           // recarrega lista
      onOpenChange(false); // fecha modal
    } catch {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar o cartão.",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cartão</DialogTitle>
          <DialogDescription>
            Atualize as informações do cartão
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Nome"
            value={form.nome}
            onChange={(e) =>
              setForm({ ...form, nome: e.target.value })
            }
          />

          <Input
            placeholder="Bandeira"
            value={form.bandeira}
            onChange={(e) =>
              setForm({ ...form, bandeira: e.target.value })
            }
          />

          <Input
            type="number"
            placeholder="Limite"
            value={form.limite}
            onChange={(e) =>
              setForm({
                ...form,
                limite: Number(e.target.value),
              })
            }
          />

          {/* Dias do mês */}
          <div className="grid grid-cols-2 gap-3">
            <SelectDiaMes
              label="Dia de fechamento"
              value={form.dia_fechamento}
              onChange={(value) =>
                setForm({ ...form, dia_fechamento: value })
              }
            />

            <SelectDiaMes
              label="Dia de vencimento"
              value={form.dia_vencimento}
              onChange={(value) =>
                setForm({ ...form, dia_vencimento: value })
              }
            />
          </div>

          {/* Seletor de Cor */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Cor do cartão</label>
            <div className="grid grid-cols-6 gap-2">
              {CORES_PREDEFINIDAS.map((item) => (
                <button
                  key={item.cor}
                  type="button"
                  onClick={() => setForm({ ...form, cor: item.cor })}
                  className="relative w-10 h-10 rounded-xl transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
            className="p-4 rounded-xl text-white text-center"
            style={{ 
              background: `linear-gradient(135deg, rgb(15 23 42) 0%, rgb(15 23 42) 60%, ${form.cor}50 100%)`,
            }}
          >
            <p className="text-sm opacity-70">Preview</p>
            <p className="font-semibold">{form.nome || "Nome do Cartão"}</p>
          </div>

          <Button className="w-full" onClick={salvar}>
            Salvar alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- COMPONENTE AUXILIAR ---------- */

interface SelectDiaMesProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function SelectDiaMes({
  label,
  value,
  onChange,
}: SelectDiaMesProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-muted-foreground">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {Array.from({ length: 28 }, (_, i) => i + 1).map((dia) => (
          <option key={dia} value={dia}>
            Dia {dia}
          </option>
        ))}
      </select>
    </div>
  );
}
