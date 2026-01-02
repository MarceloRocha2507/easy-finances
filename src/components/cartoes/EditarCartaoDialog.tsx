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
      <label className="text-sm text-slate-600">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="
          rounded-xl border border-slate-300
          px-3 py-2 text-slate-800
          focus:outline-none focus:ring-2 focus:ring-indigo-500
        "
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
