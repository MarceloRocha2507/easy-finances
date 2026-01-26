import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarClock,
  Calendar,
  Wallet,
  Hash,
  CreditCard,
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  List,
  LayoutList,
  Receipt,
} from "lucide-react";
import { format, addDays, addMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

import {
  useDespesasFuturas,
  calcularResumo,
  agruparPorMes,
  agruparPorCartao,
  getDefaultFiltros,
  type DespesaFutura,
  type FiltrosDespesasFuturas,
} from "@/hooks/useDespesasFuturas";
import { useCategories } from "@/hooks/useCategories";
import { useResponsaveis } from "@/services/responsaveis";
import { useCartoes } from "@/services/cartoes";
import { formatCurrency } from "@/lib/formatters";
import { FiltroDataRange } from "@/components/FiltroDataRange";

type ViewMode = "lista" | "agrupado";

export default function DespesasFuturas() {
  const defaultFiltros = getDefaultFiltros();
  const [startDate, setStartDate] = useState<Date | undefined>(defaultFiltros.dataInicio);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultFiltros.dataFim);
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [cartaoId, setCartaoId] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("lista");
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  // Atalhos específicos para despesas futuras
  const handleProximos30Dias = () => {
    const hoje = new Date();
    setStartDate(hoje);
    setEndDate(addDays(hoje, 30));
  };

  const handleProximos3Meses = () => {
    const hoje = new Date();
    setStartDate(hoje);
    setEndDate(addMonths(hoje, 3));
  };

  const handleProximos6Meses = () => {
    const hoje = new Date();
    setStartDate(hoje);
    setEndDate(addMonths(hoje, 6));
  };

  const handleProximo12Meses = () => {
    const hoje = new Date();
    setStartDate(hoje);
    setEndDate(addMonths(hoje, 12));
  };

  // Filtros
  const filtros: FiltrosDespesasFuturas = useMemo(
    () => ({
      dataInicio: startDate || new Date(),
      dataFim: endDate || addMonths(new Date(), 3),
      categoriaId: categoriaId || undefined,
      responsavelId: responsavelId || undefined,
      cartaoId: cartaoId || undefined,
      tipo: tipo || undefined,
    }),
    [startDate, endDate, categoriaId, responsavelId, cartaoId, tipo]
  );

  // Dados
  const { data: despesas, isLoading, refetch } = useDespesasFuturas(filtros);
  const { data: categorias } = useCategories();
  const { data: responsaveis } = useResponsaveis();
  const { data: cartoes } = useCartoes();

  // Resumo
  const resumo = useMemo(() => calcularResumo(despesas || []), [despesas]);

  // Agrupamento por mês
  const despesasAgrupadas = useMemo(() => agruparPorMes(despesas || []), [despesas]);

  // Resumo por cartão
  const resumoPorCartao = useMemo(
    () =>
      agruparPorCartao(
        despesas || [],
        (cartoes || []).map((c) => ({ id: c.id, nome: c.nome, cor: c.cor }))
      ),
    [despesas, cartoes]
  );

  const handleFiltrarCartao = (cartaoIdClicado: string | null) => {
    if (cartaoIdClicado === null) {
      if (cartaoId === "transacao") {
        setCartaoId("");
      } else {
        setCartaoId("transacao");
      }
    } else if (cartaoId === cartaoIdClicado) {
      setCartaoId("");
    } else {
      setCartaoId(cartaoIdClicado);
    }
  };

  const toggleMonth = (mesKey: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(mesKey)) {
        next.delete(mesKey);
      } else {
        next.add(mesKey);
      }
      return next;
    });
  };

  const formatMesLabel = (mesKey: string) => {
    const [ano, mes] = mesKey.split("-").map(Number);
    const data = new Date(ano, mes - 1, 1);
    return format(data, "MMMM 'de' yyyy", { locale: ptBR });
  };

  const limparFiltros = () => {
    setCategoriaId("");
    setResponsavelId("");
    setCartaoId("");
    setTipo("");
    setStartDate(new Date());
    setEndDate(addMonths(new Date(), 3));
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            Despesas Futuras
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize todas as despesas programadas para os próximos meses
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Total no Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-expense">
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  formatCurrency(resumo.totalPeriodo)
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Próximos 30 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  formatCurrency(resumo.proximos30Dias)
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Qtd. Despesas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Skeleton className="h-8 w-16" /> : resumo.quantidade}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo por Cartão */}
        {resumoPorCartao.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Por Cartão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {resumoPorCartao.map((item) => (
                  <button
                    key={item.cartaoId || "transacao"}
                    onClick={() => handleFiltrarCartao(item.cartaoId)}
                    className={cn(
                      "p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left",
                      (item.cartaoId === null && cartaoId === "transacao") ||
                        (item.cartaoId && cartaoId === item.cartaoId)
                        ? "ring-2 ring-primary bg-muted/30"
                        : ""
                    )}
                    style={{ borderColor: item.cartaoCor || undefined }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {item.cartaoId ? (
                        <CreditCard
                          className="h-4 w-4 shrink-0"
                          style={{ color: item.cartaoCor }}
                        />
                      ) : (
                        <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm truncate">
                        {item.cartaoNome}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-expense">
                      {formatCurrency(item.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantidade}{" "}
                      {item.quantidade === 1 ? "despesa" : "despesas"}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Linha 1: Período */}
            <div className="flex flex-wrap items-center gap-2">
              <FiltroDataRange
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onRefresh={() => refetch()}
                isLoading={isLoading}
              />
              <div className="flex gap-1 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleProximos30Dias}
                  className="text-xs px-2"
                >
                  30d
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleProximos3Meses}
                  className="text-xs px-2"
                >
                  3 meses
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleProximos6Meses}
                  className="text-xs px-2 hidden sm:inline-flex"
                >
                  6 meses
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleProximo12Meses}
                  className="text-xs px-2 hidden sm:inline-flex"
                >
                  12 meses
                </Button>
              </div>
            </div>

            {/* Linha 2: Filtros de seleção */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Categoria */}
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="sem-categoria">Sem categoria</SelectItem>
                  {categorias?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Responsável */}
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {responsaveis?.map((resp) => (
                    <SelectItem key={resp.id} value={resp.id}>
                      {resp.apelido || resp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Cartão/Origem */}
              <Select value={cartaoId} onValueChange={setCartaoId}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="transacao">Transações</SelectItem>
                  {cartoes?.map((cartao) => (
                    <SelectItem key={cartao.id} value={cartao.id}>
                      <span className="flex items-center gap-2">
                        <CreditCard
                          className="h-3 w-3"
                          style={{ color: cartao.cor }}
                        />
                        {cartao.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Tipo */}
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="parcelada">Parcelada</SelectItem>
                  <SelectItem value="fixa">Fixa/Recorrente</SelectItem>
                  <SelectItem value="unica">Única</SelectItem>
                </SelectContent>
              </Select>

              {/* Toggle de Visualização */}
              <div className="flex items-center gap-1 ml-auto border rounded-lg p-1">
                <Button
                  variant={viewMode === "lista" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("lista")}
                  className="h-7 px-2"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "agrupado" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("agrupado")}
                  className="h-7 px-2"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>

              {/* Limpar */}
              <Button variant="ghost" size="sm" onClick={limparFiltros}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela ou Agrupamento */}
        <Card>
          <CardContent className="p-0">
            {viewMode === "lista" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="hidden lg:table-cell">Origem</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}>
                          <Skeleton className="h-10 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : !despesas?.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <p className="text-muted-foreground">
                          Nenhuma despesa futura encontrada
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    despesas.map((d) => (
                      <DespesaRow key={d.id} despesa={d} />
                    ))
                  )}
                </TableBody>
              </Table>
            ) : (
              <div className="divide-y">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4">
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))
                ) : Object.keys(despesasAgrupadas).length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">
                      Nenhuma despesa futura encontrada
                    </p>
                  </div>
                ) : (
                  Object.entries(despesasAgrupadas)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([mesKey, grupo]) => {
                      const isExpanded = expandedMonths.has(mesKey);
                      return (
                        <div key={mesKey}>
                          <button
                            onClick={() => toggleMonth(mesKey)}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <span className="font-medium capitalize">
                                {formatMesLabel(mesKey)}
                              </span>
                              <Badge variant="secondary" className="ml-2">
                                {grupo.despesas.length}
                              </Badge>
                            </div>
                            <span className="font-semibold text-expense">
                              {formatCurrency(grupo.total)}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="border-t bg-muted/20">
                              <Table>
                                <TableBody>
                                  {grupo.despesas.map((d) => (
                                    <DespesaRow key={d.id} despesa={d} compact />
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

/* ======================================================
   COMPONENTE DE LINHA
====================================================== */

function DespesaRow({
  despesa,
  compact = false,
}: {
  despesa: DespesaFutura;
  compact?: boolean;
}) {
  const descricaoCompleta = despesa.parcela
    ? `${despesa.descricao} (${despesa.parcela.numero}/${despesa.parcela.total})`
    : despesa.descricao;

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-sm">{descricaoCompleta}</span>
          {/* Mobile: mostrar info extra */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground sm:hidden">
            <span>{format(despesa.dataVencimento, "dd/MM")}</span>
            {despesa.origem === "cartao" && (
              <>
                <span>•</span>
                <span>{despesa.cartaoNome}</span>
              </>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className={cn("hidden sm:table-cell", compact && "py-2")}>
        <span className="text-sm">
          {format(despesa.dataVencimento, "dd/MM/yyyy", { locale: ptBR })}
        </span>
      </TableCell>
      <TableCell className={cn("hidden md:table-cell", compact && "py-2")}>
        {despesa.categoria ? (
          <Badge
            variant="outline"
            className="text-xs"
            style={{
              borderColor: despesa.categoria.cor,
              color: despesa.categoria.cor,
            }}
          >
            {despesa.categoria.nome}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className={cn("hidden lg:table-cell", compact && "py-2")}>
        <div className="flex items-center gap-1.5 text-sm">
          {despesa.origem === "cartao" ? (
            <>
              <CreditCard
                className="h-3.5 w-3.5"
                style={{ color: "hsl(var(--primary))" }}
              />
              <span>{despesa.cartaoNome}</span>
            </>
          ) : (
            <>
              <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Transação</span>
            </>
          )}
        </div>
      </TableCell>
      <TableCell className={cn("text-right", compact && "py-2")}>
        <span className="font-semibold text-expense">
          {formatCurrency(despesa.valor)}
        </span>
      </TableCell>
    </TableRow>
  );
}
