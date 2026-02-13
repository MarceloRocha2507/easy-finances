import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Bot, User, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
const EXPIRY_MS = 20 * 60 * 1000;

const SUGGESTIONS = [
  "Qual meu saldo atual?",
  "Quanto gastei este mês?",
  "Como estão minhas metas?",
  "Resuma minhas finanças",
];

export default function Assistente() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamStarted, setStreamStarted] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // 20-minute inactivity expiration
  useEffect(() => {
    if (messages.length === 0) return;
    const interval = setInterval(() => {
      if (Date.now() - lastActivity > EXPIRY_MS) {
        setMessages([]);
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [lastActivity, messages.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const clearChat = () => {
    setMessages([]);
    setLastActivity(Date.now());
  };

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading || !session) return;

    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setStreamStarted(false);
    setLastActivity(Date.now());

    if (inputRef.current) inputRef.current.style.height = "auto";

    let assistantSoFar = "";
    const allMessages = [...messages, userMsg];

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: allMessages.map((m) => ({ role: m.role, content: m.content })) }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ ${err.error || "Erro ao consultar IA. Tente novamente."}` }]);
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              if (!streamStarted) setStreamStarted(true);
              assistantSoFar += content;
              const snapshot = assistantSoFar;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length > allMessages.length) {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: snapshot } : m));
                }
                return [...prev, { role: "assistant", content: snapshot }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const c = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (c) {
              assistantSoFar += c;
              const snapshot = assistantSoFar;
              setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: snapshot } : m)));
            }
          } catch { /* ignore */ }
        }
      }

      if (!assistantSoFar) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Não consegui gerar uma resposta. Tente novamente." }]);
      }
    } catch (e) {
      console.error("AI chat error:", e);
      setMessages((prev) => [...prev, { role: "assistant", content: "❌ Erro de conexão. Tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!session) return null;

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen max-w-3xl mx-auto -m-6">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">Fina IA</h1>
            <p className="text-xs text-muted-foreground">Assistente financeiro inteligente</p>
          </div>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Nova conversa
            </Button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-primary opacity-60" />
              </div>
              <p className="text-lg font-semibold text-foreground">Olá! Sou o Fina 👋</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                Pergunte qualquer coisa sobre suas finanças!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-left px-4 py-3 rounded-xl border border-border text-sm hover:bg-muted/50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm break-words leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-code:text-xs prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && !streamStarted && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border px-6 py-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre suas finanças..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-h-[120px] overflow-y-auto"
            />
            <Button
              size="icon"
              onClick={() => send()}
              disabled={!input.trim() || isLoading}
              className="rounded-xl h-11 w-11 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
