// ============================================================
// Utilisateurs Service — gestion des rôles/statut des comptes existants
// (rubrique "Base de données"). La création de comptes est hors
// périmètre : les invitations se font depuis le dashboard Supabase.
// RLS : "Admin gère les utilisateurs de son site" (migration 003) —
// lecture/écriture réservées à ADMIN pour les utilisateurs de son site.
// ============================================================

import { supabase } from '@/lib/supabase';
import type { Utilisateur, ServiceResult } from '../types';
import type { UpdateUtilisateurRolesPayload } from '../types';

/** Liste les utilisateurs d'un site */
export async function listerUtilisateurs(siteId: string): Promise<ServiceResult<Utilisateur[]>> {
  try {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('id, email, nom, prenom, roles, site_id, habilitations, telephone, actif, created_at')
      .eq('site_id', siteId)
      .order('nom', { ascending: true });

    if (error) throw error;
    return { data: data as Utilisateur[] };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

/** Met à jour les rôles et le statut actif d'un utilisateur — réservé ADMIN côté RLS */
export async function modifierRolesEtStatut(
  id: string,
  payload: UpdateUtilisateurRolesPayload,
): Promise<ServiceResult<Utilisateur>> {
  try {
    const { data, error } = await supabase
      .from('utilisateurs')
      .update({ roles: payload.roles, actif: payload.actif })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Utilisateur };
  } catch (err) {
    return { error: { code: 'UPDATE_ERROR', message: (err as Error).message } };
  }
}
