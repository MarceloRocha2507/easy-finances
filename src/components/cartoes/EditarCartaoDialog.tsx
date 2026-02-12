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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Cartao, atualizarCartao } from "@/services/cartoes";
import { useToast } from "@/components/ui/use-toast";
import { DaySelector } from "@/components/ui/day-selector";
import { Check } from "lucide-react";
import { BancoSelector } from "@/components/bancos";

// Lista de cartões brasileiros com bandeira e cor padrão
const CARTOES_BRASIL = [
  { nome: "Nubank", bandeira: "Mastercard", cor: "#820AD1" },
  { nome: "Inter", bandeira: "Mastercard", cor: "#00A859" },
  { nome: "C6 Bank", bandeira: "Mastercard", cor: "#242424" },
  { nome: "Next", bandeira: "Visa", cor: "#D50032" },
  { nome: "Itaú", bandeira: "Visa", cor: "#003399" },
  { nome: "Santander", bandeira: "Mastercard", cor: "#CC0000" },
  { nome: "Bradesco", bandeira: "Visa", cor: "#CC092F" },
  { nome: "Banco do Brasil", bandeira: "Visa", cor: "#FFCD00" },
  { nome: "Caixa", bandeira: "Elo", cor: "#0070C0" },
  { nome: "PAN", bandeira: "Mastercard", cor: "#F37021" },
  { nome: "XP", bandeira: "Visa", cor: "#000000" },
  { nome: "BTG", bandeira: "Mastercard", cor: "#1A1A2E" },
  { nome: "Neon", bandeira: "Visa", cor: "#00E5FF" },
  { nome: "PicPay", bandeira: "Mastercard", cor: "#21C25E" },
  { nome: "Mercado Pago", bandeira: "Mastercard", cor: "#00AEEF" },
  { nome: "Digio", bandeira: "Visa", cor: "#0066CC" },
  { nome: "Credicard", bandeira: "Mastercard", cor: "#00A551" },
  { nome: "Outro", bandeira: "", cor: "#6366f1" },
];

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
  const [loading, setLoading] = useState(false);

  const [cartaoSelecionado, setCartaoSelecionado] = useState("");
  const [nomePersonalizado, setNomePersonalizado] = useState("");

  const [form, setForm] = useState({
    nome: "",
    bandeira: "",
    limite: 0,
    dia_fechamento: 1,
    dia_vencimento: 1,
    cor: "#6366f1",
    banco_id: null as string | null,
  });

  const isOutro = cartaoSelecionado === "Outro";

  // Sincroniza o form sempre que o cartão mudar
  useEffect(() => {
    if (!cartao) return;

    // Verifica se o nome do cartão existe na lista
    const cartaoEncontrado = CARTOES_BRASIL.find(
      (c) => c.nome.toLowerCase() === cartao.nome.toLowerCase()
    );

    if (cartaoEncontrado && cartaoEncontrado.nome !== "Outro") {
      setCartaoSelecionado(cartaoEncontrado.nome);
      setNomePersonalizado("");
    } else {
      setCartaoSelecionado("Outro");
      setNomePersonalizado(cartao.nome);
    }

    setForm({
      nome: cartao.nome,
      bandeira: cartao.bandeira ?? "",
      limite: cartao.limite,
      dia_fechamento: cartao.dia_fechamento,
      dia_vencimento: cartao.dia_vencimento,
      cor: cartao.cor || "#6366f1",
      banco_id: (cartao as any).banco_id || null,
    });
  }, [cartao, open]);

  function handleCartaoChange(nomeCartao: string) {
    setCartaoSelecionado(nomeCartao);

    const cartaoInfo = CARTOES_BRASIL.find((c) => c.nome === nomeCartao);
    if (cartaoInfo) {
      if (nomeCartao === "Outro") {
        setForm({
          ...form,
          nome: nomePersonalizado,
          bandeira: "",
        });
      } else {
        setNomePersonalizado("");
        setForm({
          ...form,
          nome: cartaoInfo.nome,
          bandeira: cartaoInfo.bandeira,
          cor: cartaoInfo.cor,
        });
      }
    }
  }

  function handleNomePersonalizadoChange(nome: string) {
    setNomePersonalizado(nome);
    setForm({ ...form, nome });
  }

  async function salvar() {
    const nomeCartao = isOutro ? nomePersonalizado : cartaoSelecionado;

    if (!nomeCartao.trim()) {
      toast({ title: "Informe o nome do cartão", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await atualizarCartao(cartao.id, {
        nome: nomeCartao,
        bandeira: form.bandeira,
        limite: Number(form.limite),
        dia_fechamento: form.dia_fechamento,
        dia_vencimento: form.dia_vencimento,
        cor: form.cor,
        banco_id: form.banco_id,
      });

      toast({
        title: "Cartão atualizado",
        description: "As informações foram salvas com sucesso.",
      });

      onSaved();
      onOpenChange(false);
    } catch {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar o cartão.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const displayNome = isOutro ? nomePersonalizado : cartaoSelecionado;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 border-0 overflow-hidden [&>button]:text-white [&>button]:hover:text-white/80">
        <div
          className="px-4 sm:px-5 pt-4 pb-4"
          style={{ background: form.cor || "#6366f1" }}
        >
          <DialogHeader>
            <DialogTitle className="text-white">Editar cartão</DialogTitle>
            <DialogDescription className="text-white/70">
              Atualize as informações do cartão
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-4 sm:px-5 pb-4 pt-2 overflow-y-auto">
          {/* Seletor de Cartão */}
          <div className="space-y-2">
            <Label>Cartão</Label>
            <Select value={cartaoSelecionado} onValueChange={handleCartaoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cartão" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {CARTOES_BRASIL.map((c) => (
                  <SelectItem key={c.nome} value={c.nome}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: c.cor }}
                      />
                      <span>{c.nome}</span>
                      {c.bandeira && (
                        <span className="text-xs text-muted-foreground">
                          ({c.bandeira})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nome personalizado (apenas se "Outro") */}
          {isOutro && (
            <div className="space-y-2">
              <Label htmlFor="nomePersonalizado">Nome do cartão</Label>
              <Input
                id="nomePersonalizado"
                placeholder="Digite o nome do cartão"
                value={nomePersonalizado}
                onChange={(e) => handleNomePersonalizadoChange(e.target.value)}
              />
            </div>
          )}

          {/* Bandeira */}
          <div className="space-y-2">
            <Label htmlFor="bandeira">Bandeira</Label>
            {isOutro ? (
              <Input
                id="bandeira"
                placeholder="Ex: Mastercard, Visa, Elo..."
                value={form.bandeira}
                onChange={(e) => setForm({ ...form, bandeira: e.target.value })}
              />
            ) : (
              <Input
                id="bandeira"
                value={form.bandeira}
                disabled
                className="bg-muted"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="limite">Limite (R$)</Label>
            <Input
              id="limite"
              type="number"
              placeholder="0,00"
              value={form.limite || ""}
              onChange={(e) => setForm({ ...form, limite: Number(e.target.value) })}
            />
          </div>

          {/* Seletores de dia com calendário visual */}
          <div className="grid grid-cols-2 gap-4">
            <DaySelector
              label="Dia de fechamento"
              value={form.dia_fechamento}
              onChange={(day) => setForm({ ...form, dia_fechamento: day })}
            />
            <DaySelector
              label="Dia de vencimento"
              value={form.dia_vencimento}
              onChange={(day) => setForm({ ...form, dia_vencimento: day })}
            />
          </div>

          {/* Banco */}
          <BancoSelector
            value={form.banco_id}
            onChange={(bancoId) => setForm({ ...form, banco_id: bancoId })}
            label="Banco (opcional)"
            placeholder="Selecione o banco"
          />

          {/* Seletor de Cor */}
          <div className="space-y-2">
            <Label>Cor do cartão</Label>
            <div className="grid grid-cols-6 gap-2">
              {CORES_PREDEFINIDAS.map((item) => (
                <button
                  key={item.cor}
                  type="button"
                  onClick={() => setForm({ ...form, cor: item.cor })}
                  className="relative w-10 h-10 rounded-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
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
            className="p-4 rounded-lg text-white text-center"
            style={{
              background: `linear-gradient(135deg, rgb(15 23 42) 0%, rgb(15 23 42) 60%, ${form.cor}50 100%)`,
            }}
          >
            <p className="text-xs opacity-70 mb-1">Preview</p>
            <p className="font-semibold">{displayNome || "Nome do Cartão"}</p>
            {form.bandeira && (
              <p className="text-xs opacity-70 uppercase mt-1">{form.bandeira}</p>
            )}
          </div>

          <Button className="w-full" onClick={salvar} disabled={loading}>
            {loading ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
