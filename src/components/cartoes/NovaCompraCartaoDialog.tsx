import { useState, useEffect } from "react";
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
import { CreditCard, Calendar, Tag } from "lucide-react";

type Categoria = {
  id: string;
  name: string;
  color: string;
  icon?: string;
};

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
  const { data: titularData } = useResponsavelTitular();
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    parcelas: "1",
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

  // Reset form quando abrir
  useEffect(() => {
    if (open) {
      setForm({
        descricao: "",
        valor: "",
        parcelas: "1",
        dataCompra: new Date().toISOString().split("T")[0],
        categoriaId: "",
        responsavelId: titularData?.id || "",
      });
    }
  }, [open, titularData]);

  async function handleSalvar() {
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

    setLoading(true);
    try {
      await criarCompraCartao({
        cartaoId: cartao.id,
        descricao: form.descricao,
        valorTotal: valor,
        parcelas: parseInt(form.parcelas),
        dataCompra: new Date(form.dataCompra),
        categoriaId: form.categoriaId || undefined,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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

          {/* Valor e Parcelas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor total (R$)</Label>
              <Input
                id="valor"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parcelas">Parcelas</Label>
              <Select
                value={form.parcelas}
                onValueChange={(v) => setForm({ ...form, parcelas: v })}
              >
                <SelectTrigger id="parcelas">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}x {n === 1 ? "(à vista)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsável - NOVO CAMPO */}
          <ResponsavelSelector
            label="Quem fez a compra?"
            value={form.responsavelId}
            onChange={(id) => setForm({ ...form, responsavelId: id || "" })}
            required
          />

          {/* Data da compra */}
          <div className="space-y-2">
            <Label htmlFor="dataCompra" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data da compra
            </Label>
            <Input
              id="dataCompra"
              type="date"
              value={form.dataCompra}
              onChange={(e) => setForm({ ...form, dataCompra: e.target.value })}
            />
          </div>

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
                <SelectItem value="">Sem categoria</SelectItem>
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
          {form.valor && parseInt(form.parcelas) > 1 && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">
                {parseInt(form.parcelas)}x de{" "}
                <strong className="text-foreground">
                  R${" "}
                  {(
                    parseFloat(form.valor.replace(",", ".")) /
                    parseInt(form.parcelas)
                  ).toFixed(2)}
                </strong>
              </p>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSalvar}
            disabled={loading}
          >
            {loading ? "Salvando..." : "Registrar compra"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}