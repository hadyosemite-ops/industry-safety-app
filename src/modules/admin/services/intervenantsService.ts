// ============================================================
// Intervenants Externes Service — annuaire réutilisable des
// personnes/entreprises externes (migration 004_referentiels.sql).
// RLS : lecture par site, écriture (INSERT/UPDATE) réservée à
// DEMANDEUR/HSE_MANAGER/ADMIN, suppression réservée à ADMIN.
// ============================================================

import { supabase } from '@/lib/supabase';
import type { IntervenantExterne, ServiceResult } from '../types';
import type { CreateIntervenantExternePayload, UpdateIntervenantExternePayload } from '../types';

/** Liste les intervenants externes d'un site */
export async function listerIntervenants(siteId: string): Promise<ServiceResult<IntervenantExterne[]>> {
  try {
    const { data, error } = await supabase
      .from('intervenants_externes')
      .select('*')
      .eq('site_id', siteId)
      .order('nom_complet', { ascending: true });

    if (error) throw error;
    return { data: data as IntervenantExterne[] };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

/** Crée un intervenant externe — réservé DEMANDEUR/HSE_MANAGER/ADMIN côté RLS */
export async function creerIntervenant(
  payload: CreateIntervenantExternePayload,
): Promise<ServiceResult<IntervenantExterne>> {
  try {
    const { data, error } = await supabase
      .from('intervenants_externes')
      .insert({ ...payload, actif: payload.actif ?? true })
      .select()
      .single();

    if (error) throw error;
    return { data: data as IntervenantExterne };
  } catch (err) {
    return { error: { code: 'CREATE_ERROR', message: (err as Error).message } };
  }
}

/** Modifie un intervenant externe — réservé DEMANDEUR/HSE_MANAGER/ADMIN côté RLS */
export async function modifierIntervenant(
  id: string,
  payload: UpdateIntervenantExternePayload,
): Promise<ServiceResult<IntervenantExterne>> {
  try {
    const { data, error } = await supabase
      .from('intervenants_externes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as IntervenantExterne };
  } catch (err) {
    return { error: { code: 'UPDATE_ERROR', message: (err as Error).message } };
  }
}

/** Supprime un intervenant externe — réservé ADMIN côté RLS */
export async function supprimerIntervenant(id: string): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.from('intervenants_externes').delete().eq('id', id);
    if (error) throw error;
    return { data: null };
  } catch (err) {
    return { error: { code: 'DELETE_ERROR', message: (err as Error).message } };
  }
}
