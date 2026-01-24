import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Cartao } from "@/services/cartoes";
import { criarCompraCartao } from "@/services/compras-cartao";
import { useToast } from "@/hooks/use-toast";
import { ResponsavelSelector } from "@/components/ui/responsavel-selector";
import { useResponsavelTitular } from "@/services/responsaveis";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Calendar, Tag, Repeat, Hash } from "lucide-react";
import { CalculatorPopover } from "@/components/ui/calculator-popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NovoResponsavelDialog } from "./NovoResponsavelDialog";
import { useQueryClient } from "@tanstack/react-query";

type Categoria = {
  id: string;
  name: string;
  color: string;
  icon?: string;
};

type TipoLancamento = "unica" | "parcelada" | "fixa";

interface Props {
  cartao: Cartao;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function NovaCompraCartaoDialog({
  cartao,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: titularData } = useResponsavelTitular();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [novoResponsavelOpen, setNovoResponsavelOpen] = useState(false);

  // Calcular mês da fatura baseado na data da compra e dia de fechamento
  function calcularMesFatura(dataCompra: Date, diaFechamento: number): string {
    const diaCompra = dataCompra.getDate();
    const mesCompra = dataCompra.getMonth();
    const anoCompra = dataCompra.getFullYear();

    if (diaCompra >= diaFechamento) {
      // Compra após o fechamento: vai para a fatura do mês atual
      return format(new Date(anoCompra, mesCompra, 1), "yyyy-MM");
    } else {
      // Compra antes do fechamento: vai para a fatura do mês anterior
      return format(new Date(anoCompra, mesCompra - 1, 1), "yyyy-MM");
    }
  }

  // Gerar opções de mês da fatura (6 meses anteriores + próximos 12 meses)
  const opcoesMesFatura = useMemo(() => {
    const hoje = new Date();
    const meses = [];
    // Incluir 6 meses anteriores para cobrir compras passadas
    for (let i = -6; i < 12; i++) {
      const mes = addMonths(hoje, i);
      meses.push({
        value: format(mes, "yyyy-MM"),
        label: format(mes, "MMMM/yyyy", { locale: ptBR }),
      });
    }
    return meses;
  }, []);

  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    tipoLancamento: "unica" as TipoLancamento,
    parcelas: "2",
    parcelaInicial: "1",
    mesFatura: opcoesMesFatura[0]?.value || "",
    dataCompra: new Date().toISOString().split("T")[0],
    categoriaId: "",
    responsavelId: "",
  });

  // Carregar categorias
  useEffect(() => {
    async function loadCategorias() {
      const { data } = await supabase
        .from("categories")
        .select("id, name, color, icon")
        .order("name");
      
      if (data) {
        setCategorias(data);
      }
    }
    loadCategorias();
  }, []);

  // Definir titular como padrão quando carregar
  useEffect(() => {
    if (titularData && !form.responsavelId) {
      setForm((f) => ({ ...f, responsavelId: titularData.id }));
    }
  }, [titularData]);

  // Reset form quando abrir - calcular mês da fatura com base na data atual e dia de fechamento
  useEffect(() => {
    if (open) {
      const hoje = new Date();
      const mesFaturaCalculado = calcularMesFatura(hoje, cartao.dia_fechamento);
      
      setForm({
        descricao: "",
        valor: "",
        tipoLancamento: "unica",
        parcelas: "2",
        parcelaInicial: "1",
        mesFatura: mesFaturaCalculado,
        dataCompra: hoje.toISOString().split("T")[0],
        categoriaId: "",
        responsavelId: titularData?.id || "",
      });
    }
  }, [open, titularData, cartao.dia_fechamento]);

  // Recalcular mês da fatura automaticamente quando a data da compra mudar
  useEffect(() => {
    if (form.dataCompra && open) {
      const dataCompra = new Date(form.dataCompra + "T12:00:00"); // T12:00:00 evita problemas de timezone
      const novoMesFatura = calcularMesFatura(dataCompra, cartao.dia_fechamento);
      
      // Só atualizar se for diferente (evitar loop infinito)
      if (form.mesFatura !== novoMesFatura) {
        setForm(f => ({ ...f, mesFatura: novoMesFatura }));
      }
    }
  }, [form.dataCompra, cartao.dia_fechamento, open]);

  // Gerar opções de parcela inicial baseado no número de parcelas
  const opcoesParcelaInicial = useMemo(() => {
    const numParcelas = parseInt(form.parcelas) || 2;
    return Array.from({ length: numParcelas }, (_, i) => ({
      value: String(i + 1),
      label: `${i + 1}ª parcela`,
    }));
  }, [form.parcelas]);

  // Ajustar parcela inicial se ficar maior que o total
  useEffect(() => {
    const numParcelas = parseInt(form.parcelas) || 2;
    const parcelaInicial = parseInt(form.parcelaInicial) || 1;
    if (parcelaInicial > numParcelas) {
      setForm(f => ({ ...f, parcelaInicial: "1" }));
    }
  }, [form.parcelas]);

  async function handleSalvar() {
    // Proteção contra cliques duplos
    if (loading) return;
    
    if (!form.descricao.trim()) {
      toast({ title: "Informe a descrição", variant: "destructive" });
      return;
    }

    const valor = parseFloat(form.valor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      toast({ title: "Informe um valor válido", variant: "destructive" });
      return;
    }

    if (!form.responsavelId) {
      toast({ title: "Selecione o responsável", variant: "destructive" });
      return;
    }

    if (!form.mesFatura) {
      toast({ title: "Selecione o mês da fatura", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Montar mês da fatura como Date
      const [ano, mes] = form.mesFatura.split("-").map(Number);
      const mesFaturaDate = new Date(ano, mes - 1, 1);

      // Calcular número de parcelas baseado no tipo
      let numParcelas = 1;
      let parcelaInicial = 1;
      
      if (form.tipoLancamento === "parcelada") {
        numParcelas = parseInt(form.parcelas);
        parcelaInicial = parseInt(form.parcelaInicial);
      } else if (form.tipoLancamento === "fixa") {
        numParcelas = 12; // Fixa por 12 meses
        parcelaInicial = 1;
      }

      await criarCompraCartao({
        cartaoId: cartao.id,
        descricao: form.descricao,
        valorTotal: valor,
        parcelas: numParcelas,
        parcelaInicial,
        mesFatura: mesFaturaDate,
        tipoLancamento: form.tipoLancamento,
        dataCompra: new Date(form.dataCompra),
        categoriaId: form.categoriaId && form.categoriaId !== "none" ? form.categoriaId : undefined,
        responsavelId: form.responsavelId,
      });

      toast({ title: "Compra registrada!" });
      onSaved();
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

  // Calcular resumo das parcelas
  const resumoParcelas = useMemo(() => {
    const valor = parseFloat(form.valor.replace(",", ".")) || 0;
    if (valor <= 0) return null;

    if (form.tipoLancamento === "unica") {
      return { tipo: "unica", valor };
    }

    if (form.tipoLancamento === "parcelada") {
      const numParcelas = parseInt(form.parcelas) || 2;
      const parcelaInicial = parseInt(form.parcelaInicial) || 1;
      const numParcelasACriar = numParcelas - parcelaInicial + 1;
      const valorParcela = valor / numParcelas;
      
      return {
        tipo: "parcelada",
        valorParcela,
        numParcelas,
        parcelaInicial,
        numParcelasACriar,
      };
    }

    if (form.tipoLancamento === "fixa") {
      return { tipo: "fixa", valorMensal: valor };
    }

    return null;
  }, [form.valor, form.tipoLancamento, form.parcelas, form.parcelaInicial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Nova Compra
          </DialogTitle>
          <DialogDescription>
            Registre uma compra no cartão {cartao.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              placeholder="Ex: Supermercado, Farmácia..."
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor total (R$)</Label>
            <div className="flex gap-2">
              <Input
                id="valor"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                className="flex-1"
              />
              <CalculatorPopover
                onResult={(value) => {
                  setForm({ ...form, valor: value.toFixed(2).replace(".", ",") });
                }}
              />
            </div>
          </div>

          {/* Tipo de Lançamento */}
          <div className="space-y-2">
            <Label>Tipo de lançamento</Label>
            <ToggleGroup
              type="single"
              value={form.tipoLancamento}
              onValueChange={(v) => {
                if (v) setForm({ ...form, tipoLancamento: v as TipoLancamento });
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="unica" className="flex-1">
                Avulsa
              </ToggleGroupItem>
              <ToggleGroupItem value="parcelada" className="flex-1">
                Parcelada
              </ToggleGroupItem>
              <ToggleGroupItem value="fixa" className="flex-1">
                <Repeat className="h-4 w-4 mr-1" />
                Fixa
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Opções de Parcelamento (só aparece quando parcelada) */}
          {form.tipoLancamento === "parcelada" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parcelas">Nº de parcelas</Label>
                <Select
                  value={form.parcelas}
                  onValueChange={(v) => setForm({ ...form, parcelas: v })}
                >
                  <SelectTrigger id="parcelas">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 23 }, (_, i) => i + 2).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parcelaInicial" className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Começar na
                </Label>
                <Select
                  value={form.parcelaInicial}
                  onValueChange={(v) => setForm({ ...form, parcelaInicial: v })}
                >
                  <SelectTrigger id="parcelaInicial">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesParcelaInicial.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Mês da Fatura */}
          <div className="space-y-2">
            <Label htmlFor="mesFatura" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Mês da fatura
            </Label>
            <Select
              value={form.mesFatura}
              onValueChange={(v) => setForm({ ...form, mesFatura: v })}
            >
              <SelectTrigger id="mesFatura">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {opcoesMesFatura.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data da compra */}
          <div className="space-y-2">
            <Label htmlFor="dataCompra">Data da compra</Label>
            <Input
              id="dataCompra"
              type="date"
              value={form.dataCompra}
              onChange={(e) => setForm({ ...form, dataCompra: e.target.value })}
            />
          </div>

          {/* Responsável */}
          <ResponsavelSelector
            label="Quem fez a compra?"
            value={form.responsavelId}
            onChange={(id) => setForm({ ...form, responsavelId: id || "" })}
            onAddNew={() => setNovoResponsavelOpen(true)}
            required
          />

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoria" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categoria (opcional)
            </Label>
            <Select
              value={form.categoriaId}
              onValueChange={(v) => setForm({ ...form, categoriaId: v })}
            >
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Selecionar categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem categoria</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resumo */}
          {resumoParcelas && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              {resumoParcelas.tipo === "unica" && (
                <p className="text-muted-foreground">
                  Compra à vista:{" "}
                  <strong className="text-foreground">
                    R$ {resumoParcelas.valor.toFixed(2).replace(".", ",")}
                  </strong>
                </p>
              )}
              {resumoParcelas.tipo === "parcelada" && (
                <>
                  <p className="text-muted-foreground">
                    {resumoParcelas.numParcelas}x de{" "}
                    <strong className="text-foreground">
                      R$ {resumoParcelas.valorParcela.toFixed(2).replace(".", ",")}
                    </strong>
                  </p>
                  {resumoParcelas.parcelaInicial > 1 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Começando na {resumoParcelas.parcelaInicial}ª parcela ({resumoParcelas.numParcelasACriar} parcelas serão criadas)
                    </p>
                  )}
                </>
              )}
              {resumoParcelas.tipo === "fixa" && (
                <p className="text-muted-foreground">
                  Despesa fixa mensal:{" "}
                  <strong className="text-foreground">
                    R$ {resumoParcelas.valorMensal.toFixed(2).replace(".", ",")}
                  </strong>
                </p>
              )}
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSalvar}
            disabled={loading}
            aria-disabled={loading}
          >
            {loading ? "Salvando..." : "Registrar compra"}
          </Button>
        </div>
      </DialogContent>

      <NovoResponsavelDialog
        open={novoResponsavelOpen}
        onOpenChange={setNovoResponsavelOpen}
        onCreated={(novoId) => {
          setForm({ ...form, responsavelId: novoId });
          queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
        }}
      />
    </Dialog>
  );
}
