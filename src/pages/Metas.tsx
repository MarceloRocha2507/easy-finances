import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  Plus,
  Calendar,
  Check,
  ChevronLeft,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useMetas } from "@/hooks/useMetas";
import { NovaMetaDialog } from "@/components/dashboard/NovaMetaDialog";
import { GerenciarMetaDialog } from "@/components/dashboard/GerenciarMetaDialog";
import { Meta } from "@/hooks/useDashboardCompleto";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Metas() {
  const { data: metas = [], isLoading, refetch } = useMetas();
  const [novaMetaOpen, setNovaMetaOpen] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState<Meta | null>(null);
  const [gerenciarMetaOpen, setGerenciarMetaOpen] = useState(false);

  // Separar metas ativas e concluídas
  const metasAtivas = metas.filter((m) => !m.concluida);
  const metasConcluidas = metas.filter((m) => m.concluida);

  // Totais
  const totalAlvo = metas.reduce((sum, m) => sum + m.valorAlvo, 0);
  const totalAtual = metas.reduce((sum, m) => sum + m.valorAtual, 0);
  const progressoGeral = totalAlvo > 0 ? (totalAtual / totalAlvo) * 100 : 0;

  function handleMetaClick(meta: Meta) {
    setMetaSelecionada(meta);
    setGerenciarMetaOpen(true);
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 fade-in">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/economia"
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Finanças
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">Objetivos</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Objetivos</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Defina e acompanhe suas metas financeiras
            </p>
          </div>
          <Button onClick={() => setNovaMetaOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Novo objetivo
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground font-medium">Total</p>
              <p className="text-2xl font-semibold mt-1">{metas.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground font-medium">Em andamento</p>
              <p className="text-2xl font-semibold mt-1">{metasAtivas.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground font-medium">Concluídos</p>
              <p className="text-2xl font-semibold mt-1">{metasConcluidas.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground font-medium">Valor acumulado</p>
              <p className="text-2xl font-semibold mt-1 value-display">
                {formatCurrency(totalAtual)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progresso Geral */}
        {metas.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Progresso geral</span>
                <span className="text-sm text-muted-foreground">
                  {progressoGeral.toFixed(0)}%
                </span>
              </div>
              <Progress value={progressoGeral} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{formatCurrency(totalAtual)} acumulado</span>
                <span>{formatCurrency(totalAlvo)} total</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="ativos">
          <TabsList>
            <TabsTrigger value="ativos">
              Em andamento ({metasAtivas.length})
            </TabsTrigger>
            <TabsTrigger value="concluidos">
              Concluídos ({metasConcluidas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ativos" className="mt-4">
            {metasAtivas.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Target className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" strokeWidth={1.5} />
                  <p className="text-muted-foreground mb-4">
                    Nenhum objetivo em andamento
                  </p>
                  <Button onClick={() => setNovaMetaOpen(true)} variant="outline" size="sm">
                    Criar primeiro objetivo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {metasAtivas.map((meta, index) => (
                  <MetaCard
                    key={meta.id}
                    meta={meta}
                    onClick={() => handleMetaClick(meta)}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="concluidos" className="mt-4">
            {metasConcluidas.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Check className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" strokeWidth={1.5} />
                  <p className="text-muted-foreground">
                    Nenhum objetivo concluído
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {metasConcluidas.map((meta, index) => (
                  <MetaCard
                    key={meta.id}
                    meta={meta}
                    onClick={() => handleMetaClick(meta)}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <NovaMetaDialog
        open={novaMetaOpen}
        onOpenChange={setNovaMetaOpen}
        onSuccess={() => refetch()}
      />

      {metaSelecionada && (
        <GerenciarMetaDialog
          meta={metaSelecionada}
          open={gerenciarMetaOpen}
          onOpenChange={setGerenciarMetaOpen}
          onSuccess={() => {
            refetch();
            setMetaSelecionada(null);
          }}
        />
      )}
    </Layout>
  );
}

/* ======================================================
   MetaCard
====================================================== */

function MetaCard({
  meta,
  onClick,
  index,
}: {
  meta: Meta;
  onClick: () => void;
  index: number;
}) {
  const diasRestantes = meta.dataLimite
    ? Math.ceil(
        (meta.dataLimite.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const faltando = Math.max(meta.valorAlvo - meta.valorAtual, 0);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all card-hover fade-in",
        meta.concluida && "bg-income/5 border-income/20"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${meta.cor}15` }}
            >
              {meta.concluida ? (
                <Check className="h-5 w-5" style={{ color: meta.cor }} strokeWidth={1.75} />
              ) : (
                <Target className="h-5 w-5" style={{ color: meta.cor }} strokeWidth={1.75} />
              )}
            </div>
            <div>
              <p className="font-medium">{meta.titulo}</p>
              {diasRestantes !== null && diasRestantes > 0 && !meta.concluida && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" />
                  {diasRestantes} dias restantes
                </p>
              )}
            </div>
          </div>

          {meta.concluida && (
            <Badge variant="secondary" className="bg-income/10 text-income border-0">
              Concluído
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{meta.progresso.toFixed(0)}%</span>
          </div>

          <Progress
            value={meta.progresso}
            className={cn("h-1.5", meta.concluida && "[&>div]:bg-income")}
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="value-display">{formatCurrency(meta.valorAtual)}</span>
            <span className="value-display">{formatCurrency(meta.valorAlvo)}</span>
          </div>

          {!meta.concluida && faltando > 0 && (
            <p className="text-xs text-muted-foreground text-right pt-1">
              Faltam {formatCurrency(faltando)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}