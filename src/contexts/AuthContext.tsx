// ─────────────────────────────────────────────────────────────────────────────
// AuthContext — session Supabase + profil métier (table `utilisateurs`).
// Le profil porte les rôles (role_utilisateur[]) utilisés par les services
// PTW (atService, permisService...) pour les vérifications de permission.
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface UtilisateurProfile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
  site_id: string;
  actif: boolean;
}

interface AuthApi {
  session: Session | null;
  user: User | null;
  profile: UtilisateurProfile | null;
  loading: boolean;
  /** true une fois la session ET (si connecté) le profil chargés */
  ready: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UtilisateurProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  async function loadProfile(userId: string) {
    setProfileLoading(true);
    const { data } = await supabase
      .from('utilisateurs')
      .select('id, email, nom, prenom, roles, site_id, actif')
      .eq('id', userId)
      .single();
    setProfile((data as UtilisateurProfile) ?? null);
    setProfileLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
      if (s?.user) void loadProfile(s.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        void loadProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: traduireErreurAuth(error.message) };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const api: AuthApi = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    ready: !loading && (!session?.user || !profileLoading),
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={api}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>.');
  }
  return ctx;
}

function traduireErreurAuth(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (message.includes('Email not confirmed')) return 'Compte non confirmé — vérifiez votre email.';
  return message;
}
