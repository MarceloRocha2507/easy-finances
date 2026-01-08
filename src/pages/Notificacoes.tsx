import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useNotificacoes, NotificacaoComStatus } from "@/hooks/useNotificacoes";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Check,
  X,
  Bell,
  BellOff,
} from "lucide-react";

type TabStatus = "todas" | "nao_lidas" | "lidas";

const tipoConfig = {
  danger: {
    icon: AlertCircle,
    bgColor: "bg-expense/10",
    textColor: "text-expense",
    borderColor: "border-expense/20",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-500",
    borderColor: "border-amber-500/20",
  },
  info: {
    icon: Info,
    bgColor: "bg-primary/10",
    textColor: "text-primary",
    borderColor: "border-primary/20",
  },
  success: {
    icon: CheckCircle2,
    bgColor: "bg-income/10",
    textColor: "text-income",
    borderColor: "border-income/20",
  },
};

export default function Notificacoes() {
  const [tab, setTab] = useState<TabStatus>("todas");
  const {
    notificacoes,
    isLoading,
    marcarComoLido,
    marcarComoNaoLido,
    marcarTodosComoLidos,
    naoLidas,
  } = useNotificacoes();

  const filtrarPorTab = (n: NotificacaoComStatus) => {
    if (tab === "nao_lidas") return !n.lido;
    if (tab === "lidas") return n.lido;
    return true;
  };

  const notificacoesFiltradas = notificacoes.filter(filtrarPorTab);

  const handleToggleLido = (notificacao: NotificacaoComStatus) => {
    if (notificacao.lido) {
      marcarComoNaoLido.mutate(notificacao.id);
    } else {
      marcarComoLido.mutate(notificacao.id);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe seus alertas e avisos importantes
            </p>
          </div>
          {naoLidas > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => marcarTodosComoLidos.mutate()}
              disabled={marcarTodosComoLidos.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              Marcar todos como lidos
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabStatus)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="todas" className="gap-2">
              Todas
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {notificacoes.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="nao_lidas" className="gap-2">
              Não Lidas
              {naoLidas > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-xs bg-expense">
                  {naoLidas}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="lidas">Lidas</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : notificacoesFiltradas.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <BellOff className="h-12 w-12 text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground font-medium">
                    {tab === "nao_lidas"
                      ? "Nenhuma notificação não lida"
                      : tab === "lidas"
                      ? "Nenhuma notificação lida"
                      : "Nenhuma notificação"}
                  </p>
                  <p className="text-sm text-muted-foreground/60 mt-1">
                    Quando houver alertas importantes, eles aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              notificacoesFiltradas.map((notificacao, index) => {
                const config = tipoConfig[notificacao.tipo];
                const Icon = config.icon;

                return (
                  <Card
                    key={notificacao.id}
                    className={cn(
                      "transition-all duration-300 border-l-4",
                      config.borderColor,
                      notificacao.lido && "opacity-60"
                    )}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <CardContent className="flex items-start gap-4 p-4">
                      <div
                        className={cn(
                          "flex-shrink-0 p-2 rounded-full",
                          config.bgColor
                        )}
                      >
                        <Icon className={cn("h-5 w-5", config.textColor)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={cn(
                              "font-medium text-foreground",
                              notificacao.lido && "text-muted-foreground"
                            )}
                          >
                            {notificacao.titulo}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0 h-8 px-2"
                            onClick={() => handleToggleLido(notificacao)}
                            disabled={
                              marcarComoLido.isPending ||
                              marcarComoNaoLido.isPending
                            }
                          >
                            {notificacao.lido ? (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                <span className="text-xs">Não lido</span>
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                <span className="text-xs">Lido</span>
                              </>
                            )}
                          </Button>
                        </div>
                        <p
                          className={cn(
                            "text-sm mt-1",
                            notificacao.lido
                              ? "text-muted-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {notificacao.mensagem}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
