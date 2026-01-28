import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { usePreferenciasNotificacao, CATEGORIAS_ALERTAS } from "@/hooks/usePreferenciasNotificacao";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw, CreditCard, Receipt, Target, PiggyBank, Users, TrendingUp } from "lucide-react";
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
  const {
    isLoading,
    getPreferencia,
    salvarPreferencia,
    ativarCategoria,
    restaurarPadroes,
  } = usePreferenciasNotificacao();

  const handleToggle = async (tipoAlerta: string, novoValor: boolean) => {
    try {
      await salvarPreferencia.mutateAsync({ tipoAlerta, ativo: novoValor });
      toast.success(novoValor ? "Notificação ativada" : "Notificação desativada");
    } catch (error) {
      toast.error("Erro ao salvar preferência");
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

  if (isLoading) {
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
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-foreground">
                              {alerta.label}
                            </p>
                            {!alerta.padrao && (
                              <p className="text-xs text-muted-foreground">
                                Desativado por padrão
                              </p>
                            )}
                          </div>
                          <Switch
                            checked={getPreferencia(alerta.id)}
                            onCheckedChange={(checked) => handleToggle(alerta.id, checked)}
                            disabled={salvarPreferencia.isPending}
                          />
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
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
