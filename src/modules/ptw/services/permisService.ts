// ============================================================
// Permis Service — CRUD + Validation terrain
// ============================================================

import { supabase } from '../../../lib/supabase';
import {
  Permis,
  StatutPermis,
  RoleUtilisateur,
  CreatePermisPayload,
  ValiderPermisPayload,
  RejeterPermisPayload,
  ServiceResult,
  ErreurMetier,
  TemplateChecklist,
  TypePermis,
} from '../types';

// ------------------------------------------------------------
// LECTURE
// ------------------------------------------------------------

export async function getPermis(id: string): Promise<ServiceResult<Permis>> {
  try {
    const { data, error } = await supabase
      .from('permis')
      .select(`
        *,
        at:autorisations_travail(id, numero_at, statut, titre, zone_id),
        intervenants_permis(*),
        valideur:utilisateurs!valide_par(id, nom, prenom),
        rejeteur:utilisateurs!rejete_par(id, nom, prenom)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { error: { code: ErreurMetier.PERMIS_NON_TROUVE, message: `Permis ${id} introuvable.` } };
      }
      throw error;
    }

    return { data: data as unknown as Permis };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

/** Récupère un permis via son QR Code token (pour scan terrain) */
export async function getPermisParQRCode(token: string): Promise<ServiceResult<Permis>> {
  try {
    const { data, error } = await supabase
      .from('permis')
      .select(`
        *,
        at:autorisations_travail(
          id, numero_at, statut, titre,
          zone:zones(nom, code_zone),
          animateur:utilisateurs!animateur_id(id, nom, prenom, telephone)
        ),
        intervenants_permis(*)
      `)
      .eq('qr_code_token', token)
      .single();

    if (error || !data) {
      return { error: { code: 'QR_INVALIDE', message: 'QR Code invalide ou expiré.' } };
    }

    return { data: data as unknown as Permis };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

export async function listerPermisAT(atId: string): Promise<ServiceResult<Permis[]>> {
  try {
    const { data, error } = await supabase
      .from('permis')
      .select(`*, intervenants_permis(*)`)
      .eq('at_id', atId)
      .order('created_at');

    if (error) throw error;
    return { data: data as unknown as Permis[] };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// CRÉATION
// ------------------------------------------------------------

export async function creerPermis(
  payload: CreatePermisPayload,
  _acteurId: string,
  role: RoleUtilisateur
): Promise<ServiceResult<Permis>> {
  if (role !== RoleUtilisateur.DEMANDEUR && role !== RoleUtilisateur.HSE_MANAGER && role !== RoleUtilisateur.ADMIN) {
    return { error: { code: ErreurMetier.PERMISSION_INSUFFISANTE, message: 'Permission insuffisante pour créer un permis.' } };
  }

  try {
    // Vérifier que l'AT est en BROUILLON ou SOUMISE
    const { data: at } = await supabase
      .from('autorisations_travail')
      .select('statut')
      .eq('id', payload.at_id)
      .single();

    if (!at || !['BROUILLON', 'SOUMISE'].includes(at.statut)) {
      return {
        error: {
          code: ErreurMetier.TRANSITION_STATUT_INVALIDE,
          message: 'Les permis ne peuvent être créés que si l\'AT est en BROUILLON ou SOUMISE.',
        },
      };
    }

    const { intervenants, ...permisData } = payload;

    const { data: permis, error } = await supabase
      .from('permis')
      .insert({
        ...permisData,
        statut: StatutPermis.EN_ATTENTE,
        intervenants: intervenants,
      })
      .select()
      .single();

    if (error) throw error;

    // Insérer les intervenants dans la table dédiée
    if (intervenants && intervenants.length > 0) {
      await supabase.from('intervenants_permis').insert(
        intervenants.map(i => ({ ...i, permis_id: permis.id }))
      );
    }

    return { data: permis as unknown as Permis };
  } catch (err) {
    return { error: { code: 'CREATE_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// VALIDATION TERRAIN — Animateur de Sécurité
// ------------------------------------------------------------

export async function validerPermis(
  payload: ValiderPermisPayload,
  acteurId: string,
  role: RoleUtilisateur
): Promise<ServiceResult<Permis>> {
  if (role !== RoleUtilisateur.ANIMATEUR_SECURITE && role !== RoleUtilisateur.HSE_MANAGER) {
    return { error: { code: ErreurMetier.PERMISSION_INSUFFISANTE, message: 'Seul l\'Animateur de Sécurité peut valider un permis.' } };
  }

  try {
    const { data: permis, error: readError } = await supabase
      .from('permis')
      .select('*, at:autorisations_travail(statut)')
      .eq('id', payload.permis_id)
      .single();

    if (readError || !permis) {
      return { error: { code: ErreurMetier.PERMIS_NON_TROUVE, message: 'Permis introuvable.' } };
    }

    if (permis.statut !== StatutPermis.EN_ATTENTE) {
      return {
        error: {
          code: ErreurMetier.TRANSITION_STATUT_INVALIDE,
          message: `Ce permis ne peut pas être validé. Statut actuel : ${permis.statut}`,
        },
      };
    }

    const updateData: Record<string, unknown> = {
      statut: StatutPermis.VALIDE,
      valide_par: acteurId,
      valide_le: new Date().toISOString(),
      commentaire_validation: payload.commentaire_validation,
    };

    if (payload.checklist_reponses) {
      updateData.checklist_reponses = payload.checklist_reponses;
    }

    const { data, error } = await supabase
      .from('permis')
      .update(updateData)
      .eq('id', payload.permis_id)
      .select()
      .single();

    if (error) throw error;

    // Vérifier si tous les permis de l'AT sont validés → déclencher auto-transition AT
    await verifierEtTransitionnerAT(permis.at_id, acteurId, role);

    return { data: data as unknown as Permis };
  } catch (err) {
    return { error: { code: 'VALIDATION_ERROR', message: (err as Error).message } };
  }
}

export async function rejeterPermis(
  payload: RejeterPermisPayload,
  acteurId: string,
  role: RoleUtilisateur
): Promise<ServiceResult<Permis>> {
  if (role !== RoleUtilisateur.ANIMATEUR_SECURITE && role !== RoleUtilisateur.HSE_MANAGER) {
    return { error: { code: ErreurMetier.PERMISSION_INSUFFISANTE, message: 'Seul l\'Animateur de Sécurité peut rejeter un permis.' } };
  }

  try {
    const { data, error } = await supabase
      .from('permis')
      .update({
        statut: StatutPermis.REJETE,
        rejete_par: acteurId,
        rejete_le: new Date().toISOString(),
        motif_rejet: payload.motif_rejet,
      })
      .eq('id', payload.permis_id)
      .eq('statut', StatutPermis.EN_ATTENTE)
      .select()
      .single();

    if (error) throw error;
    return { data: data as unknown as Permis };
  } catch (err) {
    return { error: { code: 'REJECTION_ERROR', message: (err as Error).message } };
  }
}

/** Clôturer un permis */
export async function cloturerPermis(
  permisId: string,
  _acteurId: string,
  role: RoleUtilisateur
): Promise<ServiceResult<Permis>> {
  if (
    role !== RoleUtilisateur.ANIMATEUR_SECURITE &&
    role !== RoleUtilisateur.HSE_MANAGER &&
    role !== RoleUtilisateur.RESP_ZONE
  ) {
    return { error: { code: ErreurMetier.PERMISSION_INSUFFISANTE, message: 'Permission insuffisante pour clôturer un permis.' } };
  }

  try {
    const { data, error } = await supabase
      .from('permis')
      .update({ statut: StatutPermis.CLOS })
      .eq('id', permisId)
      .eq('statut', StatutPermis.VALIDE)
      .select()
      .single();

    if (error) throw error;

    // S'assurer que tous les intervenants sont check-out
    await supabase
      .from('intervenants_permis')
      .update({ check_out_at: new Date().toISOString() })
      .eq('permis_id', permisId)
      .is('check_out_at', null);

    return { data: data as unknown as Permis };
  } catch (err) {
    return { error: { code: 'CLOTURE_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// CHECK-IN / CHECK-OUT terrain (QR Code)
// ------------------------------------------------------------

export async function checkIn(
  permisId: string,
  intervenantId: string,
  gps?: { lat: number; lng: number }
): Promise<ServiceResult<true>> {
  try {
    const { error } = await supabase
      .from('intervenants_permis')
      .update({
        check_in_at: new Date().toISOString(),
        check_in_gps: gps,
      })
      .eq('id', intervenantId)
      .eq('permis_id', permisId)
      .is('check_in_at', null);

    if (error) throw error;
    return { data: true };
  } catch (err) {
    return { error: { code: 'CHECKIN_ERROR', message: (err as Error).message } };
  }
}

export async function checkOut(
  intervenantId: string
): Promise<ServiceResult<true>> {
  try {
    const { error } = await supabase
      .from('intervenants_permis')
      .update({ check_out_at: new Date().toISOString() })
      .eq('id', intervenantId)
      .is('check_out_at', null);

    if (error) throw error;
    return { data: true };
  } catch (err) {
    return { error: { code: 'CHECKOUT_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// TEMPLATES CHECKLIST
// ------------------------------------------------------------

export async function getTemplateChecklist(
  typePermis: TypePermis
): Promise<ServiceResult<TemplateChecklist>> {
  try {
    const { data, error } = await supabase
      .from('templates_checklist')
      .select('*')
      .eq('type_permis', typePermis)
      .eq('actif', true)
      .single();

    if (error) throw error;
    return { data: data as unknown as TemplateChecklist };
  } catch (err) {
    return { error: { code: 'TEMPLATE_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// INTERNE : Vérifier si tous les permis sont validés → AT → VALIDEE
// ------------------------------------------------------------

async function verifierEtTransitionnerAT(
  atId: string,
  acteurId: string,
  role: RoleUtilisateur
): Promise<void> {
  const { data: permis } = await supabase
    .from('permis')
    .select('statut')
    .eq('at_id', atId)
    .neq('statut', StatutPermis.REJETE);

  if (!permis || permis.length === 0) return;

  const tousValides = permis.every(p => p.statut === StatutPermis.VALIDE);
  if (tousValides) {
    // Importer dynamiquement pour éviter la dépendance circulaire
    const { valider } = await import('./atService');
    await valider(atId, acteurId, role);
  }
}
