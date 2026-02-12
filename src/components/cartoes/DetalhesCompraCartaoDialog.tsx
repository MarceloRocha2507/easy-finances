import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ParcelaFatura } from "@/services/compras-cartao";
import {
  Calendar,
  Check,
  Clock,
  Hash,
  Layers,
  Pencil,
  RefreshCw,
  Tag,
  User,
  CreditCard,
  DollarSign,
  Package,
} from "lucide-react";

interface DetalhesCompraCartaoDialogProps {
  parcela: ParcelaFatura | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (parcela: ParcelaFatura) => void;
  corCartao?: string;
}

export function DetalhesCompraCartaoDialog({
  parcela,
  open,
  onOpenChange,
  onEdit,
  corCartao,
}: DetalhesCompraCartaoDialogProps) {
  if (!parcela) return null;

  const isCredito = parcela.valor < 0;
  const isEstorno = parcela.tipo_lancamento === "estorno";
  const isAjuste = parcela.tipo_lancamento === "ajuste";

  const getTipoLabel = () => {
    if (parcela.total_parcelas > 1) return "Parcelada";
    if (parcela.tipo_lancamento === "fixa") return "Fixa";
    return "Única";
  };

  const valorTotal = Math.abs(parcela.valor) * parcela.total_parcelas;

  const formatDateOnly = (dateStr: string) => {
    const date = parseISO(dateStr);
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const formatMesRef = (mesRef: string) => {
    const date = parseISO(mesRef);
    return format(date, "MMMM/yyyy", { locale: ptBR });
  };

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(parcela);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 border-0 overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 pb-4 bg-muted border-b">
          <DialogHeader>
            <DialogTitle>Detalhes da Compra</DialogTitle>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-4 sm:px-5 pb-4 pt-4 overflow-y-auto">
          {/* Cabeçalho com ícone e descrição */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                isCredito
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              )}
            >
              {parcela.categoria_cor ? (
                <Tag
                  className="w-6 h-6"
                  style={{ color: parcela.categoria_cor }}
                />
              ) : (
                <CreditCard
                  className={cn(
                    "w-6 h-6",
                    isCredito ? "text-emerald-600" : "text-red-600"
                  )}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground text-lg">
                  {parcela.descricao}
                </p>
                {isEstorno && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >
                    Estorno
                  </Badge>
                )}
                {isAjuste && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    Ajuste
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {parcela.categoria_nome || "Sem categoria"}
              </p>
            </div>
          </div>

          {/* Valor em destaque */}
          <div
            className={cn(
              "text-center py-4 rounded-xl",
              isCredito
                ? "bg-emerald-50 dark:bg-emerald-950/30"
                : "bg-red-50 dark:bg-red-950/30"
            )}
          >
            <span
              className={cn(
                "text-3xl font-bold",
                isCredito ? "text-emerald-600" : "text-red-600"
              )}
            >
              {isCredito ? "- " : ""}
              {formatCurrency(Math.abs(parcela.valor))}
            </span>
            {parcela.total_parcelas > 1 && (
              <p className="text-sm text-muted-foreground mt-1">
                {parcela.numero_parcela}x de {formatCurrency(Math.abs(parcela.valor))}
              </p>
            )}
          </div>

          <Separator />

          {/* Informações da Parcela */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Informações da Parcela
            </h4>
            <div className="grid gap-2">
              {/* Status */}
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {parcela.paga ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span>Status</span>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    parcela.paga
                      ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30"
                      : "text-amber-600 bg-amber-100 dark:bg-amber-900/30"
                  )}
                >
                  {parcela.paga ? "Paga" : "Pendente"}
                </Badge>
              </div>

              {/* Parcela */}
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="w-4 h-4" />
                  <span>Parcela</span>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs bg-primary/10 text-primary"
                >
                  {parcela.numero_parcela} de {parcela.total_parcelas}
                </Badge>
              </div>

              {/* Valor unitário */}
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  <span>Valor da parcela</span>
                </div>
                <span className="text-sm font-medium">
                  {formatCurrency(Math.abs(parcela.valor))}
                </span>
              </div>

              {/* Mês de referência */}
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Mês referência</span>
                </div>
                <span className="text-sm font-medium capitalize">
                  {formatMesRef(parcela.mes_referencia)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Informações da Compra */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Informações da Compra
            </h4>
            <div className="grid gap-2">
              {/* Data da compra */}
              {parcela.data_compra && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Data da compra</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatDateOnly(parcela.data_compra)}
                  </span>
                </div>
              )}

              {/* Valor total */}
              {parcela.total_parcelas > 1 && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span>Valor total</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(valorTotal)}
                  </span>
                </div>
              )}

              {/* Tipo de lançamento */}
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {parcela.total_parcelas > 1 ? (
                    <Layers className="w-4 h-4" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Tipo</span>
                </div>
                <span className="text-sm font-medium">{getTipoLabel()}</span>
              </div>

              {/* Categoria */}
              {parcela.categoria_nome && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Tag className="w-4 h-4" />
                    <span>Categoria</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="gap-1 text-xs"
                    style={{
                      backgroundColor: `${parcela.categoria_cor}15`,
                      color: parcela.categoria_cor,
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: parcela.categoria_cor }}
                    />
                    {parcela.categoria_nome}
                  </Badge>
                </div>
              )}

              {/* Responsável */}
              {(parcela.responsavel_nome || parcela.responsavel_apelido) && (
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Responsável</span>
                  </div>
                  <span className="text-sm font-medium">
                    {parcela.responsavel_apelido || parcela.responsavel_nome}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Registro */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Registro
            </h4>
            <div className="grid gap-2 text-xs">
              {parcela.updated_at && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Última alteração</span>
                  <span className="font-mono">
                    {formatDistanceToNow(parseISO(parcela.updated_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-muted-foreground/70 truncate max-w-[180px]">
                  {parcela.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 px-4 sm:px-5 pb-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleEdit} className="gap-2">
            <Pencil className="w-4 h-4" />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
