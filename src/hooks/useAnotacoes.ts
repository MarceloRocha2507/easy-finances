import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Anotacao {
  id: string;
  usuario_id: string;
  titulo: string;
  conteudo: string | null;
  fixado: boolean;
  created_at: string;
  updated_at: string;
}

export function useAnotacoes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: anotacoes = [], isLoading } = useQuery({
    queryKey: ["anotacoes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("anotacoes")
        .select("*")
        .order("fixado", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao buscar anotações:", error);
        throw error;
      }
      return data as Anotacao[];
    },
    enabled: !!user,
  });

  const createAnotacao = useMutation({
    mutationFn: async (anotacao: { titulo: string; conteudo?: string; fixado?: boolean }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("anotacoes")
        .insert([{ ...anotacao, usuario_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anotacoes"] });
      toast.success("Anotação criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar anotação");
      console.error(error);
    },
  });

  const updateAnotacao = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Anotacao> & { id: string }) => {
      const { data, error } = await supabase
        .from("anotacoes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anotacoes"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar anotação");
      console.error(error);
    },
  });

  const deleteAnotacao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("anotacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anotacoes"] });
      toast.success("Anotação excluída");
    },
    onError: (error) => {
      toast.error("Erro ao excluir anotação");
      console.error(error);
    },
  });

  const toggleFixar = useMutation({
    mutationFn: async ({ id, fixado }: { id: string; fixado: boolean }) => {
      const { error } = await supabase
        .from("anotacoes")
        .update({ fixado: !fixado })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anotacoes"] });
    },
  });

  return {
    anotacoes,
    isLoading,
    createAnotacao,
    updateAnotacao,
    deleteAnotacao,
    toggleFixar,
  };
}
