// ─────────────────────────────────────────────────────────────────────────────
// roles — Petits helpers pour résoudre le rôle PTW « agissant » d'un
// utilisateur (profile.roles est un string[] côté AuthContext, potentiellement
// multi-rôles) au regard des vérifications de permission déjà en place dans
// atService/permisService/workflowService.
// ─────────────────────────────────────────────────────────────────────────────

import { RoleUtilisateur } from '../types';

/** Convertit les rôles bruts du profil (string[]) vers l'enum métier, en ignorant les valeurs inconnues. */
export function toRoleUtilisateurs(roles: string[] | undefined | null): RoleUtilisateur[] {
  if (!roles) return [];
  const valeurs = new Set(Object.values(RoleUtilisateur) as string[]);
  return roles.filter((r): r is RoleUtilisateur => valeurs.has(r)) as RoleUtilisateur[];
}

/** Retourne le premier rôle de `preferes` que l'utilisateur possède, sinon null. */
export function pickRole(roles: RoleUtilisateur[], preferes: RoleUtilisateur[]): RoleUtilisateur | null {
  for (const r of preferes) {
    if (roles.includes(r)) return r;
  }
  return null;
}
