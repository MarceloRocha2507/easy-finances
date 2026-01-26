import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

export interface Banco {
  id: string;
  user_id: string;
  nome: string;
  codigo: string | null;
  cor: string;
  logo_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface BancoComResumo extends Banco {
  quantidadeCartoes: number;
  limiteTotal: number;
  faturaTotal: number;
  disponivelTotal: number;
}

export type NovoBanco = {
  nome: string;
  codigo?: string;
  cor?: string;
  logo_url?: string;
};

export type AtualizarBanco = Partial<NovoBanco> & {
  ativo?: boolean;
};

// ============ Funções CRUD ============

export async function listarBancos(): Promise<Banco[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data, error } = await supabase
    .from("bancos")
    .select("*")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("nome");

  if (error) throw error;
  return (data || []) as Banco[];
}

export async function listarTodosBancos(): Promise<Banco[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data, error } = await supabase
    .from("bancos")
    .select("*")
    .eq("user_id", user.id)
    .order("ativo", { ascending: false })
    .order("nome");

  if (error) throw error;
  return (data || []) as Banco[];
}

export async function listarBancosComResumo(): Promise<BancoComResumo[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  // Buscar bancos
  const { data: bancos, error: erBancos } = await supabase
    .from("bancos")
    .select("*")
    .eq("user_id", user.id)
    .eq("ativo", true)
    .order("nome");

  if (erBancos) throw erBancos;

  // Buscar cartões com banco_id
  const { data: cartoes, error: erCartoes } = await supabase
    .from("cartoes")
    .select("id, nome, limite, banco_id")
    .eq("user_id", user.id);

  if (erCartoes) throw erCartoes;

  // Buscar compras ativas
  const { data: compras, error: erCompras } = await supabase
    .from("compras_cartao")
    .select("id, cartao_id")
    .eq("user_id", user.id)
    .eq("ativo", true);

  if (erCompras) throw erCompras;

  // Buscar parcelas não pagas
  const { data: parcelas, error: erParcelas } = await supabase
    .from("parcelas_cartao")
    .select("compra_id, valor, paga")
    .eq("paga", false)
    .eq("ativo", true);

  if (erParcelas) throw erParcelas;

  // Mapear compra_id -> cartao_id
  const compraToCartao = new Map<string, string>();
  (compras || []).forEach((c) => {
    compraToCartao.set(c.id, c.cartao_id);
  });

  // Calcular fatura por cartão
  const faturasPorCartao = new Map<string, number>();
  (parcelas || []).forEach((p) => {
    const cartaoId = compraToCartao.get(p.compra_id);
    if (cartaoId) {
      const atual = faturasPorCartao.get(cartaoId) || 0;
      faturasPorCartao.set(cartaoId, atual + Math.abs(Number(p.valor)));
    }
  });

  // Agrupar cartões por banco
  const resultado: BancoComResumo[] = (bancos || []).map((banco) => {
    const cartoesVinculados = (cartoes || []).filter((c) => c.banco_id === banco.id);
    const quantidadeCartoes = cartoesVinculados.length;
    const limiteTotal = cartoesVinculados.reduce((acc, c) => acc + Number(c.limite || 0), 0);
    const faturaTotal = cartoesVinculados.reduce(
      (acc, c) => acc + (faturasPorCartao.get(c.id) || 0),
      0
    );
    const disponivelTotal = limiteTotal - faturaTotal;

    return {
      ...(banco as Banco),
      quantidadeCartoes,
      limiteTotal,
      faturaTotal,
      disponivelTotal,
    };
  });

  return resultado;
}

export async function criarBanco(dados: NovoBanco): Promise<Banco> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data, error } = await supabase
    .from("bancos")
    .insert({
      user_id: user.id,
      nome: dados.nome,
      codigo: dados.codigo || null,
      cor: dados.cor || "#6366f1",
      logo_url: dados.logo_url || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Banco;
}

export async function atualizarBanco(id: string, dados: AtualizarBanco): Promise<Banco> {
  const { data, error } = await supabase
    .from("bancos")
    .update({
      ...(dados.nome !== undefined && { nome: dados.nome }),
      ...(dados.codigo !== undefined && { codigo: dados.codigo }),
      ...(dados.cor !== undefined && { cor: dados.cor }),
      ...(dados.logo_url !== undefined && { logo_url: dados.logo_url }),
      ...(dados.ativo !== undefined && { ativo: dados.ativo }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Banco;
}

export async function excluirBanco(id: string): Promise<void> {
  // Soft delete - apenas desativa
  const { error } = await supabase
    .from("bancos")
    .update({ ativo: false })
    .eq("id", id);

  if (error) throw error;
}

export async function reativarBanco(id: string): Promise<Banco> {
  const { data, error } = await supabase
    .from("bancos")
    .update({ ativo: true })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Banco;
}

// ============ React Query Hooks ============

export function useBancos() {
  return useQuery({
    queryKey: ["bancos"],
    queryFn: listarBancos,
  });
}

export function useTodosBancos() {
  return useQuery({
    queryKey: ["bancos", "todos"],
    queryFn: listarTodosBancos,
  });
}

export function useBancosComResumo() {
  return useQuery({
    queryKey: ["bancos", "resumo"],
    queryFn: listarBancosComResumo,
  });
}

export function useCriarBanco() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: criarBanco,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bancos"] });
      toast({ title: "Banco cadastrado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao cadastrar banco", variant: "destructive" });
    },
  });
}

export function useAtualizarBanco() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: AtualizarBanco }) =>
      atualizarBanco(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bancos"] });
      queryClient.invalidateQueries({ queryKey: ["cartoes"] });
      toast({ title: "Banco atualizado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar banco", variant: "destructive" });
    },
  });
}

export function useExcluirBanco() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: excluirBanco,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bancos"] });
      toast({ title: "Banco desativado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao desativar banco", variant: "destructive" });
    },
  });
}

export function useReativarBanco() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: reativarBanco,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bancos"] });
      toast({ title: "Banco reativado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao reativar banco", variant: "destructive" });
    },
  });
}
