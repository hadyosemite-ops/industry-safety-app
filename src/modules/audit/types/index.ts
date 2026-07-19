// ─────────────────────────────────────────────────────────────────────────────
// Module Audit HSE — Types
// Benchmark : ISO 45001:2018 · MASE 2022 · OHSAS 18001
// ─────────────────────────────────────────────────────────────────────────────

// ── Énumérations ─────────────────────────────────────────────────────────────

export type TypeAudit =
  | 'TERRAIN'     // Walkthrough terrain — hebdomadaire
  | 'SYSTEME'     // Audit système / documentation — trimestriel
  | 'COMPLIANCE'  // Conformité légale / réglementaire — semestriel
  | 'SUIVI';      // Vérification clôture actions correctives

export type StatutAudit =
  | 'PLANIFIE'
  | 'EN_COURS'
  | 'REALISE'
  | 'VALIDE'
  | 'ANNULE';

export type ReponseItem = 'CONFORME' | 'PARTIELLEMENT' | 'NON_CONFORME' | 'NA' | null;

export type NiveauEcart = 'MAJEUR' | 'MINEUR' | 'OBSERVATION';

export type SectionId =
  | 'EPI'
  | 'ORDRE_PROPRETE'
  | 'TRAVAIL_HAUTEUR'
  | 'RISQUES_CHIMIQUES'
  | 'ELECTRICITE'
  | 'INCENDIE'
  | 'MANUTENTION'
  | 'PTW'
  | 'SECOURS';

// ── Checklist ─────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  section: SectionId;
  question: string;
  ponderation: 1 | 2 | 3;  // 1=standard, 2=important, 3=critique
  reglementaire: boolean;   // NC sur item réglementaire = écart MAJEUR
  sous_type?: string;       // ex. 'ATEX', 'LEVAGE', 'CMR'
}

// ── Réponse à un item de checklist ───────────────────────────────────────────

export interface ReponseCL {
  item_id: string;
  reponse: ReponseItem;
  commentaire?: string;
  niveau_ecart?: NiveauEcart;  // renseigné si NON_CONFORME ou PARTIELLEMENT
  photo_url?: string;
}

// ── Écart formalisé ───────────────────────────────────────────────────────────

export interface EcartAudit {
  id: string;
  item_id: string;
  section: SectionId;
  description: string;
  niveau: NiveauEcart;
  reglementaire: boolean;
  action_corrective: string;
  responsable: string;
  date_echeance: string;          // ISO date
  statut: 'OUVERT' | 'EN_COURS' | 'CLOS';
  date_cloture?: string;
}

// ── Plan d'audit (entrée planning annuel) ────────────────────────────────────

export interface PlanAudit {
  id: string;
  zone: string;
  type_audit: TypeAudit;
  auditeur: string;
  semaine: number;              // 1-52
  annee: number;
  statut: StatutAudit;
  audit_id?: string;            // lié à l'audit réalisé
  notes?: string;
}

// ── Audit réalisé ─────────────────────────────────────────────────────────────

export interface Audit {
  id: string;
  plan_id?: string;
  numero: string;               // ex. "AUD-2026-0012"
  type_audit: TypeAudit;
  statut: StatutAudit;

  // Contexte
  zone: string;
  zone_code: string;
  date_audit: string;           // ISO datetime
  duree_minutes?: number;
  auditeur: string;
  auditeur_poste: string;
  accompagnateur?: string;      // responsable de zone présent

  // Réponses checklist
  reponses: ReponseCL[];

  // Scores calculés (remplis après soumission)
  score_global?: number;        // 0-100
  scores_sections?: Partial<Record<SectionId, number>>;

  // Écarts formalisés
  ecarts: EcartAudit[];

  // Synthèse narrative
  points_positifs?: string;
  synthese?: string;

  // Métadonnées
  date_soumission?: string;
  date_validation?: string;
  validateur?: string;

  // Alerte NC majeure (lien PTW)
  at_concernee?: string;        // numéro AT si zone avec AT active
}

// ── Score calculé ─────────────────────────────────────────────────────────────

export function calculerScore(
  reponses: ReponseCL[],
  items: ChecklistItem[],
  sectionFilter?: SectionId,
): number {
  const filtered = items.filter(i => !sectionFilter || i.section === sectionFilter);
  if (filtered.length === 0) return 0;

  let total = 0;
  let max = 0;

  for (const item of filtered) {
    const rep = reponses.find(r => r.item_id === item.id);
    const rVal = rep?.reponse ?? null;
    if (rVal === 'NA' || rVal === null) continue;

    max += item.ponderation;
    if (rVal === 'CONFORME')       total += item.ponderation;
    if (rVal === 'PARTIELLEMENT')  total += item.ponderation * 0.5;
    // NON_CONFORME = 0
  }

  if (max === 0) return 0;
  return Math.round((total / max) * 100);
}

// ── Seuil de conformité (benchmark MASE) ─────────────────────────────────────

export function niveauConformite(score: number): {
  label: string; color: string; bg: string; border: string;
} {
  if (score >= 95) return { label: 'Excellence',    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (score >= 80) return { label: 'Satisfaisant',  color: 'text-green-700',   bg: 'bg-green-50',   border: 'border-green-200'   };
  if (score >= 60) return { label: 'À améliorer',   color: 'text-yellow-700',  bg: 'bg-yellow-50',  border: 'border-yellow-200'  };
  return             { label: 'Insuffisant',   color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200'     };
}

// ── Labels ────────────────────────────────────────────────────────────────────

export const LABELS_TYPE_AUDIT: Record<TypeAudit, string> = {
  TERRAIN:    'Terrain',
  SYSTEME:    'Système',
  COMPLIANCE: 'Conformité légale',
  SUIVI:      'Suivi actions',
};

export const ICONES_TYPE_AUDIT: Record<TypeAudit, string> = {
  TERRAIN:    '🚶',
  SYSTEME:    '⚙️',
  COMPLIANCE: '⚖️',
  SUIVI:      '🔁',
};

export const LABELS_STATUT_AUDIT: Record<StatutAudit, string> = {
  PLANIFIE: 'Planifié',
  EN_COURS: 'En cours',
  REALISE:  'Réalisé',
  VALIDE:   'Validé',
  ANNULE:   'Annulé',
};

export const LABELS_SECTION: Record<SectionId, string> = {
  EPI:              '§1 — EPI & équipements de protection',
  ORDRE_PROPRETE:   '§2 — Ordre & propreté (5S)',
  TRAVAIL_HAUTEUR:  '§3 — Travaux en hauteur',
  RISQUES_CHIMIQUES:'§4 — Risques chimiques',
  ELECTRICITE:      '§5 — Électricité & consignation',
  INCENDIE:         '§6 — Incendie & explosion',
  MANUTENTION:      '§7 — Manutention & engins',
  PTW:              '§8 — Permis de travail (PTW)',
  SECOURS:          '§9 — Secours & urgences',
};

export const ICONES_SECTION: Record<SectionId, string> = {
  EPI:              '🥽',
  ORDRE_PROPRETE:   '🧹',
  TRAVAIL_HAUTEUR:  '🪜',
  RISQUES_CHIMIQUES:'⚗️',
  ELECTRICITE:      '⚡',
  INCENDIE:         '🔥',
  MANUTENTION:      '🏗️',
  PTW:              '📋',
  SECOURS:          '🏥',
};

export const COULEURS_SECTION: Record<SectionId, { border: string; bg: string; text: string }> = {
  EPI:              { border: '#3b82f6', bg: 'rgba(59,130,246,0.10)',  text: 'var(--section-epi-text)' },
  ORDRE_PROPRETE:   { border: '#8b5cf6', bg: 'rgba(139,92,246,0.10)',  text: 'var(--section-proprete-text)' },
  TRAVAIL_HAUTEUR:  { border: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  text: 'var(--section-hauteur-text)' },
  RISQUES_CHIMIQUES:{ border: '#ef4444', bg: 'rgba(239,68,68,0.10)',   text: 'var(--section-chimique-text)' },
  ELECTRICITE:      { border: '#f97316', bg: 'rgba(249,115,22,0.10)',  text: 'var(--section-electricite-text)' },
  INCENDIE:         { border: '#ec4899', bg: 'rgba(236,72,153,0.10)',  text: 'var(--section-incendie-text)' },
  MANUTENTION:      { border: '#14b8a6', bg: 'rgba(20,184,166,0.10)',  text: 'var(--section-manutention-text)' },
  PTW:              { border: '#00d4ff', bg: 'rgba(0,212,255,0.10)',   text: 'var(--section-ptw-text)' },
  SECOURS:          { border: '#10b981', bg: 'rgba(16,185,129,0.10)',  text: 'var(--section-secours-text)' },
};

export const ZONES_SITE = [
  'Zone A - Production',
  'Zone B - Packaging',
  'Zone C - Énergie',
  'Zone D - Chimie',
  'Zone E - Logistique',
];

// ── Ordre canonique des sections (utilisé dans formulaire & rapport) ───────────

export const SECTIONS_ORDRE: SectionId[] = [
  'EPI',
  'ORDRE_PROPRETE',
  'TRAVAIL_HAUTEUR',
  'RISQUES_CHIMIQUES',
  'ELECTRICITE',
  'INCENDIE',
  'MANUTENTION',
  'PTW',
  'SECOURS',
];
