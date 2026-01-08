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
}

export function useAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    async function checkAdminRole() {
      if (!user) {
        setIsAdmin(false);
        setIsCheckingRole(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });

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
    
    if (!response.ok) {
      throw new Error(result.error || 'Erro na requisição');
    }

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
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoadingUsers(false);
    }
  }

  async function createUser(email: string, password: string, full_name?: string, tipo_plano?: TipoPlano) {
    if (!isAdmin) {
      throw new Error('Acesso negado');
    }

    const result = await callAdminFunction({ 
      action: 'create', 
      email, 
      password, 
      full_name,
      tipo_plano: tipo_plano || 'mensal'
    });

    await fetchUsers();
    return result.user;
  }

  async function updateUser(user_id: string, data: { email?: string; full_name?: string; tipo_plano?: TipoPlano }) {
    if (!isAdmin) {
      throw new Error('Acesso negado');
    }

    await callAdminFunction({ 
      action: 'update', 
      user_id,
      ...data
    });

    await fetchUsers();
  }

  async function toggleUserStatus(user_id: string, ativo: boolean, motivo_desativacao?: string) {
    if (!isAdmin) {
      throw new Error('Acesso negado');
    }

    await callAdminFunction({ 
      action: 'toggle-status', 
      user_id,
      ativo,
      motivo_desativacao
    });

    await fetchUsers();
  }

  async function resetPassword(user_id: string): Promise<string> {
    if (!isAdmin) {
      throw new Error('Acesso negado');
    }

    const result = await callAdminFunction({ 
      action: 'reset-password', 
      user_id
    });

    return result.new_password;
  }

  return {
    isAdmin,
    isCheckingRole,
    users,
    isLoadingUsers,
    fetchUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    resetPassword
  };
}
