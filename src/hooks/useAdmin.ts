import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type TipoPlano = 'teste' | 'mensal' | 'anual' | 'ilimitado';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: 'admin' | 'user';
  ativo: boolean;
  tipo_plano: TipoPlano;
  data_expiracao: string | null;
  motivo_desativacao: string | null;
  banned_until: string | null;
  last_sign_in_at: string | null;
}

export interface AdminStats {
  total_transacoes: number;
  total_cartoes: number;
  total_bancos: number;
  distribuicao_planos: Record<string, number>;
}

export interface UserDetails {
  total_transacoes: number;
  total_cartoes: number;
  total_bancos: number;
  last_sign_in_at: string | null;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  email: string;
  tabela: string;
  acao: string;
  created_at: string;
}

export function useAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    async function checkAdminRole() {
      if (!user) { setIsAdmin(false); setIsCheckingRole(false); return; }
      try {
        const { data, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        if (error) throw error;
        setIsAdmin(!!data);
      } catch (error) {
        console.error('Erro ao verificar role:', error);
        setIsAdmin(false);
      } finally {
        setIsCheckingRole(false);
      }
    }
    checkAdminRole();
  }, [user]);

  async function callAdminFunction(body: Record<string, unknown>) {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(body)
      }
    );
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Erro na requisição');
    return result;
  }

  async function fetchUsers() {
    if (!isAdmin) return;
    setIsLoadingUsers(true);
    try {
      const result = await callAdminFunction({ action: 'list' });
      setUsers(result.users || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar usuários';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setIsLoadingUsers(false);
    }
  }

  async function fetchStats() {
    if (!isAdmin) return;
    setIsLoadingStats(true);
    try {
      const result = await callAdminFunction({ action: 'stats' });
      setStats(result);
    } catch (error: unknown) {
      console.error('Erro ao buscar stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }

  async function fetchUserDetails(user_id: string): Promise<UserDetails> {
    return await callAdminFunction({ action: 'user-details', user_id });
  }

  async function fetchActivity(): Promise<ActivityLog[]> {
    const result = await callAdminFunction({ action: 'activity' });
    return result.logs || [];
  }

  async function createUser(email: string, password: string, full_name?: string, tipo_plano?: TipoPlano) {
    if (!isAdmin) throw new Error('Acesso negado');
    const result = await callAdminFunction({ action: 'create', email, password, full_name, tipo_plano: tipo_plano || 'mensal' });
    await fetchUsers();
    return result.user;
  }

  async function updateUser(user_id: string, data: { email?: string; full_name?: string; tipo_plano?: TipoPlano }) {
    if (!isAdmin) throw new Error('Acesso negado');
    await callAdminFunction({ action: 'update', user_id, ...data });
    await fetchUsers();
  }

  async function toggleUserStatus(user_id: string, ativo: boolean, motivo_desativacao?: string) {
    if (!isAdmin) throw new Error('Acesso negado');
    await callAdminFunction({ action: 'toggle-status', user_id, ativo, motivo_desativacao });
    await fetchUsers();
  }

  async function resetPassword(user_id: string): Promise<string> {
    if (!isAdmin) throw new Error('Acesso negado');
    const result = await callAdminFunction({ action: 'reset-password', user_id });
    return result.new_password;
  }

  async function deleteUser(user_id: string) {
    if (!isAdmin) throw new Error('Acesso negado');
    await callAdminFunction({ action: 'delete', user_id });
    await fetchUsers();
  }

  async function bulkRenew(user_ids: string[], tipo_plano: TipoPlano) {
    if (!isAdmin) throw new Error('Acesso negado');
    await callAdminFunction({ action: 'bulk-renew', user_ids, tipo_plano });
    await fetchUsers();
  }

  async function bulkToggle(user_ids: string[], ativo: boolean, motivo_desativacao?: string) {
    if (!isAdmin) throw new Error('Acesso negado');
    await callAdminFunction({ action: 'bulk-toggle', user_ids, ativo, motivo_desativacao });
    await fetchUsers();
  }

  return {
    isAdmin, isCheckingRole, users, isLoadingUsers, stats, isLoadingStats,
    fetchUsers, fetchStats, fetchUserDetails, fetchActivity,
    createUser, updateUser, toggleUserStatus, resetPassword,
    deleteUser, bulkRenew, bulkToggle
  };
}
