import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UltimaAlteracao {
  id: string;
  user_id: string;
  tabela: "compras_cartao" | "parcelas_cartao";
  registro_id: string;
  acao: "INSERT" | "UPDATE" | "DELETE";
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  created_at: string;
}

export function useUltimaAlteracao() {
  return useQuery({
    queryKey: ["ultima-alteracao"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Buscar última alteração das últimas 24h
      const limite24h = new Date();
      limite24h.setHours(limite24h.getHours() - 24);

      const { data, error } = await supabase
        .from("auditoria_cartao")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", limite24h.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as UltimaAlteracao | null;
    },
    refetchInterval: 30000, // Atualiza a cada 30s
  });
}

export function useDesfazerAlteracao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registro: UltimaAlteracao) => {
      const { acao, tabela, registro_id, dados_anteriores, dados_novos } = registro;

      // Desfazer INSERT = deletar o registro criado
      if (acao === "INSERT") {
        if (tabela === "compras_cartao") {
          // Deletar parcelas associadas primeiro
          const { error: parcelasError } = await supabase
            .from("parcelas_cartao")
            .delete()
            .eq("compra_id", registro_id);
          
          if (parcelasError) throw parcelasError;
        }

        const { error } = await supabase
          .from(tabela)
          .delete()
          .eq("id", registro_id);

        if (error) throw error;
        return { tipo: "INSERT", sucesso: true };
      }

      // Desfazer UPDATE = restaurar dados_anteriores
      if (acao === "UPDATE" && dados_anteriores) {
        // Filtrar campos que não devem ser atualizados
        const { id, created_at, user_id, ...dadosRestaurar } = dados_anteriores as Record<string, unknown>;
        
        const { error } = await supabase
          .from(tabela)
          .update(dadosRestaurar)
          .eq("id", registro_id);

        if (error) throw error;
        return { tipo: "UPDATE", sucesso: true };
      }

      // Desfazer DELETE = re-inserir dados_anteriores
      if (acao === "DELETE" && dados_anteriores) {
        const dadosInserir = { ...dados_anteriores };
        
        const { error } = await (supabase as any)
          .from(tabela)
          .insert(dadosInserir);

        if (error) throw error;

        // Se for compra, também restaurar parcelas deletadas próximas no tempo
        if (tabela === "compras_cartao") {
          const compraId = registro_id;
          const tempoRegistro = new Date(registro.created_at);
          const tempoLimite = new Date(tempoRegistro.getTime() + 5000); // 5 segundos depois
          const tempoInicio = new Date(tempoRegistro.getTime() - 1000); // 1 segundo antes

          // Buscar parcelas deletadas do mesmo período
          const { data: parcelasAuditoria } = await supabase
            .from("auditoria_cartao")
            .select("*")
            .eq("tabela", "parcelas_cartao")
            .eq("acao", "DELETE")
            .gte("created_at", tempoInicio.toISOString())
            .lte("created_at", tempoLimite.toISOString());

          if (parcelasAuditoria && parcelasAuditoria.length > 0) {
            // Filtrar apenas parcelas dessa compra
            const parcelasParaRestaurar = parcelasAuditoria
              .filter((p) => {
                const dados = p.dados_anteriores as Record<string, unknown> | null;
                return dados && dados.compra_id === compraId;
              })
              .map((p) => p.dados_anteriores);

            if (parcelasParaRestaurar.length > 0) {
              await (supabase as any)
                .from("parcelas_cartao")
                .insert(parcelasParaRestaurar);
            }
          }
        }

        return { tipo: "DELETE", sucesso: true };
      }

      throw new Error("Não foi possível desfazer esta alteração");
    },
    onSuccess: (result) => {
      const mensagens = {
        INSERT: "Inserção desfeita com sucesso!",
        UPDATE: "Alteração desfeita com sucesso!",
        DELETE: "Exclusão desfeita com sucesso!",
      };
      toast.success(mensagens[result.tipo as keyof typeof mensagens] || "Alteração desfeita!");
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["cartoes"] });
      queryClient.invalidateQueries({ queryKey: ["compras-cartao"] });
      queryClient.invalidateQueries({ queryKey: ["parcelas-fatura"] });
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      queryClient.invalidateQueries({ queryKey: ["ultima-alteracao"] });
    },
    onError: (error) => {
      console.error("Erro ao desfazer:", error);
      toast.error("Erro ao desfazer alteração");
    },
  });
}

// Helpers para formatação
export function formatarAcao(acao: string): string {
  const map: Record<string, string> = {
    INSERT: "Inserção",
    UPDATE: "Alteração",
    DELETE: "Exclusão",
  };
  return map[acao] || acao;
}

export function formatarTabela(tabela: string): string {
  const map: Record<string, string> = {
    compras_cartao: "Compra",
    parcelas_cartao: "Parcela",
  };
  return map[tabela] || tabela;
}

export function formatarTempoRelativo(dataStr: string): string {
  const data = new Date(dataStr);
  const agora = new Date();
  const diffMs = agora.getTime() - data.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMin / 60);

  if (diffMin < 1) return "agora mesmo";
  if (diffMin === 1) return "há 1 minuto";
  if (diffMin < 60) return `há ${diffMin} minutos`;
  if (diffHoras === 1) return "há 1 hora";
  if (diffHoras < 24) return `há ${diffHoras} horas`;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
