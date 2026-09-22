// ─────────────────────────────────────────────────────────────────────────────
// Module Analyse des Risques Industriels — Types
// Phases Installation & Opération · Matrice F×G · Plan d'action · ALARP
// ─────────────────────────────────────────────────────────────────────────────

// ── Énumérations ─────────────────────────────────────────────────────────────

export type PhaseRisque = 'INSTALLATION' | 'OPERATION';

export type NiveauCriticite = 'FAIBLE' | 'MODERE' | 'ELEVE' | 'CRITIQUE';

export type StatutRisque = 'OUVERT' | 'EN_COURS' | 'SOUS_SURVEILLANCE' | 'CLOTURE';

export type TypeMesureHierarchie =
  | 'ELIMINATION'
  | 'SUBSTITUTION'
  | 'CONTROLE_TECHNIQUE'
  | 'CONTROLE_ADMINISTRATIF'
  | 'EPI';

export type StatutActionRisque = 'PLANIFIEE' | 'EN_COURS' | 'REALISEE' | 'VERIFIEE';

export type TypeCotation = 'INITIALE' | 'INTERMEDIAIRE' | 'RESIDUELLE';

export type DecisionResiduelle = 'ACCEPTE' | 'ACCEPTE_ALARP' | 'EN_ATTENTE_JUSTIFICATION' | 'ACTION_OBLIGATOIRE';

// ── Moyen de protection ───────────────────────────────────────────────────────

export interface MoyenProtection {
  description: string;
  hierarchie: TypeMesureHierarchie;
}

// ── Cotation (historique — timeline avant/après) ─────────────────────────────

export interface CotationRisque {
  id: string;
  risque_id: string;
  type: TypeCotation;
  frequence: number;
  gravite: number;
  score: number;
  niveau: NiveauCriticite;
  auteur_id?: string | null;
  auteur_nom?: string;
  commentaire?: string | null;
  date: string; // ISO datetime
}

// ── Action corrective (plan d'action) ────────────────────────────────────────

export interface PreuveCloture {
  url: string;
  nom: string;
  type: string; // mime-type ou extension
}

export interface ActionRisque {
  id: string;
  risque_id: string;
  description: string;
  type_mesure: TypeMesureHierarchie;
  responsable_id?: string | null;
  responsable_nom?: string;
  date_creation: string;      // ISO datetime
  date_echeance: string;      // ISO datetime — calculée automatiquement
  statut: StatutActionRisque;
  date_realisation?: string | null;
  date_verification?: string | null;
  verificateur_id?: string | null;
  verificateur_nom?: string;
  preuve_cloture: PreuveCloture[];
  commentaire?: string | null;
  created_at: string;
  updated_at: string;

  // Dénormalisé — présent quand l'action est chargée hors du contexte d'un
  // risque déjà connu (ex. le Kanban global du plan d'action)
  risque_numero?: string;
  risque_danger?: string;
  risque_phase?: PhaseRisque;
}

// ── Risque industriel (registre) ─────────────────────────────────────────────

export interface RisqueIndustriel {
  id: string;
  numero: string;               // ex. "RI-2026-IND-0031"
  site_id: string;
  zone_id?: string | null;
  zone_nom?: string;
  zone_code?: string;

  phase: PhaseRisque;
  activite: string;
  danger: string;
  situation_dangereuse: string;
  evenement_redoute: string;
  consequence_potentielle: string;

  // Cotation initiale — jamais modifiée, sert de référence "avant"
  frequence_initiale: number;   // 1-5
  gravite_initiale: number;     // 1-5
  score_initial: number;        // calculé (F×G)
  niveau_initial: NiveauCriticite; // calculé

  moyens_protection: MoyenProtection[];

  // Cotation résiduelle — renseignée après vérification de clôture d'action
  frequence_residuelle?: number | null;
  gravite_residuelle?: number | null;
  score_residuel?: number | null;
  niveau_residuel?: NiveauCriticite | null;
  justification_alarp?: string | null;

  statut: StatutRisque;
  responsable_id?: string | null;
  responsable_nom?: string;

  date_identification: string;
  date_derniere_cotation: string;
  created_at: string;
  updated_at: string;

  cotations?: CotationRisque[];
  actions?: ActionRisque[];
}

// ── KPIs calculés ─────────────────────────────────────────────────────────────

export interface KpisAnalyseRisques {
  tf: number;
  tg: number;
  pct_critiques_maitrises: number;
  taux_cloture_delais: number;
  nb_presquaccidents: number;
  nb_risques_ouverts: number;
  nb_risques_critiques: number;
  nb_actions_en_retard: number;
  nb_actions_echeance_proche: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTIONS MÉTIER (logique de calcul — jamais dupliquée côté affichage)
// ─────────────────────────────────────────────────────────────────────────────

/** Score brut F×G */
export function calculerScore(frequence: number, gravite: number): number {
  return frequence * gravite;
}

/** Classification 1-4 Faible · 5-9 Modéré · 10-14 Élevé · 15-25 Critique */
export function calculerNiveau(score: number | null | undefined): NiveauCriticite | null {
  if (score === null || score === undefined) return null;
  if (score >= 15) return 'CRITIQUE';
  if (score >= 10) return 'ELEVE';
  if (score >= 5)  return 'MODERE';
  return 'FAIBLE';
}

/** Échéance automatique d'une action selon le niveau de criticité du risque */
export function calculerEcheanceAction(niveau: NiveauCriticite, depuis: Date = new Date()): Date {
  const d = new Date(depuis);
  switch (niveau) {
    case 'CRITIQUE': d.setDate(d.getDate() + 1);   break; // immédiat
    case 'ELEVE':     d.setDate(d.getDate() + 30);  break;
    case 'MODERE':    d.setDate(d.getDate() + 180); break;
    default:          d.setDate(d.getDate() + 365); break; // FAIBLE
  }
  return d;
}

/**
 * Règle de décision sur le risque résiduel (§D) :
 * ≤4 accepté · 5-9 accepté seulement avec justification ALARP ·
 * ≥10 nouvelle action obligatoire (retour au plan d'action)
 */
export function evaluerDecisionResiduelle(
  score: number | null | undefined,
  justificationAlarp?: string | null,
): DecisionResiduelle | null {
  if (score === null || score === undefined) return null;
  if (score <= 4) return 'ACCEPTE';
  if (score <= 9) return justificationAlarp?.trim() ? 'ACCEPTE_ALARP' : 'EN_ATTENTE_JUSTIFICATION';
  return 'ACTION_OBLIGATOIRE';
}

/** Une action est en retard si son échéance est dépassée et qu'elle n'est pas clôturée */
export function actionEstEnRetard(action: ActionRisque): boolean {
  if (action.statut === 'REALISEE' || action.statut === 'VERIFIEE') return false;
  return new Date(action.date_echeance).getTime() < Date.now();
}

/** Une action arrive à échéance sous `joursSeuil` jours (par défaut 7) */
export function actionEcheanceProche(action: ActionRisque, joursSeuil = 7): boolean {
  if (action.statut === 'REALISEE' || action.statut === 'VERIFIEE') return false;
  const joursRestants = (new Date(action.date_echeance).getTime() - Date.now()) / (1000 * 3600 * 24);
  return joursRestants >= 0 && joursRestants <= joursSeuil;
}

/** % des risques initialement Critiques qui sont désormais sous maîtrise */
export function calculerTauxCritiquesMaitrises(risques: RisqueIndustriel[]): number {
  const critiques = risques.filter(r => r.niveau_initial === 'CRITIQUE');
  if (critiques.length === 0) return 100;
  const maitrises = critiques.filter(r => {
    const niveauActuel = r.niveau_residuel ?? r.niveau_initial;
    return niveauActuel !== 'CRITIQUE' || r.statut === 'CLOTURE';
  });
  return Math.round((maitrises.length / critiques.length) * 100);
}

/** Taux de clôture des actions dans les délais (parmi les actions traitées) */
export function calculerTauxClotureDelais(actions: ActionRisque[]): number {
  const traitees = actions.filter(a => a.statut === 'REALISEE' || a.statut === 'VERIFIEE');
  if (traitees.length === 0) return 100;
  const dansLesDelais = traitees.filter(a => {
    const dateRef = a.date_verification ?? a.date_realisation;
    return dateRef ? new Date(dateRef).getTime() <= new Date(a.date_echeance).getTime() : false;
  });
  return Math.round((dansLesDelais.length / traitees.length) * 100);
}

/**
 * Suggestion de moyens de protection déjà utilisés pour des dangers similaires
 * (autocomplétion simple par correspondance de sous-chaîne sur le champ `danger`)
 */
export function suggererMoyensProtection(danger: string, registre: RisqueIndustriel[]): MoyenProtection[] {
  const q = danger.trim().toLowerCase();
  if (q.length < 3) return [];

  const correspondants = registre.filter(r => {
    const d = r.danger.toLowerCase();
    return d.includes(q) || q.includes(d);
  });

  const vus = new Set<string>();
  const suggestions: MoyenProtection[] = [];
  for (const r of correspondants) {
    for (const m of r.moyens_protection) {
      const key = m.description.trim().toLowerCase();
      if (key && !vus.has(key)) {
        vus.add(key);
        suggestions.push(m);
      }
    }
  }
  return suggestions.slice(0, 8);
}

// ── Labels & apparence ────────────────────────────────────────────────────────

export const LABELS_PHASE: Record<PhaseRisque, string> = {
  INSTALLATION: 'Installation',
  OPERATION:    'Opération',
};

export const ICONES_PHASE: Record<PhaseRisque, string> = {
  INSTALLATION: '🏗️',
  OPERATION:    '⚙️',
};

export const LABELS_NIVEAU: Record<NiveauCriticite, string> = {
  FAIBLE:   'Faible',
  MODERE:   'Modéré',
  ELEVE:    'Élevé',
  CRITIQUE: 'Critique',
};

// Ordre canonique (du moins au plus critique) — matrice, légendes, tris
export const ORDRE_NIVEAU: NiveauCriticite[] = ['FAIBLE', 'MODERE', 'ELEVE', 'CRITIQUE'];

// Un symbole distinct par niveau en plus de la couleur, pour rester lisible
// aux personnes daltoniennes (jamais la couleur seule).
export const MOTIFS_NIVEAU: Record<NiveauCriticite, string> = {
  FAIBLE:   '●',
  MODERE:   '▲',
  ELEVE:    '◆',
  CRITIQUE: '✕',
};

export const COULEURS_NIVEAU: Record<NiveauCriticite, {
  bg: string; border: string; text: string; badge_bg: string; badge_text: string; solide: string;
}> = {
  FAIBLE:   { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-800',  badge_bg: 'bg-green-100',  badge_text: 'text-green-800',  solide: '#22c55e' },
  MODERE:   { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge_bg: 'bg-yellow-100', badge_text: 'text-yellow-800', solide: '#eab308' },
  ELEVE:    { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge_bg: 'bg-orange-100', badge_text: 'text-orange-800', solide: '#f97316' },
  CRITIQUE: { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-800',    badge_bg: 'bg-red-100',    badge_text: 'text-red-800',    solide: '#ef4444' },
};

export const LABELS_STATUT_RISQUE: Record<StatutRisque, string> = {
  OUVERT:            'Ouvert',
  EN_COURS:          'En cours',
  SOUS_SURVEILLANCE: 'Sous surveillance',
  CLOTURE:           'Clôturé',
};

export const LABELS_TYPE_MESURE: Record<TypeMesureHierarchie, string> = {
  ELIMINATION:             'Élimination',
  SUBSTITUTION:            'Substitution',
  CONTROLE_TECHNIQUE:      'Contrôle technique',
  CONTROLE_ADMINISTRATIF:  'Contrôle administratif',
  EPI:                     'EPI',
};

// Ordre canonique de la hiérarchie des mesures (la plus efficace en premier)
export const ORDRE_TYPE_MESURE: TypeMesureHierarchie[] = [
  'ELIMINATION', 'SUBSTITUTION', 'CONTROLE_TECHNIQUE', 'CONTROLE_ADMINISTRATIF', 'EPI',
];

export const LABELS_STATUT_ACTION: Record<StatutActionRisque, string> = {
  PLANIFIEE: 'Planifiée',
  EN_COURS:  'En cours',
  REALISEE:  'Réalisée',
  VERIFIEE:  'Vérifiée',
};

export const ORDRE_STATUT_ACTION: StatutActionRisque[] = ['PLANIFIEE', 'EN_COURS', 'REALISEE', 'VERIFIEE'];

export const LABELS_DECISION_RESIDUELLE: Record<DecisionResiduelle, string> = {
  ACCEPTE:                   'Accepté',
  ACCEPTE_ALARP:             'Accepté (ALARP)',
  EN_ATTENTE_JUSTIFICATION:  'Justification ALARP requise',
  ACTION_OBLIGATOIRE:        'Nouvelle action obligatoire',
};

// ── Résultat de service (pattern atService.ts) ───────────────────────────────

export interface ServiceError {
  code: string;
  message: string;
}

export interface ServiceResult<T> {
  data?: T;
  error?: ServiceError;
}

export enum ErreurMetierRisque {
  RISQUE_NON_TROUVE = 'RISQUE_NON_TROUVE',
  ACTION_NON_TROUVEE = 'ACTION_NON_TROUVEE',
  JUSTIFICATION_ALARP_REQUISE = 'JUSTIFICATION_ALARP_REQUISE',
  ACTION_OBLIGATOIRE_RISQUE_RESIDUEL = 'ACTION_OBLIGATOIRE_RISQUE_RESIDUEL',
  PERMISSION_INSUFFISANTE = 'PERMISSION_INSUFFISANTE',
}

export const ZONES_SITE_DEFAUT = [
  'Zone A - Production',
  'Zone B - Packaging',
  'Zone C - Énergie',
  'Zone D - Chimie',
  'Zone E - Logistique',
];
