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
  Wallet,
  Plus,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Orcamento, useSalvarOrcamento } from "@/hooks/useEconomia";
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
  const [categoriaId, setCategoriaId] = useState("");
  const [valorLimite, setValorLimite] = useState("");

  const { data: categories } = useCategories();
  const salvarOrcamento = useSalvarOrcamento();

  // Filtrar categorias de despesa que ainda não têm orçamento
  const categoriasDisponiveis = categories?.filter(
    (c) =>
      c.type === "expense" &&
      !orcamentos.some((o) => o.categoryId === c.id)
  );

  function handleSalvar() {
    if (!categoriaId || !valorLimite) return;

    salvarOrcamento.mutate(
      {
        categoryId: categoriaId,
        valorLimite: parseFloat(valorLimite),
        mesReferencia,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setCategoriaId("");
          setValorLimite("");
          onUpdate?.();
        },
      }
    );
  }

  // Calcular totais
  const totalLimites = orcamentos.reduce((sum, o) => sum + o.valorLimite, 0);
  const totalGasto = orcamentos.reduce((sum, o) => sum + o.gastoAtual, 0);
  const totalDisponivel = orcamentos.reduce((sum, o) => sum + o.disponivel, 0);

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Orçamentos por Categoria
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Definir Limite
          </Button>
        </CardHeader>
        <CardContent>
          {orcamentos.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground mb-2">
                Nenhum orçamento definido
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Defina limites por categoria para controlar seus gastos!
              </p>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Definir primeiro limite
              </Button>
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-4 mb-6 p-3 rounded-xl bg-muted/50">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Limites</p>
                  <p className="font-semibold">{formatCurrency(totalLimites)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Gasto</p>
                  <p className="font-semibold text-expense">
                    {formatCurrency(totalGasto)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Disponível</p>
                  <p className="font-semibold text-income">
                    {formatCurrency(totalDisponivel)}
                  </p>
                </div>
              </div>

              {/* Lista de orçamentos */}
              <div className="space-y-4">
                {orcamentos.map((orcamento) => (
                  <div key={orcamento.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                          style={{
                            backgroundColor: `${orcamento.categoriaCor}20`,
                          }}
                        >
                          {orcamento.categoriaIcone}
                        </div>
                        <span className="font-medium">
                          {orcamento.categoriaNome}
                        </span>
                        <StatusBadge status={orcamento.status} />
                      </div>
                      <div className="text-right text-sm">
                        <span className="font-semibold">
                          {formatCurrency(orcamento.gastoAtual)}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {formatCurrency(orcamento.valorLimite)}
                        </span>
                      </div>
                    </div>

                    <Progress
                      value={Math.min(orcamento.percentualUsado, 100)}
                      className={cn(
                        "h-2",
                        orcamento.status === "excedido" && "[&>div]:bg-red-500",
                        orcamento.status === "atencao" && "[&>div]:bg-amber-500",
                        orcamento.status === "ok" && "[&>div]:bg-emerald-500"
                      )}
                    />

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{orcamento.percentualUsado.toFixed(0)}% usado</span>
                      <span
                        className={
                          orcamento.disponivel > 0
                            ? "text-emerald-600"
                            : "text-red-500"
                        }
                      >
                        {orcamento.disponivel > 0
                          ? `Disponível: ${formatCurrency(orcamento.disponivel)}`
                          : `Excedido: ${formatCurrency(
                              Math.abs(orcamento.disponivel)
                            )}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog para novo orçamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Definir Limite de Orçamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasDisponiveis?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
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
              disabled={!categoriaId || !valorLimite || salvarOrcamento.isPending}
              className="gradient-primary"
            >
              Salvar Limite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusBadge({ status }: { status: "ok" | "atencao" | "excedido" }) {
  if (status === "ok") {
    return (
      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-600 gap-1">
        <CheckCircle className="h-3 w-3" />
        OK
      </Badge>
    );
  }
  if (status === "atencao") {
    return (
      <Badge variant="outline" className="text-xs text-amber-600 border-amber-600 gap-1">
        <AlertCircle className="h-3 w-3" />
        Atenção
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="text-xs gap-1">
      <AlertTriangle className="h-3 w-3" />
      Excedido
    </Badge>
  );
}