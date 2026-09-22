// ============================================================
// Action Service — Plan d'action lié aux risques industriels
// ============================================================

import { supabase } from '../../../lib/supabase';
import type {
  ActionRisque, StatutActionRisque, TypeMesureHierarchie, PreuveCloture, ServiceResult,
} from '../types';
import { ErreurMetierRisque } from '../types';

const SELECT_ACTION = `
  *,
  responsable:utilisateurs!responsable_id(id, nom, prenom),
  verificateur:utilisateurs!verificateur_id(id, nom, prenom)
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toActionRisque(row: any): ActionRisque {
  return {
    id: row.id,
    risque_id: row.risque_id,
    description: row.description,
    type_mesure: row.type_mesure,
    responsable_id: row.responsable_id,
    responsable_nom: row.responsable ? `${row.responsable.prenom} ${row.responsable.nom}` : undefined,
    date_creation: row.date_creation,
    date_echeance: row.date_echeance,
    statut: row.statut,
    date_realisation: row.date_realisation,
    date_verification: row.date_verification,
    verificateur_id: row.verificateur_id,
    verificateur_nom: row.verificateur ? `${row.verificateur.prenom} ${row.verificateur.nom}` : undefined,
    preuve_cloture: (row.preuve_cloture ?? []) as PreuveCloture[],
    commentaire: row.commentaire,
    created_at: row.created_at,
    updated_at: row.updated_at,
    risque_numero: row.risque?.numero,
    risque_danger: row.risque?.danger,
    risque_phase: row.risque?.phase,
  };
}

export async function listerActions(risqueId: string): Promise<ServiceResult<ActionRisque[]>> {
  try {
    const { data, error } = await supabase
      .from('actions_risques')
      .select(SELECT_ACTION)
      .eq('risque_id', risqueId)
      .order('date_echeance', { ascending: true });

    if (error) throw error;
    return { data: (data ?? []).map(toActionRisque) };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

/** Toutes les actions du site (pour le Kanban et les alertes d'échéance globales) */
export async function listerToutesActions(): Promise<ServiceResult<ActionRisque[]>> {
  try {
    const { data, error } = await supabase
      .from('actions_risques')
      .select(`${SELECT_ACTION}, risque:risques_industriels(id, numero, danger, phase)`)
      .order('date_echeance', { ascending: true });

    if (error) throw error;
    return { data: (data ?? []).map(toActionRisque) };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

export interface CreerActionPayload {
  risque_id: string;
  description: string;
  type_mesure: TypeMesureHierarchie;
  responsable_id?: string | null;
  commentaire?: string;
}

export async function creerAction(payload: CreerActionPayload): Promise<ServiceResult<ActionRisque>> {
  try {
    const { data, error } = await supabase
      .from('actions_risques')
      .insert({ ...payload, statut: 'PLANIFIEE' })
      .select(SELECT_ACTION)
      .single();

    if (error) throw error;
    return { data: toActionRisque(data) };
  } catch (err) {
    return { error: { code: 'CREATE_ERROR', message: (err as Error).message } };
  }
}

export async function changerStatutAction(id: string, statut: StatutActionRisque): Promise<ServiceResult<ActionRisque>> {
  try {
    const { data, error } = await supabase
      .from('actions_risques')
      .update({ statut })
      .eq('id', id)
      .select(SELECT_ACTION)
      .single();

    if (error) throw error;
    return { data: toActionRisque(data) };
  } catch (err) {
    return { error: { code: 'UPDATE_ERROR', message: (err as Error).message } };
  }
}

/** Clôture (réalisation) d'une action avec preuve à l'appui (photo/document) */
export async function cloturerActionAvecPreuve(
  id: string,
  preuve: PreuveCloture[],
  commentaire?: string,
): Promise<ServiceResult<ActionRisque>> {
  try {
    const { data, error } = await supabase
      .from('actions_risques')
      .update({ statut: 'REALISEE', preuve_cloture: preuve, commentaire })
      .eq('id', id)
      .select(SELECT_ACTION)
      .single();

    if (error) throw error;
    return { data: toActionRisque(data) };
  } catch (err) {
    return { error: { code: 'CLOTURE_ERROR', message: (err as Error).message } };
  }
}

/** Vérification de l'action réalisée (déclenche le droit à la réévaluation du risque) */
export async function verifierAction(id: string, verificateurId: string): Promise<ServiceResult<ActionRisque>> {
  try {
    const { data: action, error: readError } = await supabase
      .from('actions_risques')
      .select('statut')
      .eq('id', id)
      .single();
    if (readError) throw readError;

    if (action.statut !== 'REALISEE') {
      return {
        error: {
          code: ErreurMetierRisque.ACTION_NON_TROUVEE,
          message: 'Seule une action Réalisée peut être vérifiée.',
        },
      };
    }

    const { data, error } = await supabase
      .from('actions_risques')
      .update({ statut: 'VERIFIEE', verificateur_id: verificateurId })
      .eq('id', id)
      .select(SELECT_ACTION)
      .single();

    if (error) throw error;
    return { data: toActionRisque(data) };
  } catch (err) {
    return { error: { code: 'VERIFICATION_ERROR', message: (err as Error).message } };
  }
}
