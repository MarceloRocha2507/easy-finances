import { useState, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { gerarMensagemFatura } from "@/services/compras-cartao";
import { CartaoComResumo } from "@/services/cartoes";
import { useResponsaveis } from "@/services/responsaveis";
import {
  Copy,
  Check,
  FileText,
  MessageCircle,
  CreditCard,
  AlertCircle,
  ArrowLeft,
  Users,
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

type Etapa = "selecao" | "resultado";

export function GerarMensagensLoteDialog({
  cartoes,
  mesReferencia,
  open,
  onOpenChange,
}: Props) {
  const { toast } = useToast();
  const { data: responsaveis = [] } = useResponsaveis();
  const [etapa, setEtapa] = useState<Etapa>("selecao");
  const [cartoesSelecionados, setCartoesSelecionados] = useState<Set<string>>(new Set());
  const [responsavelId, setResponsavelId] = useState("todos");
  const [resultados, setResultados] = useState<ResultadoCartao[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiadoTudo, setCopiadoTudo] = useState(false);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setEtapa("selecao");
    setCartoesSelecionados(new Set());
    setResponsavelId("todos");
    setResultados([]);
    setLoading(false);
    setCopiadoTudo(false);
    setCopiadoId(null);
  }, []);

  const handleOpenChange = (value: boolean) => {
    if (!value) resetState();
    onOpenChange(value);
  };

  const toggleCartao = (id: string) => {
    setCartoesSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (cartoesSelecionados.size === cartoes.length) {
      setCartoesSelecionados(new Set());
    } else {
      setCartoesSelecionados(new Set(cartoes.map((c) => c.id)));
    }
  };

  const handleGerar = async () => {
    setEtapa("resultado");
    setLoading(true);
    setResultados([]);

    const selecionados = cartoes.filter((c) => cartoesSelecionados.has(c.id));
    const respId = responsavelId === "todos" ? null : responsavelId;
    const formato = responsavelId === "todos" ? "todos" : "detalhado";

    const promises = selecionados.map(async (cartao) => {
      try {
        const msg = await gerarMensagemFatura(cartao.id, mesReferencia, respId, formato as any);
        return { cartaoId: cartao.id, nomeCartao: cartao.nome, cor: cartao.cor || "#6366f1", mensagem: msg, erro: false } as ResultadoCartao;
      } catch {
        return { cartaoId: cartao.id, nomeCartao: cartao.nome, cor: cartao.cor || "#6366f1", mensagem: "Erro ao gerar mensagem", erro: true } as ResultadoCartao;
      }
    });

    const results = await Promise.allSettled(promises);
    const mapped = results.map((r) =>
      r.status === "fulfilled" ? r.value : { cartaoId: "", nomeCartao: "Erro", cor: "#ef4444", mensagem: "Falha inesperada", erro: true } as ResultadoCartao
    );

    // Filtrar cartões sem despesas (mensagem vazia)
    const comDespesas = mapped.filter((r) => !r.erro && r.mensagem.trim() !== "");
    const semDespesas = mapped.filter((r) => !r.erro && r.mensagem.trim() === "");
    // Manter apenas os com despesas + erros
    setResultados([...comDespesas, ...mapped.filter((r) => r.erro)]);
    setLoading(false);
  };

  const resultadosComMensagem = resultados.filter((r) => !r.erro && r.mensagem.trim() !== "");

  const mensagemConsolidada = resultadosComMensagem
    .map((r) => r.mensagem)
    .join("\n\n---\n\n");

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

  const nomeMes = mesReferencia.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const sucessos = resultadosComMensagem.length;
  const todosChecked = cartoesSelecionados.size === cartoes.length && cartoes.length > 0;
  const algunsChecked = cartoesSelecionados.size > 0 && !todosChecked;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Mensagens em Lote
          </DialogTitle>
          <DialogDescription>
            {etapa === "selecao"
              ? `Selecione os cartões e o responsável — ${nomeMes}`
              : loading
                ? `Gerando mensagens de ${cartoesSelecionados.size} cartão(ões)...`
                : `${sucessos} de ${cartoesSelecionados.size} cartão(ões) com despesas — ${nomeMes}`}
          </DialogDescription>
        </DialogHeader>

        {etapa === "selecao" ? (
          <div className="space-y-4 py-2">
            {/* Responsável selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Responsável
              </label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os responsáveis</SelectItem>
                  {responsaveis
                    .filter((r) => r.ativo)
                    .map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.apelido || r.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selecionar todos */}
            <div className="flex items-center justify-between border-b pb-2">
              <label
                className="flex items-center gap-2 cursor-pointer text-sm font-medium"
                onClick={toggleTodos}
              >
                <Checkbox
                  checked={todosChecked}
                  {...(algunsChecked ? { "data-state": "indeterminate" } : {})}
                  onCheckedChange={toggleTodos}
                />
                Selecionar todos
              </label>
              <span className="text-xs text-muted-foreground">
                {cartoesSelecionados.size} de {cartoes.length} selecionado(s)
              </span>
            </div>

            {/* Lista de cartões */}
            <ScrollArea className="max-h-[40vh]">
              <div className="space-y-1 pr-3">
                {cartoes.map((cartao) => (
                  <label
                    key={cartao.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={cartoesSelecionados.has(cartao.id)}
                      onCheckedChange={() => toggleCartao(cartao.id)}
                    />
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cartao.cor || "#6366f1" }}
                    />
                    <span className="text-sm">{cartao.nome}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>

            {/* Botão gerar */}
            <Button
              className="w-full gap-2"
              disabled={cartoesSelecionados.size === 0}
              onClick={handleGerar}
            >
              <FileText className="h-4 w-4" />
              Gerar {cartoesSelecionados.size > 0 ? `${cartoesSelecionados.size} Mensagem(ns)` : "Mensagens"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {loading ? (
              <div className="space-y-4">
                {cartoes
                  .filter((c) => cartoesSelecionados.has(c.id))
                  .map((c) => (
                    <div key={c.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.cor || "#6366f1" }} />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ))}
              </div>
            ) : resultados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-3">
                <AlertCircle className="h-10 w-10" />
                <p className="text-sm font-medium">Nenhum cartão possui despesas neste mês</p>
                <Button variant="ghost" className="gap-2" onClick={() => setEtapa("selecao")}>
                  <ArrowLeft className="h-4 w-4" /> Voltar à seleção
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="max-h-[50vh]">
                  <div className="space-y-4 pr-3">
                    {resultados.map((resultado) => (
                      <div key={resultado.cartaoId} className="rounded-xl border overflow-hidden">
                        <div
                          className="flex items-center justify-between px-4 py-2.5"
                          style={{ backgroundColor: `${resultado.cor}10` }}
                        >
                          <div className="flex items-center gap-2">
                            {resultado.erro ? (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            ) : (
                              <CreditCard className="h-4 w-4" style={{ color: resultado.cor }} />
                            )}
                            <span className="font-medium text-sm">{resultado.nomeCartao}</span>
                          </div>
                          {!resultado.erro && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1.5 text-xs"
                              onClick={() => handleCopiarIndividual(resultado.cartaoId, resultado.mensagem)}
                            >
                              {copiadoId === resultado.cartaoId ? (
                                <><Check className="h-3 w-3" /> Copiado</>
                              ) : (
                                <><Copy className="h-3 w-3" /> Copiar</>
                              )}
                            </Button>
                          )}
                        </div>
                        <Textarea
                          value={resultado.mensagem}
                          readOnly
                          className="border-0 rounded-none font-mono text-xs resize-none min-h-[120px] focus-visible:ring-0"
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {sucessos > 0 && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button variant="outline" className="gap-2" onClick={handleCopiarTudo}>
                      {copiadoTudo ? <><Check className="h-4 w-4" /> Copiado!</> : <><Copy className="h-4 w-4" /> Copiar Tudo</>}
                    </Button>
                    <Button className="gap-2" onClick={handleWhatsApp}>
                      <MessageCircle className="h-4 w-4" /> Enviar WhatsApp
                    </Button>
                  </div>
                )}

                <Button
                  variant="ghost"
                  className="w-full gap-2"
                  onClick={() => setEtapa("selecao")}
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar à seleção
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
