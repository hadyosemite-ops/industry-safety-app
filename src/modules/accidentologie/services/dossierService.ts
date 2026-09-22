// ============================================================
// Dossier Service — CRUD des dossiers accidentologie (accidents,
// presqu'accidents, situations dangereuses, observations)
// ============================================================

import { supabase } from '../../../lib/supabase';
import type {
  DossierAccident, TypeEvenement, StatutDossier, Victime, Temoin, NoeudCause, ServiceResult,
} from '../types';
import { toActionCorrective } from './actionService';

const SELECT_DOSSIER = `
  *,
  zone:zones(id, nom, code_zone),
  investigateur:utilisateurs!investigateur_id(id, nom, prenom),
  validateur_cloture:utilisateurs!validateur_cloture_id(id, nom, prenom),
  at_liee:autorisations_travail(id, numero_at)
`;

const SELECT_DOSSIER_DETAIL = `
  ${SELECT_DOSSIER},
  accidents_victimes(*),
  accidents_temoins(*),
  accidents_causes(*),
  accidents_actions(*, responsable:utilisateurs!responsable_id(id, nom, prenom))
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toVictime(row: any): Victime {
  return {
    id: row.id,
    nom: row.nom,
    prenom: row.prenom,
    poste: row.poste,
    entreprise: row.entreprise,
    anciennete_mois: row.anciennete_mois,
    nature_blessure: row.nature_blessure,
    siege_lesion: row.siege_lesion,
    jours_arret: row.jours_arret,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTemoin(row: any): Temoin {
  return { id: row.id, nom: row.nom, prenom: row.prenom, poste: row.poste, declaration: row.declaration ?? undefined };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNoeudCause(row: any): NoeudCause {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    parent_ids: row.parent_ids ?? [],
    action_corrective_id: row.action_corrective_id ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDossierAccident(row: any): DossierAccident {
  return {
    id: row.id,
    site_id: row.site_id,
    numero: row.numero,
    type_evenement: row.type_evenement,
    statut: row.statut,
    titre: row.titre,
    date_evenement: row.date_evenement,
    date_declaration: row.date_declaration,
    zone_id: row.zone_id,
    lieu: row.lieu ?? '',
    zone_code: row.zone?.code_zone ?? row.zone?.nom ?? '',
    description: row.description,
    victimes: (row.accidents_victimes ?? []).map(toVictime),
    temoins: (row.accidents_temoins ?? []).map(toTemoin),
    date_investigation: row.date_investigation ?? undefined,
    investigateur_id: row.investigateur_id,
    investigateur: row.investigateur ? `${row.investigateur.prenom} ${row.investigateur.nom}` : undefined,
    arbre_causes: (row.accidents_causes ?? []).map(toNoeudCause),
    cinq_pourquoi: row.cinq_pourquoi ?? undefined,
    at_liee_id: row.at_liee_id ?? undefined,
    at_liee_numero: row.at_liee?.numero_at ?? undefined,
    actions: (row.accidents_actions ?? []).map(toActionCorrective),
    date_cloture: row.date_cloture ?? undefined,
    validateur_cloture_id: row.validateur_cloture_id,
    validateur_cloture: row.validateur_cloture ? `${row.validateur_cloture.prenom} ${row.validateur_cloture.nom}` : undefined,
    lecons_retenues: row.lecons_retenues ?? undefined,
    declarant_nom: row.declarant_nom,
    declarant_poste: row.declarant_poste,
    declaration_cpam: row.declaration_cpam,
    declaration_it: row.declaration_it,
    date_cpam: row.date_cpam ?? undefined,
    date_it: row.date_it ?? undefined,
  };
}

// ------------------------------------------------------------
// LECTURE
// ------------------------------------------------------------

export interface FiltresDossiers {
  statut?: StatutDossier;
  type_evenement?: TypeEvenement;
  zone_id?: string;
}

export async function listerDossiers(filtres?: FiltresDossiers): Promise<ServiceResult<DossierAccident[]>> {
  try {
    let query = supabase
      .from('dossiers_accidents')
      .select(SELECT_DOSSIER_DETAIL)
      .order('date_evenement', { ascending: false });

    if (filtres?.statut) query = query.eq('statut', filtres.statut);
    if (filtres?.type_evenement) query = query.eq('type_evenement', filtres.type_evenement);
    if (filtres?.zone_id) query = query.eq('zone_id', filtres.zone_id);

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data ?? []).map(toDossierAccident) };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

export async function getDossier(id: string): Promise<ServiceResult<DossierAccident>> {
  try {
    const { data, error } = await supabase
      .from('dossiers_accidents')
      .select(SELECT_DOSSIER_DETAIL)
      .eq('id', id)
      .single();
    if (error) throw error;
    return { data: toDossierAccident(data) };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// CRÉATION (déclaration)
// ------------------------------------------------------------

export interface CreerDossierPayload {
  site_id: string;
  type_evenement: TypeEvenement;
  titre: string;
  date_evenement: string;
  zone_id?: string | null;
  lieu?: string;
  description: string;
  declarant_nom: string;
  declarant_poste: string;
  victimes?: Omit<Victime, 'id'>[];
  temoins?: Omit<Temoin, 'id'>[];
  at_liee_numero?: string;
}

export async function creerDossier(payload: CreerDossierPayload): Promise<ServiceResult<DossierAccident>> {
  try {
    let at_liee_id: string | null = null;
    if (payload.at_liee_numero?.trim()) {
      const { data: at } = await supabase
        .from('autorisations_travail')
        .select('id')
        .eq('numero_at', payload.at_liee_numero.trim())
        .maybeSingle();
      at_liee_id = at?.id ?? null;
    }

    const { data: dossier, error } = await supabase
      .from('dossiers_accidents')
      .insert({
        site_id: payload.site_id,
        type_evenement: payload.type_evenement,
        statut: 'SIGNALE',
        titre: payload.titre,
        date_evenement: payload.date_evenement,
        zone_id: payload.zone_id ?? null,
        lieu: payload.lieu ?? null,
        description: payload.description,
        declarant_nom: payload.declarant_nom,
        declarant_poste: payload.declarant_poste,
        at_liee_id,
        declaration_cpam: false,
        declaration_it: false,
      })
      .select()
      .single();
    if (error) throw error;

    const victimes = payload.victimes ?? [];
    if (victimes.length > 0) {
      const { error: vError } = await supabase
        .from('accidents_victimes')
        .insert(victimes.map(v => ({ ...v, dossier_id: dossier.id })));
      if (vError) throw vError;
    }

    const temoins = payload.temoins ?? [];
    if (temoins.length > 0) {
      const { error: tError } = await supabase
        .from('accidents_temoins')
        .insert(temoins.map(t => ({ ...t, dossier_id: dossier.id })));
      if (tError) throw tError;
    }

    return await getDossier(dossier.id);
  } catch (err) {
    return { error: { code: 'CREATE_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// MISE À JOUR (champs simples du dossier)
// ------------------------------------------------------------

export interface MettreAJourDossierPayload {
  statut?: StatutDossier;
  cinq_pourquoi?: string[] | null;
  lecons_retenues?: string | null;
  date_investigation?: string | null;
  investigateur_id?: string | null;
  declaration_cpam?: boolean;
  declaration_it?: boolean;
  date_cpam?: string | null;
  date_it?: string | null;
  date_cloture?: string | null;
  validateur_cloture_id?: string | null;
}

export async function mettreAJourDossier(
  id: string,
  patch: MettreAJourDossierPayload,
): Promise<ServiceResult<DossierAccident>> {
  try {
    const { error } = await supabase.from('dossiers_accidents').update(patch).eq('id', id);
    if (error) throw error;
    return await getDossier(id);
  } catch (err) {
    return { error: { code: 'UPDATE_ERROR', message: (err as Error).message } };
  }
}

/** Fait progresser (ou fixe) le statut — renseigne automatiquement la clôture. */
export async function changerStatutDossier(
  id: string,
  statut: StatutDossier,
  validateurId?: string,
): Promise<ServiceResult<DossierAccident>> {
  const patch: MettreAJourDossierPayload = { statut };
  if (statut === 'CLOTURE') {
    patch.date_cloture = new Date().toISOString();
    patch.validateur_cloture_id = validateurId ?? null;
  }
  return mettreAJourDossier(id, patch);
}

// ------------------------------------------------------------
// ARBRE DES CAUSES — remplacement complet (même logique que les actions)
// ------------------------------------------------------------

export async function remplacerCauses(
  dossierId: string,
  noeuds: NoeudCause[],
): Promise<ServiceResult<NoeudCause[]>> {
  try {
    const { error: delError } = await supabase.from('accidents_causes').delete().eq('dossier_id', dossierId);
    if (delError) throw delError;

    if (noeuds.length === 0) return { data: [] };

    const rows = noeuds.map(n => ({
      id: n.id,
      dossier_id: dossierId,
      type: n.type,
      description: n.description,
      parent_ids: n.parent_ids,
      action_corrective_id: n.action_corrective_id ?? null,
    }));

    const { data, error } = await supabase.from('accidents_causes').insert(rows).select();
    if (error) throw error;
    return { data: (data ?? []).map(toNoeudCause) };
  } catch (err) {
    return { error: { code: 'REPLACE_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// KPI — résumé pour le dashboard et l'outil `get_kpis_accidentologie`
// Approximation : les heures travaillées annuelles sont extrapolées à
// partir de la moyenne mensuelle du site (heures_travaillees_mensuelles ×
// 12) faute d'historique mensuel détaillé — cohérent avec un calcul de
// TF/TG/IF sur le registre complet des dossiers actuellement en base.
// ------------------------------------------------------------

export interface KpisAccidentologieCalcules {
  tf: number;
  tg: number;
  if_: number;
  nb_at_arret: number;
  nb_at_sans_arret: number;
  nb_presqu_accidents: number;
  nb_situations: number;
  nb_observations: number;
  jours_perdus: number;
  heures_travaillees: number;
  effectif: number;
  taux_actions_soldees: number;
  taux_presqu_accidents: number;
}

export async function calculerKpisAccidentologie(siteId: string): Promise<ServiceResult<KpisAccidentologieCalcules>> {
  try {
    const [{ data: dossiers, error: dError }, { data: site, error: sError }] = await Promise.all([
      listerDossiers().then(r => ({ data: r.data, error: r.error })),
      supabase.from('sites').select('effectif, heures_travaillees_mensuelles').eq('id', siteId).single(),
    ]);
    if (dError) throw new Error(dError.message);
    if (sError) throw sError;

    const tous = dossiers ?? [];
    const nb_at_arret = tous.filter(d => d.type_evenement === 'GRAVE' || d.type_evenement === 'FATAL').length;
    const nb_at_sans_arret = tous.filter(d => d.type_evenement === 'BENIN').length;
    const nb_presqu_accidents = tous.filter(d => d.type_evenement === 'PRESQU_ACCIDENT').length;
    const nb_situations = tous.filter(d => d.type_evenement === 'SITUATION_DANGEREUSE').length;
    const nb_observations = tous.filter(d => d.type_evenement === 'OBSERVATION').length;
    const jours_perdus = tous.reduce((sum, d) => sum + d.victimes.reduce((s, v) => s + v.jours_arret, 0), 0);

    const toutesActions = tous.flatMap(d => d.actions);
    const taux_actions_soldees = toutesActions.length > 0
      ? Math.round((toutesActions.filter(a => a.statut === 'REALISEE').length / toutesActions.length) * 100)
      : 0;

    const proactif = nb_presqu_accidents + nb_situations + nb_observations;
    const reactif = nb_at_arret + nb_at_sans_arret;
    const taux_presqu_accidents = proactif + reactif > 0 ? Math.round((proactif / (proactif + reactif)) * 100) : 0;

    const effectif = site?.effectif ?? 0;
    const heures_travaillees = (site?.heures_travaillees_mensuelles ?? 0) * 12;

    const tf = heures_travaillees > 0 ? (nb_at_arret * 1_000_000) / heures_travaillees : 0;
    const tg = heures_travaillees > 0 ? (jours_perdus * 1000) / heures_travaillees : 0;
    const if_ = effectif > 0 ? (nb_at_arret * 1000) / effectif : 0;

    return {
      data: {
        tf, tg, if_, nb_at_arret, nb_at_sans_arret, nb_presqu_accidents, nb_situations, nb_observations,
        jours_perdus, heures_travaillees, effectif, taux_actions_soldees, taux_presqu_accidents,
      },
    };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}
