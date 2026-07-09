import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Relatório detalhado de cartões por responsável.
 *
 * "Falta para quitar" = soma de todas as parcelas ainda não pagas
 * (paga = false) das compras ativas, agrupadas por responsável e
 * detalhadas por cartão. É o total em aberto, independente do mês.
 */

export interface CartaoQuitacao {
  cartaoId: string;
  cartaoNome: string;
  cor: string;
  aQuitar: number;
  parcelas: number;
}

export interface ResponsavelQuitacao {
  id: string;
  nome: string;
  isTitular: boolean;
  aQuitar: number;
  parcelas: number;
  cartoes: CartaoQuitacao[];
  /** Quanto vence neste mês de referência (mes_referencia = mesRef) */
  aVencerNoMes: number;
}

export interface RelatorioCartoes {
  responsaveis: ResponsavelQuitacao[];
  totalAQuitar: number;
  totalParcelas: number;
}

export function useRelatorioCartoes(mesRef?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["relatorio-cartoes-responsavel", user?.id, mesRef ?? null],
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
    queryFn: async (): Promise<RelatorioCartoes> => {
      // 1. Cartões (para nome e cor)
      const { data: cartoes, error: cartoesErr } = await (supabase as any)
        .from("cartoes")
        .select("id, nome, cor")
        .eq("user_id", user!.id);
      if (cartoesErr) throw cartoesErr;

      const cartaoMap = new Map<string, { nome: string; cor: string }>();
      (cartoes ?? []).forEach((c: any) => {
        cartaoMap.set(c.id, { nome: c.nome, cor: c.cor || "#9CA3AF" });
      });

      // 2. Responsáveis ativos (titular primeiro)
      const { data: responsaveis, error: respErr } = await (supabase as any)
        .from("responsaveis")
        .select("id, nome, apelido, is_titular")
        .eq("user_id", user!.id)
        .eq("ativo", true)
        .order("is_titular", { ascending: false });
      if (respErr) throw respErr;

      const titular = (responsaveis ?? []).find((r: any) => r.is_titular);
      const titularId: string | null = titular?.id ?? null;

      // 3. Compras ativas (para mapear compra -> cartão / responsável)
      const { data: compras, error: comprasErr } = await (supabase as any)
        .from("compras_cartao")
        .select("id, cartao_id, responsavel_id")
        .eq("user_id", user!.id)
        .eq("ativo", true);
      if (comprasErr) throw comprasErr;

      const compraCartao = new Map<string, string>();
      const compraResponsavel = new Map<string, string | null>();
      const compraIds: string[] = [];
      (compras ?? []).forEach((c: any) => {
        compraCartao.set(c.id, c.cartao_id);
        // Compras sem responsável são atribuídas ao titular (convenção do app)
        compraResponsavel.set(c.id, c.responsavel_id ?? titularId);
        compraIds.push(c.id);
      });

      // 4. Parcelas em aberto (não pagas) das compras ativas
      let parcelas: any[] = [];
      if (compraIds.length > 0) {
        // Supabase limita o tamanho do IN; paginar em blocos de 500
        for (let i = 0; i < compraIds.length; i += 500) {
          const bloco = compraIds.slice(i, i + 500);
          const { data, error } = await (supabase as any)
            .from("parcelas_cartao")
            .select("valor, compra_id, mes_referencia")
            .in("compra_id", bloco)
            .eq("ativo", true)
            .eq("paga", false)
            .limit(10000);
          if (error) throw error;
          if (data) parcelas = parcelas.concat(data);
        }
      }

      // 5. Agregar por responsável e por cartão
      type Acc = {
        info: { id: string; nome: string; isTitular: boolean };
        aQuitar: number;
        parcelas: number;
        aVencerNoMes: number;
        cartoes: Map<string, CartaoQuitacao>;
      };
      const accMap = new Map<string, Acc>();
      const initAcc = (id: string): Acc => {
        if (!accMap.has(id)) {
          const r = (responsaveis ?? []).find((x: any) => x.id === id);
          accMap.set(id, {
            info: {
              id,
              nome: r ? (r.apelido || r.nome) : "Sem responsável",
              isTitular: r?.is_titular ?? false,
            },
            aQuitar: 0,
            parcelas: 0,
            aVencerNoMes: 0,
            cartoes: new Map(),
          });
        }
        return accMap.get(id)!;
      };

      for (const p of parcelas) {
        const respId = compraResponsavel.get(p.compra_id) ?? "sem-responsavel";
        const cartaoId = compraCartao.get(p.compra_id);
        if (!cartaoId) continue;
        const valor = Number(p.valor) || 0;

        const acc = initAcc(respId);
        acc.aQuitar += valor;
        acc.parcelas += 1;
        if (mesRef && typeof p.mes_referencia === "string" && p.mes_referencia.startsWith(mesRef.slice(0, 7))) {
          acc.aVencerNoMes += valor;
        }

        const meta = cartaoMap.get(cartaoId) ?? { nome: "Cartão", cor: "#9CA3AF" };
        if (!acc.cartoes.has(cartaoId)) {
          acc.cartoes.set(cartaoId, {
            cartaoId,
            cartaoNome: meta.nome,
            cor: meta.cor,
            aQuitar: 0,
            parcelas: 0,
          });
        }
        const cAcc = acc.cartoes.get(cartaoId)!;
        cAcc.aQuitar += valor;
        cAcc.parcelas += 1;
      }

      const responsaveisResult: ResponsavelQuitacao[] = Array.from(accMap.values())
        .map((a) => ({
          id: a.info.id,
          nome: a.info.nome,
          isTitular: a.info.isTitular,
          aQuitar: a.aQuitar,
          parcelas: a.parcelas,
          aVencerNoMes: a.aVencerNoMes,
          cartoes: Array.from(a.cartoes.values()).sort((x, y) => y.aQuitar - x.aQuitar),
        }))
        .filter((r) => r.aQuitar > 0)
        .sort((x, y) => {
          if (x.isTitular !== y.isTitular) return x.isTitular ? -1 : 1;
          return y.aQuitar - x.aQuitar;
        });

      const totalAQuitar = responsaveisResult.reduce((s, r) => s + r.aQuitar, 0);
      const totalParcelas = responsaveisResult.reduce((s, r) => s + r.parcelas, 0);

      return { responsaveis: responsaveisResult, totalAQuitar, totalParcelas };
    },
  });
}
