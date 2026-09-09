// ─────────────────────────────────────────────────────────────────────────────
// tools — Définition des outils (tool-use Anthropic) exposés à l'Assistant
// HSE, et exécution côté client de chacun d'eux via les services existants
// (atService, admin/*Service). Source unique de vérité pour la distinction
// action « sûre » (exécution immédiate) / « destructive » (confirmation UI
// obligatoire avant exécution) : `OUTILS_DESTRUCTIFS`.
//
// Périmètre volontairement limité pour ce v1 (cf. rapport de livraison) :
// pas de wrapper pour permisService, auditService, utilisateursService, ni
// pour la suppression de site/zone — seuls les outils listés ci-dessous sont
// exposés au modèle.
// ─────────────────────────────────────────────────────────────────────────────

import * as atService from '@/modules/ptw/services/atService';
import * as sitesService from '@/modules/admin/services/sitesService';
import * as zonesService from '@/modules/admin/services/zonesService';
import * as intervenantsService from '@/modules/admin/services/intervenantsService';
import { calculerKpis } from './services/kpiService';
import {
  RoleUtilisateur, StatutAT, TypeEcart, NiveauRisque,
  type CreateATPayload, type ServiceResult,
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

export const OUTILS_DESTRUCTIFS = ['suspendre_at', 'cloturer_at', 'supprimer_intervenant'] as const;

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

      default:
        return { content: `Outil inconnu : ${nom}.`, isError: true };
    }
  } catch (err) {
    return { content: `Erreur inattendue lors de l'exécution de l'outil "${nom}" : ${(err as Error).message}`, isError: true };
  }
}
