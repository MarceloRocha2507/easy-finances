import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import type { DadosSimulacao, ProjecaoMes } from "@/hooks/useSimuladorCompra";

interface Props {
  dados: DadosSimulacao;
  projecao: ProjecaoMes[];
  onVeredictChange?: (veredicto: string) => void;
}

type Nivel = "aprovado" | "risco" | "nao_recomendado" | null;

function detectNivel(text: string): Nivel {
  const lower = text.toLowerCase();
  if (lower.includes("❌") || lower.includes("não recomendado")) return "nao_recomendado";
  if (lower.includes("⚠️") || lower.includes("possível") || lower.includes("risco")) return "risco";
  if (lower.includes("✅") || lower.includes("consegue") || lower.includes("aprovad")) return "aprovado";
  return null;
}

const borderColors: Record<string, string> = {
  aprovado: "border-l-green-500",
  risco: "border-l-amber-500",
  nao_recomendado: "border-l-red-500",
};

export function VeredictFinaIA({ dados, projecao, onVeredictChange }: Props) {
  const [veredicto, setVeredicto] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nivel, setNivel] = useState<Nivel>(null);

  const formaLabel =
    dados.formaPagamento === "a_vista"
      ? "à vista"
      : dados.formaPagamento === "parcelado_cartao"
      ? `parcelado no cartão em ${dados.parcelas}x`
      : `boleto parcelado em ${dados.parcelas}x`;

  const analisar = async () => {
    setIsLoading(true);
    setVeredicto("");
    setNivel(null);

    const saldos = projecao.map(
      (p) => `${p.mesLabel}: ${formatCurrency(p.saldoComCompra)}`
    );

    const mesesNegativos = projecao.filter((p) => p.saldoComCompra < 0);
    const mesesAbaixoSeguranca =
      dados.valorSeguranca > 0
        ? projecao.filter(
            (p) =>
              p.saldoComCompra >= 0 &&
              p.saldoComCompra < dados.valorSeguranca
          )
        : [];

    const prompt = `Analise esta simulação de compra e dê um veredicto em português brasileiro.

Compra: ${dados.nome}
Valor: ${formatCurrency(dados.valorTotal)}
Forma: ${formaLabel}
Valor de segurança mínimo: ${formatCurrency(dados.valorSeguranca)}

Projeção de saldo dos próximos 12 meses COM a compra:
${saldos.join("\n")}

${mesesNegativos.length > 0 ? `⚠️ Meses com saldo NEGATIVO: ${mesesNegativos.map((m) => m.mesLabel).join(", ")}` : "Nenhum mês com saldo negativo."}
${mesesAbaixoSeguranca.length > 0 ? `⚠️ Meses abaixo do valor de segurança: ${mesesAbaixoSeguranca.map((m) => m.mesLabel).join(", ")}` : ""}

Responda com um dos 3 níveis:
✅ Se aprovado (saldo se mantém positivo e acima da segurança em todos os meses)
⚠️ Se possível com risco (saldo fica apertado em alguns meses)
❌ Se não recomendado (saldo ficaria negativo)

Explique de forma clara, direta e amigável em 3-5 linhas. Mencione valores e meses específicos.`;

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simulador-veredicto`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (resp.status === 429) {
        setVeredicto("⚠️ Muitas requisições. Tente novamente em alguns segundos.");
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        setVeredicto("⚠️ Créditos de IA esgotados. Adicione créditos para usar esta funcionalidade.");
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Erro na análise");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setVeredicto(fullText);
              const n = detectNivel(fullText);
              if (n) setNivel(n);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      onVeredictChange?.(fullText);
    } catch (e) {
      console.error(e);
      setVeredicto("Não foi possível gerar a análise. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      className={cn(
        "border-l-4 rounded-xl shadow-sm transition-colors",
        nivel ? borderColors[nivel] : "border-l-muted"
      )}
    >
      <CardContent className="py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 text-primary" />
            Veredicto da Fina IA
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={analisar}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {veredicto ? "Analisar novamente" : "Analisar"}
          </Button>
        </div>

        {veredicto ? (
          <div className="prose prose-sm max-w-none text-foreground">
            <ReactMarkdown>{veredicto}</ReactMarkdown>
          </div>
        ) : !isLoading ? (
          <p className="text-sm text-muted-foreground">
            Clique em "Analisar" para que a Fina IA avalie o impacto desta compra.
          </p>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analisando sua simulação...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
