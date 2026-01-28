import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Chip } from "@/components/ui/chip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Layers, Calendar, TrendingUp, CreditCard, LayoutGrid, LayoutList } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCartoes } from "@/services/cartoes";
import { useResponsaveis } from "@/services/responsaveis";
import { formatCurrency } from "@/lib/formatters";
import { addMonths, format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Parcelamento {
  id: string;
  descricao: string;
  valorTotal: number;
  valorParcela: number;
  totalParcelas: number;
  parcelasPagas: number;
  parcelasRestantes: number;
  cartaoNome: string;
  cartaoId: string;
  cartaoCor: string;
  responsavelNome: string | null;
  proximaParcela: Date | null;
  tipo: "parcelado" | "fixo" | "recorrente";
}

interface TimelineMonth {
  date: Date;
  label: string;
  parcelas: { id: string; descricao: string; valor: number; cartaoCor: string }[];
  total: number;
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  suffix, 
  gradient 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  suffix?: string; 
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex-1 min-w-[160px] rounded-xl p-4 ${gradient}`}
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold animate-count-up">{value}</span>
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
    </motion.div>
  );
}

function TimelineView({ months }: { months: TimelineMonth[] }) {
  const maxTotal = Math.max(...months.map(m => m.total), 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border bg-card overflow-hidden"
    >
      <div className="p-4 border-b">
        <h3 className="font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Projeção de Gastos
        </h3>
      </div>
      <div className="flex overflow-x-auto">
        {months.map((month, index) => {
          const heightPercent = (month.total / maxTotal) * 100;
          
          return (
            <TooltipProvider key={month.label}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="timeline-column flex flex-col items-center cursor-pointer"
                  >
                    <span className="text-xs font-medium text-muted-foreground mb-2">
                      {month.label}
                    </span>
                    
                    {/* Bar chart */}
                    <div className="relative h-24 w-8 bg-muted/50 rounded-full overflow-hidden mb-2">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ delay: 0.3 + index * 0.05, duration: 0.5, ease: "easeOut" }}
                        className="absolute bottom-0 w-full rounded-full bg-gradient-to-t from-primary to-primary/60"
                      />
                    </div>

                    {/* Dots for parcelas */}
                    <div className="flex flex-wrap gap-0.5 justify-center max-w-[40px] mb-2">
                      {month.parcelas.slice(0, 6).map((p, i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: p.cartaoCor || 'hsl(var(--primary))' }}
                        />
                      ))}
                      {month.parcelas.length > 6 && (
                        <span className="text-[10px] text-muted-foreground">+{month.parcelas.length - 6}</span>
                      )}
                    </div>

                    <span className="text-xs font-semibold">
                      {formatCurrency(month.total)}
                    </span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium mb-1">{month.parcelas.length} parcelas</p>
                  {month.parcelas.slice(0, 5).map((p, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      • {p.descricao}: {formatCurrency(p.valor)}
                    </p>
                  ))}
                  {month.parcelas.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      + {month.parcelas.length - 5} mais...
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </motion.div>
  );
}

function ParcelamentoCard({ 
  parcelamento, 
  index 
}: { 
  parcelamento: Parcelamento; 
  index: number;
}) {
  const percentual = parcelamento.totalParcelas > 0
    ? (parcelamento.parcelasPagas / parcelamento.totalParcelas) * 100
    : 0;

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "fixo":
        return <Badge variant="secondary" className="text-xs">Fixo</Badge>;
      case "recorrente":
        return <Badge variant="outline" className="text-xs">Recorrente</Badge>;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      className="group"
    >
      <Card className="relative overflow-hidden transition-shadow duration-200 hover:shadow-md">
        {/* Color bar */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: parcelamento.cartaoCor || 'hsl(var(--primary))' }}
        />
        
        <CardContent className="p-4 pl-5">
          <div className="flex items-start gap-4">
            {/* Circular Progress */}
            <div className="flex-shrink-0">
              <CircularProgress 
                value={percentual} 
                size={56} 
                strokeWidth={5}
                showValue
                indicatorClassName={parcelamento.tipo === "fixo" ? "stroke-warning" : ""}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium truncate">{parcelamento.descricao}</h3>
                {getTipoBadge(parcelamento.tipo)}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <CreditCard className="h-3 w-3" />
                <span>{parcelamento.cartaoNome}</span>
                {parcelamento.responsavelNome && (
                  <>
                    <span>•</span>
                    <span>{parcelamento.responsavelNome}</span>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-semibold">
                    {formatCurrency(parcelamento.valorParcela)}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                
                {parcelamento.tipo === "parcelado" && (
                  <span className="text-sm text-muted-foreground">
                    {parcelamento.parcelasPagas}/{parcelamento.totalParcelas} pagas
                  </span>
                )}
              </div>

              {parcelamento.parcelasRestantes > 0 && parcelamento.tipo === "parcelado" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Restante: {formatCurrency(parcelamento.valorParcela * parcelamento.parcelasRestantes)}
                </p>
              )}
            </div>
          </div>

          {/* Hover actions */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Badge variant="outline" className="text-xs bg-background">
              {parcelamento.proximaParcela 
                ? format(parcelamento.proximaParcela, "MMM/yy", { locale: ptBR })
                : "—"
              }
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Parcelamentos() {
  const [filtroCartao, setFiltroCartao] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: cartoes = [], isLoading: cartoesLoading } = useCartoes();
  const { data: responsaveis = [] } = useResponsaveis();

  const { data: parcelamentos = [], isLoading } = useQuery({
    queryKey: ["parcelamentos-ativos"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: compras, error } = await supabase
        .from("compras_cartao")
        .select(`
          id,
          descricao,
          valor_total,
          parcelas,
          tipo_lancamento,
          cartao_id,
          responsavel_id,
          cartoes!inner(id, nome, cor),
          responsaveis(id, nome, apelido)
        `)
        .eq("user_id", user.id)
        .or("parcelas.gt.1,tipo_lancamento.eq.fixa");

      if (error) throw error;

      const result: Parcelamento[] = [];

      for (const compra of compras || []) {
        const { data: parcelas } = await supabase
          .from("parcelas_cartao")
          .select("id, numero_parcela, paga, mes_referencia, valor, total_parcelas")
          .eq("compra_id", compra.id)
          .eq("ativo", true)
          .order("mes_referencia", { ascending: true });

        const parcelasPagas = parcelas?.filter((p) => p.paga).length || 0;
        const parcelasRestantes = (parcelas?.length || 0) - parcelasPagas;
        const proximaParcela = parcelas?.find((p) => !p.paga);
        const valorParcela = parcelas?.[0]?.valor || (compra.valor_total / compra.parcelas);

        if (parcelasRestantes === 0 && compra.tipo_lancamento === "parcelada") continue;

        const tipoMapeado = compra.tipo_lancamento === "fixa" ? "fixo" 
          : compra.tipo_lancamento === "parcelada" ? "parcelado" 
          : "parcelado";

        result.push({
          id: compra.id,
          descricao: compra.descricao,
          valorTotal: compra.valor_total,
          valorParcela,
          totalParcelas: parcelas?.length || compra.parcelas,
          parcelasPagas,
          parcelasRestantes,
          cartaoNome: (compra.cartoes as any)?.nome || "Cartão",
          cartaoId: compra.cartao_id,
          cartaoCor: (compra.cartoes as any)?.cor || "#6366f1",
          responsavelNome: (compra.responsaveis as any)?.apelido || (compra.responsaveis as any)?.nome || null,
          proximaParcela: proximaParcela ? new Date(proximaParcela.mes_referencia) : null,
          tipo: tipoMapeado as "parcelado" | "fixo" | "recorrente",
        });
      }

      return result.sort((a, b) => {
        if (!a.proximaParcela) return 1;
        if (!b.proximaParcela) return -1;
        return a.proximaParcela.getTime() - b.proximaParcela.getTime();
      });
    },
  });

  const parcelamentosFiltrados = useMemo(() => {
    return parcelamentos.filter((p) => {
      if (filtroCartao !== "todos" && p.cartaoId !== filtroCartao) return false;
      if (filtroTipo !== "todos" && p.tipo !== filtroTipo) return false;
      return true;
    });
  }, [parcelamentos, filtroCartao, filtroTipo]);

  const totais = useMemo(() => {
    const totalRestante = parcelamentosFiltrados.reduce(
      (acc, p) => acc + p.valorParcela * p.parcelasRestantes,
      0
    );
    const totalMensal = parcelamentosFiltrados.reduce((acc, p) => acc + p.valorParcela, 0);
    return { totalRestante, totalMensal, quantidade: parcelamentosFiltrados.length };
  }, [parcelamentosFiltrados]);

  // Generate timeline data for next 6 months
  const timelineData = useMemo((): TimelineMonth[] => {
    const months: TimelineMonth[] = [];
    const today = startOfMonth(new Date());

    for (let i = 0; i < 6; i++) {
      const monthDate = addMonths(today, i);
      const monthParcelas: TimelineMonth["parcelas"] = [];
      let total = 0;

      for (const p of parcelamentosFiltrados) {
        if (p.tipo === "fixo" || (p.proximaParcela && p.parcelasRestantes > i)) {
          monthParcelas.push({
            id: p.id,
            descricao: p.descricao,
            valor: p.valorParcela,
            cartaoCor: p.cartaoCor,
          });
          total += p.valorParcela;
        }
      }

      months.push({
        date: monthDate,
        label: format(monthDate, "MMM", { locale: ptBR }),
        parcelas: monthParcelas,
        total,
      });
    }

    return months;
  }, [parcelamentosFiltrados]);

  if (isLoading || cartoesLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 flex-1" />
            ))}
          </div>
          <Skeleton className="h-48" />
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Parcelamentos</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Visualize e acompanhe todos os seus parcelamentos
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-background/50"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-background/50"
              }`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Filters with Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          <Chip 
            active={filtroCartao === "todos"} 
            onClick={() => setFiltroCartao("todos")}
          >
            Todos cartões
          </Chip>
          {cartoes.map((c) => (
            <Chip
              key={c.id}
              active={filtroCartao === c.id}
              color={c.cor}
              onClick={() => setFiltroCartao(c.id)}
            >
              {c.nome}
            </Chip>
          ))}
          
          <div className="w-px h-6 bg-border mx-2 self-center" />
          
          <Chip
            active={filtroTipo === "todos"}
            onClick={() => setFiltroTipo("todos")}
          >
            Todos tipos
          </Chip>
          <Chip
            active={filtroTipo === "parcelado"}
            onClick={() => setFiltroTipo("parcelado")}
          >
            Parcelado
          </Chip>
          <Chip
            active={filtroTipo === "fixo"}
            onClick={() => setFiltroTipo("fixo")}
          >
            Fixo
          </Chip>
        </motion.div>

        {/* Stats Ribbon */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          <StatCard
            icon={Layers}
            label="Parcelamentos"
            value={totais.quantidade}
            suffix="ativos"
            gradient="stat-violet"
          />
          <StatCard
            icon={Calendar}
            label="Compromisso"
            value={formatCurrency(totais.totalMensal)}
            suffix="/mês"
            gradient="stat-emerald"
          />
          <StatCard
            icon={TrendingUp}
            label="Total Restante"
            value={formatCurrency(totais.totalRestante)}
            gradient="stat-amber"
          />
        </div>

        {/* Timeline */}
        <TimelineView months={timelineData} />

        {/* Parcelamentos Grid/List */}
        <AnimatePresence mode="wait">
          {parcelamentosFiltrados.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card>
                <CardContent className="py-16 text-center">
                  <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Nenhum parcelamento ativo</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Adicione compras parceladas para visualizá-las aqui
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={
                viewMode === "grid"
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                  : "space-y-3"
              }
            >
              {parcelamentosFiltrados.map((parc, index) => (
                <ParcelamentoCard
                  key={parc.id}
                  parcelamento={parc}
                  index={index}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
