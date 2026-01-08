import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatDateLong } from '@/lib/formatters';
import { useProfileStats } from '@/hooks/useProfileStats';

export function EstatisticasTab() {
  const stats = useProfileStats();

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

  const accountStats = [
    {
      title: 'Transações',
      value: stats.totalTransacoes,
      icon: ArrowLeftRight,
    },
    {
      title: 'Categorias',
      value: stats.totalCategorias,
      icon: Tag,
    },
    {
      title: 'Cartões',
      value: stats.totalCartoes,
      icon: CreditCard,
    },
    {
      title: 'Metas',
      value: `${stats.metasConcluidas}/${stats.totalMetas}`,
      subtitle: 'atingidas',
      icon: Target,
    },
  ];

  const getPlanoBadge = () => {
    const tipo = stats.plano.tipo;
    if (tipo === 'anual') return { label: 'Anual', variant: 'default' as const };
    if (tipo === 'mensal') return { label: 'Mensal', variant: 'secondary' as const };
    return { label: tipo || 'Mensal', variant: 'outline' as const };
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

      {/* Estatísticas da Conta */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            Estatísticas da Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {accountStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className="p-4 rounded-xl bg-secondary text-center"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
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
                <Badge variant={planoBadge.variant}>{planoBadge.label}</Badge>
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
