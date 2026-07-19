// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute — bloque l'accès aux routes applicatives sans session Supabase
// valide. Redirige vers /login en conservant la route d'origine (état `from`)
// pour y revenir après connexion.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/PageLoader';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
