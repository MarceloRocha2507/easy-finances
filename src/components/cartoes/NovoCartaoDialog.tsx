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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { criarCartao } from "@/services/cartoes";
import { useToast } from "@/components/ui/use-toast";
import { DaySelector } from "@/components/ui/day-selector";
import { Plus, Lock } from "lucide-react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { PlanLimitAlert } from "@/components/ui/plan-limit-alert";
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

interface NovoCartaoDialogProps {
  onSaved: () => void;
}

export function NovoCartaoDialog({ onSaved }: NovoCartaoDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { canCreate, isLimitReached, usage, limits } = usePlanLimits();

  const [cartaoSelecionado, setCartaoSelecionado] = useState("");
  const [nomePersonalizado, setNomePersonalizado] = useState("");
  
  const [form, setForm] = useState({
    nome: "",
    bandeira: "",
    limite: 0,
    dia_fechamento: 5,
    dia_vencimento: 12,
    cor: "#6366f1",
    banco_id: null as string | null,
  });

  const limitReached = isLimitReached("cartoes");
  const isOutro = cartaoSelecionado === "Outro";

  function handleCartaoChange(nomeCartao: string) {
    setCartaoSelecionado(nomeCartao);
    
    const cartao = CARTOES_BRASIL.find((c) => c.nome === nomeCartao);
    if (cartao) {
      if (nomeCartao === "Outro") {
        setForm({
          ...form,
          nome: nomePersonalizado,
          bandeira: "",
          cor: cartao.cor,
        });
      } else {
        setNomePersonalizado("");
        setForm({
          ...form,
          nome: cartao.nome,
          bandeira: cartao.bandeira,
          cor: cartao.cor,
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

    if (form.limite <= 0) {
      toast({ title: "Informe o limite do cartão", variant: "destructive" });
      return;
    }

    if (!canCreate("cartoes")) {
      toast({ 
        title: "Limite de cartões atingido", 
        description: "Faça upgrade do seu plano para adicionar mais cartões.",
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      await criarCartao({
        ...form,
        nome: nomeCartao,
        banco_id: form.banco_id,
      });
      toast({ title: "Cartão cadastrado com sucesso" });
      setOpen(false);
      resetForm();
      onSaved();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar cartão";
      toast({ 
        title: message.includes("mesmo nome") ? "Cartão já existe" : "Erro ao salvar",
        description: message.includes("mesmo nome") ? "Já existe um cartão com este nome. Edite o existente ou escolha outro nome." : message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setCartaoSelecionado("");
    setNomePersonalizado("");
    setForm({
      nome: "",
      bandeira: "",
      limite: 0,
      dia_fechamento: 5,
      dia_vencimento: 12,
      cor: "#6366f1",
      banco_id: null,
    });
  }

  function handleUpgrade() {
    toast({
      title: "Upgrade de plano",
      description: "Entre em contato com o administrador para fazer upgrade do seu plano.",
    });
  }

  const displayNome = isOutro ? nomePersonalizado : cartaoSelecionado;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={limitReached}>
          {limitReached ? (
            <>
              <Lock className="h-4 w-4 mr-1.5" />
              Limite atingido
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1.5" />
              Novo Cartão
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Cartão</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Adicione as informações do seu cartão de crédito
          </p>
        </DialogHeader>

        {limitReached ? (
          <div className="py-4">
            <PlanLimitAlert
              recurso="cartões"
              usado={usage.cartoes}
              limite={limits.cartoes}
              onUpgrade={handleUpgrade}
            />
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Seletor de Cartão */}
            <div className="space-y-2">
              <Label>Cartão</Label>
              <Select value={cartaoSelecionado} onValueChange={handleCartaoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cartão" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {CARTOES_BRASIL.map((cartao) => (
                    <SelectItem key={cartao.nome} value={cartao.nome}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cartao.cor }}
                        />
                        <span>{cartao.nome}</span>
                        {cartao.bandeira && (
                          <span className="text-xs text-muted-foreground">
                            ({cartao.bandeira})
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

            {/* Banco */}
            <BancoSelector
              value={form.banco_id}
              onChange={(bancoId) => setForm({ ...form, banco_id: bancoId })}
              label="Banco (opcional)"
              placeholder="Selecione o banco"
            />

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

            {/* Preview do card */}
            <div
              className="p-4 rounded-lg text-center bg-muted border"
            >
              <p className="text-xs text-muted-foreground mb-1">Preview</p>
              <p className="font-semibold">{displayNome || "Nome do Cartão"}</p>
              {form.bandeira && (
                <p className="text-xs text-muted-foreground uppercase mt-1">{form.bandeira}</p>
              )}
            </div>

            <Button className="w-full" onClick={salvar} disabled={loading || !cartaoSelecionado}>
              {loading ? "Salvando..." : "Salvar cartão"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
