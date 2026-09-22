// ============================================================
// Action Service — Plan d'actions correctives lié aux dossiers accidents
// ============================================================

import { supabase } from '../../../lib/supabase';
import type { ActionCorrective, ServiceResult } from '../types';

const SELECT_ACTION = `
  *,
  responsable:utilisateurs!responsable_id(id, nom, prenom)
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toActionCorrective(row: any): ActionCorrective {
  return {
    id: row.id,
    description: row.description,
    categorie: row.categorie,
    responsable_id: row.responsable_id,
    responsable_nom: row.responsable ? `${row.responsable.prenom} ${row.responsable.nom}` : undefined,
    date_echeance: row.date_echeance,
    date_realisation: row.date_realisation ?? undefined,
    statut: row.statut,
    commentaire: row.commentaire ?? undefined,
    priorite: row.priorite,
  };
}

export async function listerActions(dossierId: string): Promise<ServiceResult<ActionCorrective[]>> {
  try {
    const { data, error } = await supabase
      .from('accidents_actions')
      .select(SELECT_ACTION)
      .eq('dossier_id', dossierId)
      .order('date_echeance', { ascending: true });
    if (error) throw error;
    return { data: (data ?? []).map(toActionCorrective) };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

export interface CreerActionAccidentPayload {
  dossier_id: string;
  description: string;
  categorie: ActionCorrective['categorie'];
  responsable_id?: string | null;
  date_echeance: string;
  priorite?: ActionCorrective['priorite'];
  commentaire?: string;
}

export async function creerAction(payload: CreerActionAccidentPayload): Promise<ServiceResult<ActionCorrective>> {
  try {
    const { data, error } = await supabase
      .from('accidents_actions')
      .insert({ ...payload, priorite: payload.priorite ?? 'NORMALE', statut: 'A_FAIRE' })
      .select(SELECT_ACTION)
      .single();
    if (error) throw error;
    return { data: toActionCorrective(data) };
  } catch (err) {
    return { error: { code: 'CREATE_ERROR', message: (err as Error).message } };
  }
}

export async function changerStatutAction(
  id: string,
  statut: ActionCorrective['statut'],
): Promise<ServiceResult<ActionCorrective>> {
  try {
    const { data, error } = await supabase
      .from('accidents_actions')
      .update({ statut, date_realisation: statut === 'REALISEE' ? new Date().toISOString().slice(0, 10) : null })
      .eq('id', id)
      .select(SELECT_ACTION)
      .single();
    if (error) throw error;
    return { data: toActionCorrective(data) };
  } catch (err) {
    return { error: { code: 'UPDATE_ERROR', message: (err as Error).message } };
  }
}

export async function supprimerAction(id: string): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.from('accidents_actions').delete().eq('id', id);
    if (error) throw error;
    return { data: null };
  } catch (err) {
    return { error: { code: 'DELETE_ERROR', message: (err as Error).message } };
  }
}

/**
 * Remplace l'intégralité du plan d'actions d'un dossier — utilisé par
 * l'éditeur inline (PlanActions), qui manipule un tableau complet côté
 * client et renvoie systématiquement la nouvelle version entière. Les
 * actions déjà existantes gardent leur id (pas de perte de lien), les
 * nouvelles sont créées avec un id déjà généré côté client (uuid).
 */
export async function remplacerActions(
  dossierId: string,
  actions: ActionCorrective[],
): Promise<ServiceResult<ActionCorrective[]>> {
  try {
    const { error: delError } = await supabase.from('accidents_actions').delete().eq('dossier_id', dossierId);
    if (delError) throw delError;

    if (actions.length === 0) return { data: [] };

    const rows = actions.map(a => ({
      id: a.id,
      dossier_id: dossierId,
      description: a.description,
      categorie: a.categorie,
      responsable_id: a.responsable_id ?? null,
      date_echeance: a.date_echeance,
      date_realisation: a.date_realisation ?? null,
      statut: a.statut,
      commentaire: a.commentaire ?? null,
      priorite: a.priorite,
    }));

    const { data, error } = await supabase.from('accidents_actions').insert(rows).select(SELECT_ACTION);
    if (error) throw error;
    return { data: (data ?? []).map(toActionCorrective) };
  } catch (err) {
    return { error: { code: 'REPLACE_ERROR', message: (err as Error).message } };
  }
}
