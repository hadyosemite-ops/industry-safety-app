// ============================================================
// AT Service — CRUD + Workflow Autorisation de Travail
// ============================================================

import { supabase } from '../../../lib/supabase';
import {
  AutorisationTravail,
  StatutAT,
  RoleUtilisateur,
  CreateATPayload,
  ApprouverATPayload,
  SuspendreATPayload,
  LeverSuspensionPayload,
  ServiceResult,
  ErreurMetier,
} from '../types';
import {
  verifierTransition,
  verifierConditionApprobation,
  verifierConditionCloture,
} from './workflowService';

// ------------------------------------------------------------
// LECTURE
// ------------------------------------------------------------

/** Récupère toutes les AT du site de l'utilisateur connecté */
export async function listerATs(filtres?: {
  statut?: StatutAT;
  zone_id?: string;
  animateur_id?: string;
  dateDebut?: string;
  dateFin?: string;
}): Promise<ServiceResult<AutorisationTravail[]>> {
  try {
    let query = supabase
      .from('autorisations_travail')
      .select(`
        *,
        zone:zones(id, nom, code_zone),
        demandeur:utilisateurs!demandeur_id(id, nom, prenom, email),
        animateur:utilisateurs!animateur_id(id, nom, prenom),
        approbateur:utilisateurs!approbateur_id(id, nom, prenom),
        permis(id, type_permis, statut, qr_code_token),
        suspensions_at(id, date_suspension, date_levee, type_ecart)
      `)
      .order('created_at', { ascending: false });

    if (filtres?.statut)       query = query.eq('statut', filtres.statut);
    if (filtres?.zone_id)      query = query.eq('zone_id', filtres.zone_id);
    if (filtres?.animateur_id) query = query.eq('animateur_id', filtres.animateur_id);
    if (filtres?.dateDebut)    query = query.gte('date_debut_prevue', filtres.dateDebut);
    if (filtres?.dateFin)      query = query.lte('date_fin_prevue', filtres.dateFin);

    const { data, error } = await query;
    if (error) throw error;

    return { data: data as unknown as AutorisationTravail[] };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

/** Récupère une AT complète avec tous ses enfants */
export async function getAT(id: string): Promise<ServiceResult<AutorisationTravail>> {
  try {
    const { data, error } = await supabase
      .from('autorisations_travail')
      .select(`
        *,
        site:sites(id, nom, code_site),
        zone:zones(id, nom, code_zone, niveau_risque_defaut),
        demandeur:utilisateurs!demandeur_id(id, nom, prenom, email, telephone),
        animateur:utilisateurs!animateur_id(id, nom, prenom, email, telephone),
        approbateur:utilisateurs!approbateur_id(id, nom, prenom, email),
        permis(
          *,
          intervenants_permis(*)
        ),
        audits_at(*,
          auditeur:utilisateurs!auditeur_id(id, nom, prenom)
        ),
        suspensions_at(*,
          animateur:utilisateurs!animateur_id(id, nom, prenom),
          audit_levee:audits_at!audit_levee_id(id, resultat, date_audit)
        ),
        historique_statuts_at(*, acteur:utilisateurs!acteur_id(id, nom, prenom))
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { error: { code: ErreurMetier.AT_NON_TROUVEE, message: `AT ${id} introuvable.` } };
      }
      throw error;
    }

    return { data: data as unknown as AutorisationTravail };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

/** Récupère une AT via le QR Code token d'un de ses permis */
export async function getATParQRCode(token: string): Promise<ServiceResult<AutorisationTravail>> {
  try {
    const { data: permis, error: permisError } = await supabase
      .from('permis')
      .select('at_id')
      .eq('qr_code_token', token)
      .single();

    if (permisError || !permis) {
      return { error: { code: 'QR_INVALIDE', message: 'QR Code invalide ou expiré.' } };
    }

    return getAT(permis.at_id);
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// CRÉATION
// ------------------------------------------------------------

/** Crée une nouvelle AT en statut BROUILLON */
export async function creerAT(
  payload: CreateATPayload,
  acteurId: string
): Promise<ServiceResult<AutorisationTravail>> {
  try {
    const { data, error } = await supabase
      .from('autorisations_travail')
      .insert({
        ...payload,
        demandeur_id: acteurId,
        statut: StatutAT.BROUILLON,
        numero_at: '', // Généré automatiquement par le trigger SQL
      })
      .select()
      .single();

    if (error) throw error;

    await enregistrerHistorique({
      at_id: data.id,
      statut_avant: StatutAT.BROUILLON,
      statut_apres: StatutAT.BROUILLON,
      acteur_id: acteurId,
      motif: 'Création de l\'AT',
    });

    return { data: data as unknown as AutorisationTravail };
  } catch (err) {
    return { error: { code: 'CREATE_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// TRANSITIONS DE STATUT
// ------------------------------------------------------------

/** Soumettre une AT (BROUILLON → SOUMISE) */
export async function soumettre(
  atId: string,
  acteurId: string,
  role: RoleUtilisateur
): Promise<ServiceResult<AutorisationTravail>> {
  return transitionnerStatut(atId, StatutAT.SOUMISE, acteurId, role, 'Soumission pour validation');
}

/**
 * Valider une AT (SOUMISE → VALIDEE)
 * RÈGLE MÉTIER #2 : Tous les permis doivent être validés (check côté service + trigger SQL)
 */
export async function valider(
  atId: string,
  acteurId: string,
  role: RoleUtilisateur
): Promise<ServiceResult<AutorisationTravail>> {
  // Vérification pré-transition : récupérer les permis
  const { data: at, error } = await getAT(atId);
  if (error || !at) return { error: error ?? { code: ErreurMetier.AT_NON_TROUVEE, message: 'AT introuvable' } };

  const check = verifierConditionApprobation(at.permis ?? []);
  if (check.error) return { error: check.error };

  return transitionnerStatut(atId, StatutAT.VALIDEE, acteurId, role, 'Validation par l\'Animateur de Sécurité');
}

/**
 * Approuver une AT (VALIDEE → APPROUVEE)
 * DERNIER MOT — Resp. Zone ou HSE Manager
 */
export async function approuver(
  payload: ApprouverATPayload,
  acteurId: string,
  role: RoleUtilisateur
): Promise<ServiceResult<AutorisationTravail>> {
  // Sauvegarde l'approbateur
  await supabase
    .from('autorisations_travail')
    .update({ approbateur_id: acteurId })
    .eq('id', payload.at_id);

  return transitionnerStatut(
    payload.at_id,
    StatutAT.APPROUVEE,
    acteurId,
    role,
    payload.commentaire ?? 'Approbation finale'
  );
}

/** Activer une AT (APPROUVEE → ACTIVE) — GO terrain */
export async function activer(
  atId: string,
  acteurId: string,
  role: RoleUtilisateur
): Promise<ServiceResult<AutorisationTravail>> {
  await supabase
    .from('autorisations_travail')
    .update({ date_debut_effective: new Date().toISOString() })
    .eq('id', atId);

  return transitionnerStatut(atId, StatutAT.ACTIVE, acteurId, role, 'Démarrage des travaux');
}

/**
 * Clôturer une AT (ACTIVE → CLOTUREE)
 * RÈGLE MÉTIER #3 : Tous permis clos + aucune suspension ouverte
 */
export async function cloturer(
  atId: string,
  acteurId: string,
  role: RoleUtilisateur,
  commentaire?: string
): Promise<ServiceResult<AutorisationTravail>> {
  const { data: at, error } = await getAT(atId);
  if (error || !at) return { error: error ?? { code: ErreurMetier.AT_NON_TROUVEE, message: 'AT introuvable' } };

  const suspensionOuverte = (at.suspensions ?? []).some(s => !s.date_levee);
  const check = verifierConditionCloture(at.permis ?? [], suspensionOuverte);
  if (check.error) return { error: check.error };

  await supabase
    .from('autorisations_travail')
    .update({ date_fin_effective: new Date().toISOString() })
    .eq('id', atId);

  return transitionnerStatut(atId, StatutAT.CLOTUREE, acteurId, role, commentaire ?? 'Clôture des travaux');
}

// ------------------------------------------------------------
// SUSPENSION (Animateur de Sécurité uniquement)
// RÈGLE MÉTIER #1 : Cascade automatique sur tous les permis
// ------------------------------------------------------------

export async function suspendre(
  payload: SuspendreATPayload,
  acteurId: string,
  role: RoleUtilisateur
): Promise<ServiceResult<AutorisationTravail>> {
  // Vérifier le rôle
  if (role !== RoleUtilisateur.ANIMATEUR_SECURITE && role !== RoleUtilisateur.HSE_MANAGER) {
    return {
      error: {
        code: ErreurMetier.PERMISSION_INSUFFISANTE,
        message: 'Seul l\'Animateur de Sécurité peut suspendre une AT.',
      },
    };
  }

  // Vérifier que l'AT est active
  const { data: at, error } = await getAT(payload.at_id);
  if (error || !at) return { error: error ?? { code: ErreurMetier.AT_NON_TROUVEE, message: 'AT introuvable' } };

  if (at.statut !== StatutAT.ACTIVE) {
    return { error: { code: ErreurMetier.AT_NON_ACTIVE, message: `L'AT doit être ACTIVE pour être suspendue. Statut actuel : ${at.statut}` } };
  }

  // Vérifier qu'il n'y a pas déjà une suspension ouverte
  const dejasSuspendue = (at.suspensions ?? []).some(s => !s.date_levee);
  if (dejasSuspendue) {
    return { error: { code: ErreurMetier.AT_DEJA_SUSPENDUE, message: 'Cette AT a déjà une suspension en cours.' } };
  }

  // Créer la suspension (le trigger SQL gère la cascade sur les permis)
  const { error: suspError } = await supabase.from('suspensions_at').insert({
    at_id: payload.at_id,
    animateur_id: acteurId,
    motif_suspension: payload.motif_suspension,
    type_ecart: payload.type_ecart,
    description_ecart: payload.description_ecart,
    mesures_correctives: payload.mesures_correctives,
    delai_correction: payload.delai_correction,
    photos_ecart: payload.photos_ecart ?? [],
    date_suspension: new Date().toISOString(),
  });
  if (suspError) return { error: { code: 'SUSPENSION_ERROR', message: suspError.message } };

  return transitionnerStatut(payload.at_id, StatutAT.SUSPENDUE, acteurId, role, payload.motif_suspension);
}

/** Lever une suspension — requiert un audit de type LEVEE_SUSPENSION */
export async function leverSuspension(
  payload: LeverSuspensionPayload,
  acteurId: string,
  role: RoleUtilisateur
): Promise<ServiceResult<AutorisationTravail>> {
  if (role !== RoleUtilisateur.ANIMATEUR_SECURITE && role !== RoleUtilisateur.HSE_MANAGER) {
    return {
      error: {
        code: ErreurMetier.PERMISSION_INSUFFISANTE,
        message: 'Seul l\'Animateur de Sécurité peut lever une suspension.',
      },
    };
  }

  // Vérifier que l'audit de levée existe et est de type LEVEE_SUSPENSION
  const { data: audit, error: auditError } = await supabase
    .from('audits_at')
    .select('*')
    .eq('id', payload.audit_levee_id)
    .single();

  if (auditError || !audit) {
    return { error: { code: ErreurMetier.LEVEE_SUSPENSION_SANS_AUDIT, message: 'L\'audit de conformité est requis pour lever la suspension.' } };
  }

  if (audit.type_audit !== 'LEVEE_SUSPENSION') {
    return {
      error: {
        code: ErreurMetier.AUDIT_TYPE_INCORRECT,
        message: `L'audit doit être de type LEVEE_SUSPENSION. Type fourni : ${audit.type_audit}`,
      },
    };
  }

  // Mettre à jour la suspension
  const { error: updateError } = await supabase
    .from('suspensions_at')
    .update({
      audit_levee_id: payload.audit_levee_id,
      levee_par: acteurId,
      date_levee: new Date().toISOString(),
      commentaire_levee: payload.commentaire_levee,
    })
    .eq('id', payload.suspension_id)
    .is('date_levee', null);

  if (updateError) return { error: { code: 'LEVEE_ERROR', message: updateError.message } };

  // La transition SUSPENDUE → ACTIVE déclenche le trigger de restauration des permis
  return transitionnerStatut(
    audit.at_id,
    StatutAT.ACTIVE,
    acteurId,
    role,
    payload.commentaire_levee ?? 'Levée de suspension après audit de conformité'
  );
}

// ------------------------------------------------------------
// INTERNE : transition de statut + enregistrement historique
// ------------------------------------------------------------

async function transitionnerStatut(
  atId: string,
  statutCible: StatutAT,
  acteurId: string,
  role: RoleUtilisateur,
  motif: string
): Promise<ServiceResult<AutorisationTravail>> {
  try {
    // Lire le statut actuel
    const { data: atActuel, error: readError } = await supabase
      .from('autorisations_travail')
      .select('statut')
      .eq('id', atId)
      .single();

    if (readError) throw readError;
    const statutActuel = atActuel.statut as StatutAT;

    // Vérifier la transition (défense en profondeur — le trigger SQL vérifie aussi)
    const check = verifierTransition(statutActuel, statutCible, role);
    if (check.error) return { error: check.error };

    // Effectuer la transition
    const { data, error } = await supabase
      .from('autorisations_travail')
      .update({
        statut: statutCible,
        statut_precedent: statutActuel, // Sauvegardé pour restauration éventuelle
      })
      .eq('id', atId)
      .select()
      .single();

    if (error) {
      // Extraire le code d'erreur métier du message PostgreSQL
      const msg = error.message;
      if (msg.includes('APPROBATION_BLOQUEE')) {
        return { error: { code: ErreurMetier.APPROBATION_BLOQUEE_PERMIS_NON_VALIDES, message: msg } };
      }
      if (msg.includes('CLOTURE_BLOQUEE_PERMIS_NON_CLOS')) {
        return { error: { code: ErreurMetier.CLOTURE_BLOQUEE_PERMIS_NON_CLOS, message: msg } };
      }
      if (msg.includes('CLOTURE_BLOQUEE_SUSPENSION_OUVERTE')) {
        return { error: { code: ErreurMetier.CLOTURE_BLOQUEE_SUSPENSION_OUVERTE, message: msg } };
      }
      throw error;
    }

    // Enregistrer dans l'historique
    await enregistrerHistorique({
      at_id: atId,
      statut_avant: statutActuel,
      statut_apres: statutCible,
      acteur_id: acteurId,
      motif,
    });

    return { data: data as unknown as AutorisationTravail };
  } catch (err) {
    return { error: { code: 'TRANSITION_ERROR', message: (err as Error).message } };
  }
}

async function enregistrerHistorique(params: {
  at_id: string;
  statut_avant: StatutAT;
  statut_apres: StatutAT;
  acteur_id: string;
  motif?: string;
  metadata?: Record<string, unknown>;
}) {
  await supabase.from('historique_statuts_at').insert({
    ...params,
    timestamp: new Date().toISOString(),
  });
}
