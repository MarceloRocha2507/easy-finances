import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Pencil,
  Search,
  Trash2,
  User,
  Tag,
  X,
  Crown,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  listarParcelasDaFatura,
  ParcelaFatura,
  marcarParcelaComoPaga,
} from "@/services/compras-cartao";
import { useResponsaveis } from "@/services/responsaveis";
import { Cartao } from "@/services/cartoes";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { EditarCompraDialog } from "@/components/cartoes/EditarCompraDialog";
import { ExcluirCompraDialog } from "@/components/cartoes/ExcluirCompraDialog";
import { NovaCompraCartaoDialog } from "@/components/cartoes/NovaCompraCartaoDialog";
import { useAuth } from "@/hooks/useAuth";

/* ======================================================
   Utils
====================================================== */

function monthLabel(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(d);
}

function addMonths(base: Date, delta: number) {
  return new Date(base.getFullYear(), base.getMonth() + delta, 1);
}

/* ======================================================
   Tipos de Filtro
====================================================== */

interface Filtros {
  busca: string;
  status: "todos" | "pendente" | "pago";
  responsavelId: string | null;
}

const filtrosIniciais: Filtros = {
  busca: "",
  status: "todos",
  responsavelId: null,
};

/* ======================================================
   Component
====================================================== */

export default function DespesasCartao() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cartao, setCartao] = useState<Cartao | null>(null);
  const [mesRef, setMesRef] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [parcelas, setParcelas] = useState<ParcelaFatura[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtros, setFiltros] = useState<Filtros>(filtrosIniciais);

  // Dialogs
  const [novaCompraOpen, setNovaCompraOpen] = useState(false);
  const [editarCompraOpen, setEditarCompraOpen] = useState(false);
  const [excluirCompraOpen, setExcluirCompraOpen] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<ParcelaFatura | null>(null);

  // Hooks
  const { data: responsaveis = [] } = useResponsaveis();

  /* ======================================================
     Carregar cartão
  ====================================================== */

  useEffect(() => {
    if (!id || !user) return;

    async function fetchCartao() {
      const { data, error } = await supabase
        .from("cartoes")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

      if (!error && data) {
        setCartao(data as Cartao);
      }
    }

    fetchCartao();
  }, [id, user]);

  /* ======================================================
     Carregar parcelas
  ====================================================== */

  async function carregarFatura() {
    if (!id) return;
    setLoading(true);

    try {
      const parcelasData = await listarParcelasDaFatura(id, mesRef);
      setParcelas(parcelasData ?? []);
    } catch (e) {
      console.error(e);
      setParcelas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    carregarFatura();
    setFiltros(filtrosIniciais);
  }, [id, mesRef]);

  /* ======================================================
     Aplicar filtros
  ====================================================== */

  const parcelasFiltradas = useMemo(() => {
    return parcelas.filter((p) => {
      if (
        filtros.busca &&
        !p.descricao.toLowerCase().includes(filtros.busca.toLowerCase())
      ) {
        return false;
      }

      if (filtros.status === "pendente" && p.paga) return false;
      if (filtros.status === "pago" && !p.paga) return false;

      if (filtros.responsavelId) {
        if (p.responsavel_id !== filtros.responsavelId) return false;
      }

      return true;
    });
  }, [parcelas, filtros]);

  /* ======================================================
     Totais
  ====================================================== */

  const totalMes = useMemo(() => {
    return parcelas
      .filter((p) => !p.paga)
      .reduce((sum, p) => sum + Math.abs(Number(p.valor) || 0), 0);
  }, [parcelas]);

  const totalPago = useMemo(() => {
    return parcelas
      .filter((p) => p.paga)
      .reduce((sum, p) => sum + Math.abs(Number(p.valor) || 0), 0);
  }, [parcelas]);

  const totalFiltrado = useMemo(() => {
    return parcelasFiltradas.reduce(
      (sum, p) => sum + Math.abs(Number(p.valor) || 0),
      0
    );
  }, [parcelasFiltradas]);

  const temFiltrosAtivos =
    filtros.busca !== "" ||
    filtros.status !== "todos" ||
    filtros.responsavelId !== null;

  if (!id) return null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cartoes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <CreditCard
                className="h-6 w-6"
                style={{ color: cartao?.cor || "#6366f1" }}
              />
              <div>
                <h1 className="text-2xl font-bold">{cartao?.nome || "Cartão"}</h1>
                <p className="text-sm text-muted-foreground">Despesas do cartão</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setNovaCompraOpen(true)}>
            + Nova compra
          </Button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Pendente</p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(totalMes)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Pago</p>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrency(totalPago)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                {temFiltrosAtivos ? "Total Filtrado" : "Total Geral"}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(temFiltrosAtivos ? totalFiltrado : totalMes + totalPago)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navegação de mês */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setMesRef((m) => addMonths(m, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[180px] text-center font-semibold capitalize text-lg">
              {monthLabel(mesRef)}
            </span>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setMesRef((m) => addMonths(m, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição..."
                  className="pl-9"
                  value={filtros.busca}
                  onChange={(e) =>
                    setFiltros((f) => ({ ...f, busca: e.target.value }))
                  }
                />
                {filtros.busca && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setFiltros((f) => ({ ...f, busca: "" }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <Select
                value={filtros.status}
                onValueChange={(v) =>
                  setFiltros((f) => ({
                    ...f,
                    status: v as "todos" | "pendente" | "pago",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      Pendentes
                    </div>
                  </SelectItem>
                  <SelectItem value="pago">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      Pagos
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filtros.responsavelId || "todos"}
                onValueChange={(v) =>
                  setFiltros((f) => ({
                    ...f,
                    responsavelId: v === "todos" ? null : v,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {responsaveis.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <div className="flex items-center gap-2">
                        {r.is_titular ? (
                          <Crown className="h-4 w-4 text-primary" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        {r.apelido || r.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {temFiltrosAtivos && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando <strong>{parcelasFiltradas.length}</strong> de{" "}
                  <strong>{parcelas.length}</strong> despesas
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiltros(filtrosIniciais)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de despesas */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-center">Parcela</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Carregando despesas...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && parcelasFiltradas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p className="text-muted-foreground">
                          {temFiltrosAtivos
                            ? "Nenhuma despesa encontrada com os filtros."
                            : "Nenhuma despesa neste mês."}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    parcelasFiltradas.map((p) => (
                      <TableRow
                        key={p.id}
                        className={cn(
                          p.paga && "opacity-60 bg-emerald-500/5"
                        )}
                      >
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Checkbox
                                    checked={!!p.paga}
                                    onCheckedChange={async () => {
                                      await marcarParcelaComoPaga(p.id, !p.paga);
                                      carregarFatura();
                                    }}
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {p.paga ? "Marcar como pendente" : "Marcar como paga"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>

                        <TableCell>
                          <p
                            className={cn(
                              "font-medium",
                              p.paga && "line-through text-muted-foreground"
                            )}
                          >
                            {p.descricao}
                          </p>
                        </TableCell>

                        <TableCell>
                          {p.categoria_nome ? (
                            <Badge
                              variant="secondary"
                              className="gap-1"
                              style={{
                                backgroundColor: `${p.categoria_cor}20`,
                                color: p.categoria_cor,
                                borderColor: `${p.categoria_cor}40`,
                              }}
                            >
                              <Tag className="h-3 w-3" />
                              {p.categoria_nome}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          {p.responsavel_apelido || p.responsavel_nome ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {p.responsavel_apelido || p.responsavel_nome}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {p.numero_parcela}/{p.total_parcelas}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "font-semibold",
                              p.paga
                                ? "line-through text-muted-foreground"
                                : "text-red-500"
                            )}
                          >
                            {formatCurrency(Math.abs(p.valor))}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setParcelaSelecionada(p);
                                      setEditarCompraOpen(true);
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => {
                                      setParcelaSelecionada(p);
                                      setExcluirCompraOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Excluir</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {cartao && (
        <NovaCompraCartaoDialog
          cartao={cartao}
          open={novaCompraOpen}
          onOpenChange={setNovaCompraOpen}
          onSaved={() => {
            setNovaCompraOpen(false);
            carregarFatura();
          }}
        />
      )}

      <EditarCompraDialog
        parcela={parcelaSelecionada}
        open={editarCompraOpen}
        onOpenChange={(open) => {
          setEditarCompraOpen(open);
          if (!open) setParcelaSelecionada(null);
        }}
        onSaved={() => {
          setEditarCompraOpen(false);
          setParcelaSelecionada(null);
          carregarFatura();
        }}
      />

      <ExcluirCompraDialog
        parcela={parcelaSelecionada}
        open={excluirCompraOpen}
        onOpenChange={(open) => {
          setExcluirCompraOpen(open);
          if (!open) setParcelaSelecionada(null);
        }}
        onDeleted={() => {
          setExcluirCompraOpen(false);
          setParcelaSelecionada(null);
          carregarFatura();
        }}
      />
    </Layout>
  );
}
