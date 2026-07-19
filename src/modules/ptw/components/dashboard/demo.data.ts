// ============================================================
// Données demo — Dashboard Animateur de Sécurité
// À remplacer par appels Supabase
// ============================================================

export type StatutATDemo  = 'SOUMISE' | 'VALIDEE' | 'APPROUVEE' | 'ACTIVE' | 'SUSPENDUE' | 'CLOTUREE';
export type StatutPermisDemo = 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'SUSPENDU' | 'CLOS';
export type TypePermisDemo = 'TRAVAIL_CHAUD' | 'ESPACE_CONFINE' | 'ELECTRIQUE_LOTO' |
  'TRAVAIL_HAUTEUR' | 'ATEX_CHIMIQUE' | 'EXCAVATION' | 'TRAVAUX_PRESSION' | 'TRAVAUX_GENERAUX';
export type ResultatAuditDemo = 'CONFORME' | 'NON_CONFORME' | 'CONFORME_RESERVES';
export type TypeEcartDemo = 'EPI_MANQUANT' | 'ZONE_NON_SECURISEE' | 'INTERVENANT_NON_HABILITE' |
  'DEFAUT_ISOLATION' | 'ECART_PROCEDURE' | 'RISQUE_TIERS' | 'AUTRE';

export interface IntervenantDemo {
  id: string;
  nom_complet: string;
  entreprise: string;
  habilitations: string[];
  check_in_at: string | null;
  check_out_at: string | null;
}

export interface ChecklistItemDemo {
  question_id: string;
  question_libelle: string;
  reponse: 'OUI' | 'NON' | 'N_A';
  obligatoire: boolean;
  categorie: string;
}

export interface PermisDemo {
  id: string;
  type_permis: TypePermisDemo;
  statut: StatutPermisDemo;
  checklist_reponses: ChecklistItemDemo[];
  epi_requis: string[];
  mesures_prevention: string[];
  equipements_concernes: string[];
  intervenants: IntervenantDemo[];
  valide_par?: string;
  valide_le?: string;
  commentaire_validation?: string;
  rejete_le?: string;
  motif_rejet?: string;
  qr_code_token: string;
}

export interface SuspensionDemo {
  id: string;
  motif_suspension: string;
  type_ecart: TypeEcartDemo;
  description_ecart: string;
  mesures_correctives: string;
  date_suspension: string;
  date_levee: string | null;
  animateur_nom: string;
}

export interface AuditDemo {
  id: string;
  type_audit: 'PROGRAMME' | 'INOPINE' | 'LEVEE_SUSPENSION';
  date_audit: string;
  resultat: ResultatAuditDemo;
  auditeur_nom: string;
}

export interface ATDemo {
  id: string;
  numero_at: string;
  titre: string;
  description_travaux: string;
  statut: StatutATDemo;
  zone: string;
  code_zone: string;
  entreprise_intervenante: string;
  chef_chantier: string;
  nombre_intervenants_prevu: number;
  date_debut_prevue: string;
  date_fin_prevue: string;
  niveau_risque: 'MODERE' | 'ELEVE' | 'CRITIQUE';
  dangers_identifies: string[];
  epi_obligatoires: string[];
  demandeur_nom: string;
  permis: PermisDemo[];
  suspensions: SuspensionDemo[];
  audits: AuditDemo[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const ICONES_PERMIS: Record<TypePermisDemo, string> = {
  TRAVAIL_CHAUD:    '🔥',
  ESPACE_CONFINE:   '🕳️',
  ELECTRIQUE_LOTO:  '⚡',
  TRAVAIL_HAUTEUR:  '🪜',
  ATEX_CHIMIQUE:    '☢️',
  EXCAVATION:       '⛏️',
  TRAVAUX_PRESSION: '💨',
  TRAVAUX_GENERAUX: '🔧',
};

export const LABELS_PERMIS: Record<TypePermisDemo, string> = {
  TRAVAIL_CHAUD:    'Travail à Chaud',
  ESPACE_CONFINE:   'Espace Confiné',
  ELECTRIQUE_LOTO:  'Électrique / LOTO',
  TRAVAIL_HAUTEUR:  'Travail en Hauteur',
  ATEX_CHIMIQUE:    'ATEX / Chimique',
  EXCAVATION:       'Excavation',
  TRAVAUX_PRESSION: 'Sous Pression',
  TRAVAUX_GENERAUX: 'Travaux Généraux',
};

export const RISQUE_PERMIS: Record<TypePermisDemo, 'CRITIQUE' | 'ELEVE' | 'MODERE'> = {
  TRAVAIL_CHAUD:    'CRITIQUE',
  ESPACE_CONFINE:   'CRITIQUE',
  ELECTRIQUE_LOTO:  'CRITIQUE',
  ATEX_CHIMIQUE:    'CRITIQUE',
  TRAVAIL_HAUTEUR:  'ELEVE',
  EXCAVATION:       'ELEVE',
  TRAVAUX_PRESSION: 'ELEVE',
  TRAVAUX_GENERAUX: 'MODERE',
};

// ── Données demo ──────────────────────────────────────────────────────────────

export const AT_DEMO: ATDemo[] = [
  // ── AT 1 : SOUMISE — 2 permis en attente, 1 validé
  {
    id: 'at-001',
    numero_at: 'AT-2026-IND-0038',
    titre: 'Maintenance échangeurs thermiques E-201 — Ligne Production 2',
    description_travaux: 'Remplacement des joints et nettoyage des faisceaux de l\'échangeur E-201 à l\'arrêt.',
    statut: 'SOUMISE',
    zone: 'Atelier A — Soudure',
    code_zone: 'ATL-A',
    entreprise_intervenante: 'Thermique Industrie SARL',
    chef_chantier: 'Mohamed Alami',
    nombre_intervenants_prevu: 4,
    date_debut_prevue: '2026-05-29T08:00',
    date_fin_prevue: '2026-05-31T18:00',
    niveau_risque: 'CRITIQUE',
    dangers_identifies: ['Risque de brûlure', 'Risque électrique', 'Projection de particules'],
    epi_obligatoires: ['Casque', 'Lunettes', 'Gants de soudeur', 'Chaussures S3'],
    demandeur_nom: 'Karim Benali',
    suspensions: [],
    audits: [],
    permis: [
      {
        id: 'p-001',
        type_permis: 'TRAVAIL_CHAUD',
        statut: 'EN_ATTENTE',
        epi_requis: ['Masque soudeur', 'Tablier ignifugé', 'Gants soudeur'],
        mesures_prevention: ['Balisage périmètre 5m', 'Extincteur CO2 à portée'],
        equipements_concernes: ['Échangeur E-201', 'Torche soudure OA-204'],
        qr_code_token: 'qr-token-001',
        intervenants: [
          { id: 'i1', nom_complet: 'Ahmed Bensalem', entreprise: 'Thermique Industrie', habilitations: ['Soudeur qualifié', 'SST'], check_in_at: null, check_out_at: null },
          { id: 'i2', nom_complet: 'Pierre Dumont', entreprise: 'Thermique Industrie', habilitations: ['Soudeur qualifié'], check_in_at: null, check_out_at: null },
        ],
        checklist_reponses: [
          { question_id: 'TC01', question_libelle: 'Zone délimitée et balisée', reponse: 'OUI', obligatoire: true, categorie: 'ZONE' },
          { question_id: 'TC02', question_libelle: 'Extincteur positionné à moins de 5m', reponse: 'OUI', obligatoire: true, categorie: 'SECURITE' },
          { question_id: 'TC03', question_libelle: 'Mesure atmosphérique réalisée (gaz, O2)', reponse: 'NON', obligatoire: true, categorie: 'ATMOSPHERIQUE' },
          { question_id: 'TC04', question_libelle: 'Matières inflammables éloignées ou protégées', reponse: 'OUI', obligatoire: true, categorie: 'ZONE' },
          { question_id: 'TC05', question_libelle: 'Surveillant de chantier désigné', reponse: 'OUI', obligatoire: true, categorie: 'ORGANISATION' },
          { question_id: 'TC06', question_libelle: 'EPI : masque, gants, tablier soudeur fournis', reponse: 'NON', obligatoire: true, categorie: 'EPI' },
          { question_id: 'TC07', question_libelle: 'Communication avec salle de contrôle', reponse: 'N_A', obligatoire: false, categorie: 'COMMUNICATION' },
          { question_id: 'TC08', question_libelle: 'Alarme incendie testée', reponse: 'OUI', obligatoire: false, categorie: 'SECURITE' },
        ],
      },
      {
        id: 'p-002',
        type_permis: 'ELECTRIQUE_LOTO',
        statut: 'EN_ATTENTE',
        epi_requis: ['Gants diélectriques', 'Casque isolant', 'Tapis isolant'],
        mesures_prevention: ['Consignation LOTO réalisée', 'VAT effectuée'],
        equipements_concernes: ['Tableau électrique TE-14', 'Moteur M-201'],
        qr_code_token: 'qr-token-002',
        intervenants: [
          { id: 'i3', nom_complet: 'Julien Moreau', entreprise: 'Thermique Industrie', habilitations: ['B2', 'BR', 'BC'], check_in_at: null, check_out_at: null },
        ],
        checklist_reponses: [
          { question_id: 'EL01', question_libelle: 'Consignation électrique réalisée (LOTO)', reponse: 'OUI', obligatoire: true, categorie: 'ISOLATION' },
          { question_id: 'EL02', question_libelle: 'VAT (Vérification Absence Tension) effectuée', reponse: 'OUI', obligatoire: true, categorie: 'ISOLATION' },
          { question_id: 'EL03', question_libelle: 'Cadenas de consignation posés', reponse: 'OUI', obligatoire: true, categorie: 'ISOLATION' },
          { question_id: 'EL04', question_libelle: 'Habilitation électrique vérifiée', reponse: 'OUI', obligatoire: true, categorie: 'HABILITATION' },
          { question_id: 'EL05', question_libelle: 'EPI diélectriques fournis', reponse: 'OUI', obligatoire: true, categorie: 'EPI' },
          { question_id: 'EL06', question_libelle: 'Panneau de signalisation posé', reponse: 'OUI', obligatoire: true, categorie: 'ZONE' },
          { question_id: 'EL07', question_libelle: 'Schéma électrique disponible sur chantier', reponse: 'OUI', obligatoire: false, categorie: 'DOCUMENTATION' },
        ],
      },
      {
        id: 'p-003',
        type_permis: 'TRAVAIL_HAUTEUR',
        statut: 'VALIDE',
        epi_requis: ['Harnais antichute', 'Longe double', 'Casque avec jugulaire'],
        mesures_prevention: ['Zone basse balisée', 'Filet anti-chute installé'],
        equipements_concernes: ['Nacelle élévatrice NE-02'],
        qr_code_token: 'qr-token-003',
        valide_par: 'Sophie Martin',
        valide_le: '2026-05-28T09:15',
        commentaire_validation: 'Nacelle vérifiée, harnais contrôlés. RAS.',
        intervenants: [
          { id: 'i4', nom_complet: 'Rachid Oumansour', entreprise: 'Thermique Industrie', habilitations: ['Travail en hauteur', 'CACES R486'], check_in_at: null, check_out_at: null },
          { id: 'i5', nom_complet: 'Lucie Fernandez', entreprise: 'Thermique Industrie', habilitations: ['Travail en hauteur'], check_in_at: null, check_out_at: null },
        ],
        checklist_reponses: [
          { question_id: 'TH01', question_libelle: 'Harnais de sécurité vérifié', reponse: 'OUI', obligatoire: true, categorie: 'EPI' },
          { question_id: 'TH02', question_libelle: 'Points d\'ancrage identifiés et validés', reponse: 'OUI', obligatoire: true, categorie: 'SECURITE' },
          { question_id: 'TH03', question_libelle: 'Zone en bas balisée et interdite', reponse: 'OUI', obligatoire: true, categorie: 'ZONE' },
          { question_id: 'TH04', question_libelle: 'Nacelle vérifiée et conforme', reponse: 'OUI', obligatoire: true, categorie: 'EQUIPEMENT' },
          { question_id: 'TH05', question_libelle: 'Conditions météo vérifiées (vent < 45 km/h)', reponse: 'OUI', obligatoire: true, categorie: 'METEO' },
          { question_id: 'TH06', question_libelle: 'Formation travaux en hauteur vérifiée', reponse: 'OUI', obligatoire: true, categorie: 'HABILITATION' },
        ],
      },
    ],
  },

  // ── AT 2 : SOUMISE — tous les permis en attente
  {
    id: 'at-002',
    numero_at: 'AT-2026-IND-0039',
    titre: 'Inspection cuve de stockage V-104 — Zone Chimique',
    description_travaux: 'Inspection interne de la cuve V-104 après vidange. Contrôle parois et soudures.',
    statut: 'SOUMISE',
    zone: 'Zone Extérieure — Parking Camions',
    code_zone: 'EXT-1',
    entreprise_intervenante: 'InspectPro France',
    chef_chantier: 'Nadia Cherkaoui',
    nombre_intervenants_prevu: 3,
    date_debut_prevue: '2026-05-29T07:30',
    date_fin_prevue: '2026-05-29T17:00',
    niveau_risque: 'CRITIQUE',
    dangers_identifies: ['Asphyxie / anoxie', 'Atmosphère explosive (ATEX)', 'Chute de hauteur'],
    epi_obligatoires: ['Harnais', 'Détecteur gaz', 'Masque FFP3'],
    demandeur_nom: 'Samir Ouali',
    suspensions: [],
    audits: [],
    permis: [
      {
        id: 'p-004',
        type_permis: 'ESPACE_CONFINE',
        statut: 'EN_ATTENTE',
        epi_requis: ['Harnais + trépied', 'Détecteur 4 gaz', 'Masque FFP3', 'Combinaison chimique'],
        mesures_prevention: ['Ventilation forcée active', 'Analyse atmo toutes les 30 min'],
        equipements_concernes: ['Cuve V-104'],
        qr_code_token: 'qr-token-004',
        intervenants: [
          { id: 'i6', nom_complet: 'Thomas Laurent', entreprise: 'InspectPro', habilitations: ['Espace confiné', 'SST'], check_in_at: null, check_out_at: null },
          { id: 'i7', nom_complet: 'Marc Dubois', entreprise: 'InspectPro', habilitations: ['Espace confiné'], check_in_at: null, check_out_at: null },
        ],
        checklist_reponses: [
          { question_id: 'EC01', question_libelle: 'Analyse atmosphérique réalisée (O2, gaz)', reponse: 'OUI', obligatoire: true, categorie: 'ATMOSPHERIQUE' },
          { question_id: 'EC02', question_libelle: 'Ventilation forcée en place', reponse: 'OUI', obligatoire: true, categorie: 'SECURITE' },
          { question_id: 'EC03', question_libelle: 'Surveillant permanent extérieur désigné', reponse: 'NON', obligatoire: true, categorie: 'ORGANISATION' },
          { question_id: 'EC04', question_libelle: 'Harnais et trépied disponibles', reponse: 'OUI', obligatoire: true, categorie: 'EPI' },
          { question_id: 'EC05', question_libelle: 'Détecteur de gaz personnel fourni', reponse: 'OUI', obligatoire: true, categorie: 'EPI' },
          { question_id: 'EC06', question_libelle: 'Plan de sauvetage établi et communiqué', reponse: 'NON', obligatoire: true, categorie: 'URGENCE' },
          { question_id: 'EC07', question_libelle: 'Isolations mécaniques et électriques confirmées', reponse: 'OUI', obligatoire: true, categorie: 'ISOLATION' },
          { question_id: 'EC08', question_libelle: 'Contact radio permanent établi', reponse: 'OUI', obligatoire: true, categorie: 'COMMUNICATION' },
        ],
      },
    ],
  },

  // ── AT 3 : ACTIVE — travaux en cours, intervenants check-in
  {
    id: 'at-003',
    numero_at: 'AT-2026-IND-0035',
    titre: 'Nettoyage cuves stockage produits chimiques — Zone B',
    description_travaux: 'Nettoyage haute pression des cuves C-01 à C-04 après vidange totale.',
    statut: 'ACTIVE',
    zone: 'Salle Production Principale',
    code_zone: 'PROD-1',
    entreprise_intervenante: 'CleanPro SAS',
    chef_chantier: 'Isabelle Roux',
    nombre_intervenants_prevu: 5,
    date_debut_prevue: '2026-05-27T07:00',
    date_fin_prevue: '2026-05-29T18:00',
    niveau_risque: 'ELEVE',
    dangers_identifies: ['Produits chimiques CMR', 'Bruit excessif', 'Projection liquides'],
    epi_obligatoires: ['Combinaison chimique', 'Lunettes étanches', 'Bottes', 'Bouchons oreilles'],
    demandeur_nom: 'Paul Girard',
    suspensions: [],
    audits: [
      { id: 'aud-01', type_audit: 'PROGRAMME', date_audit: '2026-05-27T14:30', resultat: 'CONFORME', auditeur_nom: 'Sophie Martin' },
    ],
    permis: [
      {
        id: 'p-005',
        type_permis: 'TRAVAUX_GENERAUX',
        statut: 'VALIDE',
        epi_requis: ['Combinaison chimique', 'Lunettes', 'Gants nitrile'],
        mesures_prevention: ['Zone balisée', 'Ventilation activée'],
        equipements_concernes: ['Cuves C-01 à C-04', 'Lance HP-07'],
        qr_code_token: 'qr-token-005',
        valide_par: 'Sophie Martin',
        valide_le: '2026-05-27T07:45',
        intervenants: [
          { id: 'i8',  nom_complet: 'Antoine Blanc', entreprise: 'CleanPro', habilitations: ['SST'], check_in_at: '2026-05-28T07:15', check_out_at: null },
          { id: 'i9',  nom_complet: 'Sara Benali', entreprise: 'CleanPro', habilitations: [], check_in_at: '2026-05-28T07:18', check_out_at: null },
          { id: 'i10', nom_complet: 'Kevin Morin', entreprise: 'CleanPro', habilitations: [], check_in_at: '2026-05-28T07:20', check_out_at: null },
          { id: 'i11', nom_complet: 'Fatima Zahra', entreprise: 'CleanPro', habilitations: ['SST'], check_in_at: '2026-05-28T07:22', check_out_at: null },
          { id: 'i12', nom_complet: 'Romain Petit', entreprise: 'CleanPro', habilitations: [], check_in_at: null, check_out_at: null },
        ],
        checklist_reponses: [
          { question_id: 'TG01', question_libelle: 'Zone de travail délimitée', reponse: 'OUI', obligatoire: true, categorie: 'ZONE' },
          { question_id: 'TG02', question_libelle: 'EPI de base fournis', reponse: 'OUI', obligatoire: true, categorie: 'EPI' },
          { question_id: 'TG03', question_libelle: 'Risques identifiés et mesures en place', reponse: 'OUI', obligatoire: true, categorie: 'SECURITE' },
          { question_id: 'TG04', question_libelle: 'Outillage vérifié et en bon état', reponse: 'OUI', obligatoire: false, categorie: 'EQUIPEMENT' },
          { question_id: 'TG05', question_libelle: 'Numéros d\'urgence affichés', reponse: 'OUI', obligatoire: true, categorie: 'URGENCE' },
        ],
      },
    ],
  },

  // ── AT 4 : ACTIVE — 2 permis, intervenants partiellement check-in
  {
    id: 'at-004',
    numero_at: 'AT-2026-IND-0036',
    titre: 'Remplacement vanne V-45 — Circuit vapeur haute pression',
    description_travaux: 'Remplacement de la vanne V-45 DN100 PN40 sur le circuit vapeur après consignation.',
    statut: 'ACTIVE',
    zone: 'Chaufferie / Local Technique',
    code_zone: 'CHAUD',
    entreprise_intervenante: 'TechniValves SA',
    chef_chantier: 'Hassan El Idrissi',
    nombre_intervenants_prevu: 3,
    date_debut_prevue: '2026-05-28T06:00',
    date_fin_prevue: '2026-05-28T20:00',
    niveau_risque: 'CRITIQUE',
    dangers_identifies: ['Risque brûlure vapeur', 'Pression résiduelle', 'Risque électrique'],
    epi_obligatoires: ['Casque', 'Combinaison ignifugée', 'Gants isolants', 'Visière'],
    demandeur_nom: 'Laurent Dubois',
    suspensions: [],
    audits: [],
    permis: [
      {
        id: 'p-006',
        type_permis: 'TRAVAUX_PRESSION',
        statut: 'VALIDE',
        epi_requis: ['Visière', 'Gants isolants HP', 'Combinaison ignifugée'],
        mesures_prevention: ['Circuit dépressurisé', 'Purge confirmée', 'Zone dégagée'],
        equipements_concernes: ['Vanne V-45', 'Circuit vapeur HP-12'],
        qr_code_token: 'qr-token-006',
        valide_par: 'Sophie Martin',
        valide_le: '2026-05-28T06:30',
        intervenants: [
          { id: 'i13', nom_complet: 'Hassan El Idrissi', entreprise: 'TechniValves', habilitations: ['Tuyauteur industriel'], check_in_at: '2026-05-28T06:45', check_out_at: null },
          { id: 'i14', nom_complet: 'Youssef Haidari', entreprise: 'TechniValves', habilitations: [], check_in_at: '2026-05-28T06:50', check_out_at: null },
          { id: 'i15', nom_complet: 'Caroline Blanc', entreprise: 'TechniValves', habilitations: ['SST'], check_in_at: null, check_out_at: null },
        ],
        checklist_reponses: [
          { question_id: 'TP01', question_libelle: 'Circuit isolé et dépressurisé', reponse: 'OUI', obligatoire: true, categorie: 'ISOLATION' },
          { question_id: 'TP02', question_libelle: 'Purge et vidange confirmées', reponse: 'OUI', obligatoire: true, categorie: 'ISOLATION' },
          { question_id: 'TP03', question_libelle: 'EPI pression fournis', reponse: 'OUI', obligatoire: true, categorie: 'EPI' },
          { question_id: 'TP04', question_libelle: 'Documentation inspection en cours de validité', reponse: 'OUI', obligatoire: true, categorie: 'DOCUMENTATION' },
          { question_id: 'TP05', question_libelle: 'Zone dégagée du personnel non habilité', reponse: 'OUI', obligatoire: true, categorie: 'ZONE' },
        ],
      },
      {
        id: 'p-007',
        type_permis: 'ELECTRIQUE_LOTO',
        statut: 'VALIDE',
        epi_requis: ['Gants diélectriques BT', 'Casque isolant'],
        mesures_prevention: ['LOTO moteur M-45B'],
        equipements_concernes: ['Moteur M-45B', 'Tableau TE-08'],
        qr_code_token: 'qr-token-007',
        valide_par: 'Sophie Martin',
        valide_le: '2026-05-28T06:35',
        intervenants: [
          { id: 'i13', nom_complet: 'Hassan El Idrissi', entreprise: 'TechniValves', habilitations: ['B1'], check_in_at: '2026-05-28T06:45', check_out_at: null },
        ],
        checklist_reponses: [
          { question_id: 'EL01', question_libelle: 'Consignation électrique réalisée', reponse: 'OUI', obligatoire: true, categorie: 'ISOLATION' },
          { question_id: 'EL02', question_libelle: 'VAT effectuée', reponse: 'OUI', obligatoire: true, categorie: 'ISOLATION' },
          { question_id: 'EL03', question_libelle: 'Cadenas de consignation posés', reponse: 'OUI', obligatoire: true, categorie: 'ISOLATION' },
          { question_id: 'EL04', question_libelle: 'Habilitation vérifiée', reponse: 'OUI', obligatoire: true, categorie: 'HABILITATION' },
          { question_id: 'EL05', question_libelle: 'EPI diélectriques fournis', reponse: 'OUI', obligatoire: true, categorie: 'EPI' },
          { question_id: 'EL06', question_libelle: 'Panneau signalisation posé', reponse: 'OUI', obligatoire: true, categorie: 'ZONE' },
        ],
      },
    ],
  },

  // ── AT 5 : SUSPENDUE
  {
    id: 'at-005',
    numero_at: 'AT-2026-IND-0033',
    titre: 'Travaux de soudure toiture — Bâtiment B',
    description_travaux: 'Réparation étanchéité toiture bâtiment B. Soudure membrane EPDM.',
    statut: 'SUSPENDUE',
    zone: 'Toiture — Accès Technique',
    code_zone: 'TOITURE',
    entreprise_intervenante: 'Roofing Expert SAS',
    chef_chantier: 'David Martin',
    nombre_intervenants_prevu: 3,
    date_debut_prevue: '2026-05-27T08:00',
    date_fin_prevue: '2026-05-28T17:00',
    niveau_risque: 'CRITIQUE',
    dangers_identifies: ['Risque de chute de hauteur', 'Risque d\'incendie', 'Conditions météo'],
    epi_obligatoires: ['Harnais', 'Casque', 'Gilet HV'],
    demandeur_nom: 'Amélie Leroux',
    audits: [],
    suspensions: [
      {
        id: 'susp-01',
        motif_suspension: 'Harnais non conformes détectés sur 2 intervenants — date de contrôle dépassée.',
        type_ecart: 'EPI_MANQUANT',
        description_ecart: 'Lors de la vérification terrain, 2 harnais présentent une date de contrôle périodique dépassée de 3 mois. Utilisation impossible.',
        mesures_correctives: 'Remplacer les 2 harnais par du matériel conforme avant toute reprise. Fournir les attestations de contrôle.',
        date_suspension: '2026-05-27T14:20',
        date_levee: null,
        animateur_nom: 'Sophie Martin',
      },
    ],
    permis: [
      {
        id: 'p-008',
        type_permis: 'TRAVAIL_HAUTEUR',
        statut: 'SUSPENDU',
        epi_requis: ['Harnais antichute', 'Longe double', 'Casque'],
        mesures_prevention: ['Zone basse balisée', 'Filet anti-chute'],
        equipements_concernes: ['Toiture bâtiment B'],
        qr_code_token: 'qr-token-008',
        valide_par: 'Sophie Martin',
        valide_le: '2026-05-27T08:30',
        intervenants: [
          { id: 'i16', nom_complet: 'David Martin', entreprise: 'Roofing Expert', habilitations: ['Travail en hauteur'], check_in_at: '2026-05-27T08:45', check_out_at: '2026-05-27T14:25' },
          { id: 'i17', nom_complet: 'Christophe Petit', entreprise: 'Roofing Expert', habilitations: ['Travail en hauteur'], check_in_at: '2026-05-27T08:50', check_out_at: '2026-05-27T14:25' },
          { id: 'i18', nom_complet: 'Ali Mansouri', entreprise: 'Roofing Expert', habilitations: [], check_in_at: '2026-05-27T08:55', check_out_at: '2026-05-27T14:25' },
        ],
        checklist_reponses: [
          { question_id: 'TH01', question_libelle: 'Harnais de sécurité vérifié', reponse: 'OUI', obligatoire: true, categorie: 'EPI' },
          { question_id: 'TH02', question_libelle: 'Points d\'ancrage identifiés', reponse: 'OUI', obligatoire: true, categorie: 'SECURITE' },
          { question_id: 'TH03', question_libelle: 'Zone basse balisée', reponse: 'OUI', obligatoire: true, categorie: 'ZONE' },
          { question_id: 'TH04', question_libelle: 'Équipement vérifié', reponse: 'OUI', obligatoire: true, categorie: 'EQUIPEMENT' },
          { question_id: 'TH05', question_libelle: 'Conditions météo vérifiées', reponse: 'OUI', obligatoire: true, categorie: 'METEO' },
          { question_id: 'TH06', question_libelle: 'Formation vérifiée', reponse: 'OUI', obligatoire: true, categorie: 'HABILITATION' },
        ],
      },
      {
        id: 'p-009',
        type_permis: 'TRAVAIL_CHAUD',
        statut: 'SUSPENDU',
        epi_requis: ['Masque soudeur', 'Tablier', 'Gants'],
        mesures_prevention: ['Extincteur à portée', 'Balisage'],
        equipements_concernes: ['Toiture — membrane EPDM'],
        qr_code_token: 'qr-token-009',
        valide_par: 'Sophie Martin',
        valide_le: '2026-05-27T08:35',
        intervenants: [
          { id: 'i16', nom_complet: 'David Martin', entreprise: 'Roofing Expert', habilitations: ['Soudeur'], check_in_at: '2026-05-27T08:45', check_out_at: '2026-05-27T14:25' },
        ],
        checklist_reponses: [
          { question_id: 'TC01', question_libelle: 'Zone délimitée et balisée', reponse: 'OUI', obligatoire: true, categorie: 'ZONE' },
          { question_id: 'TC02', question_libelle: 'Extincteur positionné', reponse: 'OUI', obligatoire: true, categorie: 'SECURITE' },
          { question_id: 'TC03', question_libelle: 'Mesure atmosphérique réalisée', reponse: 'N_A', obligatoire: true, categorie: 'ATMOSPHERIQUE' },
          { question_id: 'TC04', question_libelle: 'Matières inflammables éloignées', reponse: 'OUI', obligatoire: true, categorie: 'ZONE' },
          { question_id: 'TC05', question_libelle: 'Surveillant désigné', reponse: 'OUI', obligatoire: true, categorie: 'ORGANISATION' },
          { question_id: 'TC06', question_libelle: 'EPI soudeur fournis', reponse: 'OUI', obligatoire: true, categorie: 'EPI' },
        ],
      },
    ],
  },

  // ── AT 6 : VALIDEE — tous permis validés par Animateur, prête pour Resp. Zone
  {
    id: 'at-006',
    numero_at: 'AT-2026-IND-0040',
    titre: 'Révision complète compresseur K-301 — Arrêt programmé',
    description_travaux: 'Révision générale du compresseur K-301 : remplacement segments, vérification électrique, nettoyage circuit huile. Arrêt prévu 48h.',
    statut: 'VALIDEE',
    zone: 'Chaufferie / Local Technique',
    code_zone: 'CHAUD',
    entreprise_intervenante: 'MécaIndustrie Pro',
    chef_chantier: 'Younes Amrani',
    nombre_intervenants_prevu: 5,
    date_debut_prevue: '2026-05-30T06:00',
    date_fin_prevue: '2026-06-01T18:00',
    niveau_risque: 'CRITIQUE',
    dangers_identifies: ['Risque électrique HT', 'Pression résiduelle huile', 'Risque de brûlure', 'Atmosphère ATEX zone 2'],
    epi_obligatoires: ['Casque isolant', 'Gants diélectriques', 'Combinaison ignifugée', 'Chaussures S3', 'Détecteur gaz personnel'],
    demandeur_nom: 'Omar Belhaj',
    suspensions: [],
    audits: [],
    permis: [
      {
        id: 'p-010',
        type_permis: 'ELECTRIQUE_LOTO',
        statut: 'VALIDE',
        epi_requis: ['Gants diélectriques HT', 'Casque isolant', 'Tapis isolant', 'VAT'],
        mesures_prevention: ['Consignation 5 points LOTO réalisée', 'VAT effectuée sur 3 armoires', 'Cadenas posés — clés remises à Younes Amrani'],
        equipements_concernes: ['Armoire TGBT-12', 'Moteur M-301', 'Variateur VFD-301'],
        qr_code_token: 'qr-token-010',
        valide_par: 'Karim Dubois',
        valide_le: '2026-05-29T08:45',
        commentaire_validation: 'Consignation LOTO conforme. VAT réalisée sur les 3 points. RAS.',
        intervenants: [
          { id: 'i19', nom_complet: 'Younes Amrani',    entreprise: 'MécaIndustrie Pro', habilitations: ['B2', 'BC', 'BR'],         check_in_at: null, check_out_at: null },
          { id: 'i20', nom_complet: 'Sofiane Kettani',  entreprise: 'MécaIndustrie Pro', habilitations: ['B1', 'BR'],               check_in_at: null, check_out_at: null },
        ],
        checklist_reponses: [
          { question_id: 'EL01', question_libelle: 'Consignation électrique réalisée (LOTO)', reponse: 'OUI', obligatoire: true,  categorie: 'ISOLATION' },
          { question_id: 'EL02', question_libelle: 'VAT (Vérification Absence Tension) effectuée', reponse: 'OUI', obligatoire: true,  categorie: 'ISOLATION' },
          { question_id: 'EL03', question_libelle: 'Cadenas de consignation posés', reponse: 'OUI', obligatoire: true,  categorie: 'ISOLATION' },
          { question_id: 'EL04', question_libelle: 'Habilitation électrique vérifiée', reponse: 'OUI', obligatoire: true,  categorie: 'HABILITATION' },
          { question_id: 'EL05', question_libelle: 'EPI diélectriques fournis', reponse: 'OUI', obligatoire: true,  categorie: 'EPI' },
          { question_id: 'EL06', question_libelle: 'Panneau de signalisation posé', reponse: 'OUI', obligatoire: true,  categorie: 'ZONE' },
          { question_id: 'EL07', question_libelle: 'Schéma électrique disponible', reponse: 'OUI', obligatoire: false, categorie: 'DOCUMENTATION' },
        ],
      },
      {
        id: 'p-011',
        type_permis: 'TRAVAUX_PRESSION',
        statut: 'VALIDE',
        epi_requis: ['Visière anti-projection', 'Gants résistants HP', 'Combinaison ignifugée'],
        mesures_prevention: ['Circuit huile dépressurisé', 'Purge et vidange confirmées', 'Bac de rétention positionné'],
        equipements_concernes: ['Circuit huile K-301', 'Filtre FLT-301', 'Tuyauterie HP-14'],
        qr_code_token: 'qr-token-011',
        valide_par: 'Karim Dubois',
        valide_le: '2026-05-29T09:00',
        commentaire_validation: 'Dépressurisation confirmée. Circuit purgé et vidangé. Bac rétention en place.',
        intervenants: [
          { id: 'i21', nom_complet: 'Mohamed Tahiri',   entreprise: 'MécaIndustrie Pro', habilitations: ['Tuyauteur N2', 'SST'],    check_in_at: null, check_out_at: null },
          { id: 'i22', nom_complet: 'Julien Castaing',  entreprise: 'MécaIndustrie Pro', habilitations: ['Tuyauteur N1'],          check_in_at: null, check_out_at: null },
          { id: 'i23', nom_complet: 'Leila Bouzid',     entreprise: 'MécaIndustrie Pro', habilitations: ['SST'],                   check_in_at: null, check_out_at: null },
        ],
        checklist_reponses: [
          { question_id: 'TP01', question_libelle: 'Circuit isolé et dépressurisé',               reponse: 'OUI', obligatoire: true,  categorie: 'ISOLATION' },
          { question_id: 'TP02', question_libelle: 'Purge et vidange confirmées',                  reponse: 'OUI', obligatoire: true,  categorie: 'ISOLATION' },
          { question_id: 'TP03', question_libelle: 'EPI pression fournis',                         reponse: 'OUI', obligatoire: true,  categorie: 'EPI' },
          { question_id: 'TP04', question_libelle: 'Documentation inspection en cours de validité', reponse: 'OUI', obligatoire: true,  categorie: 'DOCUMENTATION' },
          { question_id: 'TP05', question_libelle: 'Zone dégagée du personnel non habilité',       reponse: 'OUI', obligatoire: true,  categorie: 'ZONE' },
        ],
      },
      {
        id: 'p-012',
        type_permis: 'ATEX_CHIMIQUE',
        statut: 'VALIDE',
        epi_requis: ['Combinaison antistatique', 'Chaussures antistatiques', 'Détecteur ATEX personnel'],
        mesures_prevention: ['Analyse atmosphérique OK : 0% LIE', 'Ventilation forcée active', 'Outillage antistatique uniquement'],
        equipements_concernes: ['Zone ATEX 2 — local compresseur K-301'],
        qr_code_token: 'qr-token-012',
        valide_par: 'Karim Dubois',
        valide_le: '2026-05-29T09:15',
        commentaire_validation: 'Analyse atmo < 10% LIE. Ventilation conforme. Outillage ATEX vérifié.',
        intervenants: [
          { id: 'i19', nom_complet: 'Younes Amrani', entreprise: 'MécaIndustrie Pro', habilitations: ['Formation ATEX N2'], check_in_at: null, check_out_at: null },
        ],
        checklist_reponses: [
          { question_id: 'AX01', question_libelle: 'Analyse atmosphérique réalisée (< 10% LIE)',        reponse: 'OUI', obligatoire: true,  categorie: 'ATMOSPHERIQUE' },
          { question_id: 'AX02', question_libelle: 'Ventilation forcée en place et efficace',           reponse: 'OUI', obligatoire: true,  categorie: 'SECURITE' },
          { question_id: 'AX03', question_libelle: 'Outillage antistatique/ATEX utilisé',               reponse: 'OUI', obligatoire: true,  categorie: 'EQUIPEMENT' },
          { question_id: 'AX04', question_libelle: 'Sources d\'ignition éliminées (téléphones, etc.)',  reponse: 'OUI', obligatoire: true,  categorie: 'SECURITE' },
          { question_id: 'AX05', question_libelle: 'Personnel formé ATEX',                             reponse: 'OUI', obligatoire: true,  categorie: 'HABILITATION' },
          { question_id: 'AX06', question_libelle: 'Détecteur gaz personnel fourni',                   reponse: 'OUI', obligatoire: true,  categorie: 'EPI' },
        ],
      },
    ],
  },

  // ── AT 7 : VALIDEE — 1 permis validé, opération plus simple
  {
    id: 'at-007',
    numero_at: 'AT-2026-IND-0041',
    titre: 'Remplacement éclairage LED — Hall Production',
    description_travaux: 'Remplacement des luminaires fluorescents du hall production par des LED basse consommation. Travaux en hauteur sur nacelle.',
    statut: 'VALIDEE',
    zone: 'Salle Production Principale',
    code_zone: 'PROD-1',
    entreprise_intervenante: 'Élec Service Maroc',
    chef_chantier: 'Abdelmajid Tazi',
    nombre_intervenants_prevu: 2,
    date_debut_prevue: '2026-05-30T08:00',
    date_fin_prevue: '2026-05-30T17:00',
    niveau_risque: 'ELEVE',
    dangers_identifies: ['Risque électrique', 'Risque de chute de hauteur', 'Projection de matériaux'],
    epi_obligatoires: ['Casque avec jugulaire', 'Harnais antichute', 'Gants isolants BT', 'Chaussures S3'],
    demandeur_nom: 'Fatima Zahraoui',
    suspensions: [],
    audits: [],
    permis: [
      {
        id: 'p-013',
        type_permis: 'TRAVAIL_HAUTEUR',
        statut: 'VALIDE',
        epi_requis: ['Harnais antichute certifié', 'Longe double', 'Casque avec jugulaire'],
        mesures_prevention: ['Nacelle CACES R486 — contrôle validé', 'Zone basse balisée — personnel non autorisé exclu', 'Filet anti-chute positionné sous zone de travail'],
        equipements_concernes: ['Nacelle élévatrice NE-04', 'Hall production — travées A et B'],
        qr_code_token: 'qr-token-013',
        valide_par: 'Leila Bernard',
        valide_le: '2026-05-29T14:30',
        commentaire_validation: 'Nacelle vérifiée et conforme. Harnais contrôlés — dates de vérification OK. Zone basse bien balisée.',
        intervenants: [
          { id: 'i24', nom_complet: 'Abdelmajid Tazi',  entreprise: 'Élec Service Maroc', habilitations: ['CACES R486 B', 'B1', 'BR', 'Travail en hauteur'], check_in_at: null, check_out_at: null },
          { id: 'i25', nom_complet: 'Nadia El Fassi',   entreprise: 'Élec Service Maroc', habilitations: ['B1', 'Travail en hauteur'],                        check_in_at: null, check_out_at: null },
        ],
        checklist_reponses: [
          { question_id: 'TH01', question_libelle: 'Harnais de sécurité vérifié',                   reponse: 'OUI', obligatoire: true,  categorie: 'EPI' },
          { question_id: 'TH02', question_libelle: 'Points d\'ancrage identifiés et validés',       reponse: 'OUI', obligatoire: true,  categorie: 'SECURITE' },
          { question_id: 'TH03', question_libelle: 'Zone en bas balisée et interdite',              reponse: 'OUI', obligatoire: true,  categorie: 'ZONE' },
          { question_id: 'TH04', question_libelle: 'Nacelle vérifiée et conforme (CACES)',          reponse: 'OUI', obligatoire: true,  categorie: 'EQUIPEMENT' },
          { question_id: 'TH05', question_libelle: 'Conditions météo vérifiées (vent < 45 km/h)',   reponse: 'OUI', obligatoire: true,  categorie: 'METEO' },
          { question_id: 'TH06', question_libelle: 'Formation travaux en hauteur vérifiée',         reponse: 'OUI', obligatoire: true,  categorie: 'HABILITATION' },
        ],
      },
      {
        id: 'p-014',
        type_permis: 'ELECTRIQUE_LOTO',
        statut: 'VALIDE',
        epi_requis: ['Gants diélectriques BT', 'Casque isolant'],
        mesures_prevention: ['Disjoncteurs travées A+B consignés', 'VAT réalisée sur chaque point de raccordement'],
        equipements_concernes: ['Tableau divisionnaire TD-Hall-A', 'Tableau divisionnaire TD-Hall-B'],
        qr_code_token: 'qr-token-014',
        valide_par: 'Leila Bernard',
        valide_le: '2026-05-29T14:45',
        commentaire_validation: 'Consignation OK sur TD-Hall-A et TD-Hall-B. VAT réalisée. Habilitations B1/BR vérifiées.',
        intervenants: [
          { id: 'i24', nom_complet: 'Abdelmajid Tazi', entreprise: 'Élec Service Maroc', habilitations: ['B1', 'BR'], check_in_at: null, check_out_at: null },
        ],
        checklist_reponses: [
          { question_id: 'EL01', question_libelle: 'Consignation électrique réalisée (LOTO)', reponse: 'OUI', obligatoire: true,  categorie: 'ISOLATION' },
          { question_id: 'EL02', question_libelle: 'VAT effectuée',                           reponse: 'OUI', obligatoire: true,  categorie: 'ISOLATION' },
          { question_id: 'EL03', question_libelle: 'Cadenas de consignation posés',           reponse: 'OUI', obligatoire: true,  categorie: 'ISOLATION' },
          { question_id: 'EL04', question_libelle: 'Habilitation électrique vérifiée',        reponse: 'OUI', obligatoire: true,  categorie: 'HABILITATION' },
          { question_id: 'EL05', question_libelle: 'EPI diélectriques fournis',               reponse: 'OUI', obligatoire: true,  categorie: 'EPI' },
          { question_id: 'EL06', question_libelle: 'Panneau signalisation posé',              reponse: 'OUI', obligatoire: true,  categorie: 'ZONE' },
        ],
      },
    ],
  },
];
