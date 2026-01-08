import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type TipoAlertaConfig = {
  id: string;
  label: string;
  padrao: boolean;
};

export type CategoriaAlertas = {
  id: string;
  label: string;
  icone: string;
  alertas: TipoAlertaConfig[];
};

// Lista de todos os tipos de alertas disponíveis organizados por categoria
export const CATEGORIAS_ALERTAS: CategoriaAlertas[] = [
  {
    id: "cartao",
    label: "Cartões de Crédito",
    icone: "credit-card",
    alertas: [
      { id: "cartao_limite_critico", label: "Limite crítico (≥90%)", padrao: true },
      { id: "cartao_limite_alto", label: "Limite alto (≥75%)", padrao: true },
      { id: "cartao_fatura_vencida", label: "Fatura vencida", padrao: true },
      { id: "cartao_fatura_hoje", label: "Fatura vence hoje", padrao: true },
      { id: "cartao_fatura_proxima", label: "Fatura vence em 1-3 dias", padrao: true },
      { id: "cartao_fatura_semana", label: "Fatura vence em 4-7 dias", padrao: false },
      { id: "cartao_fatura_quinzena", label: "Fatura vence em 8-15 dias", padrao: false },
    ],
  },
  {
    id: "transacao",
    label: "Transações",
    icone: "receipt",
    alertas: [
      { id: "transacao_vencida", label: "Conta atrasada", padrao: true },
      { id: "transacao_hoje", label: "Conta vence hoje", padrao: true },
      { id: "transacao_proxima", label: "Conta próxima do vencimento", padrao: true },
      { id: "transacao_receita", label: "Receita pendente a receber", padrao: true },
    ],
  },
  {
    id: "meta",
    label: "Metas",
    icone: "target",
    alertas: [
      { id: "meta_atingida", label: "Meta atingida", padrao: true },
      { id: "meta_proxima", label: "Meta quase completa (≥90%)", padrao: true },
      { id: "meta_prazo_vencido", label: "Prazo da meta vencido", padrao: true },
      { id: "meta_prazo_proximo", label: "Prazo da meta se aproxima", padrao: true },
    ],
  },
  {
    id: "orcamento",
    label: "Orçamentos",
    icone: "piggy-bank",
    alertas: [
      { id: "orcamento_excedido", label: "Orçamento estourado", padrao: true },
      { id: "orcamento_alerta", label: "Orçamento quase no limite (≥80%)", padrao: true },
    ],
  },
  {
    id: "acerto",
    label: "Acertos",
    icone: "users",
    alertas: [
      { id: "acerto_pendente", label: "Acerto pendente", padrao: true },
      { id: "acerto_parcial", label: "Acerto parcial", padrao: true },
    ],
  },
  {
    id: "economia",
    label: "Economia",
    icone: "trending-up",
    alertas: [
      { id: "economia_aumento", label: "Gastos aumentaram", padrao: true },
      { id: "economia_reducao", label: "Você economizou", padrao: true },
    ],
  },
];

// Mapeamento de ID do alerta para tipo de preferência
export function mapearAlertaParaTipo(alertaId: string): string | null {
  // Cartões
  if (alertaId.startsWith("limite-critico-")) return "cartao_limite_critico";
  if (alertaId.startsWith("limite-alto-")) return "cartao_limite_alto";
  if (alertaId.startsWith("fatura-vencida-")) return "cartao_fatura_vencida";
  if (alertaId.startsWith("fatura-hoje-")) return "cartao_fatura_hoje";
  if (alertaId.startsWith("fatura-proxima-")) return "cartao_fatura_proxima";
  if (alertaId.startsWith("fatura-semana-")) return "cartao_fatura_semana";
  if (alertaId.startsWith("fatura-quinzena-")) return "cartao_fatura_quinzena";
  
  // Transações
  if (alertaId.startsWith("transacao-vencida-")) return "transacao_vencida";
  if (alertaId.startsWith("transacao-hoje-")) return "transacao_hoje";
  if (alertaId.startsWith("transacao-proxima-")) return "transacao_proxima";
  if (alertaId.startsWith("receita-pendente-")) return "transacao_receita";
  
  // Metas
  if (alertaId.startsWith("meta-atingida-")) return "meta_atingida";
  if (alertaId.startsWith("meta-proxima-")) return "meta_proxima";
  if (alertaId.startsWith("meta-vencida-")) return "meta_prazo_vencido";
  if (alertaId.startsWith("meta-prazo-")) return "meta_prazo_proximo";
  
  // Orçamentos
  if (alertaId.startsWith("orcamento-excedido-")) return "orcamento_excedido";
  if (alertaId.startsWith("orcamento-alerta-")) return "orcamento_alerta";
  
  // Acertos
  if (alertaId.startsWith("acerto-pendente-")) return "acerto_pendente";
  if (alertaId.startsWith("acerto-parcial-")) return "acerto_parcial";
  
  // Economia
  if (alertaId === "economia-aumento-gastos") return "economia_aumento";
  if (alertaId === "economia-reducao-gastos") return "economia_reducao";
  
  return null;
}

// Obter valor padrão para um tipo de alerta
export function getValorPadrao(tipoAlerta: string): boolean {
  for (const categoria of CATEGORIAS_ALERTAS) {
    const alerta = categoria.alertas.find((a) => a.id === tipoAlerta);
    if (alerta) return alerta.padrao;
  }
  return true;
}

export type PreferenciasMap = Record<string, boolean>;

// Hook simplificado apenas para verificar preferências (sem mutations)
export function usePreferenciasLeitura() {
  const { user } = useAuth();

  const { data: preferencias = {}, isLoading } = useQuery({
    queryKey: ["preferencias-notificacao", user?.id],
    queryFn: async (): Promise<PreferenciasMap> => {
      if (!user) return {};

      const { data, error } = await supabase
        .from("preferencias_notificacao")
        .select("tipo_alerta, ativo");

      if (error) {
        console.error("Erro ao buscar preferências:", error);
        return {};
      }

      const map: PreferenciasMap = {};
      (data || []).forEach((p: any) => {
        map[p.tipo_alerta] = p.ativo;
      });

      return map;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Verificar se um alerta está ativo
  const isAlertaAtivo = (alertaId: string): boolean => {
    const tipoAlerta = mapearAlertaParaTipo(alertaId);
    if (!tipoAlerta) return true;

    if (tipoAlerta in preferencias) {
      return preferencias[tipoAlerta];
    }
    return getValorPadrao(tipoAlerta);
  };

  return {
    preferencias,
    isLoading,
    isAlertaAtivo,
  };
}

// Hook completo para página de configurações (com mutations)
export function usePreferenciasNotificacao() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar preferências do usuário
  const { data: preferencias = {}, isLoading } = useQuery({
    queryKey: ["preferencias-notificacao", user?.id],
    queryFn: async (): Promise<PreferenciasMap> => {
      if (!user) return {};

      const { data, error } = await supabase
        .from("preferencias_notificacao")
        .select("tipo_alerta, ativo");

      if (error) {
        console.error("Erro ao buscar preferências:", error);
        return {};
      }

      const map: PreferenciasMap = {};
      (data || []).forEach((p: any) => {
        map[p.tipo_alerta] = p.ativo;
      });

      return map;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Verificar se um alerta está ativo
  const isAlertaAtivo = (alertaId: string): boolean => {
    const tipoAlerta = mapearAlertaParaTipo(alertaId);
    if (!tipoAlerta) return true;

    if (tipoAlerta in preferencias) {
      return preferencias[tipoAlerta];
    }
    return getValorPadrao(tipoAlerta);
  };

  // Obter valor atual de uma preferência (considerando padrão)
  const getPreferencia = (tipoAlerta: string): boolean => {
    if (tipoAlerta in preferencias) {
      return preferencias[tipoAlerta];
    }
    return getValorPadrao(tipoAlerta);
  };

  // Salvar preferência individual
  const salvarPreferencia = useMutation({
    mutationFn: async ({ tipoAlerta, ativo }: { tipoAlerta: string; ativo: boolean }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("preferencias_notificacao")
        .upsert({
          user_id: user.id,
          tipo_alerta: tipoAlerta,
          ativo,
        }, { onConflict: "user_id,tipo_alerta" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferencias-notificacao"] });
    },
  });

  // Ativar todos de uma categoria
  const ativarCategoria = useMutation({
    mutationFn: async (categoriaId: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      const categoria = CATEGORIAS_ALERTAS.find((c) => c.id === categoriaId);
      if (!categoria) throw new Error("Categoria não encontrada");

      const registros = categoria.alertas.map((a) => ({
        user_id: user.id,
        tipo_alerta: a.id,
        ativo: true,
      }));

      const { error } = await supabase
        .from("preferencias_notificacao")
        .upsert(registros, { onConflict: "user_id,tipo_alerta" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferencias-notificacao"] });
    },
  });

  // Restaurar padrões (deletar todas as preferências)
  const restaurarPadroes = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("preferencias_notificacao")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferencias-notificacao"] });
    },
  });

  return {
    preferencias,
    isLoading,
    isAlertaAtivo,
    getPreferencia,
    salvarPreferencia,
    ativarCategoria,
    restaurarPadroes,
  };
}
