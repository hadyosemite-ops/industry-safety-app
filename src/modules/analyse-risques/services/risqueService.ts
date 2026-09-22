// ============================================================
// Risque Service — CRUD + réévaluation du risque résiduel
// Module Analyse des Risques Industriels
// ============================================================

import { supabase } from '../../../lib/supabase';
import type {
  RisqueIndustriel, PhaseRisque, StatutRisque, NiveauCriticite,
  MoyenProtection, ServiceResult,
} from '../types';
import { ErreurMetierRisque } from '../types';
import { toActionRisque } from './actionService';

const SELECT_RISQUE = `
  *,
  zone:zones(id, nom, code_zone),
  responsable:utilisateurs!responsable_id(id, nom, prenom)
`;

const SELECT_RISQUE_DETAIL = `
  ${SELECT_RISQUE},
  cotations_risques(*, auteur:utilisateurs!auteur_id(id, nom, prenom)),
  actions_risques(*,
    responsable:utilisateurs!responsable_id(id, nom, prenom),
    verificateur:utilisateurs!verificateur_id(id, nom, prenom)
  )
`;

// ------------------------------------------------------------
// Adaptateur — ligne Supabase (avec jointures) → RisqueIndustriel
// ------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toRisqueIndustriel(row: any): RisqueIndustriel {
  return {
    id: row.id,
    numero: row.numero,
    site_id: row.site_id,
    zone_id: row.zone_id,
    zone_nom: row.zone?.nom,
    zone_code: row.zone?.code_zone,
    phase: row.phase,
    activite: row.activite,
    danger: row.danger,
    situation_dangereuse: row.situation_dangereuse,
    evenement_redoute: row.evenement_redoute,
    consequence_potentielle: row.consequence_potentielle,
    frequence_initiale: row.frequence_initiale,
    gravite_initiale: row.gravite_initiale,
    score_initial: row.score_initial,
    niveau_initial: row.niveau_initial,
    moyens_protection: (row.moyens_protection ?? []) as MoyenProtection[],
    frequence_residuelle: row.frequence_residuelle,
    gravite_residuelle: row.gravite_residuelle,
    score_residuel: row.score_residuel,
    niveau_residuel: row.niveau_residuel,
    justification_alarp: row.justification_alarp,
    statut: row.statut,
    responsable_id: row.responsable_id,
    responsable_nom: row.responsable ? `${row.responsable.prenom} ${row.responsable.nom}` : undefined,
    date_identification: row.date_identification,
    date_derniere_cotation: row.date_derniere_cotation,
    created_at: row.created_at,
    updated_at: row.updated_at,
    cotations: row.cotations_risques?.map((c: any) => ({
      id: c.id,
      risque_id: c.risque_id,
      type: c.type,
      frequence: c.frequence,
      gravite: c.gravite,
      score: c.score,
      niveau: c.niveau,
      auteur_id: c.auteur_id,
      auteur_nom: c.auteur ? `${c.auteur.prenom} ${c.auteur.nom}` : undefined,
      commentaire: c.commentaire,
      date: c.date,
    })).sort((a: { date: string }, b: { date: string }) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    actions: row.actions_risques?.map(toActionRisque),
  };
}

// ------------------------------------------------------------
// LECTURE
// ------------------------------------------------------------

export interface FiltresRisques {
  phase?: PhaseRisque;
  statut?: StatutRisque;
  niveau?: NiveauCriticite;   // filtre sur le niveau courant (résiduel si connu, sinon initial)
  zone_id?: string;
}

export async function listerRisques(filtres?: FiltresRisques): Promise<ServiceResult<RisqueIndustriel[]>> {
  try {
    let query = supabase
      .from('risques_industriels')
      .select(SELECT_RISQUE_DETAIL)
      .order('created_at', { ascending: false });

    if (filtres?.phase)   query = query.eq('phase', filtres.phase);
    if (filtres?.statut)  query = query.eq('statut', filtres.statut);
    if (filtres?.zone_id) query = query.eq('zone_id', filtres.zone_id);

    const { data, error } = await query;
    if (error) throw error;

    let risques = (data ?? []).map(toRisqueIndustriel);

    if (filtres?.niveau) {
      risques = risques.filter(r => (r.niveau_residuel ?? r.niveau_initial) === filtres.niveau);
    }

    return { data: risques };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

export async function getRisque(id: string): Promise<ServiceResult<RisqueIndustriel>> {
  try {
    const { data, error } = await supabase
      .from('risques_industriels')
      .select(SELECT_RISQUE_DETAIL)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { error: { code: ErreurMetierRisque.RISQUE_NON_TROUVE, message: `Risque ${id} introuvable.` } };
      }
      throw error;
    }

    return { data: toRisqueIndustriel(data) };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// CRÉATION
// ------------------------------------------------------------

export interface CreerRisquePayload {
  site_id: string;
  zone_id?: string | null;
  phase: PhaseRisque;
  activite: string;
  danger: string;
  situation_dangereuse: string;
  evenement_redoute: string;
  consequence_potentielle: string;
  frequence_initiale: number;
  gravite_initiale: number;
  moyens_protection: MoyenProtection[];
  responsable_id?: string | null;
}

export async function creerRisque(payload: CreerRisquePayload): Promise<ServiceResult<RisqueIndustriel>> {
  try {
    const { data, error } = await supabase
      .from('risques_industriels')
      .insert({ ...payload, numero: '', statut: 'OUVERT' })
      .select(SELECT_RISQUE_DETAIL)
      .single();

    if (error) throw error;
    return { data: toRisqueIndustriel(data) };
  } catch (err) {
    return { error: { code: 'CREATE_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// RÉÉVALUATION — recotation du risque résiduel (§D)
// ------------------------------------------------------------

export interface ReevaluerRisquePayload {
  frequence_residuelle: number;
  gravite_residuelle: number;
  justification_alarp?: string;
}

export async function reevaluerRisque(
  id: string,
  payload: ReevaluerRisquePayload,
): Promise<ServiceResult<RisqueIndustriel>> {
  const score = payload.frequence_residuelle * payload.gravite_residuelle;

  // Garde-fou UI avant l'appel (la vérité vient de la contrainte SQL chk_alarp)
  if (score >= 5 && score <= 9 && !payload.justification_alarp?.trim()) {
    return {
      error: {
        code: ErreurMetierRisque.JUSTIFICATION_ALARP_REQUISE,
        message: 'Une justification ALARP est requise pour accepter un risque résiduel modéré (score 5-9).',
      },
    };
  }

  try {
    const update: Record<string, unknown> = {
      frequence_residuelle: payload.frequence_residuelle,
      gravite_residuelle: payload.gravite_residuelle,
      justification_alarp: payload.justification_alarp ?? null,
    };

    // ≥10 : le risque reste actif (retour au plan d'action) — jamais clôturé directement
    if (score >= 10) {
      update.statut = 'EN_COURS';
    } else if (score <= 4) {
      update.statut = 'SOUS_SURVEILLANCE';
    }

    const { data, error } = await supabase
      .from('risques_industriels')
      .update(update)
      .eq('id', id)
      .select(SELECT_RISQUE_DETAIL)
      .single();

    if (error) {
      if (error.message.includes('ACTION_OBLIGATOIRE_RISQUE_RESIDUEL')) {
        return {
          error: {
            code: ErreurMetierRisque.ACTION_OBLIGATOIRE_RISQUE_RESIDUEL,
            message: 'Score résiduel Élevé/Critique : une nouvelle action corrective est obligatoire avant clôture.',
          },
        };
      }
      throw error;
    }

    return { data: toRisqueIndustriel(data) };
  } catch (err) {
    return { error: { code: 'REEVALUATION_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// CHANGEMENT DE STATUT / CLÔTURE
// ------------------------------------------------------------

export async function changerStatutRisque(id: string, statut: StatutRisque): Promise<ServiceResult<RisqueIndustriel>> {
  try {
    const { data, error } = await supabase
      .from('risques_industriels')
      .update({ statut })
      .eq('id', id)
      .select(SELECT_RISQUE_DETAIL)
      .single();

    if (error) {
      if (error.message.includes('ACTION_OBLIGATOIRE_RISQUE_RESIDUEL')) {
        return {
          error: {
            code: ErreurMetierRisque.ACTION_OBLIGATOIRE_RISQUE_RESIDUEL,
            message: 'Score résiduel Élevé/Critique : une nouvelle action corrective est obligatoire avant clôture.',
          },
        };
      }
      throw error;
    }

    return { data: toRisqueIndustriel(data) };
  } catch (err) {
    return { error: { code: 'UPDATE_ERROR', message: (err as Error).message } };
  }
}
