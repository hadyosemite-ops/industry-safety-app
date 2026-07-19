// ─────────────────────────────────────────────────────────────────────────────
// usePTWActions — Point d'entrée unique pour toutes les actions métier du
// dashboard PTW (valider/rejeter un permis, approuver/activer/suspendre/
// clôturer une AT, lever une suspension, créer un audit). Centralise :
//   - la résolution du rôle agissant (un utilisateur peut avoir plusieurs
//     rôles ; on prend le premier rôle pertinent pour l'action demandée,
//     cohérent avec les vérifications faites côté service),
//   - les notifications de succès/erreur (useToast），
//   - le refetch des données après une mutation réussie.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/ToastProvider';
import * as atService from '../services/atService';
import * as permisService from '../services/permisService';
import * as auditService from '../services/auditService';
import {
  RoleUtilisateur, TypeAudit, TypeEcart, ResultatAudit,
  type ChecklistReponse,
} from '../types';
import { pickRole, toRoleUtilisateurs } from '../utils/roles';

export interface SuspensionInput {
  type_ecart: TypeEcart;
  description_ecart: string;
  mesures_correctives: string;
}

export interface AuditInput {
  type_audit: 'PROGRAMME' | 'INOPINE';
  resultat: 'CONFORME' | 'NON_CONFORME' | 'CONFORME_RESERVES';
  observations: string;
  ecarts: string;
}

export function usePTWActions(onDone?: () => void | Promise<void>) {
  const { user, profile } = useAuth();
  const toast = useToast();
  const acteurId = user?.id ?? '';
  const roles = toRoleUtilisateurs(profile?.roles);

  const apresSucces = useCallback(async (message: string) => {
    toast.success(message);
    if (onDone) await onDone();
  }, [toast, onDone]);

  const besoinRole = useCallback((preferes: RoleUtilisateur[]): RoleUtilisateur | null => {
    const role = pickRole(roles, preferes);
    if (!role) {
      toast.error("Vous n'avez pas le rôle requis pour effectuer cette action.");
    }
    return role;
  }, [roles, toast]);

  const validerPermis = useCallback(async (
    permisId: string, commentaire?: string, checklist?: ChecklistReponse[],
  ): Promise<boolean> => {
    const role = besoinRole([RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.HSE_MANAGER]);
    if (!role) return false;
    const { error } = await permisService.validerPermis(
      { permis_id: permisId, commentaire_validation: commentaire || undefined, checklist_reponses: checklist },
      acteurId, role,
    );
    if (error) { toast.error(error.message); return false; }
    await apresSucces('Permis validé.');
    return true;
  }, [acteurId, besoinRole, toast, apresSucces]);

  const rejeterPermis = useCallback(async (permisId: string, motif: string): Promise<boolean> => {
    const role = besoinRole([RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.HSE_MANAGER]);
    if (!role) return false;
    const { error } = await permisService.rejeterPermis({ permis_id: permisId, motif_rejet: motif }, acteurId, role);
    if (error) { toast.error(error.message); return false; }
    await apresSucces('Permis rejeté.');
    return true;
  }, [acteurId, besoinRole, toast, apresSucces]);

  const validerAT = useCallback(async (atId: string): Promise<boolean> => {
    const role = besoinRole([RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.HSE_MANAGER]);
    if (!role) return false;
    const { error } = await atService.valider(atId, acteurId, role);
    if (error) { toast.error(error.message); return false; }
    await apresSucces('AT validée.');
    return true;
  }, [acteurId, besoinRole, toast, apresSucces]);

  const approuverAT = useCallback(async (atId: string, commentaire?: string): Promise<boolean> => {
    const role = besoinRole([RoleUtilisateur.RESP_ZONE, RoleUtilisateur.HSE_MANAGER, RoleUtilisateur.ADMIN]);
    if (!role) return false;
    const { error } = await atService.approuver({ at_id: atId, commentaire }, acteurId, role);
    if (error) { toast.error(error.message); return false; }
    await apresSucces('AT approuvée.');
    return true;
  }, [acteurId, besoinRole, toast, apresSucces]);

  /**
   * Le workflow métier (workflowService.TRANSITIONS_AUTORISEES) n'autorise pas
   * de retour VALIDEE → SOUMISE : il n'existe aucune fonction de service pour
   * « refuser » une AT déjà validée par l'Animateur. On le signale plutôt que
   * de simuler un succès.
   */
  const refuserAT = useCallback(async (_atId: string, _motif: string): Promise<boolean> => {
    toast.error("Le refus d'une AT validée n'est pas pris en charge par le workflow métier actuel.");
    return false;
  }, [toast]);

  const activerAT = useCallback(async (atId: string): Promise<boolean> => {
    const role = besoinRole([RoleUtilisateur.RESP_ZONE, RoleUtilisateur.HSE_MANAGER, RoleUtilisateur.ANIMATEUR_SECURITE]);
    if (!role) return false;
    const { error } = await atService.activer(atId, acteurId, role);
    if (error) { toast.error(error.message); return false; }
    await apresSucces('AT activée.');
    return true;
  }, [acteurId, besoinRole, toast, apresSucces]);

  const suspendreAT = useCallback(async (atId: string, data: SuspensionInput): Promise<boolean> => {
    const role = besoinRole([RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.HSE_MANAGER]);
    if (!role) return false;
    const { error } = await atService.suspendre(
      {
        at_id: atId,
        motif_suspension: data.description_ecart,
        type_ecart: data.type_ecart,
        description_ecart: data.description_ecart,
        mesures_correctives: data.mesures_correctives,
      },
      acteurId, role,
    );
    if (error) { toast.error(error.message); return false; }
    await apresSucces('AT suspendue.');
    return true;
  }, [acteurId, besoinRole, toast, apresSucces]);

  const cloturerAT = useCallback(async (atId: string): Promise<boolean> => {
    const role = besoinRole([RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.RESP_ZONE, RoleUtilisateur.HSE_MANAGER]);
    if (!role) return false;
    const { error } = await atService.cloturer(atId, acteurId, role);
    if (error) { toast.error(error.message); return false; }
    await apresSucces('AT clôturée.');
    return true;
  }, [acteurId, besoinRole, toast, apresSucces]);

  /** Audit terrain « classique » (programmé / inopiné). */
  const creerAuditTerrain = useCallback(async (atId: string, data: AuditInput): Promise<boolean> => {
    const role = besoinRole([RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.HSE_MANAGER]);
    if (!role) return false;
    const { error } = await auditService.creerAudit(
      {
        at_id: atId,
        type_audit: data.type_audit as unknown as TypeAudit,
        checklist_audit: [],
        ecarts_constates: data.ecarts || undefined,
        resultat: data.resultat as unknown as ResultatAudit,
        recommandations: undefined,
      },
      acteurId, role,
    );
    if (error) { toast.error(error.message); return false; }
    await apresSucces('Audit enregistré.');
    return true;
  }, [acteurId, besoinRole, toast, apresSucces]);

  /**
   * Levée de suspension : crée l'audit de conformité obligatoire (forcé en
   * type LEVEE_SUSPENSION quel que soit le type sélectionné dans la modale
   * générique d'audit — cf. AuditModal, qui ne propose que PROGRAMME/INOPINE
   * pour l'usage "audit terrain" courant), puis lève la suspension.
   */
  const leverSuspensionAvecAudit = useCallback(async (
    atId: string, suspensionId: string, data: AuditInput,
  ): Promise<boolean> => {
    const role = besoinRole([RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.HSE_MANAGER]);
    if (!role) return false;

    const auditResult = await auditService.creerAudit(
      {
        at_id: atId,
        type_audit: TypeAudit.LEVEE_SUSPENSION,
        checklist_audit: [],
        ecarts_constates: data.ecarts || undefined,
        resultat: data.resultat as unknown as ResultatAudit,
        recommandations: undefined,
      },
      acteurId, role,
    );
    if (auditResult.error || !auditResult.data) {
      toast.error(auditResult.error?.message ?? "Erreur lors de la création de l'audit de levée.");
      return false;
    }

    const { error } = await atService.leverSuspension(
      { suspension_id: suspensionId, audit_levee_id: auditResult.data.id, commentaire_levee: data.observations },
      acteurId, role,
    );
    if (error) { toast.error(error.message); return false; }
    await apresSucces('Suspension levée — AT réactivée.');
    return true;
  }, [acteurId, besoinRole, toast, apresSucces]);

  return {
    acteurId,
    roles,
    validerPermis,
    rejeterPermis,
    validerAT,
    approuverAT,
    refuserAT,
    activerAT,
    suspendreAT,
    cloturerAT,
    creerAuditTerrain,
    leverSuspensionAvecAudit,
  };
}

export type PTWActions = ReturnType<typeof usePTWActions>;
