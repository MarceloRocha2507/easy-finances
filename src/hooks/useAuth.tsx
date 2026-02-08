import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { detectDevice, generateSessionToken, getStoredSessionToken, storeSessionToken, clearSessionToken } from '@/lib/deviceUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function registerDeviceSession(userId: string) {
  let token = getStoredSessionToken();

  if (token) {
    const { data: existing } = await supabase
      .from('device_sessions')
      .select('id, is_active')
      .eq('session_token', token)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('device_sessions')
        .update({ is_active: true, last_active_at: new Date().toISOString() })
        .eq('id', existing.id);
      await enforceDeviceLimit(userId);
      return;
    }
  }

  token = generateSessionToken();
  storeSessionToken(token);
  const { device_name, device_type } = detectDevice();

  await supabase.from('device_sessions').insert({
    user_id: userId,
    device_name,
    device_type,
    session_token: token,
    ip_address: null,
  });

  await enforceDeviceLimit(userId);
}

async function enforceDeviceLimit(userId: string) {
  // Fetch profile to get plan + extras
  const { data: profile } = await supabase
    .from('profiles')
    .select('tipo_plano, dispositivos_extras')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return;

  const baseLimits: Record<string, number> = { teste: 1, mensal: 1, anual: 2, ilimitado: Infinity };
  const base = baseLimits[profile.tipo_plano || 'teste'] ?? 1;
  if (base === Infinity) return;
  const limit = base + ((profile as any).dispositivos_extras ?? 0);

  const { data: active } = await supabase
    .from('device_sessions')
    .select('id, session_token')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('last_active_at', { ascending: true });

  if (!active || active.length <= limit) return;

  const toDeactivate = active.slice(0, active.length - limit);
  for (const s of toDeactivate) {
    await supabase.from('device_sessions').update({ is_active: false }).eq('id', s.id);
  }
}

async function deactivateCurrentSession(userId: string) {
  const token = getStoredSessionToken();
  if (!token) return;
  await supabase
    .from('device_sessions')
    .update({ is_active: false })
    .eq('session_token', token)
    .eq('user_id', userId);
  clearSessionToken();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const registeredRef = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user && !registeredRef.current) {
          registeredRef.current = true;
          setTimeout(() => {
            registerDeviceSession(session.user.id);
          }, 0);
        }

        if (event === 'SIGNED_OUT') {
          registeredRef.current = false;
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    if (user) {
      await deactivateCurrentSession(user.id);
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
