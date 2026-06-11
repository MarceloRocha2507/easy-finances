import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import { Crown, User, Users, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  mesReferencia: Date;
}

type DetalheCartao = {
  cartaoNome: string;
  total: number;
};

type ResumoItem = {
  id: string;
  nome: string;
  isTitular: boolean;
  total: number;
  qtd: number;
  percentual: number;
  detalhesPorCartao: DetalheCartao[];
};

async function buscarTotaisPorResponsavel(userId: string, mesReferencia: Date): Promise<ResumoItem[]> {
  const ano = mesReferencia.getFullYear();
  const mes = mesReferencia.getMonth();
  const inicio = `${ano}-${String(mes + 1).padStart(2, "0")}-01`;
  const fimDate = new Date(ano, mes + 1, 1);
  const fim = `${fimDate.getFullYear()}-${String(fimDate.getMonth() + 1).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("parcelas_cartao")
    .select(`
      valor,
      compra:compras_cartao!inner (
        user_id,
        responsavel_id,
        cartao:cartoes (
          nome
        ),
        responsavel:responsaveis (
          id,
          nome,
          apelido,
          is_titular
        )
      )
    `)
    .eq("ativo", true)
    .gte("mes_referencia", inicio)
    .lt("mes_referencia", fim)
    .limit(10000);

  if (error) {
    console.error("Erro ao buscar totais por responsável:", error);
    return [];
  }

  const filtered = (data || []).filter((p: any) => p.compra?.user_id === userId);

  const map: Record<string, ResumoItem> = {};
  let totalGeral = 0;

  filtered.forEach((p: any) => {
    const valor = Math.abs(Number(p.valor) || 0);
    totalGeral += valor;

    const resp = p.compra?.responsavel;
    const isTitular = resp?.is_titular === true || !p.compra?.responsavel_id;
    const key = isTitular ? "__titular__" : resp?.id || "__sem__";
    const nome = isTitular
      ? "Eu (Titular)"
      : resp?.apelido || resp?.nome || "Sem responsável";

    if (!map[key]) {
      map[key] = { 
        id: key, 
        nome, 
        isTitular, 
        total: 0, 
        qtd: 0, 
        percentual: 0,
        detalhesPorCartao: []
      };
    }
    
    map[key].total += valor;
    map[key].qtd += 1;

    const cartaoNome = p.compra?.cartao?.nome || "Cartão não identificado";
    const indexCartao = map[key].detalhesPorCartao.findIndex(d => d.cartaoNome === cartaoNome);
    
    if (indexCartao >= 0) {
      map[key].detalhesPorCartao[indexCartao].total += valor;
    } else {
      map[key].detalhesPorCartao.push({ cartaoNome, total: valor });
    }
  });

  Object.values(map).forEach((item) => {
    item.percentual = totalGeral > 0 ? (item.total / totalGeral) * 100 : 0;
    item.detalhesPorCartao.sort((a, b) => b.total - a.total);
  });

  return Object.values(map).sort((a, b) => {
    if (a.isTitular !== b.isTitular) return a.isTitular ? -1 : 1;
    return b.total - a.total;
  });
}

export function ResumoResponsaveisMes({ mesReferencia }: Props) {
  const { user } = useAuth();
  const [itemSelecionado, setItemSelecionado] = useState<ResumoItem | null>(null);
  const mesKey = `${mesReferencia.getFullYear()}-${String(mesReferencia.getMonth() + 1).padStart(2, "0")}`;

  const { data: resumo = [], isLoading } = useQuery({
    queryKey: ["totais-responsavel-mes", user?.id, mesKey],
    queryFn: () => buscarTotaisPorResponsavel(user!.id, mesReferencia),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const totalMes = resumo.reduce((s, r) => s + r.total, 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (resumo.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold text-foreground">Total por responsável</h2>
        </div>
        <span className="text-xs text-muted-foreground value-display">
          Total: {formatCurrency(totalMes)}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {resumo.map((item) => (
          <Card
            key={item.id}
            className="rounded-xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow cursor-pointer active:scale-[0.98]"
            onClick={() => setItemSelecionado(item)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    item.isTitular ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.isTitular ? <Crown className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <p className="text-xs font-medium text-foreground truncate flex-1" title={item.nome}>
                  {item.nome}
                </p>
              </div>
              <p className="text-base sm:text-lg font-bold text-foreground value-display truncate">
                {formatCurrency(item.total)}
              </p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-muted-foreground">
                  {item.qtd} {item.qtd === 1 ? "lançamento" : "lançamentos"}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground">
                  {item.percentual.toFixed(0)}%
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!itemSelecionado} onOpenChange={(open) => !open && setItemSelecionado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Gastos de {itemSelecionado?.nome}
            </DialogTitle>
            <DialogDescription>
              Detalhamento de gastos por cartão neste mês
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium text-muted-foreground">Total Geral</span>
              <span className="text-lg font-bold text-foreground">
                {itemSelecionado && formatCurrency(itemSelecionado.total)}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Por Cartão
              </p>
              <div className="grid gap-2">
                {(itemSelecionado?.detalhesPorCartao ?? []).map((detalhe, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center border border-border">
                        <CreditCard className="h-4 w-4 text-primary/70" />
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {detalhe.cartaoNome}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(detalhe.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
