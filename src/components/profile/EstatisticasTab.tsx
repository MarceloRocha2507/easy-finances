import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeftRight, 
  Tag, 
  CreditCard, 
  Target,
  Crown,
  Calendar,
  CheckCircle2,
  Users
} from 'lucide-react';
import { formatCurrency, formatDateLong } from '@/lib/formatters';
import { useProfileStats } from '@/hooks/useProfileStats';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { cn } from '@/lib/utils';

export function EstatisticasTab() {
  const stats = useProfileStats();
  const { tipoPlano, limits, usage, getUsagePercentage, isLimitReached } = usePlanLimits();

  const statsCards = [
    {
      title: 'Saldo Atual',
      value: formatCurrency(stats.saldoAtual),
      icon: Wallet,
      color: stats.saldoAtual >= 0 ? 'text-income' : 'text-destructive',
      bgColor: stats.saldoAtual >= 0 ? 'bg-income/10' : 'bg-destructive/10',
    },
    {
      title: 'Receitas (mês)',
      value: formatCurrency(stats.receitasMes),
      icon: TrendingUp,
      color: 'text-income',
      bgColor: 'bg-income/10',
    },
    {
      title: 'Despesas (mês)',
      value: formatCurrency(stats.despesasMes),
      icon: TrendingDown,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  const resourceUsage = [
    {
      key: 'cartoes' as const,
      title: 'Cartões',
      icon: CreditCard,
      used: usage.cartoes,
      limit: limits.cartoes,
    },
    {
      key: 'metas' as const,
      title: 'Metas',
      icon: Target,
      used: usage.metas,
      limit: limits.metas,
    },
    {
      key: 'categorias' as const,
      title: 'Categorias',
      icon: Tag,
      used: usage.categorias,
      limit: limits.categorias,
    },
    {
      key: 'transacoesMes' as const,
      title: 'Transações (mês)',
      icon: ArrowLeftRight,
      used: usage.transacoesMes,
      limit: limits.transacoesMes,
    },
    {
      key: 'responsaveis' as const,
      title: 'Responsáveis',
      icon: Users,
      used: usage.responsaveis,
      limit: limits.responsaveis,
    },
  ];

  const getPlanoBadge = () => {
    if (tipoPlano === 'ilimitado') return { label: 'Ilimitado', variant: 'default' as const, icon: Crown };
    if (tipoPlano === 'anual') return { label: 'Anual', variant: 'default' as const, icon: Crown };
    if (tipoPlano === 'mensal') return { label: 'Mensal', variant: 'secondary' as const, icon: null };
    return { label: 'Teste', variant: 'outline' as const, icon: null };
  };

  const planoBadge = getPlanoBadge();

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Resumo Financeiro
          </CardTitle>
          <CardDescription>
            Visão geral das suas finanças
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statsCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="p-4 rounded-xl bg-secondary text-center"
                >
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center mx-auto mb-3`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Uso de Recursos por Plano */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            Uso de Recursos
          </CardTitle>
          <CardDescription>
            Acompanhe o uso dos recursos do seu plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resourceUsage.map((resource) => {
              const Icon = resource.icon;
              const percentage = getUsagePercentage(resource.key);
              const isUnlimited = resource.limit === Infinity;
              const limitHit = isLimitReached(resource.key);
              
              return (
                <div key={resource.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        limitHit ? "bg-destructive/10" : "bg-primary/10"
                      )}>
                        <Icon className={cn(
                          "w-4 h-4",
                          limitHit ? "text-destructive" : "text-primary"
                        )} />
                      </div>
                      <span className="text-sm font-medium">{resource.title}</span>
                    </div>
                    <span className={cn(
                      "text-sm font-medium",
                      limitHit ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {resource.used}{isUnlimited ? " (∞)" : `/${resource.limit}`}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <Progress 
                      value={percentage} 
                      className={cn(
                        "h-2",
                        limitHit && "[&>div]:bg-destructive",
                        percentage >= 80 && !limitHit && "[&>div]:bg-warning"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Informações do Plano */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Informações do Plano
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Tipo de Plano</p>
                <Badge variant={planoBadge.variant} className="mt-1">
                  {planoBadge.icon && <Crown className="w-3 h-3 mr-1" />}
                  {planoBadge.label}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stats.plano.ativo ? (
                <Badge variant="outline" className="bg-income/10 text-income border-income/20">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="destructive">Inativo</Badge>
              )}
            </div>
          </div>

          {stats.plano.dataExpiracao && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Válido até</p>
                <p className="font-medium text-foreground">
                  {formatDateLong(stats.plano.dataExpiracao)}
                </p>
              </div>
            </div>
          )}

          {stats.membroDesde && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Membro desde</p>
                <p className="font-medium text-foreground">
                  {formatDateLong(stats.membroDesde)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
