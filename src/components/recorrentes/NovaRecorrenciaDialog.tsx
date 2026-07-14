import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDespesasRecorrentes } from "@/hooks/useDespesasRecorrentes";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { listarCartoes, Cartao } from "@/services/cartoes";
import {
  DespesaRecorrente,
  FrequenciaRecorrencia,
  MetodoPagamentoRecorrencia,
} from "@/services/despesas-recorrentes";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editar?: DespesaRecorrente | null;
}

const FREQUENCIAS: { value: FrequenciaRecorrencia; label: string }[] = [
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

const METODOS: { value: MetodoPagamentoRecorrencia; label: string }[] = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "PIX" },
  { value: "debito", label: "Débito" },
  { value: "conta", label: "Conta bancária" },
  { value: "cartao_credito", label: "Cartão de crédito" },
];

export function NovaRecorrenciaDialog({ open, onOpenChange, editar }: Props) {
  const { user } = useAuth();
  const { criar, atualizar } = useDespesasRecorrentes();
  const { data: categorias } = useCategories();

  const { data: cartoes = [] } = useQuery<Cartao[]>({
    queryKey: ["cartoes"],
    queryFn: listarCartoes,
    enabled: open,
  });

  const { data: bancos = [] } = useQuery<any[]>({
    queryKey: ["bancos"],
    enabled: open && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bancos")
        .select("id,nome")
        .eq("user_id", user!.id)
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const categoriasExpense = useMemo(
    () => (categorias || []).filter((c) => c.type === "expense" && c.name !== "Fatura do Cartão"),
    [categorias]
  );

  const [nome, setNome] = useState("");
  const [valor, setValor] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [frequencia, setFrequencia] = useState<FrequenciaRecorrencia>("mensal");
  const [intervalo, setIntervalo] = useState<string>("1");
  const [dataInicio, setDataInicio] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dataFim, setDataFim] = useState<string>("");
  const [metodo, setMetodo] = useState<MetodoPagamentoRecorrencia>("cartao_credito");
  const [cartaoId, setCartaoId] = useState<string>("");
  const [bancoId, setBancoId] = useState<string>("");
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (open && editar) {
      setNome(editar.nome);
      setValor(String(editar.valor));
      setCategoryId(editar.category_id || "");
      setFrequencia(editar.frequencia);
      setIntervalo(String(editar.intervalo));
      setDataInicio(editar.data_inicio);
      setDataFim(editar.data_fim || "");
      setMetodo(editar.metodo_pagamento);
      setCartaoId(editar.cartao_id || "");
      setBancoId(editar.banco_id || "");
      setObservacoes(editar.observacoes || "");
    } else if (open) {
      setNome("");
      setValor("");
      setCategoryId("");
      setFrequencia("mensal");
      setIntervalo("1");
      setDataInicio(new Date().toISOString().slice(0, 10));
      setDataFim("");
      setMetodo("cartao_credito");
      setCartaoId("");
      setBancoId("");
      setObservacoes("");
    }
  }, [open, editar]);

  const isCartao = metodo === "cartao_credito";
  const precisaBanco = metodo === "conta" || metodo === "pix" || metodo === "debito";

  const podeSalvar =
    nome.trim().length > 0 &&
    Number(valor) > 0 &&
    (!isCartao || !!cartaoId) &&
    (!precisaBanco || !!bancoId);

  const handleSalvar = async () => {
    const payload = {
      nome: nome.trim(),
      descricao: null,
      valor: Number(valor),
      moeda: "BRL",
      category_id: categoryId || null,
      subcategoria_id: null,
      frequencia,
      intervalo: Math.max(1, Number(intervalo) || 1),
      data_inicio: dataInicio,
      data_fim: dataFim || null,
      metodo_pagamento: metodo,
      banco_id: precisaBanco ? bancoId : null,
      cartao_id: isCartao ? cartaoId : null,
      responsavel_id: null,
      status: "ativa" as const,
      dia_lembrete: null,
      observacoes: observacoes.trim() || null,
      link_cancelamento: null,
      vinculo_automatico: true,
      horizonte_geracao_meses: 12,
    };

    if (editar) {
      await atualizar.mutateAsync({ id: editar.id, ...payload });
    } else {
      await criar.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editar ? "Editar recorrência" : "Nova despesa recorrente"}</DialogTitle>
          <DialogDescription>
            {editar
              ? "As alterações afetam apenas as próximas ocorrências ainda não pagas. O histórico é preservado."
              : "O sistema criará automaticamente cada despesa para cada período."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div>
            <Label>Nome *</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Spotify, Netflix, Aluguel"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasExpense.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Frequência *</Label>
              <Select value={frequencia} onValueChange={(v) => setFrequencia(v as FrequenciaRecorrencia)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIAS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>A cada</Label>
              <Input
                type="number"
                min="1"
                value={intervalo}
                onChange={(e) => setIntervalo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início *</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div>
              <Label>Fim (opcional)</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Forma de pagamento *</Label>
            <Select value={metodo} onValueChange={(v) => setMetodo(v as MetodoPagamentoRecorrencia)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METODOS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCartao && (
            <div>
              <Label>Cartão *</Label>
              <Select value={cartaoId} onValueChange={setCartaoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cartão" />
                </SelectTrigger>
                <SelectContent>
                  {cartoes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Os lançamentos serão criados automaticamente na fatura correta, respeitando o dia de fechamento.
              </p>
            </div>
          )}

          {precisaBanco && (
            <div>
              <Label>Conta *</Label>
              <Select value={bancoId} onValueChange={setBancoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {bancos.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              placeholder="Notas opcionais"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSalvar}
            disabled={!podeSalvar || criar.isPending || atualizar.isPending}
          >
            {editar ? "Salvar alterações" : "Criar recorrência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
