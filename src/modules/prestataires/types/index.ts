// ─────────────────────────────────────────────────────────────────────────────
// Module Prestataires — Types
// Gestion des entreprises extérieures intervenant sur site industriel
// ─────────────────────────────────────────────────────────────────────────────

// ── Statuts ──────────────────────────────────────────────────────────────────

export type StatutPrestataire =
  | 'AGREE'          // Agréé, tous documents valides
  | 'EN_EVALUATION'  // Premier agrément ou renouvellement en cours
  | 'EXPIRE'         // Document(s) expiré(s), accès bloqué
  | 'SUSPENDU'       // Suspendu suite incident ou décision HSE
  | 'BLACKLISTE';    // Blacklisté définitivement

export type StatutDocument =
  | 'VALIDE'
  | 'EXPIRE_BIENTOT'  // Expire dans les 60 jours
  | 'EXPIRE'
  | 'MANQUANT';

export type StatutHabilitation =
  | 'VALIDE'
  | 'EXPIRE_BIENTOT'  // Expire dans les 30 jours
  | 'EXPIRE';

// ── Catégories d'intervention ─────────────────────────────────────────────────

export type CategoriePrestataire =
  | 'TRAVAUX_CHAUDS'
  | 'ELECTRICITE'
  | 'MECANIQUE_INDUSTRIELLE'
  | 'LEVAGE_MANUTENTION'
  | 'NETTOYAGE_INDUSTRIEL'
  | 'ESPACES_CONFINES'
  | 'MAINTENANCE_GENERALE'
  | 'GENIE_CIVIL'
  | 'INSTRUMENTATION'
  | 'INFORMATIQUE_INDUSTRIELLE';

// ── Types de documents obligatoires ──────────────────────────────────────────

export type TypeDocument =
  | 'RC'
  | 'ASSURANCE_RC'
  | 'ASSURANCE_DECENNALE'
  | 'PLAN_PREVENTION'
  | 'CERTIFICATION_ISO'
  | 'AGREMENT_SPECIFIQUE'
  | 'LISTE_INTERVENANTS'
  | 'ATTESTATION_FISCALE'
  | 'AUTRE';

// ── Types d'habilitations individuelles ──────────────────────────────────────

export type TypeHabilitation =
  | 'TRAVAIL_HAUTEUR'
  | 'ELECTRICITE_B0'
  | 'ELECTRICITE_B1'
  | 'ELECTRICITE_B2'
  | 'ELECTRICITE_BR'
  | 'CACES_1'
  | 'CACES_3'
  | 'CACES_5'
  | 'CACES_R486'
  | 'ATEX'
  | 'ESPACE_CONFINE'
  | 'AMIANTE_SS4'
  | 'GESTES_SECOURS_SST'
  | 'SOUDAGE_TIG'
  | 'SOUDAGE_MIG';

// ── Labels ────────────────────────────────────────────────────────────────────

export const LABELS_STATUT: Record<StatutPrestataire, string> = {
  AGREE:         'Agréé',
  EN_EVALUATION: 'En évaluation',
  EXPIRE:        'Expiré',
  SUSPENDU:      'Suspendu',
  BLACKLISTE:    'Blacklisté',
};

export const LABELS_CATEGORIE: Record<CategoriePrestataire, string> = {
  TRAVAUX_CHAUDS:          'Travaux chauds',
  ELECTRICITE:             'Électricité',
  MECANIQUE_INDUSTRIELLE:  'Mécanique industrielle',
  LEVAGE_MANUTENTION:      'Levage & manutention',
  NETTOYAGE_INDUSTRIEL:    'Nettoyage industriel',
  ESPACES_CONFINES:        'Espaces confinés',
  MAINTENANCE_GENERALE:    'Maintenance générale',
  GENIE_CIVIL:             'Génie civil',
  INSTRUMENTATION:         'Instrumentation',
  INFORMATIQUE_INDUSTRIELLE:'Info. industrielle',
};

export const LABELS_DOCUMENT: Record<TypeDocument, string> = {
  RC:                   'Registre de commerce',
  ASSURANCE_RC:         'Assurance RC Pro',
  ASSURANCE_DECENNALE:  'Assurance décennale',
  PLAN_PREVENTION:      "Plan de prévention",
  CERTIFICATION_ISO:    'Certification ISO',
  AGREMENT_SPECIFIQUE:  'Agrément spécifique',
  LISTE_INTERVENANTS:   'Liste intervenants',
  ATTESTATION_FISCALE:  'Attestation fiscale',
  AUTRE:                'Autre',
};

export const LABELS_HABILITATION: Record<TypeHabilitation, string> = {
  TRAVAIL_HAUTEUR:    'Travail en hauteur',
  ELECTRICITE_B0:     'Habilitation B0',
  ELECTRICITE_B1:     'Habilitation B1',
  ELECTRICITE_B2:     'Habilitation B2',
  ELECTRICITE_BR:     'Habilitation BR',
  CACES_1:            'CACES R489 cat.1',
  CACES_3:            'CACES R489 cat.3',
  CACES_5:            'CACES R489 cat.5',
  CACES_R486:         'CACES R486 (nacelle)',
  ATEX:               'Risque ATEX',
  ESPACE_CONFINE:     'Espace confiné',
  AMIANTE_SS4:        'Amiante sous-section 4',
  GESTES_SECOURS_SST: 'Sauveteur Secouriste',
  SOUDAGE_TIG:        'Soudage TIG',
  SOUDAGE_MIG:        'Soudage MIG/MAG',
};

// ── Modèles de données ────────────────────────────────────────────────────────

export interface DocumentPrestataire {
  id: string;
  type: TypeDocument;
  libelle: string;
  date_emission: string;       // ISO date
  date_expiration: string;     // ISO date
  statut: StatutDocument;
  obligatoire: boolean;
  fichier_url?: string;
}

export interface HabilitationIntervenant {
  type: TypeHabilitation;
  date_obtention: string;
  date_expiration: string;
  statut: StatutHabilitation;
  organisme?: string;
}

export interface Intervenant {
  id: string;
  nom_complet: string;
  poste: string;
  badge_actif: boolean;
  date_entree_site?: string;
  habilitations: HabilitationIntervenant[];
}

export interface EvaluationPrestataire {
  id: string;
  date: string;
  evaluateur: string;
  score_securite: number;     // 0-100 (score unique sécurité HSE)
  score_global: number;       // = score_securite
  nb_incidents_periode: number;
  nb_at_periode: number;
  points_positifs: string;
  points_amelioration: string;
  recommandation: 'RENOUVELER' | 'SURVEILLER' | 'SUSPENDRE';
}

export interface Prestataire {
  id: string;
  code: string;                       // ex: PREST-001
  nom: string;
  siret: string;
  adresse: string;
  ville: string;
  code_postal: string;
  secteur_activite: string;
  contact_principal: {
    nom: string;
    poste: string;
    email: string;
    tel: string;
  };
  categories: CategoriePrestataire[];
  statut: StatutPrestataire;
  date_agrement: string;
  date_expiration_agrement: string;
  score_global?: number;              // dernier score évaluation
  documents: DocumentPrestataire[];
  intervenants: Intervenant[];
  evaluations: EvaluationPrestataire[];
  nb_at_actives: number;              // AT PTW actives actuellement
  nb_incidents_ytd: number;           // incidents cette année
  nb_audits_ytd: number;
  notes?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function statutDocument(dateExpiration: string): StatutDocument {
  const now = new Date();
  const exp = new Date(dateExpiration);
  const diffDays = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0)  return 'EXPIRE';
  if (diffDays < 60) return 'EXPIRE_BIENTOT';
  return 'VALIDE';
}

export function statutHabilitation(dateExpiration: string): StatutHabilitation {
  const now = new Date();
  const exp = new Date(dateExpiration);
  const diffDays = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0)  return 'EXPIRE';
  if (diffDays < 30) return 'EXPIRE_BIENTOT';
  return 'VALIDE';
}

export function scoreLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 85) return { label: 'Excellent',   color: 'text-emerald-700', bg: 'bg-emerald-50' };
  if (score >= 70) return { label: 'Satisfaisant',color: 'text-green-700',   bg: 'bg-green-50'   };
  if (score >= 55) return { label: 'À surveiller',color: 'text-yellow-700',  bg: 'bg-yellow-50'  };
  return               { label: 'Insuffisant',  color: 'text-red-700',     bg: 'bg-red-50'     };
}

// ── KPIs calculés ─────────────────────────────────────────────────────────────

export interface KpisPrestataires {
  total: number;
  agrees: number;
  en_evaluation: number;
  expires_ou_suspendus: number;
  docs_alerte: number;       // docs expirés ou expirant bientôt
  hab_alerte: number;        // habilitations expirées
  intervenants_total: number;
  score_moyen: number;
}

export function calculerKpis(prestataires: Prestataire[]): KpisPrestataires {
  const total = prestataires.length;
  const agrees = prestataires.filter(p => p.statut === 'AGREE').length;
  const en_evaluation = prestataires.filter(p => p.statut === 'EN_EVALUATION').length;
  const expires_ou_suspendus = prestataires.filter(
    p => p.statut === 'EXPIRE' || p.statut === 'SUSPENDU' || p.statut === 'BLACKLISTE',
  ).length;

  const allDocs = prestataires.flatMap(p => p.documents);
  const docs_alerte = allDocs.filter(
    d => d.statut === 'EXPIRE' || d.statut === 'EXPIRE_BIENTOT',
  ).length;

  const allHabs = prestataires.flatMap(p =>
    p.intervenants.flatMap(i => i.habilitations),
  );
  const hab_alerte = allHabs.filter(
    h => h.statut === 'EXPIRE' || h.statut === 'EXPIRE_BIENTOT',
  ).length;

  const intervenants_total = prestataires.reduce(
    (sum, p) => sum + p.intervenants.length, 0,
  );

  const scores = prestataires
    .filter(p => p.score_global !== undefined)
    .map(p => p.score_global as number);
  const score_moyen = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  return { total, agrees, en_evaluation, expires_ou_suspendus, docs_alerte, hab_alerte, intervenants_total, score_moyen };
}
