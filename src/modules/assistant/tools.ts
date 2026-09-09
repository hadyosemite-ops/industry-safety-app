// ─────────────────────────────────────────────────────────────────────────────
// tools — Définition des outils (tool-use Anthropic) exposés à l'Assistant
// HSE, et exécution côté client de chacun d'eux via les services existants
// (atService, admin/*Service). Source unique de vérité pour la distinction
// action « sûre » (exécution immédiate) / « destructive » (confirmation UI
// obligatoire avant exécution) : `OUTILS_DESTRUCTIFS`.
//
// Périmètre étendu à « full autorisation » sur demande explicite de
// l'utilisateur (2026-09) : couvre désormais l'ensemble des services
// PTW (AT, permis, audits) et référentiels (sites, zones, intervenants,
// utilisateurs). La distinction sûr/destructif reste la seule protection
// contre une exécution accidentelle — la protection de fond reste les
// policies RLS Supabase (un rôle sans droit reçoit une erreur claire).
// ─────────────────────────────────────────────────────────────────────────────

import * as atService from '@/modules/ptw/services/atService';
import * as permisService from '@/modules/ptw/services/permisService';
import * as auditService from '@/modules/ptw/services/auditService';
import * as sitesService from '@/modules/admin/services/sitesService';
import * as zonesService from '@/modules/admin/services/zonesService';
import * as intervenantsService from '@/modules/admin/services/intervenantsService';
import * as utilisateursService from '@/modules/admin/services/utilisateursService';
import { calculerKpis } from './services/kpiService';
import {
  RoleUtilisateur, StatutAT, TypeEcart, TypePermis, TypeAudit, ResultatAudit, NiveauRisque,
  type CreateATPayload, type CreatePermisPayload, type CreateAuditPayload, type ServiceResult,
} from '@/modules/ptw/types';
import { pickRole } from '@/modules/ptw/utils/roles';

// ------------------------------------------------------------
// Contexte d'exécution — dérivé de la session/profil de l'utilisateur
// connecté (fourni par le composant, jamais par le modèle).
// ------------------------------------------------------------

export interface ToolContext {
  userId: string;
  roles: RoleUtilisateur[];
  siteId: string;
}

export interface ToolExecutionResult {
  content: string;
  isError: boolean;
}

// ------------------------------------------------------------
// Outils destructifs — seule liste consultée par la logique de
// confirmation dans ChatAssistant.tsx. Ne pas dupliquer cette décision
// ailleurs dans le code.
// ------------------------------------------------------------

export const OUTILS_DESTRUCTIFS = [
  'suspendre_at', 'cloturer_at', 'supprimer_intervenant',
  'supprimer_zone', 'rejeter_permis', 'modifier_roles_utilisateur',
] as const;

export function estOutilDestructif(nom: string): boolean {
  return (OUTILS_DESTRUCTIFS as readonly string[]).includes(nom);
}

// ------------------------------------------------------------
// Schémas des outils (format Anthropic tool-use)
// ------------------------------------------------------------

export const TOOLS = [
  {
    name: 'get_kpis',
    description:
      "Renvoie un résumé chiffré à jour des autorisations de travail (AT) du site de l'utilisateur : nombre total, "
      + 'répartition par statut, nombre d\'AT suspendues, nombre d\'AT en retard par rapport à leur date de fin prévue. '
      + "À appeler chaque fois qu'on te demande un état des lieux ou des chiffres — ne réutilise jamais un chiffre déjà "
      + 'donné plus tôt dans la conversation.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'lister_ats',
    description: "Liste les autorisations de travail (AT), avec filtres optionnels.",
    input_schema: {
      type: 'object',
      properties: {
        statut: { type: 'string', enum: Object.values(StatutAT), description: 'Filtrer par statut.' },
        zone_id: { type: 'string', description: 'Filtrer par identifiant de zone.' },
        date_debut: { type: 'string', description: 'ISO date — AT dont la date de début prévue est postérieure ou égale.' },
        date_fin: { type: 'string', description: 'ISO date — AT dont la date de fin prévue est antérieure ou égale.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_at_detail',
    description: "Récupère le détail complet d'une AT (permis, suspensions, audits, historique) par son identifiant.",
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string', description: "Identifiant (UUID) de l'AT." } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'creer_at',
    description: "Crée une nouvelle autorisation de travail (statut initial BROUILLON). Action non destructive.",
    input_schema: {
      type: 'object',
      properties: {
        site_id: { type: 'string', description: "Optionnel — par défaut le site de l'utilisateur connecté." },
        zone_id: { type: 'string' },
        titre: { type: 'string' },
        description_travaux: { type: 'string' },
        entreprise_intervenante: { type: 'string' },
        chef_chantier: { type: 'string' },
        nombre_intervenants_prevu: { type: 'number' },
        date_debut_prevue: { type: 'string', description: 'ISO datetime.' },
        date_fin_prevue: { type: 'string', description: 'ISO datetime.' },
        dangers_identifies: { type: 'array', items: { type: 'string' } },
        mesures_prevention_globales: { type: 'array', items: { type: 'string' } },
        epi_obligatoires: { type: 'array', items: { type: 'string' } },
        niveau_risque_global: { type: 'string', enum: Object.values(NiveauRisque) },
        plan_urgence: { type: 'string' },
        animateur_id: { type: 'string' },
      },
      required: [
        'zone_id', 'titre', 'description_travaux', 'entreprise_intervenante', 'chef_chantier',
        'nombre_intervenants_prevu', 'date_debut_prevue', 'date_fin_prevue', 'niveau_risque_global',
      ],
      additionalProperties: false,
    },
  },
  {
    name: 'soumettre_at',
    description: 'Soumet une AT en BROUILLON pour validation (BROUILLON → SOUMISE). Action non destructive.',
    input_schema: {
      type: 'object',
      properties: { at_id: { type: 'string' } },
      required: ['at_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'valider_at',
    description: "Valide une AT (SOUMISE → VALIDEE) — nécessite que tous les permis soient déjà validés. Action non destructive.",
    input_schema: {
      type: 'object',
      properties: { at_id: { type: 'string' } },
      required: ['at_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'approuver_at',
    description: 'Approuve une AT (VALIDEE → APPROUVEE) — dernier mot du Responsable de Zone. Action non destructive.',
    input_schema: {
      type: 'object',
      properties: { at_id: { type: 'string' }, commentaire: { type: 'string' } },
      required: ['at_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'activer_at',
    description: 'Démarre les travaux (APPROUVEE → ACTIVE). Action non destructive.',
    input_schema: {
      type: 'object',
      properties: { at_id: { type: 'string' } },
      required: ['at_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'lever_suspension_at',
    description:
      "Lève une suspension en cours et réactive l'AT (SUSPENDUE → ACTIVE). Nécessite l'identifiant d'un audit de "
      + "conformité de type LEVEE_SUSPENSION déjà existant (audit_levee_id) — cet assistant ne propose pas encore de "
      + "créer cet audit ; si l'audit n'existe pas, l'outil échouera et il faudra créer l'audit de levée depuis le "
      + "module Audit de l'application. Action non destructive.",
    input_schema: {
      type: 'object',
      properties: {
        suspension_id: { type: 'string' },
        audit_levee_id: { type: 'string' },
        commentaire_levee: { type: 'string' },
      },
      required: ['suspension_id', 'audit_levee_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'suspendre_at',
    description:
      "Suspend une AT ACTIVE suite à un écart de sécurité constaté — arrête immédiatement les travaux et cascade sur "
      + 'tous les permis liés. Action DESTRUCTIVE : nécessite une confirmation explicite de l\'utilisateur.',
    input_schema: {
      type: 'object',
      properties: {
        at_id: { type: 'string' },
        type_ecart: { type: 'string', enum: Object.values(TypeEcart) },
        description_ecart: { type: 'string' },
        mesures_correctives: { type: 'string' },
        delai_correction: { type: 'string', description: 'ISO datetime, optionnel.' },
      },
      required: ['at_id', 'type_ecart', 'description_ecart', 'mesures_correctives'],
      additionalProperties: false,
    },
  },
  {
    name: 'cloturer_at',
    description:
      "Clôture une AT ACTIVE (ACTIVE → CLOTUREE) — nécessite que tous les permis soient clos et qu'aucune suspension "
      + "ne soit ouverte. Action DESTRUCTIVE (irréversible) : nécessite une confirmation explicite de l'utilisateur.",
    input_schema: {
      type: 'object',
      properties: { at_id: { type: 'string' }, commentaire: { type: 'string' } },
      required: ['at_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'lister_sites',
    description: 'Liste tous les sites visibles par l\'utilisateur connecté.',
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'lister_zones',
    description: "Liste les zones d'un site.",
    input_schema: {
      type: 'object',
      properties: { site_id: { type: 'string', description: "Optionnel — par défaut le site de l'utilisateur connecté." } },
      additionalProperties: false,
    },
  },
  {
    name: 'lister_intervenants',
    description: "Liste les intervenants externes (annuaire) d'un site.",
    input_schema: {
      type: 'object',
      properties: { site_id: { type: 'string', description: "Optionnel — par défaut le site de l'utilisateur connecté." } },
      additionalProperties: false,
    },
  },
  {
    name: 'creer_intervenant',
    description: 'Crée un intervenant externe dans l\'annuaire du site. Action non destructive.',
    input_schema: {
      type: 'object',
      properties: {
        site_id: { type: 'string', description: "Optionnel — par défaut le site de l'utilisateur connecté." },
        nom_complet: { type: 'string' },
        entreprise: { type: 'string' },
        habilitations: { type: 'array', items: { type: 'string' } },
        telephone: { type: 'string' },
        email: { type: 'string' },
      },
      required: ['nom_complet'],
      additionalProperties: false,
    },
  },
  {
    name: 'modifier_intervenant',
    description: "Modifie un intervenant externe existant (champs fournis uniquement). Action non destructive.",
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        nom_complet: { type: 'string' },
        entreprise: { type: 'string' },
        habilitations: { type: 'array', items: { type: 'string' } },
        telephone: { type: 'string' },
        email: { type: 'string' },
        actif: { type: 'boolean' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'supprimer_intervenant',
    description: "Supprime définitivement un intervenant externe de l'annuaire. Action DESTRUCTIVE (irréversible) : "
      + "nécessite une confirmation explicite de l'utilisateur.",
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'creer_zone',
    description: "Crée une nouvelle zone sur le site de l'utilisateur (ex: atelier, entrepôt). Réservé ADMIN/HSE_MANAGER "
      + "côté sécurité (RLS) — si l'utilisateur n'a pas ce rôle, l'outil renverra une erreur claire. Action non destructive.",
    input_schema: {
      type: 'object',
      properties: {
        nom: { type: 'string' },
        code_zone: { type: 'string', description: 'Code court unique sur le site, ex: Z-CHAUD-01.' },
        description: { type: 'string' },
        niveau_risque_defaut: { type: 'string', enum: Object.values(NiveauRisque) },
        responsable_id: { type: 'string', description: "Optionnel — identifiant d'un utilisateur du site." },
      },
      required: ['nom', 'code_zone', 'niveau_risque_defaut'],
      additionalProperties: false,
    },
  },
  {
    name: 'modifier_zone',
    description: 'Modifie une zone existante (champs fournis uniquement). Action non destructive.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        nom: { type: 'string' },
        code_zone: { type: 'string' },
        description: { type: 'string' },
        niveau_risque_defaut: { type: 'string', enum: Object.values(NiveauRisque) },
        responsable_id: { type: 'string' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'supprimer_zone',
    description: "Supprime définitivement une zone. Action DESTRUCTIVE (irréversible) : nécessite une confirmation "
      + "explicite de l'utilisateur.",
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'creer_site',
    description: "Crée un nouveau site pour l'entreprise. Réservé ADMIN côté sécurité (RLS). Action non destructive.",
    input_schema: {
      type: 'object',
      properties: {
        nom: { type: 'string' },
        adresse: { type: 'string' },
        code_site: { type: 'string', description: 'Identifiant court unique, ex: SITE-NORD-01.' },
        actif: { type: 'boolean' },
      },
      required: ['nom', 'adresse', 'code_site'],
      additionalProperties: false,
    },
  },
  {
    name: 'modifier_site',
    description: 'Modifie un site existant (champs fournis uniquement). Réservé ADMIN côté sécurité (RLS). Action non destructive.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        nom: { type: 'string' },
        adresse: { type: 'string' },
        code_site: { type: 'string' },
        actif: { type: 'boolean' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'lister_utilisateurs',
    description: "Liste les utilisateurs (comptes) du site de l'utilisateur connecté, avec leurs rôles.",
    input_schema: {
      type: 'object',
      properties: { site_id: { type: 'string', description: "Optionnel — par défaut le site de l'utilisateur connecté." } },
      additionalProperties: false,
    },
  },
  {
    name: 'modifier_roles_utilisateur',
    description: "Change les rôles et/ou le statut actif/inactif d'un utilisateur existant. Ne crée jamais de nouveau "
      + 'compte — les invitations se font uniquement depuis le tableau de bord Supabase, en dehors de cet assistant. '
      + "Réservé ADMIN côté sécurité (RLS). Action DESTRUCTIVE (impact sur les droits d'accès d'autrui) : nécessite "
      + "une confirmation explicite de l'utilisateur.",
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        roles: { type: 'array', items: { type: 'string', enum: Object.values(RoleUtilisateur) } },
        actif: { type: 'boolean' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'creer_permis',
    description: "Ajoute un permis à une AT existante en statut BROUILLON ou SOUMISE (ex: travail en hauteur, espace "
      + 'confiné...). Action non destructive.',
    input_schema: {
      type: 'object',
      properties: {
        at_id: { type: 'string' },
        type_permis: { type: 'string', enum: Object.values(TypePermis) },
        mesures_prevention: { type: 'array', items: { type: 'string' } },
        epi_requis: { type: 'array', items: { type: 'string' } },
        equipements_concernes: { type: 'array', items: { type: 'string' } },
        intervenants: {
          type: 'array',
          description: 'Liste des intervenants prévus sur ce permis.',
          items: {
            type: 'object',
            properties: {
              nom_complet: { type: 'string' },
              entreprise: { type: 'string' },
              habilitations: { type: 'array', items: { type: 'string' } },
            },
            required: ['nom_complet'],
          },
        },
      },
      required: ['at_id', 'type_permis'],
      additionalProperties: false,
    },
  },
  {
    name: 'valider_permis',
    description: "Valide un permis en attente (terrain) — réservé Animateur de Sécurité/HSE Manager côté sécurité. "
      + 'Action non destructive.',
    input_schema: {
      type: 'object',
      properties: { permis_id: { type: 'string' }, commentaire_validation: { type: 'string' } },
      required: ['permis_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'rejeter_permis',
    description: 'Rejette un permis en attente, avec motif obligatoire — bloque la validation de l\'AT tant qu\'un '
      + "nouveau permis conforme n'est pas soumis. Action DESTRUCTIVE : nécessite une confirmation explicite de "
      + "l'utilisateur.",
    input_schema: {
      type: 'object',
      properties: { permis_id: { type: 'string' }, motif_rejet: { type: 'string' } },
      required: ['permis_id', 'motif_rejet'],
      additionalProperties: false,
    },
  },
  {
    name: 'cloturer_permis',
    description: 'Clôture un permis validé (fin de travaux sur ce permis) et check-out tous ses intervenants encore '
      + 'actifs. Action non destructive.',
    input_schema: {
      type: 'object',
      properties: { permis_id: { type: 'string' } },
      required: ['permis_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'creer_audit',
    description: "Crée un audit de conformité sur une AT ACTIVE, SUSPENDUE ou APPROUVÉE — réservé Animateur de "
      + "Sécurité/HSE Manager. Un audit de type LEVEE_SUSPENSION est obligatoire avant de pouvoir lever une "
      + "suspension (outil lever_suspension_at). Action non destructive.",
    input_schema: {
      type: 'object',
      properties: {
        at_id: { type: 'string' },
        type_audit: { type: 'string', enum: Object.values(TypeAudit) },
        resultat: { type: 'string', enum: Object.values(ResultatAudit) },
        ecarts_constates: { type: 'string' },
        points_positifs: { type: 'string' },
        recommandations: { type: 'string' },
      },
      required: ['at_id', 'type_audit', 'resultat'],
      additionalProperties: false,
    },
  },
] as const;

// ------------------------------------------------------------
// Rôles préférés par transition — reflète workflowService.ROLES_PAR_TRANSITION
// / usePTWActions, pour choisir un rôle "agissant" cohérent avec les
// vérifications déjà faites côté service.
// ------------------------------------------------------------

const ROLES_SOUMETTRE = [RoleUtilisateur.DEMANDEUR, RoleUtilisateur.HSE_MANAGER, RoleUtilisateur.ADMIN];
const ROLES_VALIDER = [RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.HSE_MANAGER];
const ROLES_APPROUVER = [RoleUtilisateur.RESP_ZONE, RoleUtilisateur.HSE_MANAGER, RoleUtilisateur.ADMIN];
const ROLES_ACTIVER = [RoleUtilisateur.RESP_ZONE, RoleUtilisateur.HSE_MANAGER, RoleUtilisateur.ANIMATEUR_SECURITE];
const ROLES_SUSPENDRE = [RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.HSE_MANAGER];
const ROLES_CLOTURER = [RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.RESP_ZONE, RoleUtilisateur.HSE_MANAGER];
const ROLES_CREER_PERMIS = [RoleUtilisateur.DEMANDEUR, RoleUtilisateur.HSE_MANAGER, RoleUtilisateur.ADMIN];
const ROLES_VALIDER_PERMIS = [RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.HSE_MANAGER];
const ROLES_CLOTURER_PERMIS = [RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.HSE_MANAGER, RoleUtilisateur.RESP_ZONE];
const ROLES_CREER_AUDIT = [RoleUtilisateur.ANIMATEUR_SECURITE, RoleUtilisateur.HSE_MANAGER];

function role(ctx: ToolContext, preferes: RoleUtilisateur[]): RoleUtilisateur | null {
  return pickRole(ctx.roles, preferes);
}

function erreurRole(): ToolExecutionResult {
  return { content: "Vous n'avez pas le rôle requis pour effectuer cette action.", isError: true };
}

function depuisServiceResult<T>(result: ServiceResult<T>): ToolExecutionResult {
  if (result.error) return { content: result.error.message, isError: true };
  return { content: JSON.stringify(result.data ?? null), isError: false };
}

// ------------------------------------------------------------
// Exécution — un seul point d'entrée, appelé par ChatAssistant pour tout
// outil (sûr ou destructif, la distinction/gating étant faite en amont par
// le composant via `estOutilDestructif`).
// ------------------------------------------------------------

export async function executeTool(
  nom: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolExecutionResult> {
  try {
    switch (nom) {
      case 'get_kpis': {
        return depuisServiceResult(await calculerKpis());
      }

      case 'lister_ats': {
        return depuisServiceResult(await atService.listerATs({
          statut: input.statut as StatutAT | undefined,
          zone_id: input.zone_id as string | undefined,
          dateDebut: input.date_debut as string | undefined,
          dateFin: input.date_fin as string | undefined,
        }));
      }

      case 'get_at_detail': {
        return depuisServiceResult(await atService.getAT(input.id as string));
      }

      case 'creer_at': {
        const payload: CreateATPayload = {
          site_id: (input.site_id as string) || ctx.siteId,
          zone_id: input.zone_id as string,
          titre: input.titre as string,
          description_travaux: input.description_travaux as string,
          entreprise_intervenante: input.entreprise_intervenante as string,
          chef_chantier: input.chef_chantier as string,
          nombre_intervenants_prevu: Number(input.nombre_intervenants_prevu),
          date_debut_prevue: input.date_debut_prevue as string,
          date_fin_prevue: input.date_fin_prevue as string,
          animateur_id: input.animateur_id as string | undefined,
          evaluation_risques: {
            dangers_identifies: (input.dangers_identifies as string[]) ?? [],
            mesures_prevention_globales: (input.mesures_prevention_globales as string[]) ?? [],
            epi_obligatoires: (input.epi_obligatoires as string[]) ?? [],
            niveau_risque_global: input.niveau_risque_global as NiveauRisque,
            plan_urgence: input.plan_urgence as string | undefined,
          },
        };
        return depuisServiceResult(await atService.creerAT(payload, ctx.userId));
      }

      case 'soumettre_at': {
        const r = role(ctx, ROLES_SOUMETTRE);
        if (!r) return erreurRole();
        return depuisServiceResult(await atService.soumettre(input.at_id as string, ctx.userId, r));
      }

      case 'valider_at': {
        const r = role(ctx, ROLES_VALIDER);
        if (!r) return erreurRole();
        return depuisServiceResult(await atService.valider(input.at_id as string, ctx.userId, r));
      }

      case 'approuver_at': {
        const r = role(ctx, ROLES_APPROUVER);
        if (!r) return erreurRole();
        return depuisServiceResult(await atService.approuver(
          { at_id: input.at_id as string, commentaire: input.commentaire as string | undefined },
          ctx.userId, r,
        ));
      }

      case 'activer_at': {
        const r = role(ctx, ROLES_ACTIVER);
        if (!r) return erreurRole();
        return depuisServiceResult(await atService.activer(input.at_id as string, ctx.userId, r));
      }

      case 'lever_suspension_at': {
        const r = role(ctx, ROLES_SUSPENDRE);
        if (!r) return erreurRole();
        return depuisServiceResult(await atService.leverSuspension(
          {
            suspension_id: input.suspension_id as string,
            audit_levee_id: input.audit_levee_id as string,
            commentaire_levee: input.commentaire_levee as string | undefined,
          },
          ctx.userId, r,
        ));
      }

      case 'suspendre_at': {
        const r = role(ctx, ROLES_SUSPENDRE);
        if (!r) return erreurRole();
        return depuisServiceResult(await atService.suspendre(
          {
            at_id: input.at_id as string,
            motif_suspension: input.description_ecart as string,
            type_ecart: input.type_ecart as TypeEcart,
            description_ecart: input.description_ecart as string,
            mesures_correctives: input.mesures_correctives as string,
            delai_correction: input.delai_correction as string | undefined,
          },
          ctx.userId, r,
        ));
      }

      case 'cloturer_at': {
        const r = role(ctx, ROLES_CLOTURER);
        if (!r) return erreurRole();
        return depuisServiceResult(await atService.cloturer(
          input.at_id as string, ctx.userId, r, input.commentaire as string | undefined,
        ));
      }

      case 'lister_sites': {
        return depuisServiceResult(await sitesService.listerSites());
      }

      case 'lister_zones': {
        return depuisServiceResult(await zonesService.listerZones((input.site_id as string) || ctx.siteId));
      }

      case 'lister_intervenants': {
        return depuisServiceResult(await intervenantsService.listerIntervenants((input.site_id as string) || ctx.siteId));
      }

      case 'creer_intervenant': {
        return depuisServiceResult(await intervenantsService.creerIntervenant({
          site_id: (input.site_id as string) || ctx.siteId,
          nom_complet: input.nom_complet as string,
          entreprise: input.entreprise as string | undefined,
          habilitations: input.habilitations as string[] | undefined,
          telephone: input.telephone as string | undefined,
          email: input.email as string | undefined,
        }));
      }

      case 'modifier_intervenant': {
        return depuisServiceResult(await intervenantsService.modifierIntervenant(input.id as string, {
          nom_complet: input.nom_complet as string | undefined,
          entreprise: input.entreprise as string | undefined,
          habilitations: input.habilitations as string[] | undefined,
          telephone: input.telephone as string | undefined,
          email: input.email as string | undefined,
          actif: input.actif as boolean | undefined,
        }));
      }

      case 'supprimer_intervenant': {
        return depuisServiceResult(await intervenantsService.supprimerIntervenant(input.id as string));
      }

      case 'creer_zone': {
        return depuisServiceResult(await zonesService.creerZone({
          site_id: ctx.siteId,
          nom: input.nom as string,
          code_zone: input.code_zone as string,
          description: input.description as string | undefined,
          niveau_risque_defaut: input.niveau_risque_defaut as NiveauRisque,
          responsable_id: input.responsable_id as string | undefined,
        }));
      }

      case 'modifier_zone': {
        return depuisServiceResult(await zonesService.modifierZone(input.id as string, {
          nom: input.nom as string | undefined,
          code_zone: input.code_zone as string | undefined,
          description: input.description as string | undefined,
          niveau_risque_defaut: input.niveau_risque_defaut as NiveauRisque | undefined,
          responsable_id: input.responsable_id as string | undefined,
        }));
      }

      case 'supprimer_zone': {
        return depuisServiceResult(await zonesService.supprimerZone(input.id as string));
      }

      case 'creer_site': {
        return depuisServiceResult(await sitesService.creerSite({
          nom: input.nom as string,
          adresse: input.adresse as string,
          code_site: input.code_site as string,
          actif: (input.actif as boolean | undefined) ?? true,
        }));
      }

      case 'modifier_site': {
        return depuisServiceResult(await sitesService.modifierSite(input.id as string, {
          nom: input.nom as string | undefined,
          adresse: input.adresse as string | undefined,
          code_site: input.code_site as string | undefined,
          actif: input.actif as boolean | undefined,
        }));
      }

      case 'lister_utilisateurs': {
        return depuisServiceResult(await utilisateursService.listerUtilisateurs((input.site_id as string) || ctx.siteId));
      }

      case 'modifier_roles_utilisateur': {
        // UpdateUtilisateurRolesPayload exige roles ET actif : on complète avec les
        // valeurs actuelles si l'un des deux champs n'a pas été fourni par le modèle.
        const utilisateurs = await utilisateursService.listerUtilisateurs(ctx.siteId);
        const existant = utilisateurs.data?.find(u => u.id === input.id);
        if (!existant) return { content: 'Utilisateur introuvable sur ce site.', isError: true };
        return depuisServiceResult(await utilisateursService.modifierRolesEtStatut(input.id as string, {
          roles: (input.roles as RoleUtilisateur[] | undefined) ?? existant.roles,
          actif: (input.actif as boolean | undefined) ?? existant.actif,
        }));
      }

      case 'creer_permis': {
        const r = role(ctx, ROLES_CREER_PERMIS);
        if (!r) return erreurRole();
        const payload: CreatePermisPayload = {
          at_id: input.at_id as string,
          type_permis: input.type_permis as TypePermis,
          checklist_reponses: [],
          mesures_prevention: (input.mesures_prevention as string[]) ?? [],
          epi_requis: (input.epi_requis as string[]) ?? [],
          equipements_concernes: (input.equipements_concernes as string[]) ?? [],
          intervenants: (input.intervenants as CreatePermisPayload['intervenants']) ?? [],
        };
        return depuisServiceResult(await permisService.creerPermis(payload, ctx.userId, r));
      }

      case 'valider_permis': {
        const r = role(ctx, ROLES_VALIDER_PERMIS);
        if (!r) return erreurRole();
        return depuisServiceResult(await permisService.validerPermis(
          {
            permis_id: input.permis_id as string,
            commentaire_validation: input.commentaire_validation as string | undefined,
          },
          ctx.userId, r,
        ));
      }

      case 'rejeter_permis': {
        const r = role(ctx, ROLES_VALIDER_PERMIS);
        if (!r) return erreurRole();
        return depuisServiceResult(await permisService.rejeterPermis(
          {
            permis_id: input.permis_id as string,
            motif_rejet: input.motif_rejet as string,
          },
          ctx.userId, r,
        ));
      }

      case 'cloturer_permis': {
        const r = role(ctx, ROLES_CLOTURER_PERMIS);
        if (!r) return erreurRole();
        return depuisServiceResult(await permisService.cloturerPermis(input.permis_id as string, ctx.userId, r));
      }

      case 'creer_audit': {
        const r = role(ctx, ROLES_CREER_AUDIT);
        if (!r) return erreurRole();
        const payload: CreateAuditPayload = {
          at_id: input.at_id as string,
          type_audit: input.type_audit as TypeAudit,
          checklist_audit: [],
          resultat: input.resultat as ResultatAudit,
          ecarts_constates: input.ecarts_constates as string | undefined,
          points_positifs: input.points_positifs as string | undefined,
          recommandations: input.recommandations as string | undefined,
        };
        return depuisServiceResult(await auditService.creerAudit(payload, ctx.userId, r));
      }

      default:
        return { content: `Outil inconnu : ${nom}.`, isError: true };
    }
  } catch (err) {
    return { content: `Erreur inattendue lors de l'exécution de l'outil "${nom}" : ${(err as Error).message}`, isError: true };
  }
}
