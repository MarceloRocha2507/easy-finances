import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { BarChart3, CreditCard, Wallet, Loader2, Users, Crown, CheckCircle2 } from "lucide-react";
import { FiltroPeriodo } from "@/components/dashboard/FiltroPeriodo";
import { useMesesComMovimentacao } from "@/hooks/useMesesComMovimentacao";
import { useRelatorioCartoes } from "@/hooks/useRelatorioCartoes";
import { startOfMonth, endOfMonth, format } from "date-fns";

interface CategoryRow {
  id: string;
  name: string;
  color: string;
  totalNormal: number;
  totalCartao: number;
  total: number;
}

export default function Relatorios() {
  const { user } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: mesesDisponiveis } = useMesesComMovimentacao();

  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState<Date>(new Date(hoje.getFullYear(), hoje.getMonth(), 1));

  const inicio = format(startOfMonth(mesAtual), "yyyy-MM-dd");
  const fim = format(endOfMonth(mesAtual), "yyyy-MM-dd");
  const mesRef = format(startOfMonth(mesAtual), "yyyy-MM-dd");

  const { data: txExpenses = [], isLoading: loadingTx } = useQuery({
    queryKey: ["relatorios", "transactions", user?.id, inicio, fim],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("category_id, amount")
        .eq("user_id", user!.id)
        .eq("type", "expense")
        .eq("desconsiderada", false)
        .gte("date", inicio)
        .lt("date", format(new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 1), "yyyy-MM-dd"))
        .limit(10000);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: cardExpenses = [], isLoading: loadingCard } = useQuery({
    queryKey: ["relatorios", "compras-cartao", user?.id, mesRef],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcelas_cartao")
        .select("valor, compra_id, compras_cartao!inner(categoria_id, user_id, ativo)")
        .eq("compras_cartao.user_id", user!.id)
        .eq("compras_cartao.ativo", true)
        .eq("ativo", true)
        .eq("mes_referencia", mesRef)
        .limit(10000);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const rows: CategoryRow[] = useMemo(() => {
    const map = new Map<string, CategoryRow>();
    const getOrInit = (id: string) => {
      if (!map.has(id)) {
        const cat = categories.find((c) => c.id === id);
        map.set(id, {
          id,
          name: cat?.name ?? "Sem categoria",
          color: cat?.color ?? "#9CA3AF",
          totalNormal: 0,
          totalCartao: 0,
          total: 0,
        });
      }
      return map.get(id)!;
    };

    for (const t of txExpenses) {
      if (!t.category_id) continue;
      const row = getOrInit(t.category_id);
      row.totalNormal += Number(t.amount) || 0;
    }
    for (const p of cardExpenses as any[]) {
      const catId = p.compras_cartao?.categoria_id;
      if (!catId) continue;
      const row = getOrInit(catId);
      row.totalCartao += Number(p.valor) || 0;
    }

    return Array.from(map.values())
      .map((r) => ({ ...r, total: r.totalNormal + r.totalCartao }))
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [txExpenses, cardExpenses, categories]);

  const totalGeral = rows.reduce((s, r) => s + r.total, 0);
  const totalNormal = rows.reduce((s, r) => s + r.totalNormal, 0);
  const totalCartao = rows.reduce((s, r) => s + r.totalCartao, 0);
  const isLoading = loadingTx || loadingCard;

  const { data: relCartoes, isLoading: loadingRelCartoes } = useRelatorioCartoes(mesRef);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-[#374151]" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-[#111827]">Relatórios</h1>
              <p className="text-sm text-[#6B7280]">Gastos por categoria — transações e cartões</p>
            </div>
          </div>
          <FiltroPeriodo
            mesAtual={mesAtual}
            onMesChange={setMesAtual}
            mesesDisponiveis={mesesDisponiveis}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard label="Total geral" value={totalGeral} icon={<BarChart3 className="h-4 w-4" />} />
          <SummaryCard label="Transações" value={totalNormal} icon={<Wallet className="h-4 w-4" />} />
          <SummaryCard label="Cartões" value={totalCartao} icon={<CreditCard className="h-4 w-4" />} />
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <h2 className="text-sm font-semibold text-[#111827]">Por categoria</h2>
          </div>
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#6B7280]">
              Nenhuma categoria com gastos registrados.
            </div>
          ) : (
            <ul className="divide-y divide-[#F3F4F6]">
              {rows.map((row) => {
                const pct = totalGeral > 0 ? (row.total / totalGeral) * 100 : 0;
                return (
                  <li key={row.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="text-sm font-medium text-[#111827] truncate">{row.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-[#111827]">
                          {formatCurrency(row.total)}
                        </div>
                        <div className="text-[11px] text-[#9CA3AF]">{pct.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: row.color }}
                      />
                    </div>
                    <div className="flex gap-4 mt-2 text-[11px] text-[#6B7280]">
                      <span className="inline-flex items-center gap-1">
                        <Wallet className="h-3 w-3" /> {formatCurrency(row.totalNormal)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> {formatCurrency(row.totalCartao)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Relatório detalhado de cartões por responsável */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <CreditCard className="h-4 w-4 text-[#374151] shrink-0" />
              <h2 className="text-sm font-semibold text-[#111827] truncate">
                Cartões — falta para quitar
              </h2>
            </div>
            {relCartoes && relCartoes.totalAQuitar > 0 && (
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold text-[#111827]">
                  {formatCurrency(relCartoes.totalAQuitar)}
                </div>
                <div className="text-[11px] text-[#9CA3AF]">
                  {relCartoes.totalParcelas} parcela{relCartoes.totalParcelas === 1 ? "" : "s"} em aberto
                </div>
              </div>
            )}
          </div>

          {loadingRelCartoes ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" />
            </div>
          ) : !relCartoes || relCartoes.responsaveis.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#6B7280] flex flex-col items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-[#22C55E]" />
              Nenhuma parcela de cartão em aberto. Tudo quitado!
            </div>
          ) : (
            <div className="divide-y divide-[#F3F4F6]">
              {relCartoes.responsaveis.map((resp) => {
                const pctDoTotal =
                  relCartoes.totalAQuitar > 0
                    ? (resp.aQuitar / relCartoes.totalAQuitar) * 100
                    : 0;
                return (
                  <div key={resp.id} className="px-4 py-3.5">
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-7 w-7 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
                          {resp.isTitular ? (
                            <Crown className="h-3.5 w-3.5 text-[#B45309]" />
                          ) : (
                            <Users className="h-3.5 w-3.5 text-[#6B7280]" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[#111827] truncate">
                            {resp.nome}
                            {resp.isTitular && (
                              <span className="ml-1.5 text-[10px] font-medium text-[#B45309] align-middle">
                                Titular
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#9CA3AF]">
                            {resp.parcelas} parcela{resp.parcelas === 1 ? "" : "s"}
                            {resp.aVencerNoMes > 0 && (
                              <> · {formatCurrency(resp.aVencerNoMes)} vence no mês</>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-[#111827]">
                          {formatCurrency(resp.aQuitar)}
                        </div>
                        <div className="text-[11px] text-[#9CA3AF]">
                          {pctDoTotal.toFixed(0)}% do total
                        </div>
                      </div>
                    </div>

                    {/* Detalhamento por cartão */}
                    <div className="space-y-1.5 pl-9">
                      {resp.cartoes.map((c) => {
                        const pctResp =
                          resp.aQuitar > 0 ? (c.aQuitar / resp.aQuitar) * 100 : 0;
                        return (
                          <div key={c.cartaoId}>
                            <div className="flex items-center justify-between gap-2 text-[12px]">
                              <span className="flex items-center gap-1.5 min-w-0 text-[#374151]">
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: c.cor }}
                                />
                                <span className="truncate">{c.cartaoNome}</span>
                                <span className="text-[#9CA3AF]">
                                  ({c.parcelas})
                                </span>
                              </span>
                              <span className="font-medium text-[#111827] shrink-0">
                                {formatCurrency(c.aQuitar)}
                              </span>
                            </div>
                            <div className="h-1 rounded-full bg-[#F3F4F6] overflow-hidden mt-1">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pctResp}%`, backgroundColor: c.cor }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
      <div className="flex items-center gap-2 text-[#6B7280] text-xs font-medium">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-[#111827]">{formatCurrency(value)}</div>
    </div>
  );
}
