// ─────────────────────────────────────────────────────────────────────────────
// dashboardView — Modèle de vue "à plat" consommé par les composants du
// dashboard PTW (cartes, Kanban, modales). Remplace l'ancien AT_DEMO /
// ATDemo : la forme reste volontairement proche de l'ancien modèle démo pour
// limiter le diff des composants de présentation, mais les données sont
// désormais dérivées de vraies lignes Supabase via `utils/atAdapter.ts`.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  StatutAT, StatutPermis, TypePermis, NiveauRisque, TypeEcart,
  TypeAudit, ResultatAudit,
} from './index';

export interface IntervenantView {
  id: string;
  nom_complet: string;
  entreprise: string;
  habilitations: string[];
  check_in_at: string | null;
  check_out_at: string | null;
}

export interface ChecklistItemView {
  question_id: string;
  question_libelle: string;
  reponse: 'OUI' | 'NON' | 'N_A';
  obligatoire: boolean;
  categorie: string;
}

export interface PermisView {
  id: string;
  type_permis: TypePermis;
  statut: StatutPermis;
  checklist_reponses: ChecklistItemView[];
  epi_requis: string[];
  mesures_prevention: string[];
  equipements_concernes: string[];
  intervenants: IntervenantView[];
  valide_par?: string;
  valide_le?: string;
  commentaire_validation?: string;
  rejete_le?: string;
  motif_rejet?: string;
  qr_code_token: string;
}

export interface SuspensionView {
  id: string;
  motif_suspension: string;
  type_ecart: TypeEcart;
  description_ecart: string;
  mesures_correctives: string;
  date_suspension: string;
  date_levee: string | null;
  animateur_nom: string;
}

export interface AuditView {
  id: string;
  type_audit: TypeAudit;
  date_audit: string;
  resultat: ResultatAudit;
  auditeur_nom: string;
}

export interface ATView {
  id: string;
  numero_at: string;
  titre: string;
  description_travaux: string;
  statut: StatutAT;
  zone: string;
  code_zone: string;
  zone_id: string;
  entreprise_intervenante: string;
  chef_chantier: string;
  nombre_intervenants_prevu: number;
  date_debut_prevue: string;
  date_fin_prevue: string;
  niveau_risque: NiveauRisque;
  dangers_identifies: string[];
  epi_obligatoires: string[];
  demandeur_nom: string;
  permis: PermisView[];
  suspensions: SuspensionView[];
  audits: AuditView[];
}

// ── Libellés / icônes par type de permis ───────────────────────────────────────
// (repris de l'ancien demo.data.ts — purement des constantes d'affichage,
// aucune donnée métier, donc réutilisables telles quelles avec le vrai enum).

export const ICONES_PERMIS: Record<TypePermis, string> = {
  TRAVAIL_CHAUD: '🔥',
  ESPACE_CONFINE: '🕳️',
  ELECTRIQUE_LOTO: '⚡',
  TRAVAIL_HAUTEUR: '🪜',
  ATEX_CHIMIQUE: '☢️',
  EXCAVATION: '⛏️',
  TRAVAUX_PRESSION: '💨',
  TRAVAUX_GENERAUX: '🔧',
};

export const LABELS_PERMIS: Record<TypePermis, string> = {
  TRAVAIL_CHAUD: 'Travail à Chaud',
  ESPACE_CONFINE: 'Espace Confiné',
  ELECTRIQUE_LOTO: 'Électrique / LOTO',
  TRAVAIL_HAUTEUR: 'Travail en Hauteur',
  ATEX_CHIMIQUE: 'ATEX / Chimique',
  EXCAVATION: 'Excavation',
  TRAVAUX_PRESSION: 'Sous Pression',
  TRAVAUX_GENERAUX: 'Travaux Généraux',
};

export const RISQUE_PERMIS: Record<TypePermis, 'CRITIQUE' | 'ELEVE' | 'MODERE'> = {
  TRAVAIL_CHAUD: 'CRITIQUE',
  ESPACE_CONFINE: 'CRITIQUE',
  ELECTRIQUE_LOTO: 'CRITIQUE',
  ATEX_CHIMIQUE: 'CRITIQUE',
  TRAVAIL_HAUTEUR: 'ELEVE',
  EXCAVATION: 'ELEVE',
  TRAVAUX_PRESSION: 'ELEVE',
  TRAVAUX_GENERAUX: 'MODERE',
};
