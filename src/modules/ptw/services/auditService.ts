// ============================================================
// Audit Service — Gestion des audits AT
// Entité séparée avec traçabilité propre
// ============================================================

import { supabase } from '../../../lib/supabase';
import {
  AuditAT,
  TypeAudit,
  RoleUtilisateur,
  CreateAuditPayload,
  ServiceResult,
  ErreurMetier,
  StatutAT,
} from '../types';

// ------------------------------------------------------------
// LECTURE
// ------------------------------------------------------------

export async function listerAuditsAT(atId: string): Promise<ServiceResult<AuditAT[]>> {
  try {
    const { data, error } = await supabase
      .from('audits_at')
      .select(`
        *,
        auditeur:utilisateurs!auditeur_id(id, nom, prenom, email)
      `)
      .eq('at_id', atId)
      .order('date_audit', { ascending: false });

    if (error) throw error;
    return { data: data as unknown as AuditAT[] };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

export async function getAudit(id: string): Promise<ServiceResult<AuditAT>> {
  try {
    const { data, error } = await supabase
      .from('audits_at')
      .select(`
        *,
        auditeur:utilisateurs!auditeur_id(id, nom, prenom, email, telephone),
        at:autorisations_travail(id, numero_at, titre, statut)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data: data as unknown as AuditAT };
  } catch (err) {
    return { error: { code: 'FETCH_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// CRÉATION — Animateur de Sécurité uniquement
// ------------------------------------------------------------

export async function creerAudit(
  payload: CreateAuditPayload,
  acteurId: string,
  role: RoleUtilisateur
): Promise<ServiceResult<AuditAT>> {
  if (role !== RoleUtilisateur.ANIMATEUR_SECURITE && role !== RoleUtilisateur.HSE_MANAGER) {
    return {
      error: {
        code: ErreurMetier.PERMISSION_INSUFFISANTE,
        message: 'Seul l\'Animateur de Sécurité peut créer un audit.',
      },
    };
  }

  try {
    // Vérifier que l'AT est dans un état auditable (ACTIVE ou SUSPENDUE)
    const { data: at } = await supabase
      .from('autorisations_travail')
      .select('statut')
      .eq('id', payload.at_id)
      .single();

    const etatsAuditables = [StatutAT.ACTIVE, StatutAT.SUSPENDUE, StatutAT.APPROUVEE];
    if (!at || !etatsAuditables.includes(at.statut as StatutAT)) {
      return {
        error: {
          code: ErreurMetier.TRANSITION_STATUT_INVALIDE,
          message: `L'AT doit être ACTIVE, SUSPENDUE ou APPROUVÉE pour être auditée. Statut actuel : ${at?.statut}`,
        },
      };
    }

    // Pour un audit de levée de suspension, vérifier qu'il y a bien une suspension ouverte
    if (payload.type_audit === TypeAudit.LEVEE_SUSPENSION) {
      const { data: suspensions } = await supabase
        .from('suspensions_at')
        .select('id')
        .eq('at_id', payload.at_id)
        .is('date_levee', null);

      if (!suspensions || suspensions.length === 0) {
        return {
          error: {
            code: ErreurMetier.AUDIT_TYPE_INCORRECT,
            message: 'Aucune suspension ouverte sur cette AT. L\'audit de levée n\'est pas applicable.',
          },
        };
      }
    }

    const { data, error } = await supabase
      .from('audits_at')
      .insert({
        at_id: payload.at_id,
        auditeur_id: acteurId,
        type_audit: payload.type_audit,
        date_audit: new Date().toISOString(),
        checklist_audit: payload.checklist_audit,
        ecarts_constates: payload.ecarts_constates,
        points_positifs: payload.points_positifs,
        photos: payload.photos ?? [],
        resultat: payload.resultat,
        recommandations: payload.recommandations,
        signature_base64: payload.signature_base64,
        localisation_gps: payload.localisation_gps,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as unknown as AuditAT };
  } catch (err) {
    return { error: { code: 'CREATE_ERROR', message: (err as Error).message } };
  }
}

// ------------------------------------------------------------
// STATISTIQUES
// ------------------------------------------------------------

export async function getStatistiquesAudits(atId: string): Promise<ServiceResult<{
  total: number;
  conformes: number;
  nonConformes: number;
  conformesAvecReserves: number;
  derniereDate?: string;
}>> {
  try {
    const { data, error } = await supabase
      .from('audits_at')
      .select('resultat, date_audit')
      .eq('at_id', atId)
      .order('date_audit', { ascending: false });

    if (error) throw error;

    const stats = {
      total: data.length,
      conformes: data.filter(a => a.resultat === 'CONFORME').length,
      nonConformes: data.filter(a => a.resultat === 'NON_CONFORME').length,
      conformesAvecReserves: data.filter(a => a.resultat === 'CONFORME_RESERVES').length,
      derniereDate: data[0]?.date_audit,
    };

    return { data: stats };
  } catch (err) {
    return { error: { code: 'STATS_ERROR', message: (err as Error).message } };
  }
}
