import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, CreditCard, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCartoes } from "@/services/cartoes";
import { useResponsaveis } from "@/services/responsaveis";
import { formatCurrency } from "@/lib/formatters";

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
  responsavelNome: string | null;
  proximaParcela: Date | null;
  tipo: "parcelado" | "fixo" | "recorrente";
}

function monthLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

export default function Parcelamentos() {
  const [filtroCartao, setFiltroCartao] = useState<string>("todos");
  const [filtroResponsavel, setFiltroResponsavel] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  const { data: cartoes = [], isLoading: cartoesLoading } = useCartoes();
  const { data: responsaveis = [] } = useResponsaveis();

  const { data: parcelamentos = [], isLoading } = useQuery({
    queryKey: ["parcelamentos-ativos"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Buscar compras com mais de 1 parcela ou que são fixas/recorrentes
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
          cartoes!inner(id, nome),
          responsaveis(id, nome, apelido)
        `)
        .eq("user_id", user.id)
        .or("parcelas.gt.1,tipo_lancamento.eq.fixa");

      if (error) throw error;

      // Para cada compra, buscar status das parcelas
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

        // Pular se não tem parcelas restantes (já finalizou)
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
      if (filtroResponsavel !== "todos" && p.responsavelNome !== filtroResponsavel) return false;
      if (filtroTipo !== "todos" && p.tipo !== filtroTipo) return false;
      return true;
    });
  }, [parcelamentos, filtroCartao, filtroResponsavel, filtroTipo]);

  const totais = useMemo(() => {
    const totalRestante = parcelamentosFiltrados.reduce(
      (acc, p) => acc + p.valorParcela * p.parcelasRestantes,
      0
    );
    const totalMensal = parcelamentosFiltrados.reduce((acc, p) => acc + p.valorParcela, 0);
    return { totalRestante, totalMensal, quantidade: parcelamentosFiltrados.length };
  }, [parcelamentosFiltrados]);

  if (isLoading || cartoesLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "fixo":
        return <Badge variant="secondary">Fixo</Badge>;
      case "recorrente":
        return <Badge variant="outline">Recorrente</Badge>;
      default:
        return <Badge>Parcelado</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Parcelamentos</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Acompanhe todos os parcelamentos ativos
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <Select value={filtroCartao} onValueChange={setFiltroCartao}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Cartão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos cartões</SelectItem>
              {cartoes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroResponsavel} onValueChange={setFiltroResponsavel}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {responsaveis.map((r) => (
                <SelectItem key={r.id} value={r.apelido || r.nome}>
                  {r.apelido || r.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos tipos</SelectItem>
              <SelectItem value="parcelado">Parcelado</SelectItem>
              <SelectItem value="fixo">Fixo</SelectItem>
              <SelectItem value="recorrente">Recorrente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Parcelamentos Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totais.quantidade}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Compromisso Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totais.totalMensal)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total a Pagar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-warning">{formatCurrency(totais.totalRestante)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de parcelamentos */}
        <div className="space-y-3">
          {parcelamentosFiltrados.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Layers className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Nenhum parcelamento ativo</p>
              </CardContent>
            </Card>
          ) : (
            parcelamentosFiltrados.map((parc, index) => {
              const percentual = parc.totalParcelas > 0
                ? (parc.parcelasPagas / parc.totalParcelas) * 100
                : 0;

              return (
                <Card
                  key={parc.id}
                  className="fade-in"
                  style={{ animationDelay: `${index * 0.03}s` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{parc.descricao}</p>
                          {getTipoBadge(parc.tipo)}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {parc.cartaoNome}
                          </span>
                          {parc.responsavelNome && (
                            <span>• {parc.responsavelNome}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(parc.valorParcela)}/mês</p>
                        <p className="text-xs text-muted-foreground">
                          Total: {formatCurrency(parc.valorTotal)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {parc.tipo === "parcelado" 
                            ? `${parc.parcelasPagas}/${parc.totalParcelas} parcelas pagas`
                            : "Despesa contínua"
                          }
                        </span>
                        {parc.proximaParcela && (
                          <span>Próxima: {monthLabel(parc.proximaParcela)}</span>
                        )}
                      </div>
                      {parc.tipo === "parcelado" && (
                        <Progress value={percentual} className="h-2" />
                      )}
                      {parc.parcelasRestantes > 0 && parc.tipo === "parcelado" && (
                        <p className="text-xs text-muted-foreground">
                          Restante: {formatCurrency(parc.valorParcela * parc.parcelasRestantes)} 
                          ({parc.parcelasRestantes} {parc.parcelasRestantes === 1 ? "parcela" : "parcelas"})
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
