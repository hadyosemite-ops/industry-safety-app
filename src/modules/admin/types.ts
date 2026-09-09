// ============================================================
// MODULE ADMIN — "Base de données" (référentiels)
// Types & payloads propres à ce module.
//
// Les entités déjà définies pour le module PTW (Site, Zone,
// Utilisateur, RoleUtilisateur, NiveauRisque, ServiceResult…) sont
// réutilisées telles quelles — on ne les redéfinit pas ici, on les
// ré-exporte pour que les composants de ce module n'aient qu'un
// seul point d'import (`@/modules/admin/types`).
// ============================================================

import { RoleUtilisateur, NiveauRisque } from '../ptw/types';
import type { Site, Zone, Utilisateur, ServiceResult, ServiceError } from '../ptw/types';

export { RoleUtilisateur, NiveauRisque };
export type { Site, Zone, Utilisateur, ServiceResult, ServiceError };

// ------------------------------------------------------------
// INTERVENANT EXTERNE
// Annuaire réutilisable de personnes/entreprises externes
// (migration 004_referentiels.sql — table intervenants_externes)
// ------------------------------------------------------------

export interface IntervenantExterne {
  id: string;
  site_id: string;
  nom_complet: string;
  entreprise?: string;
  habilitations?: string[];
  telephone?: string;
  email?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateIntervenantExternePayload {
  site_id: string;
  nom_complet: string;
  entreprise?: string;
  habilitations?: string[];
  telephone?: string;
  email?: string;
  actif?: boolean;
}

export type UpdateIntervenantExternePayload = Partial<Omit<CreateIntervenantExternePayload, 'site_id'>>;

// ------------------------------------------------------------
// DTOs — Sites
// ------------------------------------------------------------

export interface CreateSitePayload {
  nom: string;
  adresse: string;
  code_site: string;
  actif?: boolean;
}

export type UpdateSitePayload = Partial<CreateSitePayload>;

// ------------------------------------------------------------
// DTOs — Zones
// ------------------------------------------------------------

export interface CreateZonePayload {
  site_id: string;
  nom: string;
  code_zone: string;
  description?: string;
  niveau_risque_defaut: NiveauRisque;
  responsable_id?: string | null;
}

export type UpdateZonePayload = Partial<Omit<CreateZonePayload, 'site_id'>>;

// ------------------------------------------------------------
// DTOs — Utilisateurs (gestion rôles/statut uniquement)
// ------------------------------------------------------------

export interface UpdateUtilisateurRolesPayload {
  roles: RoleUtilisateur[];
  actif: boolean;
}
