import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Orcamento, useSalvarOrcamento, useExcluirOrcamento } from "@/hooks/useEconomia";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface Props {
  orcamentos: Orcamento[];
  mesReferencia: Date;
  onUpdate?: () => void;
}

export function OrcamentosCategoria({ orcamentos, mesReferencia, onUpdate }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Orcamento | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [categoriaId, setCategoriaId] = useState("");
  const [valorLimite, setValorLimite] = useState("");

  const { data: categories } = useCategories();
  const salvarOrcamento = useSalvarOrcamento();
  const excluirOrcamento = useExcluirOrcamento();

  // Filtrar categorias de despesa que ainda não têm orçamento
  const categoriasDisponiveis = categories?.filter(
    (c) =>
      c.type === "expense" &&
      !orcamentos.some((o) => o.categoryId === c.id)
  );

  function abrirDialogNovo() {
    setEditando(null);
    setCategoriaId("");
    setValorLimite("");
    setDialogOpen(true);
  }

  function abrirDialogEditar(orcamento: Orcamento) {
    setEditando(orcamento);
    setCategoriaId(orcamento.categoryId);
    setValorLimite(orcamento.valorLimite.toString());
    setDialogOpen(true);
  }

  function handleSalvar() {
    if (!categoriaId || !valorLimite) return;

    salvarOrcamento.mutate(
      {
        id: editando?.id,
        categoryId: categoriaId,
        valorLimite: parseFloat(valorLimite),
        mesReferencia,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setEditando(null);
          setCategoriaId("");
          setValorLimite("");
          onUpdate?.();
        },
      }
    );
  }

  function handleExcluir() {
    if (!excluindoId) return;

    excluirOrcamento.mutate(excluindoId, {
      onSuccess: () => {
        setExcluindoId(null);
        onUpdate?.();
      },
    });
  }

  // Calcular totais
  const totalLimites = orcamentos.reduce((sum, o) => sum + o.valorLimite, 0);
  const totalGasto = orcamentos.reduce((sum, o) => sum + o.gastoAtual, 0);
  const totalDisponivel = orcamentos.reduce((sum, o) => sum + o.disponivel, 0);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">
            Orçamentos por Categoria
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={abrirDialogNovo}
          >
            <Plus className="h-3.5 w-3.5" />
            Novo
          </Button>
        </CardHeader>
        <CardContent>
          {orcamentos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                Nenhum orçamento definido. Defina limites por categoria para controlar seus gastos.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={abrirDialogNovo}
              >
                <Plus className="h-3.5 w-3.5" />
                Definir primeiro limite
              </Button>
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-4 mb-6 p-3 rounded-lg bg-muted/50 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Limites</p>
                  <p className="text-sm font-medium mt-0.5">{formatCurrency(totalLimites)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gasto</p>
                  <p className="text-sm font-medium text-expense mt-0.5">
                    {formatCurrency(totalGasto)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Disponível</p>
                  <p className={cn(
                    "text-sm font-medium mt-0.5",
                    totalDisponivel >= 0 ? "text-income" : "text-expense"
                  )}>
                    {formatCurrency(totalDisponivel)}
                  </p>
                </div>
              </div>

              {/* Lista de orçamentos */}
              <div className="space-y-4">
                {orcamentos.map((orcamento) => (
                  <div key={orcamento.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: orcamento.categoriaCor }}
                        />
                        <span className="text-sm font-medium truncate">
                          {orcamento.categoriaNome}
                        </span>
                        <StatusBadge status={orcamento.status} />
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right text-sm">
                          <span className="font-medium tabular-nums">
                            {formatCurrency(orcamento.gastoAtual)}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}/ {formatCurrency(orcamento.valorLimite)}
                          </span>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => abrirDialogEditar(orcamento)}>
                              <Pencil className="h-3.5 w-3.5 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setExcluindoId(orcamento.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <Progress
                      value={Math.min(orcamento.percentualUsado, 100)}
                      className={cn(
                        "h-1.5",
                        orcamento.status === "excedido" && "[&>div]:bg-destructive",
                        orcamento.status === "atencao" && "[&>div]:bg-amber-500",
                        orcamento.status === "ok" && "[&>div]:bg-income"
                      )}
                    />

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{orcamento.percentualUsado.toFixed(0)}% usado</span>
                      <span
                        className={cn(
                          orcamento.disponivel > 0 ? "text-income" : "text-expense"
                        )}
                      >
                        {orcamento.disponivel > 0
                          ? `Disponível: ${formatCurrency(orcamento.disponivel)}`
                          : `Excedido: ${formatCurrency(Math.abs(orcamento.disponivel))}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog para novo/editar orçamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar Orçamento" : "Novo Orçamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              {editando ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: editando.categoriaCor }}
                  />
                  <span className="text-sm font-medium">{editando.categoriaNome}</span>
                </div>
              ) : (
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasDisponiveis?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color || "#888" }}
                          />
                          <span>{cat.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                    {categoriasDisponiveis?.length === 0 && (
                      <SelectItem value="" disabled>
                        Todas as categorias já têm limite
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Limite Mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="500,00"
                value={valorLimite}
                onChange={(e) => setValorLimite(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Você receberá alertas ao se aproximar deste limite
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={(!editando && !categoriaId) || !valorLimite || salvarOrcamento.isPending}
            >
              {salvarOrcamento.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!excluindoId} onOpenChange={() => setExcluindoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este limite de orçamento? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StatusBadge({ status }: { status: "ok" | "atencao" | "excedido" }) {
  if (status === "ok") return null;

  return (
    <Badge
      variant={status === "excedido" ? "destructive" : "outline"}
      className={cn(
        "text-[10px] px-1.5 py-0 h-4",
        status === "atencao" && "text-amber-600 border-amber-400"
      )}
    >
      {status === "excedido" ? "Excedido" : "Atenção"}
    </Badge>
  );
}
