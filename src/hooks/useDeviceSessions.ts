import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import {
  detectDevice,
  generateSessionToken,
  getStoredSessionToken,
  storeSessionToken,
  clearSessionToken,
} from '@/lib/deviceUtils';

type TipoPlano = 'teste' | 'mensal' | 'anual' | 'ilimitado';

const BASE_DEVICE_LIMITS: Record<TipoPlano, number> = {
  teste: 1,
  mensal: 1,
  anual: 2,
  ilimitado: Infinity,
};

export interface DeviceSession {
  id: string;
  user_id: string;
  device_name: string;
  device_type: string;
  ip_address: string | null;
  last_active_at: string;
  created_at: string;
  session_token: string;
  is_active: boolean;
}

export function useDeviceSessions() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentToken = getStoredSessionToken();
  const tipoPlano = (profile?.tipo_plano as TipoPlano) || 'teste';
  const dispositivosExtras = (profile as any)?.dispositivos_extras ?? 0;
  const baseLimit = BASE_DEVICE_LIMITS[tipoPlano] ?? 1;
  const deviceLimit = baseLimit === Infinity ? Infinity : baseLimit + dispositivosExtras;

  // Fetch all sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['device-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active_at', { ascending: false });
      if (error) throw error;
      return data as DeviceSession[];
    },
    enabled: !!user?.id,
  });

  const activeSessions = sessions.filter((s) => s.is_active);

  // Register device on login
  const registerDevice = useCallback(async () => {
    if (!user?.id) return;

    // Check if we already have a session token for this device
    let token = getStoredSessionToken();
    if (token) {
      // Check if the token is still valid in the DB
      const { data: existing } = await supabase
        .from('device_sessions')
        .select('id, is_active')
        .eq('session_token', token)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Reactivate if inactive, update last_active
        await supabase
          .from('device_sessions')
          .update({ is_active: true, last_active_at: new Date().toISOString() })
          .eq('id', existing.id);
        queryClient.invalidateQueries({ queryKey: ['device-sessions'] });
        await enforceLimit();
        return;
      }
    }

    // New device session
    token = generateSessionToken();
    storeSessionToken(token);
    const { device_name, device_type } = detectDevice();

    await supabase.from('device_sessions').insert({
      user_id: user.id,
      device_name,
      device_type,
      session_token: token,
      ip_address: null, // IP can be captured server-side if needed
    });

    queryClient.invalidateQueries({ queryKey: ['device-sessions'] });
    await enforceLimit();
  }, [user?.id]);

  // Enforce device limit
  const enforceLimit = useCallback(async () => {
    if (!user?.id || deviceLimit === Infinity) return;

    const { data: active } = await supabase
      .from('device_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('last_active_at', { ascending: true });

    if (!active || active.length <= deviceLimit) return;

    // Deactivate oldest sessions that exceed the limit
    const toDeactivate = active.slice(0, active.length - deviceLimit);
    for (const session of toDeactivate) {
      await supabase
        .from('device_sessions')
        .update({ is_active: false })
        .eq('id', session.id);
    }

    queryClient.invalidateQueries({ queryKey: ['device-sessions'] });
  }, [user?.id, deviceLimit]);

  // Disconnect a specific device
  const disconnectDevice = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('device_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-sessions'] });
      toast({ title: 'Dispositivo desconectado', description: 'O dispositivo foi desconectado com sucesso.' });
    },
  });

  // Deactivate current session (on signOut)
  const deactivateCurrentSession = useCallback(async () => {
    const token = getStoredSessionToken();
    if (!token || !user?.id) return;
    await supabase
      .from('device_sessions')
      .update({ is_active: false })
      .eq('session_token', token)
      .eq('user_id', user.id);
    clearSessionToken();
  }, [user?.id]);

  // Heartbeat: update last_active_at every 5 minutes
  useEffect(() => {
    if (!user?.id || !currentToken) return;

    const updateHeartbeat = async () => {
      await supabase
        .from('device_sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('session_token', currentToken)
        .eq('user_id', user.id);
    };

    // Initial heartbeat
    updateHeartbeat();
    heartbeatRef.current = setInterval(updateHeartbeat, 5 * 60 * 1000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [user?.id, currentToken]);

  // Realtime: listen for changes to device_sessions
  useEffect(() => {
    if (!user?.id || !currentToken) return;

    const channel = supabase
      .channel('device-sessions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'device_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as DeviceSession;
          // If our session was deactivated by another device
          if (updated.session_token === currentToken && !updated.is_active) {
            toast({
              title: 'Sessão encerrada',
              description: `Este dispositivo foi desconectado. Outro dispositivo pode ter atingido o limite. Verifique a segurança da sua conta.`,
              variant: 'destructive',
            });
            // Sign out after a short delay
            setTimeout(() => {
              clearSessionToken();
              supabase.auth.signOut();
            }, 3000);
          }
          // Refresh the list
          queryClient.invalidateQueries({ queryKey: ['device-sessions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, currentToken]);

  return {
    sessions,
    activeSessions,
    isLoading,
    currentToken,
    deviceLimit,
    registerDevice,
    deactivateCurrentSession,
    disconnectDevice: disconnectDevice.mutate,
    isDisconnecting: disconnectDevice.isPending,
  };
}
