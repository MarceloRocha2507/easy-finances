import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { Assinatura } from "@/hooks/useAssinaturas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, Zap } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assinatura: Assinatura | null;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  ativa: { label: "Ativa", variant: "default" },
  pausada: { label: "Pausada", variant: "secondary" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

const frequenciaMap: Record<string, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

const metodoMap: Record<string, string> = {
  cartao_credito: "Cartão de Crédito",
  debito_automatico: "Débito Automático",
  boleto: "Boleto",
  pix: "Pix",
};

const categoriaLabel = (c: string) =>
  c === "streaming" ? "Streaming" : c === "software" ? "Software" : c === "saude" ? "Saúde" : c === "educacao" ? "Educação" : "Outros";

function formatDate(d: string | null) {
  if (!d) return "—";
  return format(new Date(d + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR });
}

export function DetalhesAssinaturaDialog({ open, onOpenChange, assinatura }: Props) {
  if (!assinatura) return null;

  const status = statusMap[assinatura.status] ?? statusMap.ativa;

  const rows = [
    { label: "Valor", value: formatCurrency(assinatura.valor) },
    { label: "Moeda", value: assinatura.moeda },
    { label: "Frequência", value: frequenciaMap[assinatura.frequencia] ?? assinatura.frequencia },
    { label: "Categoria", value: categoriaLabel(assinatura.categoria) },
    { label: "Método de pagamento", value: metodoMap[assinatura.metodo_pagamento] ?? assinatura.metodo_pagamento },
    { label: "Data de início", value: formatDate(assinatura.data_inicio) },
    { label: "Próxima cobrança", value: formatDate(assinatura.proxima_cobranca) },
    ...(assinatura.data_pausa ? [{ label: "Pausada em", value: formatDate(assinatura.data_pausa) }] : []),
    ...(assinatura.data_cancelamento ? [{ label: "Cancelada em", value: formatDate(assinatura.data_cancelamento) }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {assinatura.nome}
            <Badge variant={status.variant}>{status.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium">{r.value}</span>
            </div>
          ))}

          {/* Seção de vínculo com cartão */}
          {assinatura.compra_cartao_id && (
            <div className="pt-3 mt-3 border-t space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CreditCard className="h-4 w-4 text-primary" />
                Pagamento via Cartão
                {assinatura.vinculo_automatico && (
                  <Badge variant="secondary" className="text-[10px] h-4 gap-1">
                    <Zap className="h-3 w-3" /> Auto
                  </Badge>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cartão</span>
                <span className="font-medium">{assinatura.cartao_nome || "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data do pagamento</span>
                <span className="font-medium">{formatDate(assinatura.data_pagamento)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor cobrado</span>
                <span className="font-medium">
                  {assinatura.valor_cobrado != null ? formatCurrency(assinatura.valor_cobrado) : "—"}
                </span>
              </div>
            </div>
          )}

          {assinatura.observacoes && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-1">Observações</p>
              <p className="text-sm">{assinatura.observacoes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
