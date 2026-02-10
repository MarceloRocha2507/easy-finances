import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { gerarMensagemFatura } from "@/services/compras-cartao";
import { CartaoComResumo } from "@/services/cartoes";
import {
  Copy,
  Check,
  FileText,
  MessageCircle,
  CreditCard,
  AlertCircle,
} from "lucide-react";

interface Props {
  cartoes: CartaoComResumo[];
  mesReferencia: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ResultadoCartao = {
  cartaoId: string;
  nomeCartao: string;
  cor: string;
  mensagem: string;
  erro: boolean;
};

export function GerarMensagensLoteDialog({
  cartoes,
  mesReferencia,
  open,
  onOpenChange,
}: Props) {
  const { toast } = useToast();
  const [resultados, setResultados] = useState<ResultadoCartao[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiadoTudo, setCopiadoTudo] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || cartoes.length === 0) return;

    async function gerarTodas() {
      setLoading(true);
      setResultados([]);

      const promises = cartoes.map(async (cartao) => {
        try {
          const msg = await gerarMensagemFatura(
            cartao.id,
            mesReferencia,
            null,
            "todos"
          );
          return {
            cartaoId: cartao.id,
            nomeCartao: cartao.nome,
            cor: cartao.cor || "#6366f1",
            mensagem: msg,
            erro: false,
          } as ResultadoCartao;
        } catch {
          return {
            cartaoId: cartao.id,
            nomeCartao: cartao.nome,
            cor: cartao.cor || "#6366f1",
            mensagem: "Erro ao gerar mensagem",
            erro: true,
          } as ResultadoCartao;
        }
      });

      const results = await Promise.allSettled(promises);
      const mapped = results.map((r) =>
        r.status === "fulfilled" ? r.value : ({
          cartaoId: "",
          nomeCartao: "Erro",
          cor: "#ef4444",
          mensagem: "Falha inesperada",
          erro: true,
        } as ResultadoCartao)
      );

      setResultados(mapped);
      setLoading(false);
    }

    gerarTodas();
  }, [open, cartoes, mesReferencia]);

  const mensagemConsolidada = resultados
    .filter((r) => !r.erro)
    .map((r) => r.mensagem)
    .join("\n\n━━━━━━━━━━━━━━━━━━━━\n\n");

  const handleCopiarTudo = async () => {
    try {
      await navigator.clipboard.writeText(mensagemConsolidada);
      setCopiadoTudo(true);
      toast({ title: "Todas as mensagens copiadas!" });
      setTimeout(() => setCopiadoTudo(false), 2000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const handleCopiarIndividual = async (cartaoId: string, mensagem: string) => {
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiadoId(cartaoId);
      toast({ title: "Mensagem copiada!" });
      setTimeout(() => setCopiadoId(null), 2000);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(mensagemConsolidada);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const nomeMes = mesReferencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const sucessos = resultados.filter((r) => !r.erro).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mensagens em Lote
          </DialogTitle>
          <DialogDescription>
            {loading
              ? `Gerando mensagens de ${cartoes.length} cartões...`
              : `${sucessos} mensagem(ns) gerada(s) — ${nomeMes}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {loading ? (
            <div className="space-y-4">
              {cartoes.map((c) => (
                <div key={c.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: c.cor || "#6366f1" }}
                    />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-[50vh]">
                <div className="space-y-4 pr-3">
                  {resultados.map((resultado) => (
                    <div
                      key={resultado.cartaoId}
                      className="rounded-xl border overflow-hidden"
                    >
                      {/* Header do cartão */}
                      <div
                        className="flex items-center justify-between px-4 py-2.5"
                        style={{ backgroundColor: `${resultado.cor}10` }}
                      >
                        <div className="flex items-center gap-2">
                          {resultado.erro ? (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          ) : (
                            <CreditCard
                              className="h-4 w-4"
                              style={{ color: resultado.cor }}
                            />
                          )}
                          <span className="font-medium text-sm">
                            {resultado.nomeCartao}
                          </span>
                        </div>
                        {!resultado.erro && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1.5 text-xs"
                            onClick={() =>
                              handleCopiarIndividual(
                                resultado.cartaoId,
                                resultado.mensagem
                              )
                            }
                          >
                            {copiadoId === resultado.cartaoId ? (
                              <>
                                <Check className="h-3 w-3" /> Copiado
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" /> Copiar
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Mensagem */}
                      <Textarea
                        value={resultado.mensagem}
                        readOnly
                        className="border-0 rounded-none font-mono text-xs resize-none min-h-[120px] focus-visible:ring-0"
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Botões globais */}
              {sucessos > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleCopiarTudo}
                  >
                    {copiadoTudo ? (
                      <>
                        <Check className="h-4 w-4" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Copiar Tudo
                      </>
                    )}
                  </Button>
                  <Button className="gap-2" onClick={handleWhatsApp}>
                    <MessageCircle className="h-4 w-4" /> Enviar WhatsApp
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
