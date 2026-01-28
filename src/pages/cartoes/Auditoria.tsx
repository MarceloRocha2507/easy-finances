import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  History,
  Plus,
  Pencil,
  Trash2,
  CreditCard,
  Layers,
  CalendarIcon,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { useAuditoria, useEstatisticasAuditoria, type RegistroAuditoria } from "@/hooks/useAuditoria";
import { DetalhesAuditoriaDialog } from "@/components/cartoes/DetalhesAuditoriaDialog";

const POR_PAGINA = 15;

const acaoConfig = {
  INSERT: { label: "Inserção", icon: Plus, className: "bg-income/10 text-income border-income/20" },
  UPDATE: { label: "Atualização", icon: Pencil, className: "bg-warning/10 text-warning border-warning/20" },
  DELETE: { label: "Exclusão", icon: Trash2, className: "bg-expense/10 text-expense border-expense/20" },
};

const tabelaConfig = {
  compras_cartao: { label: "Compra", icon: CreditCard },
  parcelas_cartao: { label: "Parcela", icon: Layers },
};

function extrairDescricao(registro: RegistroAuditoria): string {
  const dados = registro.dados_novos || registro.dados_anteriores;
  if (!dados) return "—";

  if (registro.tabela === "compras_cartao") {
    const descricao = dados.descricao as string;
    const valor = dados.valor_total as number;
    if (descricao && valor) {
      return `${descricao} - ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)}`;
    }
    return descricao || "—";
  }

  if (registro.tabela === "parcelas_cartao") {
    const num = dados.numero_parcela as number;
    const total = dados.total_parcelas as number;
    const valor = dados.valor as number;
    if (num && total && valor) {
      return `Parcela ${num}/${total} - ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)}`;
    }
    return `Parcela ${num || "?"}/${total || "?"}`;
  }

  return "—";
}

export default function Auditoria() {
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();
  const [filtroTabela, setFiltroTabela] = useState("todas");
  const [filtroAcao, setFiltroAcao] = useState("todas");
  const [pagina, setPagina] = useState(0);
  const [registroSelecionado, setRegistroSelecionado] = useState<RegistroAuditoria | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: estatisticas, isLoading: loadingEstatisticas } = useEstatisticasAuditoria();
  const { data, isLoading } = useAuditoria({
    dataInicio,
    dataFim,
    tabela: filtroTabela,
    acao: filtroAcao,
    pagina,
    porPagina: POR_PAGINA,
  });

  const totalPaginas = Math.ceil((data?.total || 0) / POR_PAGINA);

  const limparFiltros = () => {
    setDataInicio(undefined);
    setDataFim(undefined);
    setFiltroTabela("todas");
    setFiltroAcao("todas");
    setPagina(0);
  };

  const abrirDetalhes = (registro: RegistroAuditoria) => {
    setRegistroSelecionado(registro);
    setDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Auditoria</h1>
              <p className="text-sm text-muted-foreground">
                Histórico de alterações em compras e parcelas de cartão
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingEstatisticas ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold">{estatisticas?.total || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inserções</CardTitle>
              <TrendingUp className="h-4 w-4 text-income" />
            </CardHeader>
            <CardContent>
              {loadingEstatisticas ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold text-income">{estatisticas?.insercoes || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atualizações</CardTitle>
              <Activity className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              {loadingEstatisticas ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold text-warning">{estatisticas?.atualizacoes || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exclusões</CardTitle>
              <TrendingDown className="h-4 w-4 text-expense" />
            </CardHeader>
            <CardContent>
              {loadingEstatisticas ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <div className="text-2xl font-bold text-expense">{estatisticas?.exclusoes || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 items-end">
              {/* Data Início */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Data Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio ? format(dataInicio, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataInicio}
                      onSelect={(d) => { setDataInicio(d); setPagina(0); }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data Fim */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Data Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataFim ? format(dataFim, "dd/MM/yyyy") : "Selecionar"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataFim}
                      onSelect={(d) => { setDataFim(d); setPagina(0); }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tabela */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tabela</label>
                <Select value={filtroTabela} onValueChange={(v) => { setFiltroTabela(v); setPagina(0); }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="compras_cartao">Compras</SelectItem>
                    <SelectItem value="parcelas_cartao">Parcelas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ação */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Ação</label>
                <Select value={filtroAcao} onValueChange={(v) => { setFiltroAcao(v); setPagina(0); }}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="INSERT">Inserção</SelectItem>
                    <SelectItem value="UPDATE">Atualização</SelectItem>
                    <SelectItem value="DELETE">Exclusão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="ghost" onClick={limparFiltros}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Registros */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : data?.registros.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum registro de auditoria encontrado</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Data/Hora</TableHead>
                      <TableHead className="w-[100px]">Tabela</TableHead>
                      <TableHead className="w-[110px]">Ação</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="w-[80px] text-center">Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.registros.map((registro) => {
                      const acao = acaoConfig[registro.acao as keyof typeof acaoConfig] || acaoConfig.INSERT;
                      const tabela = tabelaConfig[registro.tabela as keyof typeof tabelaConfig] || tabelaConfig.compras_cartao;
                      const AcaoIcon = acao.icon;
                      const TabelaIcon = tabela.icon;

                      return (
                        <TableRow key={registro.id}>
                          <TableCell className="text-sm">
                            {format(new Date(registro.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <TabelaIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{tabela.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={acao.className}>
                              <AcaoIcon className="h-3 w-3 mr-1" />
                              {acao.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {extrairDescricao(registro)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => abrirDetalhes(registro)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {pagina + 1} de {totalPaginas} ({data?.total} registros)
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setPagina(Math.max(0, pagina - 1))}
                            className={pagina === 0 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.min(5, totalPaginas) }).map((_, i) => {
                          let pageNum: number;
                          if (totalPaginas <= 5) {
                            pageNum = i;
                          } else if (pagina < 3) {
                            pageNum = i;
                          } else if (pagina > totalPaginas - 4) {
                            pageNum = totalPaginas - 5 + i;
                          } else {
                            pageNum = pagina - 2 + i;
                          }
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => setPagina(pageNum)}
                                isActive={pagina === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum + 1}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setPagina(Math.min(totalPaginas - 1, pagina + 1))}
                            className={pagina === totalPaginas - 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <DetalhesAuditoriaDialog
        registro={registroSelecionado}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Layout>
  );
}
