import { useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Calculator } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/useCategories";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { DadosSimulacao, FormaPagamento } from "@/hooks/useSimuladorCompra";

interface Props {
  onSimular: (dados: DadosSimulacao) => void;
  dadosIniciais?: DadosSimulacao | null;
}

export function FormularioSimulacao({ onSimular, dadosIniciais }: Props) {
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const { data: cartoes = [] } = useQuery({
    queryKey: ["cartoes-simulador", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cartoes")
        .select("id, nome")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [nome, setNome] = useState(dadosIniciais?.nome || "");
  const [valorStr, setValorStr] = useState(
    dadosIniciais ? String(dadosIniciais.valorTotal) : ""
  );
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(
    dadosIniciais?.formaPagamento || "a_vista"
  );
  const [parcelas, setParcelas] = useState(
    dadosIniciais?.parcelas || 2
  );
  const [cartaoId, setCartaoId] = useState<string | null>(
    dadosIniciais?.cartaoId || null
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    dadosIniciais?.categoryId || null
  );
  const [dataPrevista, setDataPrevista] = useState<Date>(
    dadosIniciais?.dataPrevista || new Date()
  );
  const [valorSegurancaStr, setValorSegurancaStr] = useState(
    dadosIniciais ? String(dadosIniciais.valorSeguranca) : "0"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(valorStr.replace(/\./g, "").replace(",", "."));
    if (!nome.trim() || isNaN(valor) || valor <= 0) return;

    onSimular({
      nome: nome.trim(),
      valorTotal: valor,
      formaPagamento,
      parcelas: formaPagamento === "a_vista" ? 1 : parcelas,
      cartaoId: formaPagamento === "parcelado_cartao" ? cartaoId : null,
      categoryId,
      dataPrevista,
      valorSeguranca: parseFloat(valorSegurancaStr.replace(/\./g, "").replace(",", ".")) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome da compra</Label>
          <Input
            placeholder="Ex: iPhone 16, Notebook..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label>Valor total (R$)</Label>
          <Input
            placeholder="0,00"
            value={valorStr}
            onChange={(e) => setValorStr(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Forma de pagamento</Label>
          <Select
            value={formaPagamento}
            onValueChange={(v) => setFormaPagamento(v as FormaPagamento)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a_vista">À vista</SelectItem>
              <SelectItem value="parcelado_cartao">Parcelado no cartão</SelectItem>
              <SelectItem value="boleto_parcelado">Boleto parcelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formaPagamento === "parcelado_cartao" && (
          <div className="space-y-2">
            <Label>Cartão</Label>
            <Select
              value={cartaoId || ""}
              onValueChange={setCartaoId}
            >
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
          </div>
        )}

        {formaPagamento !== "a_vista" && (
          <div className="space-y-2">
            <Label>Número de parcelas</Label>
            <Select
              value={String(parcelas)}
              onValueChange={(v) => setParcelas(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 47 }, (_, i) => i + 2).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}x de R$ {(parseFloat(valorStr.replace(/\./g, "").replace(",", ".")) / n || 0).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Data prevista</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dataPrevista && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dataPrevista, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dataPrevista}
                onSelect={(d) => d && setDataPrevista(d)}
                initialFocus
                className="p-3 pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            value={categoryId || "none"}
            onValueChange={(v) => setCategoryId(v === "none" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem categoria</SelectItem>
              {expenseCategories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Valor de segurança mínimo (R$)</Label>
          <Input
            placeholder="0"
            value={valorSegurancaStr}
            onChange={(e) => setValorSegurancaStr(e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" className="w-full sm:w-auto">
        <Calculator className="h-4 w-4 mr-2" />
        Simular
      </Button>
    </form>
  );
}
