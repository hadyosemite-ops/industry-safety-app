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
  username?: string;
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
  /** `identifiant` = nom d'utilisateur (voir migration 005 — résolu en email côté serveur avant connexion). */
  signIn: (identifiant: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** `identifiant` = nom d'utilisateur. */
  resetPassword: (identifiant: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
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
      .select('id, email, username, nom, prenom, roles, site_id, actif')
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

  async function signIn(identifiant: string, password: string) {
    const email = await resoudreEmail(identifiant);
    if (!email) {
      // Message générique — ne pas révéler si c'est le nom d'utilisateur qui est inconnu.
      return { error: 'Nom d\'utilisateur ou mot de passe incorrect.' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: traduireErreurAuth(error.message) };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function resetPassword(identifiant: string) {
    const email = await resoudreEmail(identifiant);
    if (!email) {
      // Toujours renvoyer un succès silencieux — évite de révéler quels noms
      // d'utilisateur existent (l'écran affiche le même message dans les deux cas).
      return { error: null };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) return { error: traduireErreurAuth(error.message) };
    return { error: null };
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: traduireErreurAuth(error.message) };
    return { error: null };
  }

  const api: AuthApi = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    ready: !loading && (!session?.user || !profileLoading),
    signIn,
    signOut,
    resetPassword,
    updatePassword,
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

/**
 * Résout un nom d'utilisateur en email via la fonction RPC `username_to_email`
 * (migration 005) — appelable sans authentification (rôle anon), nécessaire
 * puisque l'utilisateur n'est pas encore connecté à ce stade.
 */
async function resoudreEmail(identifiant: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('username_to_email', { p_username: identifiant.trim() });
  if (error) return null;
  return (data as string | null) ?? null;
}

function traduireErreurAuth(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Nom d\'utilisateur ou mot de passe incorrect.';
  if (message.includes('Email not confirmed')) return 'Compte non confirmé — vérifiez votre email.';
  if (message.includes('rate limit')) return 'Trop de tentatives d\'envoi d\'email — réessayez dans quelques minutes.';
  if (message.includes('Password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères.';
  return message;
}
