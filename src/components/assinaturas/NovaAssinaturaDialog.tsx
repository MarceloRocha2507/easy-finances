import { useState, useEffect } from "react";
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
import { useAssinaturas, Assinatura } from "@/hooks/useAssinaturas";
import { useCategories } from "@/hooks/useCategories";

const CATEGORIAS = ["streaming", "software", "saude", "educacao", "outros"];
const FREQUENCIAS = [
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];
const METODOS = [
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "debito_automatico", label: "Débito Automático" },
  { value: "boleto", label: "Boleto" },
  { value: "pix", label: "Pix" },
];
const MOEDAS = ["BRL", "USD", "EUR"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assinatura?: Assinatura | null;
  prefill?: { nome: string; valor: string; frequencia: string } | null;
}

export function NovaAssinaturaDialog({ open, onOpenChange, assinatura, prefill }: Props) {
  const { criar, atualizar } = useAssinaturas();
  const { data: categories } = useCategories();
  const isEdit = !!assinatura;

  const [form, setForm] = useState({
    nome: "",
    categoria: "outros",
    valor: "",
    moeda: "BRL",
    frequencia: "mensal",
    data_inicio: new Date().toISOString().split("T")[0],
    proxima_cobranca: new Date().toISOString().split("T")[0],
    metodo_pagamento: "cartao_credito",
    observacoes: "",
    category_id: "",
  });

  useEffect(() => {
    if (assinatura) {
      setForm({
        nome: assinatura.nome,
        categoria: assinatura.categoria,
        valor: String(assinatura.valor),
        moeda: assinatura.moeda,
        frequencia: assinatura.frequencia,
        data_inicio: assinatura.data_inicio,
        proxima_cobranca: assinatura.proxima_cobranca,
        metodo_pagamento: assinatura.metodo_pagamento,
        observacoes: assinatura.observacoes || "",
        category_id: assinatura.category_id || "",
      });
    } else {
      setForm({
        nome: prefill?.nome || "",
        categoria: "outros",
        valor: prefill?.valor || "",
        moeda: "BRL",
        frequencia: prefill?.frequencia || "mensal",
        data_inicio: new Date().toISOString().split("T")[0],
        proxima_cobranca: new Date().toISOString().split("T")[0],
        metodo_pagamento: "cartao_credito",
        observacoes: "",
        category_id: "",
      });
    }
  }, [assinatura, open, prefill]);

  const handleSubmit = () => {
    if (!form.nome || !form.valor) return;
    const payload = {
      nome: form.nome,
      categoria: form.categoria,
      valor: Number(form.valor),
      moeda: form.moeda,
      frequencia: form.frequencia,
      data_inicio: form.data_inicio,
      proxima_cobranca: form.proxima_cobranca,
      metodo_pagamento: form.metodo_pagamento,
      observacoes: form.observacoes || null,
      category_id: form.category_id || null,
      status: assinatura?.status || "ativa",
      data_cancelamento: assinatura?.data_cancelamento || null,
      data_pausa: assinatura?.data_pausa || null,
    };

    if (isEdit) {
      atualizar.mutate({ id: assinatura.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      criar.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const expenseCategories = categories?.filter((c) => c.type === "expense") ?? [];
  const categoriaLabel = (c: string) =>
    c === "streaming" ? "Streaming" : c === "software" ? "Software" : c === "saude" ? "Saúde" : c === "educacao" ? "Educação" : "Outros";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Assinatura" : "Nova Assinatura"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Nome do serviço</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Netflix, Spotify..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor</Label>
              <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="29.90" />
            </div>
            <div>
              <Label>Moeda</Label>
              <Select value={form.moeda} onValueChange={(v) => setForm({ ...form, moeda: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOEDAS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{categoriaLabel(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Frequência</Label>
              <Select value={form.frequencia} onValueChange={(v) => setForm({ ...form, frequencia: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIAS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Método de pagamento</Label>
            <Select value={form.metodo_pagamento} onValueChange={(v) => setForm({ ...form, metodo_pagamento: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METODOS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Categoria financeira (opcional)</Label>
          <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}>
            <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {expenseCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data de início</Label>
              <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
            </div>
            <div>
              <Label>Próxima cobrança</Label>
              <Input type="date" value={form.proxima_cobranca} onChange={(e) => setForm({ ...form, proxima_cobranca: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Notas opcionais..." rows={2} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={criar.isPending || atualizar.isPending}>
            {isEdit ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
