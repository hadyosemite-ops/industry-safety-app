// ============================================================
// Sites Service — CRUD référentiel Sites
// RLS (migration 004) : lecture ouverte à tout utilisateur authentifié,
// écriture (INSERT/UPDATE) réservée à ADMIN. Aucune policy DELETE —
// un site ne se supprime pas depuis l'app (cascade trop lourde).
// ============================================================

import { supabase } from '@/lib/supabase';
import type { Site, ServiceResult } from '../types';
import type { CreateSitePayload, UpdateSitePayload } from '../types';

/** Liste tous les sites (visibles par tout utilisateur authentifié) */
export async function listerSites(): Promise<ServiceResult<Site[]>> {
  try {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('nom', { ascending: true });

    if (error) throw error;
    return { data: data as Site[] };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

/** Crée un site — réservé ADMIN côté RLS */
export async function creerSite(payload: CreateSitePayload): Promise<ServiceResult<Site>> {
  try {
    const { data, error } = await supabase
      .from('sites')
      .insert({ ...payload, actif: payload.actif ?? true })
      .select()
      .single();

    if (error) throw error;
    return { data: data as Site };
  } catch (err) {
    return { error: { code: 'CREATE_ERROR', message: (err as Error).message } };
  }
}

/** Modifie un site — réservé ADMIN du site concerné côté RLS */
export async function modifierSite(id: string, payload: UpdateSitePayload): Promise<ServiceResult<Site>> {
  try {
    const { data, error } = await supabase
      .from('sites')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Site };
  } catch (err) {
    return { error: { code: 'UPDATE_ERROR', message: (err as Error).message } };
  }
}
