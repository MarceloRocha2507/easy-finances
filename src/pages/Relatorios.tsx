import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { BarChart3, CreditCard, Wallet, Loader2 } from "lucide-react";

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

  const { data: txExpenses = [], isLoading: loadingTx } = useQuery({
    queryKey: ["relatorios", "transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("category_id, amount")
        .eq("user_id", user!.id)
        .eq("type", "expense")
        .eq("desconsiderada", false)
        .limit(10000);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: cardExpenses = [], isLoading: loadingCard } = useQuery({
    queryKey: ["relatorios", "compras-cartao", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("compras_cartao")
        .select("categoria_id, valor_total")
        .eq("user_id", user!.id)
        .eq("ativo", true)
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
    for (const c of cardExpenses) {
      if (!c.categoria_id) continue;
      const row = getOrInit(c.categoria_id);
      row.totalCartao += Number(c.valor_total) || 0;
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

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-[#374151]" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-[#111827]">Relatórios</h1>
            <p className="text-sm text-[#6B7280]">Gastos por categoria — transações e cartões</p>
          </div>
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
