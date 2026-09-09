// ============================================================
// Zones Service — CRUD référentiel Zones (scoping par site)
// RLS (migration 004) : lecture par site (policy existante depuis la
// migration 002), écriture (INSERT/UPDATE) réservée à ADMIN/HSE_MANAGER,
// suppression réservée à ADMIN.
// ============================================================

import { supabase } from '@/lib/supabase';
import type { Zone, ServiceResult } from '../types';
import type { CreateZonePayload, UpdateZonePayload } from '../types';

/** Liste les zones d'un site */
export async function listerZones(siteId: string): Promise<ServiceResult<Zone[]>> {
  try {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('site_id', siteId)
      .order('nom', { ascending: true });

    if (error) throw error;
    return { data: data as Zone[] };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

/** Crée une zone — réservé ADMIN/HSE_MANAGER côté RLS */
export async function creerZone(payload: CreateZonePayload): Promise<ServiceResult<Zone>> {
  try {
    const { data, error } = await supabase
      .from('zones')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Zone };
  } catch (err) {
    return { error: { code: 'CREATE_ERROR', message: (err as Error).message } };
  }
}

/** Modifie une zone — réservé ADMIN/HSE_MANAGER côté RLS */
export async function modifierZone(id: string, payload: UpdateZonePayload): Promise<ServiceResult<Zone>> {
  try {
    const { data, error } = await supabase
      .from('zones')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Zone };
  } catch (err) {
    return { error: { code: 'UPDATE_ERROR', message: (err as Error).message } };
  }
}

/** Supprime une zone — réservé ADMIN côté RLS */
export async function supprimerZone(id: string): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.from('zones').delete().eq('id', id);
    if (error) throw error;
    return { data: null };
  } catch (err) {
    return { error: { code: 'DELETE_ERROR', message: (err as Error).message } };
  }
}
