// ============================================================
// Workflow Service — Machine à états de l'AT
// Gère les transitions de statut et les règles métier
// ============================================================

import { StatutAT, StatutPermis, RoleUtilisateur, ErreurMetier, ServiceResult } from '../types';

// ------------------------------------------------------------
// Machine à états : transitions autorisées
// ------------------------------------------------------------

const TRANSITIONS_AUTORISEES: Record<StatutAT, StatutAT[]> = {
  [StatutAT.BROUILLON]:  [StatutAT.SOUMISE],
  [StatutAT.SOUMISE]:    [StatutAT.VALIDEE, StatutAT.BROUILLON], // Retour possible pour correction
  [StatutAT.VALIDEE]:    [StatutAT.APPROUVEE],
  [StatutAT.APPROUVEE]:  [StatutAT.ACTIVE],
  [StatutAT.ACTIVE]:     [StatutAT.SUSPENDUE, StatutAT.CLOTUREE],
  [StatutAT.SUSPENDUE]:  [StatutAT.ACTIVE],   // Reprise après audit de levée
  [StatutAT.CLOTUREE]:   [],                  // État final
};

// Rôles autorisés pour chaque transition
const ROLES_PAR_TRANSITION: Record<string, RoleUtilisateur[]> = {
  [`${StatutAT.BROUILLON}→${StatutAT.SOUMISE}`]:   [RoleUtilisateur.DEMANDEUR, RoleUtilisateur.HSE_MANAGER, RoleUtilisateur.ADMIN],
  [`${StatutAT.SOUMISE}→${StatutAT.BROUILLON}`]:   [RoleUtilisateur.DEMANDEUR, RoleUtilisateur.HSE_MANAGER, RoleUtilisateur.ADMIN],
  [`${StatutAT.SOUMISE}→${StatutAT.VALIDEE}`]:     [RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.HSE_MANAGER],
  [`${StatutAT.VALIDEE}→${StatutAT.APPROUVEE}`]:   [RoleUtilisateur.RESP_ZONE, RoleUtilisateur.HSE_MANAGER, RoleUtilisateur.ADMIN],
  [`${StatutAT.APPROUVEE}→${StatutAT.ACTIVE}`]:    [RoleUtilisateur.RESP_ZONE, RoleUtilisateur.HSE_MANAGER, RoleUtilisateur.ANIMATEUR_SECURITE],
  [`${StatutAT.ACTIVE}→${StatutAT.SUSPENDUE}`]:    [RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.HSE_MANAGER],
  [`${StatutAT.SUSPENDUE}→${StatutAT.ACTIVE}`]:    [RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.HSE_MANAGER],
  [`${StatutAT.ACTIVE}→${StatutAT.CLOTUREE}`]:     [RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.RESP_ZONE, RoleUtilisateur.HSE_MANAGER],
};

// ------------------------------------------------------------
// Vérification de transition
// ------------------------------------------------------------

export function verifierTransition(
  statutActuel: StatutAT,
  statutCible: StatutAT,
  roleActeur: RoleUtilisateur
): ServiceResult<true> {
  // 1. Vérifier que la transition est dans la machine à états
  const transitionsAutorisees = TRANSITIONS_AUTORISEES[statutActuel] || [];
  if (!transitionsAutorisees.includes(statutCible)) {
    return {
      error: {
        code: ErreurMetier.TRANSITION_STATUT_INVALIDE,
        message: `Transition impossible : ${statutActuel} → ${statutCible} n'est pas autorisée.`,
      },
    };
  }

  // 2. Vérifier le rôle
  const cle = `${statutActuel}→${statutCible}`;
  const rolesAutorises = ROLES_PAR_TRANSITION[cle] || [];
  if (!rolesAutorises.includes(roleActeur)) {
    return {
      error: {
        code: ErreurMetier.PERMISSION_INSUFFISANTE,
        message: `Le rôle ${roleActeur} n'est pas autorisé à effectuer la transition ${statutActuel} → ${statutCible}.`,
        details: { rolesAutorises },
      },
    };
  }

  return { data: true };
}

// ------------------------------------------------------------
// Vérification métier — RÈGLE #2
// L'approbation AT est bloquée si tous les permis ne sont pas validés
// Cette vérification est en double avec le trigger SQL (défense en profondeur)
// ------------------------------------------------------------

export function verifierConditionApprobation(
  permis: { statut: StatutPermis }[]
): ServiceResult<true> {
  const permisActifs = permis.filter(p => p.statut !== StatutPermis.REJETE);

  if (permisActifs.length === 0) {
    return {
      error: {
        code: ErreurMetier.APPROBATION_BLOQUEE_PERMIS_NON_VALIDES,
        message: "L'AT doit avoir au moins un permis pour être approuvée.",
      },
    };
  }

  const permisNonValides = permisActifs.filter(p => p.statut !== StatutPermis.VALIDE);
  if (permisNonValides.length > 0) {
    return {
      error: {
        code: ErreurMetier.APPROBATION_BLOQUEE_PERMIS_NON_VALIDES,
        message: `${permisNonValides.length} permis sur ${permisActifs.length} ne sont pas encore validés. Tous doivent être validés par l'Animateur de Sécurité avant l'approbation.`,
        details: { permisNonValides: permisNonValides.length, total: permisActifs.length },
      },
    };
  }

  return { data: true };
}

// ------------------------------------------------------------
// Vérification métier — RÈGLE #3
// La clôture AT est bloquée si permis non clos ou suspension ouverte
// ------------------------------------------------------------

export function verifierConditionCloture(
  permis: { statut: StatutPermis }[],
  suspensionOuverte: boolean
): ServiceResult<true> {
  if (suspensionOuverte) {
    return {
      error: {
        code: ErreurMetier.CLOTURE_BLOQUEE_SUSPENSION_OUVERTE,
        message: "Une suspension est encore en cours de traitement. Levez la suspension avant de clôturer l'AT.",
      },
    };
  }

  const permisNonClos = permis.filter(
    p => p.statut !== StatutPermis.CLOS && p.statut !== StatutPermis.REJETE
  );

  if (permisNonClos.length > 0) {
    return {
      error: {
        code: ErreurMetier.CLOTURE_BLOQUEE_PERMIS_NON_CLOS,
        message: `${permisNonClos.length} permis doivent être clôturés avant de clôturer l'AT.`,
        details: { permisNonClos: permisNonClos.length },
      },
    };
  }

  return { data: true };
}

// ------------------------------------------------------------
// Helper : prochain statut possible selon le rôle
// Utilisé pour afficher les actions disponibles dans l'UI
// ------------------------------------------------------------

export function getActionsDisponibles(
  statutActuel: StatutAT,
  role: RoleUtilisateur
): StatutAT[] {
  const transitionsPossibles = TRANSITIONS_AUTORISEES[statutActuel] || [];
  return transitionsPossibles.filter(statutCible => {
    const cle = `${statutActuel}→${statutCible}`;
    const rolesAutorises = ROLES_PAR_TRANSITION[cle] || [];
    return rolesAutorises.includes(role);
  });
}

// ------------------------------------------------------------
// Helper : libellé lisible d'un statut
// ------------------------------------------------------------

export const LIBELLES_STATUT: Record<StatutAT, string> = {
  [StatutAT.BROUILLON]:  'Brouillon',
  [StatutAT.SOUMISE]:    'Soumise',
  [StatutAT.VALIDEE]:    'Validée',
  [StatutAT.APPROUVEE]:  'Approuvée',
  [StatutAT.ACTIVE]:     'Active',
  [StatutAT.SUSPENDUE]:  'Suspendue',
  [StatutAT.CLOTUREE]:   'Clôturée',
};

export const COULEURS_STATUT: Record<StatutAT, string> = {
  [StatutAT.BROUILLON]:  '#9ca3af',  // gray
  [StatutAT.SOUMISE]:    '#3b82f6',  // blue
  [StatutAT.VALIDEE]:    '#8b5cf6',  // purple
  [StatutAT.APPROUVEE]:  '#10b981',  // green
  [StatutAT.ACTIVE]:     '#f59e0b',  // amber
  [StatutAT.SUSPENDUE]:  '#ef4444',  // red
  [StatutAT.CLOTUREE]:   '#6b7280',  // gray-dark
};
