// ─────────────────────────────────────────────────────────────────────────────
// Module Accidentologie — Types
// ─────────────────────────────────────────────────────────────────────────────

// ── Énumérations ─────────────────────────────────────────────────────────────

export type TypeEvenement =
  | 'FATAL'
  | 'GRAVE'
  | 'BENIN'
  | 'PRESQU_ACCIDENT'
  | 'SITUATION_DANGEREUSE'
  | 'OBSERVATION';

export type StatutDossier =
  | 'SIGNALE'
  | 'DECLARE'
  | 'EN_INVESTIGATION'
  | 'PLAN_ACTIONS'
  | 'CLOTURE';

export type StatutAction =
  | 'A_FAIRE'
  | 'EN_COURS'
  | 'REALISEE'
  | 'EN_RETARD';

export type TypeCause =
  | 'FAIT_IMMEDIAT'
  | 'CAUSE_INTERMEDIAIRE'
  | 'CAUSE_PROFONDE';

export type CategorieAction =
  | 'TECHNIQUE'
  | 'ORGANISATIONNELLE'
  | 'HUMAINE'
  | 'FORMATION'
  | 'PROCEDURE'
  | 'EPI';

// ── Victime ───────────────────────────────────────────────────────────────────

export interface Victime {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  entreprise: string;               // interne ou sous-traitant
  anciennete_mois: number;
  nature_blessure: string;          // ex. "Contusion épaule gauche"
  siege_lesion: string;             // ex. "Épaule"
  jours_arret: number;              // 0 = sans arrêt
}

// ── Témoin ────────────────────────────────────────────────────────────────────

export interface Temoin {
  id: string;
  nom: string;
  prenom: string;
  poste: string;
  declaration?: string;
}

// ── Nœud de l'arbre des causes ────────────────────────────────────────────────

export interface NoeudCause {
  id: string;
  type: TypeCause;
  description: string;
  parent_ids: string[];             // IDs des nœuds parents (cause précédente)
  action_corrective_id?: string;    // lié à une action du plan
}

// ── Action corrective ─────────────────────────────────────────────────────────

export interface ActionCorrective {
  id: string;
  description: string;
  categorie: CategorieAction;
  responsable: string;
  date_echeance: string;            // ISO date
  date_realisation?: string;        // remplie quand REALISEE
  statut: StatutAction;
  commentaire?: string;
  priorite: 'HAUTE' | 'NORMALE' | 'BASSE';
}

// ── Dossier accidentologique ──────────────────────────────────────────────────

export interface DossierAccident {
  id: string;
  numero: string;                   // ex. "ACC-2026-0042"
  type_evenement: TypeEvenement;
  statut: StatutDossier;

  // Identification
  titre: string;
  date_evenement: string;           // ISO datetime
  date_declaration: string;         // ISO datetime
  lieu: string;                     // zone / atelier
  zone_code: string;                // ex. "Zone B - Packaging"
  description: string;

  // Victimes / témoins
  victimes: Victime[];
  temoins: Temoin[];

  // Investigation
  date_investigation?: string;
  investigateur?: string;
  arbre_causes: NoeudCause[];
  cinq_pourquoi?: string[];         // méthode alternative pour bénins

  // Liens
  at_liee_id?: string;              // AT PTW concernée
  at_liee_numero?: string;

  // Plan d'actions
  actions: ActionCorrective[];

  // Clôture
  date_cloture?: string;
  validateur_cloture?: string;
  lecons_retenues?: string;

  // Déclarant
  declarant_nom: string;
  declarant_poste: string;

  // Délais légaux (France)
  declaration_cpam?: boolean;
  declaration_it?: boolean;         // Inspection du Travail
  date_cpam?: string;
  date_it?: string;
}

// ── KPIs calculés ─────────────────────────────────────────────────────────────

export interface KpisAccidentologie {
  tf: number;                       // Taux de Fréquence
  tg: number;                       // Taux de Gravité
  if_: number;                      // Indice de Fréquence
  nb_at_arret: number;
  nb_at_sans_arret: number;
  nb_presqu_accidents: number;
  nb_situations: number;
  nb_observations: number;
  jours_perdus: number;
  heures_travaillees: number;
  effectif: number;
  taux_actions_soldees: number;     // %
  taux_presqu_accidents: number;    // ratio proactivité
}

// ── Labels & helpers ──────────────────────────────────────────────────────────

export const LABELS_TYPE: Record<TypeEvenement, string> = {
  FATAL:               'Accident mortel',
  GRAVE:               'Accident avec arrêt',
  BENIN:               'Accident sans arrêt',
  PRESQU_ACCIDENT:     "Presqu'accident",
  SITUATION_DANGEREUSE:'Situation dangereuse',
  OBSERVATION:         'Observation sécurité',
};

export const ICONES_TYPE: Record<TypeEvenement, string> = {
  FATAL:               '💀',
  GRAVE:               '🔴',
  BENIN:               '🟡',
  PRESQU_ACCIDENT:     '🟢',
  SITUATION_DANGEREUSE:'🔵',
  OBSERVATION:         '🟣',
};

export const LABELS_STATUT: Record<StatutDossier, string> = {
  SIGNALE:          'Signalé',
  DECLARE:          'Déclaré',
  EN_INVESTIGATION: 'En investigation',
  PLAN_ACTIONS:     'Plan d\'actions',
  CLOTURE:          'Clôturé',
};

export const LABELS_ACTION_STATUT: Record<StatutAction, string> = {
  A_FAIRE:   'À faire',
  EN_COURS:  'En cours',
  REALISEE:  'Réalisée',
  EN_RETARD: 'En retard',
};

export const LABELS_CATEGORIE_ACTION: Record<CategorieAction, string> = {
  TECHNIQUE:        'Technique',
  ORGANISATIONNELLE:'Organisationnelle',
  HUMAINE:          'Facteur humain',
  FORMATION:        'Formation',
  PROCEDURE:        'Procédure',
  EPI:              'EPI',
};

export const LABELS_TYPE_CAUSE: Record<TypeCause, string> = {
  FAIT_IMMEDIAT:        'Fait immédiat',
  CAUSE_INTERMEDIAIRE:  'Cause intermédiaire',
  CAUSE_PROFONDE:       'Cause profonde',
};

// Délai légal de déclaration en heures (France)
export function delaiLegal(type: TypeEvenement): number | null {
  if (type === 'FATAL') return 24;
  if (type === 'GRAVE') return 48;
  return null;
}

// Couleurs par type d'événement
export const COULEURS_TYPE: Record<TypeEvenement, {
  bg: string; border: string; text: string; badge_bg: string; badge_text: string;
}> = {
  FATAL:               { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-800',    badge_bg: 'bg-red-100',    badge_text: 'text-red-800'    },
  GRAVE:               { bg: 'bg-orange-50', border: 'border-orange-200',text: 'text-orange-800', badge_bg: 'bg-orange-100', badge_text: 'text-orange-800' },
  BENIN:               { bg: 'bg-yellow-50', border: 'border-yellow-200',text: 'text-yellow-800', badge_bg: 'bg-yellow-100', badge_text: 'text-yellow-800' },
  PRESQU_ACCIDENT:     { bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-800',  badge_bg: 'bg-green-100',  badge_text: 'text-green-800'  },
  SITUATION_DANGEREUSE:{ bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-800',   badge_bg: 'bg-blue-100',   badge_text: 'text-blue-800'   },
  OBSERVATION:         { bg: 'bg-violet-50', border: 'border-violet-200',text: 'text-violet-800', badge_bg: 'bg-violet-100', badge_text: 'text-violet-800' },
};
