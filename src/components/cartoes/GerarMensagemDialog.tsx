import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Cartao } from "@/services/cartoes";
import { gerarMensagemFatura, FormatoMensagem } from "@/services/compras-cartao";
import { useResponsaveis } from "@/services/responsaveis";
import { useToast } from "@/hooks/use-toast";
import {
  Copy,
  Check,
  FileText,
  MessageCircle,
  User,
  Users,
} from "lucide-react";

interface Props {
  cartao: Cartao;
  mesReferencia: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerarMensagemDialog({
  cartao,
  mesReferencia,
  open,
  onOpenChange,
}: Props) {
  const { toast } = useToast();
  const { data: responsaveis = [] } = useResponsaveis();

  const [responsavelId, setResponsavelId] = useState<string>("todos");
  const [formato, setFormato] = useState<FormatoMensagem>("detalhado");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Gerar mensagem quando mudar parâmetros
  useEffect(() => {
    if (!open) return;

    async function gerar() {
      setLoading(true);
      try {
        const respId = responsavelId === "todos" ? null : responsavelId;
        const fmt = responsavelId === "todos" ? "todos" : formato;
        
        const msg = await gerarMensagemFatura(
          cartao.id,
          mesReferencia,
          respId,
          fmt
        );
        setMensagem(msg);
      } catch (error) {
        console.error(error);
        setMensagem("Erro ao gerar mensagem");
      } finally {
        setLoading(false);
      }
    }

    gerar();
  }, [open, cartao.id, mesReferencia, responsavelId, formato]);

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiado(true);
      toast({ title: "Mensagem copiada!" });
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const handleWhatsApp = () => {
    // Encontrar telefone do responsável
    const responsavel = responsaveis.find((r) => r.id === responsavelId);
    const telefone = responsavel?.telefone?.replace(/\D/g, "");

    const mensagemEncoded = encodeURIComponent(mensagem);
    const url = telefone
      ? `https://wa.me/55${telefone}?text=${mensagemEncoded}`
      : `https://wa.me/?text=${mensagemEncoded}`;

    window.open(url, "_blank");
  };

  const nomeMes = mesReferencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 border-0 overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 pb-4 bg-muted border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Gerar Mensagem da Fatura
            </DialogTitle>
            <DialogDescription>
              {cartao.nome} - {nomeMes}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-4 sm:px-5 pb-4 pt-2 overflow-y-auto">
          {/* Seletor de responsável */}
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Todos (resumo geral)
                  </div>
                </SelectItem>
                {responsaveis.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {r.apelido || r.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Formato (apenas se selecionou um responsável específico) */}
          {responsavelId !== "todos" && (
            <div className="space-y-2">
              <Label>Formato</Label>
              <RadioGroup
                value={formato}
                onValueChange={(v) => setFormato(v as FormatoMensagem)}
                className="grid grid-cols-2 gap-2"
              >
                <Label
                  htmlFor="detalhado"
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formato === "detalhado"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value="detalhado" id="detalhado" />
                  <div>
                    <p className="font-medium text-sm">Detalhado</p>
                    <p className="text-xs text-muted-foreground">
                      Lista todas as compras
                    </p>
                  </div>
                </Label>
                <Label
                  htmlFor="resumido"
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formato === "resumido"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value="resumido" id="resumido" />
                  <div>
                    <p className="font-medium text-sm">Resumido</p>
                    <p className="text-xs text-muted-foreground">
                      Apenas o total
                    </p>
                  </div>
                </Label>
              </RadioGroup>
            </div>
          )}

          {/* Preview da mensagem */}
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              value={loading ? "Gerando..." : mensagem}
              readOnly
              className="min-h-[200px] font-mono text-sm resize-none"
            />
          </div>

          {/* Botões */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleCopiar}
              disabled={loading || !mensagem}
            >
              {copiado ? (
                <>
                  <Check className="h-4 w-4" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar
                </>
              )}
            </Button>
            <Button
              className="gap-2"
              onClick={handleWhatsApp}
              disabled={loading || !mensagem}
            >
              <MessageCircle className="h-4 w-4" />
              Enviar WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}