// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute — bloque l'accès aux routes applicatives sans session Supabase
// valide. Redirige vers /login en conservant la route d'origine (état `from`)
// pour y revenir après connexion.
//
// Prop optionnelle `roles` : restreint en plus l'accès aux utilisateurs dont
// le profil (`profile.roles`) contient au moins un des rôles listés. C'est un
// garde-fou côté UI seulement — la source de vérité reste les policies RLS
// Supabase ; ce garde évite juste d'afficher un module entier à un rôle qui
// n'a de toute façon aucun droit dessus (ex. "Base de données").
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/PageLoader';
import type { RoleUtilisateur } from '@/modules/ptw/types';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Si fourni, l'accès est restreint aux utilisateurs ayant au moins un de ces rôles */
  roles?: RoleUtilisateur[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { session, loading, profile, ready } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && roles.length > 0) {
    // Le profil (et ses rôles) se charge après la session — on attend qu'il
    // soit prêt avant de trancher, pour ne pas rediriger à tort pendant le
    // court instant où `profile` est encore null.
    if (!ready) return <PageLoader />;

    const autorise = profile?.roles?.some(r => roles.includes(r as RoleUtilisateur)) ?? false;
    if (!autorise) {
      return <Navigate to="/at" replace />;
    }
  }

  return <>{children}</>;
}
