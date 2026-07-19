import { createClient } from '@supabase/supabase-js';

// database.types sera généré par `supabase gen types` lors de la connexion réelle
// En attendant, le client est non-typé (any) pour éviter les erreurs de build

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '') as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '') as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/** Récupère l'utilisateur connecté (ou null) */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

/** Récupère le profil complet de l'utilisateur connecté */
export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data } = await supabase
    .from('utilisateurs')
    .select('*, site:sites(*)')
    .eq('id', user.id)
    .single();

  return data;
}
