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
import { criarCartao } from "@/services/cartoes";
import { useToast } from "@/components/ui/use-toast";

export function NovoCartaoDialog({ onSaved }: { onSaved: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    bandeira: "",
    limite: 0,
    dia_fechamento: 1,
    dia_vencimento: 10,
  });

  async function salvar() {
    try {
      await criarCartao(form);
      toast({ title: "Cartão cadastrado com sucesso" });
      setOpen(false);
      onSaved();
    } catch {
      toast({ title: "Erro ao salvar cartão", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Novo Cartão</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Cartão</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input placeholder="Nome" onChange={e => setForm({ ...form, nome: e.target.value })} />
          <Input placeholder="Bandeira" onChange={e => setForm({ ...form, bandeira: e.target.value })} />
          <Input type="number" placeholder="Limite" onChange={e => setForm({ ...form, limite: Number(e.target.value) })} />
          <Input type="number" placeholder="Dia fechamento" onChange={e => setForm({ ...form, dia_fechamento: Number(e.target.value) })} />
          <Input type="number" placeholder="Dia vencimento" onChange={e => setForm({ ...form, dia_vencimento: Number(e.target.value) })} />

          <Button className="w-full" onClick={salvar}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
