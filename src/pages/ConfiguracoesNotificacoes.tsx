import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { usePreferenciasNotificacao, CATEGORIAS_ALERTAS } from "@/hooks/usePreferenciasNotificacao";
import { useTelegram } from "@/hooks/useTelegram";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw, CreditCard, Receipt, Target, PiggyBank, Users, TrendingUp, Send, Link, Unlink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const iconesPorCategoria: Record<string, React.ElementType> = {
  "credit-card": CreditCard,
  receipt: Receipt,
  target: Target,
  "piggy-bank": PiggyBank,
  users: Users,
  "trending-up": TrendingUp,
};

export default function ConfiguracoesNotificacoes() {
  const navigate = useNavigate();
  const [codigoTelegram, setCodigoTelegram] = useState("");
  const {
    isLoading,
    getPreferencia,
    salvarPreferencia,
    ativarCategoria,
    restaurarPadroes,
  } = usePreferenciasNotificacao();

  const {
    isConectado,
    isLoading: isLoadingTelegram,
    vincular,
    desvincular,
    salvarPreferencia: salvarPrefTelegram,
    getPreferenciaTelegram,
  } = useTelegram();

  const handleToggle = async (tipoAlerta: string, novoValor: boolean) => {
    try {
      await salvarPreferencia.mutateAsync({ tipoAlerta, ativo: novoValor });
      toast.success(novoValor ? "Notificação ativada" : "Notificação desativada");
    } catch (error) {
      toast.error("Erro ao salvar preferência");
    }
  };

  const handleToggleTelegram = async (tipoAlerta: string, novoValor: boolean) => {
    try {
      await salvarPrefTelegram.mutateAsync({ tipoAlerta, ativo: novoValor });
      toast.success(novoValor ? "Telegram ativado para este alerta" : "Telegram desativado para este alerta");
    } catch (error) {
      toast.error("Erro ao salvar preferência do Telegram");
    }
  };

  const handleAtivarCategoria = async (categoriaId: string) => {
    try {
      await ativarCategoria.mutateAsync(categoriaId);
      toast.success("Todas as notificações da categoria foram ativadas");
    } catch (error) {
      toast.error("Erro ao ativar categoria");
    }
  };

  const handleRestaurarPadroes = async () => {
    try {
      await restaurarPadroes.mutateAsync();
      toast.success("Preferências restauradas para o padrão");
    } catch (error) {
      toast.error("Erro ao restaurar padrões");
    }
  };

  const handleVincularTelegram = async () => {
    if (!codigoTelegram.trim()) {
      toast.error("Digite o código de vinculação");
      return;
    }
    try {
      await vincular.mutateAsync(codigoTelegram.trim());
      toast.success("Telegram vinculado com sucesso!");
      setCodigoTelegram("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao vincular Telegram");
    }
  };

  const handleDesvincularTelegram = async () => {
    try {
      await desvincular.mutateAsync();
      toast.success("Telegram desvinculado");
    } catch (error) {
      toast.error("Erro ao desvincular Telegram");
    }
  };

  if (isLoading || isLoadingTelegram) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/notificacoes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">Configurações de Notificações</h1>
            <p className="text-sm text-muted-foreground">
              Escolha quais alertas você deseja receber
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestaurarPadroes}
            disabled={restaurarPadroes.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Padrões
          </Button>
        </div>

        {/* Seção Telegram */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#0088cc]/10">
                <Send className="h-5 w-5 text-[#0088cc]" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Telegram</CardTitle>
                <CardDescription>
                  {isConectado
                    ? "✅ Conectado — receba alertas diretamente no Telegram"
                    : "Vincule sua conta para receber notificações no Telegram"}
                </CardDescription>
              </div>
              {isConectado && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDesvincularTelegram}
                  disabled={desvincular.isPending}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  {desvincular.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Unlink className="h-4 w-4 mr-2" />
                  )}
                  Desconectar
                </Button>
              )}
            </div>
          </CardHeader>
          {!isConectado && (
            <>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>1. Abra o Telegram e procure pelo seu bot</p>
                  <p>2. Envie <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">/start</code> para o bot</p>
                  <p>3. Cole o código de vinculação abaixo:</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: ABC123"
                    value={codigoTelegram}
                    onChange={(e) => setCodigoTelegram(e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                    maxLength={6}
                  />
                  <Button
                    onClick={handleVincularTelegram}
                    disabled={vincular.isPending || !codigoTelegram.trim()}
                  >
                    {vincular.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Link className="h-4 w-4 mr-2" />
                    )}
                    Vincular
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Categorias */}
        <div className="space-y-4">
          {CATEGORIAS_ALERTAS.map((categoria) => {
            const IconeCategoria = iconesPorCategoria[categoria.icone] || CreditCard;
            const todosAtivos = categoria.alertas.every((a) => getPreferencia(a.id));

            return (
              <Card key={categoria.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IconeCategoria className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{categoria.label}</CardTitle>
                        <CardDescription>
                          {categoria.alertas.length} tipo(s) de alerta
                        </CardDescription>
                      </div>
                    </div>
                    {!todosAtivos && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAtivarCategoria(categoria.id)}
                        disabled={ativarCategoria.isPending}
                      >
                        Ativar todos
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {categoria.alertas.map((alerta, index) => (
                      <div key={alerta.id}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground">
                              {alerta.label}
                            </p>
                            {!alerta.padrao && (
                              <p className="text-xs text-muted-foreground">
                                Desativado por padrão
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            {isConectado && (
                              <div className="flex items-center gap-1.5" title="Enviar no Telegram">
                                <Send className="h-3.5 w-3.5 text-[#0088cc]" />
                                <Switch
                                  checked={getPreferenciaTelegram(alerta.id)}
                                  onCheckedChange={(checked) => handleToggleTelegram(alerta.id, checked)}
                                  disabled={salvarPrefTelegram.isPending}
                                  className="data-[state=checked]:bg-[#0088cc]"
                                />
                              </div>
                            )}
                            <Switch
                              checked={getPreferencia(alerta.id)}
                              onCheckedChange={(checked) => handleToggle(alerta.id, checked)}
                              disabled={salvarPreferencia.isPending}
                            />
                          </div>
                        </div>
                        {index < categoria.alertas.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              As alterações são salvas automaticamente. Alertas desativados não aparecerão na página de notificações.
              {isConectado && " Use o ícone do Telegram ao lado de cada alerta para escolher quais enviar pelo Telegram."}
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
