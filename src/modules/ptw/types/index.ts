// ============================================================
// MODULE PTW — Permit to Work
// Types & Interfaces TypeScript
// ============================================================

// ------------------------------------------------------------
// ENUMS
// ------------------------------------------------------------

export enum RoleUtilisateur {
  DEMANDEUR = 'DEMANDEUR',
  ANIMATEUR_SECURITE = 'ANIMATEUR_SECURITE',
  RESP_ZONE = 'RESP_ZONE',
  HSE_MANAGER = 'HSE_MANAGER',
  EXECUTANT = 'EXECUTANT',
  ADMIN = 'ADMIN',
}

/** États possibles d'une Autorisation de Travail */
export enum StatutAT {
  BROUILLON = 'BROUILLON',
  SOUMISE = 'SOUMISE',
  VALIDEE = 'VALIDEE',       // Tous permis validés par l'Animateur
  APPROUVEE = 'APPROUVEE',   // GO du Resp. Zone — dernier mot
  ACTIVE = 'ACTIVE',         // Travaux en cours
  SUSPENDUE = 'SUSPENDUE',   // Suspendue par l'Animateur (cascade sur permis)
  CLOTUREE = 'CLOTUREE',     // Travaux terminés, archivée
}

/** États possibles d'un Permis */
export enum StatutPermis {
  EN_ATTENTE = 'EN_ATTENTE',     // Créé, en attente de validation terrain
  VALIDE = 'VALIDE',             // Validé par l'Animateur de Sécurité
  SUSPENDU = 'SUSPENDU',         // Cascade depuis suspension AT
  CLOS = 'CLOS',                 // Permis clôturé
  REJETE = 'REJETE',             // Rejeté par l'Animateur
}

export enum TypePermis {
  TRAVAIL_CHAUD = 'TRAVAIL_CHAUD',
  ESPACE_CONFINE = 'ESPACE_CONFINE',
  ELECTRIQUE_LOTO = 'ELECTRIQUE_LOTO',
  TRAVAIL_HAUTEUR = 'TRAVAIL_HAUTEUR',
  ATEX_CHIMIQUE = 'ATEX_CHIMIQUE',
  EXCAVATION = 'EXCAVATION',
  TRAVAUX_PRESSION = 'TRAVAUX_PRESSION',
  TRAVAUX_GENERAUX = 'TRAVAUX_GENERAUX',
}

export enum NiveauRisque {
  MODERE = 'MODERE',
  ELEVE = 'ELEVE',
  CRITIQUE = 'CRITIQUE',
}

export enum TypeAudit {
  PROGRAMME = 'PROGRAMME',
  INOPINE = 'INOPINE',
  LEVEE_SUSPENSION = 'LEVEE_SUSPENSION', // Obligatoire avant reprise après suspension
}

export enum ResultatAudit {
  CONFORME = 'CONFORME',
  NON_CONFORME = 'NON_CONFORME',
  CONFORME_RESERVES = 'CONFORME_RESERVES',
}

export enum TypeEcart {
  EPI_MANQUANT = 'EPI_MANQUANT',
  ZONE_NON_SECURISEE = 'ZONE_NON_SECURISEE',
  INTERVENANT_NON_HABILITE = 'INTERVENANT_NON_HABILITE',
  CONDITION_METEO = 'CONDITION_METEO',
  DEFAUT_ISOLATION = 'DEFAUT_ISOLATION',
  ECART_PROCEDURE = 'ECART_PROCEDURE',
  RISQUE_TIERS = 'RISQUE_TIERS',
  AUTRE = 'AUTRE',
}

// ------------------------------------------------------------
// ENTITÉS CORE
// ------------------------------------------------------------

export interface Utilisateur {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  roles: RoleUtilisateur[];
  site_id: string;
  habilitations?: string[];      // ex: ['H0', 'B1', 'CACES R482']
  telephone?: string;
  actif: boolean;
  created_at: string;
}

export interface Site {
  id: string;
  nom: string;
  adresse: string;
  code_site: string;
  actif: boolean;
}

export interface Zone {
  id: string;
  site_id: string;
  nom: string;
  code_zone: string;
  description?: string;
  niveau_risque_defaut: NiveauRisque;
  responsable_id?: string;       // FK → Utilisateur (Resp. Zone)
}

// ------------------------------------------------------------
// AUTORISATION DE TRAVAIL (AT)
// Entité principale — document chapeau
// ------------------------------------------------------------

export interface AutorisationTravail {
  id: string;
  numero_at: string;             // Ex: AT-2026-0042 (généré automatiquement)
  site_id: string;
  zone_id: string;
  demandeur_id: string;
  animateur_id?: string;         // Animateur de Sécurité assigné
  approbateur_id?: string;       // Resp. Zone qui approuve

  // Description
  titre: string;
  description_travaux: string;
  entreprise_intervenante: string;
  chef_chantier: string;
  nombre_intervenants_prevu: number;

  // Temporalité
  date_debut_prevue: string;     // ISO datetime
  date_fin_prevue: string;
  date_debut_effective?: string;
  date_fin_effective?: string;

  // Évaluation globale des risques
  evaluation_risques: EvaluationRisques;

  // Workflow
  statut: StatutAT;
  statut_precedent?: StatutAT;   // Conservé pour restauration après levée suspension

  // Méta
  pièces_jointes?: PieceJointe[];
  commentaires?: CommentaireAT[];
  created_at: string;
  updated_at: string;

  // Relations chargées
  permis?: Permis[];
  suspensions?: SuspensionAT[];
  audits?: AuditAT[];
  historique?: HistoriqueStatutAT[];
}

export interface EvaluationRisques {
  dangers_identifies: string[];
  mesures_prevention_globales: string[];
  epi_obligatoires: string[];
  niveau_risque_global: NiveauRisque;
  plan_urgence?: string;
}

export interface PieceJointe {
  id: string;
  nom: string;
  url: string;
  type_fichier: string;
  taille_octets: number;
  uploaded_by: string;
  uploaded_at: string;
}

export interface CommentaireAT {
  id: string;
  at_id: string;
  auteur_id: string;
  texte: string;
  created_at: string;
}

// ------------------------------------------------------------
// PERMIS
// Lié à une AT — 1 AT → N Permis
// ------------------------------------------------------------

export interface Permis {
  id: string;
  at_id: string;
  type_permis: TypePermis;
  statut: StatutPermis;
  statut_avant_suspension?: StatutPermis; // Pour restauration après levée AT

  // Spécifique au type
  checklist_reponses: ChecklistReponse[];
  mesures_prevention: string[];
  epi_requis: string[];
  equipements_concernes?: string[];

  // Intervenants
  intervenants: IntervenantPermis[];

  // Validation terrain (Animateur)
  valide_par?: string;           // FK → Utilisateur (Animateur)
  valide_le?: string;
  commentaire_validation?: string;

  // Rejet
  rejete_par?: string;
  rejete_le?: string;
  motif_rejet?: string;

  // QR Code unique pour accès terrain
  qr_code_token: string;         // UUID unique, généré à la création

  pièces_jointes?: PieceJointe[];
  created_at: string;
  updated_at: string;
}

export interface ChecklistReponse {
  question_id: string;
  question_libelle: string;
  reponse: 'OUI' | 'NON' | 'N_A';
  commentaire?: string;
  obligatoire: boolean;
}

export interface IntervenantPermis {
  id: string;
  permis_id: string;
  user_id?: string;              // Si l'intervenant est dans le système
  nom_complet: string;           // Pour intervenants externes
  entreprise?: string;
  habilitations?: string[];
  check_in_at?: string;
  check_out_at?: string;
  check_in_gps?: { lat: number; lng: number };
}

// ------------------------------------------------------------
// AUDIT AT
// Entité séparée — traçabilité propre
// Déclenché par l'Animateur de Sécurité
// ------------------------------------------------------------

export interface AuditAT {
  id: string;
  at_id: string;
  auditeur_id: string;           // Animateur de Sécurité

  type_audit: TypeAudit;
  date_audit: string;

  // Checklist d'audit (spécifique au contexte)
  checklist_audit: ChecklistAuditReponse[];

  // Constats
  ecarts_constates?: string;
  points_positifs?: string;
  photos?: PieceJointe[];

  // Résultat
  resultat: ResultatAudit;
  recommandations?: string;

  // Signature électronique
  signature_base64?: string;
  localisation_gps?: { lat: number; lng: number };

  created_at: string;
}

export interface ChecklistAuditReponse {
  item_id: string;
  libelle: string;
  conforme: boolean | null;      // null = non vérifié
  commentaire?: string;
}

// ------------------------------------------------------------
// SUSPENSION AT
// Exclusivement par l'Animateur de Sécurité
//
// RÈGLE MÉTIER #1 :
//   - Seule l'AT peut être suspendue (pas un permis individuel)
//   - La suspension AT cascade automatiquement sur tous les permis
//   - La levée AT restaure les permis à leur statut précédent
//   - La levée nécessite un audit de conformité (type: LEVEE_SUSPENSION)
// ------------------------------------------------------------

export interface SuspensionAT {
  id: string;
  at_id: string;
  animateur_id: string;

  // Motif
  motif_suspension: string;
  type_ecart: TypeEcart;
  description_ecart: string;
  photos_ecart?: PieceJointe[];

  // Mesures correctives demandées
  mesures_correctives: string;
  delai_correction?: string;     // ISO datetime

  // Levée
  audit_levee_id?: string;       // FK → AuditAT (type: LEVEE_SUSPENSION)
  levee_par?: string;            // Animateur qui lève
  date_levee?: string;
  commentaire_levee?: string;

  // Horodatage
  date_suspension: string;
  created_at: string;
}

// ------------------------------------------------------------
// HISTORIQUE STATUT AT
// Audit trail complet et infalsifiable
// ------------------------------------------------------------

export interface HistoriqueStatutAT {
  id: string;
  at_id: string;
  statut_avant: StatutAT;
  statut_apres: StatutAT;
  acteur_id: string;
  motif?: string;
  metadata?: Record<string, unknown>; // Contexte supplémentaire
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

// ------------------------------------------------------------
// TEMPLATES CHECKLIST
// Checklists prédéfinies par type de permis
// ------------------------------------------------------------

export interface TemplateChecklist {
  type_permis: TypePermis;
  version: string;
  items: ItemChecklist[];
}

export interface ItemChecklist {
  id: string;
  libelle: string;
  description?: string;
  obligatoire: boolean;
  categorie: string;             // Ex: 'EPI', 'ISOLATION', 'ZONE', 'COMMUNICATION'
}

// ------------------------------------------------------------
// DTOs — Payload pour les opérations
// ------------------------------------------------------------

/** Créer une nouvelle AT */
export interface CreateATPayload {
  site_id: string;
  zone_id: string;
  titre: string;
  description_travaux: string;
  entreprise_intervenante: string;
  chef_chantier: string;
  nombre_intervenants_prevu: number;
  date_debut_prevue: string;
  date_fin_prevue: string;
  evaluation_risques: EvaluationRisques;
  animateur_id?: string;
}

/** Ajouter un permis à une AT */
export interface CreatePermisPayload {
  at_id: string;
  type_permis: TypePermis;
  checklist_reponses: ChecklistReponse[];
  mesures_prevention: string[];
  epi_requis: string[];
  equipements_concernes?: string[];
  intervenants: Omit<IntervenantPermis, 'id' | 'permis_id'>[];
}

/** Valider un permis (Animateur de Sécurité) */
export interface ValiderPermisPayload {
  permis_id: string;
  commentaire_validation?: string;
  checklist_reponses?: ChecklistReponse[]; // Mise à jour éventuelle terrain
}

/** Rejeter un permis (Animateur de Sécurité) */
export interface RejeterPermisPayload {
  permis_id: string;
  motif_rejet: string;
}

/** Approuver une AT (Resp. Zone — dernier mot) */
export interface ApprouverATPayload {
  at_id: string;
  commentaire?: string;
}

/** Suspendre une AT (Animateur de Sécurité) */
export interface SuspendreATPayload {
  at_id: string;
  motif_suspension: string;
  type_ecart: TypeEcart;
  description_ecart: string;
  mesures_correctives: string;
  delai_correction?: string;
  photos_ecart?: string[];       // URLs des photos uploadées
}

/** Lever une suspension (Animateur de Sécurité — après audit) */
export interface LeverSuspensionPayload {
  suspension_id: string;
  audit_levee_id: string;        // L'audit de conformité doit exister
  commentaire_levee?: string;
}

/** Créer un audit (Animateur de Sécurité) */
export interface CreateAuditPayload {
  at_id: string;
  type_audit: TypeAudit;
  checklist_audit: ChecklistAuditReponse[];
  ecarts_constates?: string;
  points_positifs?: string;
  resultat: ResultatAudit;
  recommandations?: string;
  photos?: string[];
  signature_base64?: string;
  localisation_gps?: { lat: number; lng: number };
}

// ------------------------------------------------------------
// RÉSULTATS DES SERVICES
// ------------------------------------------------------------

export interface ServiceResult<T> {
  data?: T;
  error?: ServiceError;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: unknown;
}

// Codes d'erreur métier spécifiques
export enum ErreurMetier {
  AT_NON_TROUVEE = 'AT_NON_TROUVEE',
  PERMIS_NON_TROUVE = 'PERMIS_NON_TROUVE',
  TRANSITION_STATUT_INVALIDE = 'TRANSITION_STATUT_INVALIDE',
  APPROBATION_BLOQUEE_PERMIS_NON_VALIDES = 'APPROBATION_BLOQUEE_PERMIS_NON_VALIDES',
  CLOTURE_BLOQUEE_PERMIS_NON_CLOS = 'CLOTURE_BLOQUEE_PERMIS_NON_CLOS',
  CLOTURE_BLOQUEE_SUSPENSION_OUVERTE = 'CLOTURE_BLOQUEE_SUSPENSION_OUVERTE',
  LEVEE_SUSPENSION_SANS_AUDIT = 'LEVEE_SUSPENSION_SANS_AUDIT',
  AT_NON_ACTIVE = 'AT_NON_ACTIVE',
  AT_DEJA_SUSPENDUE = 'AT_DEJA_SUSPENDUE',
  PERMISSION_INSUFFISANTE = 'PERMISSION_INSUFFISANTE',
  AUDIT_TYPE_INCORRECT = 'AUDIT_TYPE_INCORRECT',
}
