import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Minus,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  PiggyBank,
  Target,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { Meta } from "@/hooks/useDashboardCompleto";
import {
  useAtualizarMeta,
  useAdicionarValorMeta,
  useRetirarValorMeta,
  useExcluirMeta,
} from "@/hooks/useMetas";
import { useCompleteStats } from "@/hooks/useTransactions";

interface Props {
  meta: Meta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CORES_DISPONIVEIS = [
  "#6366f1",
  "#22c55e",
  "#ef4444",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
];

const VALORES_RAPIDOS = [50, 100, 200, 500, 1000];

export function GerenciarMetaDialog({ meta, open, onOpenChange, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState("depositar");
  const [valorDeposito, setValorDeposito] = useState("");
  const [valorRetirada, setValorRetirada] = useState("");

  // Estado para edição
  const [titulo, setTitulo] = useState(meta?.titulo || "");
  const [valorAlvo, setValorAlvo] = useState(meta?.valorAlvo?.toString() || "");
  const [valorAtual, setValorAtual] = useState(meta?.valorAtual?.toString() || "");
  const [dataLimite, setDataLimite] = useState<Date | undefined>(
    meta?.dataLimite || undefined
  );
  const [cor, setCor] = useState(meta?.cor || "#6366f1");

  // Mutations
  const atualizarMeta = useAtualizarMeta();
  const adicionarValor = useAdicionarValorMeta();
  const retirarValor = useRetirarValorMeta();
  const excluirMeta = useExcluirMeta();

  // Buscar saldo disponível para validação
  const { data: completeStats } = useCompleteStats();
  const saldoDisponivel = completeStats?.saldoDisponivel ?? 0;

  // Atualizar estado quando a meta mudar
  if (meta && titulo !== meta.titulo) {
    setTitulo(meta.titulo);
    setValorAlvo(meta.valorAlvo.toString());
    setValorAtual(meta.valorAtual.toString());
    setDataLimite(meta.dataLimite || undefined);
    setCor(meta.cor);
  }

  if (!meta) return null;

  const faltando = Math.max(meta.valorAlvo - meta.valorAtual, 0);
  const valorDepositoNum = parseFloat(valorDeposito) || 0;
  const depositoExcedeSaldo = valorDepositoNum > saldoDisponivel;

  function handleDepositar() {
    const valor = parseFloat(valorDeposito);
    if (!valor || valor <= 0) return;

    adicionarValor.mutate(
      {
        id: meta.id,
        valor,
        valorAtualAnterior: meta.valorAtual,
        valorAlvo: meta.valorAlvo,
        metaTitulo: meta.titulo,
        saldoDisponivel,
      },
      {
        onSuccess: () => {
          setValorDeposito("");
          onSuccess?.();
        },
      }
    );
  }

  function handleRetirar() {
    const valor = parseFloat(valorRetirada);
    if (!valor || valor <= 0) return;

    retirarValor.mutate(
      {
        id: meta.id,
        valor,
        valorAtualAnterior: meta.valorAtual,
        metaTitulo: meta.titulo,
      },
      {
        onSuccess: () => {
          setValorRetirada("");
          onSuccess?.();
        },
      }
    );
  }

  function handleSalvarEdicao() {
    atualizarMeta.mutate(
      {
        id: meta.id,
        titulo,
        valorAlvo: parseFloat(valorAlvo),
        valorAtual: parseFloat(valorAtual),
        dataLimite: dataLimite || null,
        cor,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  }

  function handleExcluir() {
    excluirMeta.mutate(meta.id, {
      onSuccess: () => {
        onOpenChange(false);
        onSuccess?.();
      },
    });
  }

  function handleMarcarConcluida() {
    atualizarMeta.mutate(
      {
        id: meta.id,
        valorAtual: meta.valorAlvo,
        concluida: true,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${meta.cor}20` }}
            >
              {meta.concluida ? (
                <Sparkles className="w-4 h-4" style={{ color: meta.cor }} />
              ) : (
                <PiggyBank className="w-4 h-4" style={{ color: meta.cor }} />
              )}
            </div>
            {meta.titulo}
            {meta.concluida && (
              <Badge className="bg-emerald-500 text-white ml-2">Concluída!</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Progresso */}
        <div className="space-y-3 py-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold">{meta.progresso.toFixed(0)}%</span>
          </div>
          <Progress
            value={meta.progresso}
            className={cn(
              "h-3",
              meta.concluida && "[&>div]:bg-emerald-500"
            )}
          />
          <div className="flex justify-between text-sm">
            <span>
              <span className="font-semibold">{formatCurrency(meta.valorAtual)}</span>
              <span className="text-muted-foreground"> de {formatCurrency(meta.valorAlvo)}</span>
            </span>
            {!meta.concluida && (
              <span className="text-muted-foreground">
                Faltam {formatCurrency(faltando)}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="depositar" className="gap-1">
              <Plus className="w-4 h-4" />
              Depositar
            </TabsTrigger>
            <TabsTrigger value="retirar" className="gap-1">
              <Minus className="w-4 h-4" />
              Retirar
            </TabsTrigger>
            <TabsTrigger value="editar" className="gap-1">
              <Pencil className="w-4 h-4" />
              Editar
            </TabsTrigger>
          </TabsList>

          {/* Tab: Depositar */}
          <TabsContent value="depositar" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Valor do depósito (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                max={saldoDisponivel}
                value={valorDeposito}
                onChange={(e) => setValorDeposito(e.target.value)}
                className={depositoExcedeSaldo ? "border-destructive" : ""}
              />
              <p className={cn(
                "text-xs",
                depositoExcedeSaldo ? "text-destructive" : "text-muted-foreground"
              )}>
                {depositoExcedeSaldo
                  ? `Saldo insuficiente! Disponível: ${formatCurrency(saldoDisponivel)}`
                  : `Saldo disponível: ${formatCurrency(saldoDisponivel)}`
                }
              </p>
            </div>

            {/* Valores rápidos */}
            <div className="flex flex-wrap gap-2">
              {VALORES_RAPIDOS.filter(v => v <= saldoDisponivel).map((valor) => (
                <Button
                  key={valor}
                  variant="outline"
                  size="sm"
                  onClick={() => setValorDeposito(valor.toString())}
                >
                  +R${valor}
                </Button>
              ))}
            </div>

            <Button
              className="w-full gradient-primary"
              onClick={handleDepositar}
              disabled={
                !valorDeposito ||
                valorDepositoNum <= 0 ||
                depositoExcedeSaldo ||
                adicionarValor.isPending
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              {adicionarValor.isPending ? "Adicionando..." : "Adicionar à meta"}
            </Button>
          </TabsContent>

          {/* Tab: Retirar */}
          <TabsContent value="retirar" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Valor da retirada (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                max={meta.valorAtual}
                value={valorRetirada}
                onChange={(e) => setValorRetirada(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Disponível para retirada: {formatCurrency(meta.valorAtual)}
              </p>
            </div>

            <Button
              className="w-full"
              variant="outline"
              onClick={handleRetirar}
              disabled={
                !valorRetirada ||
                parseFloat(valorRetirada) <= 0 ||
                parseFloat(valorRetirada) > meta.valorAtual ||
                retirarValor.isPending
              }
            >
              <Minus className="w-4 h-4 mr-2" />
              {retirarValor.isPending ? "Retirando..." : "Retirar da meta"}
            </Button>
          </TabsContent>

          {/* Tab: Editar */}
          <TabsContent value="editar" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Alvo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={valorAlvo}
                  onChange={(e) => setValorAlvo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Atual (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={valorAtual}
                  onChange={(e) => setValorAtual(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data Limite</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataLimite && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataLimite
                      ? format(dataLimite, "PPP", { locale: ptBR })
                      : "Sem data limite"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataLimite}
                    onSelect={setDataLimite}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {CORES_DISPONIVEIS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      cor === c
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setCor(c)}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleSalvarEdicao}
                disabled={!titulo || !valorAlvo || atualizarMeta.isPending}
              >
                {atualizarMeta.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Ações extras */}
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
          {!meta.concluida && (
            <Button
              variant="outline"
              className="gap-2 text-emerald-600 border-emerald-600 hover:bg-emerald-50"
              onClick={handleMarcarConcluida}
            >
              <CheckCircle className="w-4 h-4" />
              Marcar como Concluída
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 text-destructive">
                <Trash2 className="w-4 h-4" />
                Excluir Meta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. A meta "{meta.titulo}" será
                  removida permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleExcluir}
                  className="bg-destructive text-destructive-foreground"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}