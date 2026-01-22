import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Pencil, Trash2, CreditCard, Layers } from "lucide-react";
import type { RegistroAuditoria } from "@/hooks/useAuditoria";

interface DetalhesAuditoriaDialogProps {
  registro: RegistroAuditoria | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const acaoConfig = {
  INSERT: { label: "Inserção", icon: Plus, className: "bg-income/10 text-income border-income/20" },
  UPDATE: { label: "Atualização", icon: Pencil, className: "bg-warning/10 text-warning border-warning/20" },
  DELETE: { label: "Exclusão", icon: Trash2, className: "bg-expense/10 text-expense border-expense/20" },
};

const tabelaConfig = {
  compras_cartao: { label: "Compra", icon: CreditCard, className: "bg-primary/10 text-primary border-primary/20" },
  parcelas_cartao: { label: "Parcela", icon: Layers, className: "bg-accent/10 text-accent-foreground border-accent/20" },
};

function formatarCampo(chave: string, valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  
  if (chave.includes("valor") || chave === "limite") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(valor));
  }
  
  if (chave.includes("data") || chave === "mes_referencia" || chave === "mes_inicio") {
    try {
      const date = new Date(valor as string);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return String(valor);
    }
  }
  
  if (chave === "created_at" || chave === "updated_at") {
    try {
      const date = new Date(valor as string);
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return String(valor);
    }
  }
  
  if (typeof valor === "boolean") {
    return valor ? "Sim" : "Não";
  }
  
  return String(valor);
}

function formatarNomeCampo(chave: string): string {
  const mapeamento: Record<string, string> = {
    id: "ID",
    user_id: "ID do Usuário",
    cartao_id: "ID do Cartão",
    compra_id: "ID da Compra",
    descricao: "Descrição",
    valor_total: "Valor Total",
    valor: "Valor",
    parcelas: "Parcelas",
    parcela_inicial: "Parcela Inicial",
    numero_parcela: "Nº Parcela",
    total_parcelas: "Total Parcelas",
    mes_inicio: "Mês Início",
    mes_referencia: "Mês Referência",
    data_compra: "Data da Compra",
    categoria_id: "ID Categoria",
    responsavel_id: "ID Responsável",
    tipo_lancamento: "Tipo Lançamento",
    ativo: "Ativo",
    paga: "Paga",
    tipo_recorrencia: "Tipo Recorrência",
    created_at: "Criado em",
    updated_at: "Atualizado em",
    compra_estornada_id: "ID Compra Estornada",
  };
  return mapeamento[chave] || chave;
}

function DadosFormatados({ dados, titulo }: { dados: Record<string, unknown> | null; titulo: string }) {
  if (!dados) return null;

  const camposOrdenados = Object.entries(dados).sort(([a], [b]) => {
    const ordem = ["descricao", "valor", "valor_total", "parcelas", "numero_parcela", "mes_referencia"];
    const indexA = ordem.indexOf(a);
    const indexB = ordem.indexOf(b);
    if (indexA >= 0 && indexB >= 0) return indexA - indexB;
    if (indexA >= 0) return -1;
    if (indexB >= 0) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{titulo}</h4>
      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="grid gap-2">
          {camposOrdenados.map(([chave, valor]) => (
            <div key={chave} className="flex justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{formatarNomeCampo(chave)}</span>
              <span className="font-medium text-right truncate max-w-[60%]">
                {formatarCampo(chave, valor)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DetalhesAuditoriaDialog({
  registro,
  open,
  onOpenChange,
}: DetalhesAuditoriaDialogProps) {
  if (!registro) return null;

  const acao = acaoConfig[registro.acao as keyof typeof acaoConfig] || acaoConfig.INSERT;
  const tabela = tabelaConfig[registro.tabela as keyof typeof tabelaConfig] || tabelaConfig.compras_cartao;
  const AcaoIcon = acao.icon;
  const TabelaIcon = tabela.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={acao.className}>
                <AcaoIcon className="h-3 w-3 mr-1" />
                {acao.label}
              </Badge>
              <Badge variant="outline" className={tabela.className}>
                <TabelaIcon className="h-3 w-3 mr-1" />
                {tabela.label}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Data/Hora</span>
            <span className="font-medium">
              {format(new Date(registro.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">ID do Registro</span>
            <code className="text-xs bg-muted px-2 py-0.5 rounded">
              {registro.registro_id.slice(0, 8)}...
            </code>
          </div>

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4 pr-4">
              {registro.acao === "UPDATE" && (
                <>
                  <DadosFormatados dados={registro.dados_anteriores} titulo="Dados Anteriores" />
                  <DadosFormatados dados={registro.dados_novos} titulo="Dados Novos" />
                </>
              )}
              
              {registro.acao === "INSERT" && (
                <DadosFormatados dados={registro.dados_novos} titulo="Dados Inseridos" />
              )}
              
              {registro.acao === "DELETE" && (
                <DadosFormatados dados={registro.dados_anteriores} titulo="Dados Excluídos" />
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
