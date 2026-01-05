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
  Wallet,
  Plus,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Pencil,
  Trash2,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Plane,
  Gift,
  Coffee,
  Smartphone,
  Tv,
  Music,
  Book,
  Dumbbell,
  Shirt,
  Baby,
  Dog,
  Scissors,
  Wrench,
  Zap,
  Droplets,
  Wifi,
  CreditCard,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Tag,
  Folder,
  Briefcase,
  LucideIcon,
} from "lucide-react";
import { Orcamento, useSalvarOrcamento, useExcluirOrcamento } from "@/hooks/useEconomia";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

// Mapa de nomes de ícones para componentes Lucide
const iconMap: Record<string, LucideIcon> = {
  wallet: Wallet,
  briefcase: Briefcase,
  "shopping-bag": ShoppingBag,
  shoppingbag: ShoppingBag,
  shopping: ShoppingBag,
  utensils: Utensils,
  food: Utensils,
  alimentacao: Utensils,
  car: Car,
  carro: Car,
  transporte: Car,
  home: Home,
  casa: Home,
  moradia: Home,
  "gamepad-2": Gamepad2,
  gamepad: Gamepad2,
  lazer: Gamepad2,
  entertainment: Gamepad2,
  "heart-pulse": HeartPulse,
  heartpulse: HeartPulse,
  health: HeartPulse,
  saude: HeartPulse,
  "graduation-cap": GraduationCap,
  graduationcap: GraduationCap,
  education: GraduationCap,
  educacao: GraduationCap,
  plane: Plane,
  travel: Plane,
  viagem: Plane,
  gift: Gift,
  presente: Gift,
  coffee: Coffee,
  cafe: Coffee,
  smartphone: Smartphone,
  phone: Smartphone,
  celular: Smartphone,
  tv: Tv,
  television: Tv,
  music: Music,
  musica: Music,
  book: Book,
  livro: Book,
  dumbbell: Dumbbell,
  gym: Dumbbell,
  fitness: Dumbbell,
  academia: Dumbbell,
  shirt: Shirt,
  clothes: Shirt,
  roupa: Shirt,
  vestuario: Shirt,
  baby: Baby,
  bebe: Baby,
  filho: Baby,
  dog: Dog,
  pet: Dog,
  animal: Dog,
  scissors: Scissors,
  beauty: Scissors,
  beleza: Scissors,
  wrench: Wrench,
  maintenance: Wrench,
  manutencao: Wrench,
  zap: Zap,
  electricity: Zap,
  energia: Zap,
  luz: Zap,
  droplets: Droplets,
  water: Droplets,
  agua: Droplets,
  wifi: Wifi,
  internet: Wifi,
  "credit-card": CreditCard,
  creditcard: CreditCard,
  cartao: CreditCard,
  "piggy-bank": PiggyBank,
  piggybank: PiggyBank,
  savings: PiggyBank,
  economia: PiggyBank,
  "trending-up": TrendingUp,
  trendingup: TrendingUp,
  income: TrendingUp,
  receita: TrendingUp,
  "trending-down": TrendingDown,
  trendingdown: TrendingDown,
  expense: TrendingDown,
  despesa: TrendingDown,
  "dollar-sign": DollarSign,
  dollarsign: DollarSign,
  money: DollarSign,
  dinheiro: DollarSign,
  receipt: Receipt,
  conta: Receipt,
  tag: Tag,
  folder: Folder,
  category: Folder,
  categoria: Folder,
  trabalho: Briefcase,
  work: Briefcase,
  meta: Briefcase,
  ads: Briefcase,
};

// Função para obter o componente do ícone
function getIconComponent(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return Tag;
  const normalizedName = iconName.toLowerCase().trim().replace(/\s+/g, "");
  return iconMap[normalizedName] || Tag;
}

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
            onClick={abrirDialogNovo}
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
                Defina limites por categoria para controlar seus gastos
              </p>
              <Button
                variant="outline"
                className="gap-2"
                onClick={abrirDialogNovo}
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
                  <p className="font-semibold text-red-500">
                    {formatCurrency(totalGasto)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Disponível</p>
                  <p className="font-semibold text-emerald-500">
                    {formatCurrency(totalDisponivel)}
                  </p>
                </div>
              </div>

              {/* Lista de orçamentos */}
              <div className="space-y-4">
                {orcamentos.map((orcamento) => {
                  const IconComponent = getIconComponent(orcamento.categoriaIcone);
                  
                  return (
                    <div key={orcamento.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: `${orcamento.categoriaCor}20`,
                              color: orcamento.categoriaCor,
                            }}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <span className="font-medium">
                            {orcamento.categoriaNome}
                          </span>
                          <StatusBadge status={orcamento.status} />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right text-sm">
                            <span className="font-semibold">
                              {formatCurrency(orcamento.gastoAtual)}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}/ {formatCurrency(orcamento.valorLimite)}
                            </span>
                          </div>
                          
                          {/* Menu de ações */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => abrirDialogEditar(orcamento)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar limite
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setExcluindoId(orcamento.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                            : `Excedido: ${formatCurrency(Math.abs(orcamento.disponivel))}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
              {editando ? "Editar Limite de Orçamento" : "Definir Limite de Orçamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              {editando ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  {(() => {
                    const IconComp = getIconComponent(editando.categoriaIcone);
                    return (
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{
                          backgroundColor: `${editando.categoriaCor}20`,
                          color: editando.categoriaCor,
                        }}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                      </div>
                    );
                  })()}
                  <span className="font-medium">{editando.categoriaNome}</span>
                </div>
              ) : (
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasDisponiveis?.map((cat) => {
                      const CatIcon = getIconComponent(cat.icon);
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <CatIcon className="h-4 w-4" style={{ color: cat.color }} />
                            <span>{cat.name}</span>
                          </span>
                        </SelectItem>
                      );
                    })}
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
            <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O limite de orçamento será removido
              e você não receberá mais alertas para esta categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluir}
              className="bg-red-600 hover:bg-red-700"
            >
              {excluirOrcamento.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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