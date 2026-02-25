import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCardMinimal } from "@/components/dashboard/StatCardMinimal";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Target,
  Plus,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useMetas, Meta } from "@/hooks/useMetas";
import { NovaMetaDialog } from "@/components/dashboard/NovaMetaDialog";
import { GerenciarMetaDialog } from "@/components/dashboard/GerenciarMetaDialog";
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
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 page-enter">
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
            <h1 className="text-xl font-semibold text-foreground">Objetivos</h1>
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
        <div className="grid gap-3 md:grid-cols-4">
          <StatCardMinimal
            title="Total"
            value={metas.length}
            icon={Target}
            delay={0}
            formatValue={(v) => v.toString()}
            subInfo={<span className="text-xs text-muted-foreground">objetivos</span>}
          />
          <StatCardMinimal
            title="Em andamento"
            value={metasAtivas.length}
            icon={Clock}
            formatValue={(v) => v.toString()}
            delay={0.05}
          />
          <StatCardMinimal
            title="Concluídos"
            value={metasConcluidas.length}
            icon={Check}
            formatValue={(v) => v.toString()}
            delay={0.1}
          />
          <StatCardMinimal
            title="Valor acumulado"
            value={totalAtual}
            icon={Wallet}
            delay={0.15}
          />
        </div>

        {/* Progresso Geral */}
        {metas.length > 0 && (
          <Card className="rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <CardContent className="p-6">
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
          <TabsList className="w-full justify-start border-b bg-transparent p-0 h-auto">
            <TabsTrigger value="ativos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5">
              Em andamento ({metasAtivas.length})
            </TabsTrigger>
            <TabsTrigger value="concluidos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5">
              Concluídos ({metasConcluidas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ativos" className="mt-4">
            {metasAtivas.length === 0 ? (
              <EmptyState
                icon={Target}
                message="Nenhum objetivo em andamento"
                action={{ label: "Criar primeiro objetivo", onClick: () => setNovaMetaOpen(true) }}
              />
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
              <EmptyState
                icon={Check}
                message="Nenhum objetivo concluído"
              />
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
        "cursor-pointer transition-all rounded-xl card-hover fade-in border border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-muted">
              {meta.concluida ? (
                <Check className="h-6 w-6 text-muted-foreground" strokeWidth={1.75} />
              ) : (
                <Target className="h-6 w-6 text-muted-foreground" strokeWidth={1.75} />
              )}
            </div>
            <div>
              <p className="font-semibold">{meta.titulo}</p>
              {diasRestantes !== null && diasRestantes > 0 && !meta.concluida && (
                <p className="text-xs text-muted-foreground items-center gap-1 mt-0.5 hidden sm:flex">
                  <Calendar className="h-3 w-3" />
                  {diasRestantes} dias restantes
                </p>
              )}
            </div>
          </div>

          {meta.concluida && (
            <Badge variant="secondary" className="text-xs">
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
            <p className="text-xs text-muted-foreground text-right pt-1 hidden sm:block">
              Faltam {formatCurrency(faltando)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
