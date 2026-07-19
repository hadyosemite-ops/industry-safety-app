// ─────────────────────────────────────────────────────────────────────────────
// Module Prestataires — Données démo (contexte Maroc)
// ─────────────────────────────────────────────────────────────────────────────

import type { Prestataire } from '../types';
import { statutDocument, statutHabilitation } from '../types';

export const PRESTATAIRES_DEMO: Prestataire[] = [
  // ── 1. ELEC PRO — Agréé, excellent score ─────────────────────────────────
  {
    id: 'prest-001',
    code: 'PREST-001',
    nom: 'ELEC PRO Maintenance',
    siret: '41234567800012',
    adresse: 'Zone Industrielle Sidi Bernoussi, Lot 12',
    ville: 'Casablanca',
    code_postal: '20600',
    secteur_activite: 'Électricité industrielle',
    contact_principal: { nom: 'Rachid Bouali', poste: 'Responsable chantier', email: 'r.bouali@elecpro.ma', tel: '+212 6 61 23 45 67' },
    categories: ['ELECTRICITE', 'INSTRUMENTATION'],
    statut: 'AGREE',
    date_agrement: '2025-01-15',
    date_expiration_agrement: '2027-01-15',
    score_global: 91,
    nb_at_actives: 2,
    nb_incidents_ytd: 0,
    nb_audits_ytd: 3,
    documents: [
      { id: 'd-001-1', type: 'RC',              libelle: 'Registre de commerce',  date_emission: '2026-01-05', date_expiration: '2027-01-05', statut: statutDocument('2027-01-05'), obligatoire: true },
      { id: 'd-001-2', type: 'ASSURANCE_RC',    libelle: 'Assurance RC Pro',      date_emission: '2026-01-01', date_expiration: '2027-01-01', statut: statutDocument('2027-01-01'), obligatoire: true },
      { id: 'd-001-3', type: 'PLAN_PREVENTION', libelle: 'Plan de prévention',    date_emission: '2026-02-01', date_expiration: '2027-02-01', statut: statutDocument('2027-02-01'), obligatoire: true },
      { id: 'd-001-4', type: 'CERTIFICATION_ISO', libelle: 'ISO 45001:2018',      date_emission: '2024-06-01', date_expiration: '2027-06-01', statut: statutDocument('2027-06-01'), obligatoire: false },
      { id: 'd-001-5', type: 'ATTESTATION_FISCALE', libelle: 'Attestation fiscale CNSS', date_emission: '2026-01-01', date_expiration: '2026-07-01', statut: statutDocument('2026-07-01'), obligatoire: true },
    ],
    intervenants: [
      {
        id: 'int-001-1', nom_complet: 'Mohamed El Fassi', poste: 'Électricien chef de chantier',
        badge_actif: true, date_entree_site: '2026-05-10',
        habilitations: [
          { type: 'ELECTRICITE_B2', date_obtention: '2024-03-01', date_expiration: '2026-03-01', statut: statutHabilitation('2026-03-01'), organisme: 'OFPPT Casablanca' },
          { type: 'ELECTRICITE_BR', date_obtention: '2024-03-01', date_expiration: '2027-03-01', statut: statutHabilitation('2027-03-01'), organisme: 'OFPPT Casablanca' },
          { type: 'TRAVAIL_HAUTEUR', date_obtention: '2025-06-01', date_expiration: '2027-06-01', statut: statutHabilitation('2027-06-01'), organisme: 'Centre Prévention Maroc' },
        ],
      },
      {
        id: 'int-001-2', nom_complet: 'Samir Benzara', poste: 'Électricien',
        badge_actif: true, date_entree_site: '2026-05-12',
        habilitations: [
          { type: 'ELECTRICITE_B1', date_obtention: '2025-01-01', date_expiration: '2027-01-01', statut: statutHabilitation('2027-01-01'), organisme: 'OFPPT Casablanca' },
          { type: 'GESTES_SECOURS_SST', date_obtention: '2024-09-01', date_expiration: '2026-09-01', statut: statutHabilitation('2026-09-01'), organisme: 'Croix Rouge Maroc' },
        ],
      },
    ],
    evaluations: [
      { id: 'eval-001-1', date: '2026-04-10', evaluateur: 'Youssef Alami', score_securite: 91, score_global: 91, nb_incidents_periode: 0, nb_at_periode: 0, points_positifs: 'Excellent respect des consignes LOTO. Intervenants bien habilités.', points_amelioration: 'Délai de transmission des rapports d\'intervention à améliorer.', recommandation: 'RENOUVELER' },
      { id: 'eval-001-2', date: '2025-10-05', evaluateur: 'Youssef Alami', score_securite: 89, score_global: 89, nb_incidents_periode: 0, nb_at_periode: 0, points_positifs: 'Bonne communication avec l\'animateur HSE.', points_amelioration: 'Port des EPI à améliorer sur certains postes.', recommandation: 'RENOUVELER' },
    ],
  },

  // ── 2. SOUDURE CHAUD — Agréé, 1 AT en cours ──────────────────────────────
  {
    id: 'prest-002',
    code: 'PREST-002',
    nom: 'SOUDURE CHAUD & Cie',
    siret: '52345678900034',
    adresse: 'Quartier Industriel Ain Sebaa, Rue 5',
    ville: 'Casablanca',
    code_postal: '20250',
    secteur_activite: 'Travaux chauds & soudure',
    contact_principal: { nom: 'Karim Benzara', poste: 'Directeur technique', email: 'k.benzara@soudure-chaud.ma', tel: '+212 6 62 34 56 78' },
    categories: ['TRAVAUX_CHAUDS', 'MECANIQUE_INDUSTRIELLE'],
    statut: 'AGREE',
    date_agrement: '2025-03-01',
    date_expiration_agrement: '2027-03-01',
    score_global: 74,
    nb_at_actives: 1,
    nb_incidents_ytd: 1,
    nb_audits_ytd: 2,
    documents: [
      { id: 'd-002-1', type: 'RC',               libelle: 'Registre de commerce',       date_emission: '2026-02-01', date_expiration: '2027-02-01', statut: statutDocument('2027-02-01'), obligatoire: true },
      { id: 'd-002-2', type: 'ASSURANCE_RC',      libelle: 'Assurance RC Pro',           date_emission: '2026-01-15', date_expiration: '2027-01-15', statut: statutDocument('2027-01-15'), obligatoire: true },
      { id: 'd-002-3', type: 'PLAN_PREVENTION',   libelle: 'Plan de prévention',         date_emission: '2025-12-01', date_expiration: '2026-07-10', statut: statutDocument('2026-07-10'), obligatoire: true },
      { id: 'd-002-4', type: 'AGREMENT_SPECIFIQUE', libelle: 'Agrément soudage pression', date_emission: '2024-01-01', date_expiration: '2026-06-15', statut: statutDocument('2026-06-15'), obligatoire: true },
    ],
    intervenants: [
      {
        id: 'int-002-1', nom_complet: 'Badr Ouali', poste: 'Soudeur qualifié',
        badge_actif: true, date_entree_site: '2026-05-20',
        habilitations: [
          { type: 'SOUDAGE_TIG', date_obtention: '2023-06-01', date_expiration: '2026-06-01', statut: statutHabilitation('2026-06-01'), organisme: 'ISEM Maroc' },
          { type: 'SOUDAGE_MIG', date_obtention: '2023-06-01', date_expiration: '2026-06-01', statut: statutHabilitation('2026-06-01'), organisme: 'ISEM Maroc' },
          { type: 'TRAVAIL_HAUTEUR', date_obtention: '2025-01-01', date_expiration: '2027-01-01', statut: statutHabilitation('2027-01-01') },
        ],
      },
      {
        id: 'int-002-2', nom_complet: 'Jamal Ouali', poste: 'Aide soudeur',
        badge_actif: true,
        habilitations: [
          { type: 'GESTES_SECOURS_SST', date_obtention: '2024-03-01', date_expiration: '2026-03-01', statut: statutHabilitation('2026-03-01') },
        ],
      },
      {
        id: 'int-002-3', nom_complet: 'Omar Alaoui', poste: 'Chef d\'équipe',
        badge_actif: true,
        habilitations: [
          { type: 'SOUDAGE_TIG', date_obtention: '2025-03-01', date_expiration: '2027-03-01', statut: statutHabilitation('2027-03-01') },
          { type: 'ELECTRICITE_B0', date_obtention: '2025-01-01', date_expiration: '2027-01-01', statut: statutHabilitation('2027-01-01') },
        ],
      },
    ],
    evaluations: [
      { id: 'eval-002-1', date: '2026-03-15', evaluateur: 'Hassan Benali', score_securite: 74, score_global: 74, nb_incidents_periode: 1, nb_at_periode: 0, points_positifs: 'Maîtrise technique des procédés de soudure. Équipe expérimentée.', points_amelioration: 'Incident EPI mineur en mars. Délimitation zone chauffe à revoir.', recommandation: 'SURVEILLER' },
    ],
  },

  // ── 3. HAUTEUR EXPERT — Document expiré, statut EXPIRE ───────────────────
  {
    id: 'prest-003',
    code: 'PREST-003',
    nom: 'HAUTEUR EXPERT Services',
    siret: '63456789000056',
    adresse: 'Zone Franche Tanger Med, Bâtiment C',
    ville: 'Tanger',
    code_postal: '90000',
    secteur_activite: 'Travaux en hauteur & levage',
    contact_principal: { nom: 'Nadia Hamidi', poste: 'Gérante', email: 'n.hamidi@hauteur-expert.ma', tel: '+212 6 63 45 67 89' },
    categories: ['TRAVAUX_CHAUDS', 'LEVAGE_MANUTENTION'],
    statut: 'EXPIRE',
    date_agrement: '2024-05-01',
    date_expiration_agrement: '2026-05-01',
    score_global: 68,
    nb_at_actives: 0,
    nb_incidents_ytd: 0,
    nb_audits_ytd: 1,
    documents: [
      { id: 'd-003-1', type: 'RC',              libelle: 'Registre de commerce', date_emission: '2025-01-01', date_expiration: '2026-01-01', statut: statutDocument('2026-01-01'), obligatoire: true },
      { id: 'd-003-2', type: 'ASSURANCE_RC',    libelle: 'Assurance RC Pro',     date_emission: '2025-05-01', date_expiration: '2026-05-01', statut: statutDocument('2026-05-01'), obligatoire: true },
      { id: 'd-003-3', type: 'PLAN_PREVENTION', libelle: 'Plan de prévention',   date_emission: '2025-06-01', date_expiration: '2026-06-20', statut: statutDocument('2026-06-20'), obligatoire: true },
      { id: 'd-003-4', type: 'AGREMENT_SPECIFIQUE', libelle: 'Agrément levage',  date_emission: '2023-01-01', date_expiration: '2026-01-01', statut: statutDocument('2026-01-01'), obligatoire: true },
    ],
    intervenants: [
      {
        id: 'int-003-1', nom_complet: 'Alain Méron', poste: 'Grutier',
        badge_actif: false,
        habilitations: [
          { type: 'CACES_R486', date_obtention: '2022-04-01', date_expiration: '2025-04-01', statut: statutHabilitation('2025-04-01'), organisme: 'Centre ISTA' },
          { type: 'TRAVAIL_HAUTEUR', date_obtention: '2023-01-01', date_expiration: '2025-01-01', statut: statutHabilitation('2025-01-01') },
        ],
      },
    ],
    evaluations: [
      { id: 'eval-003-1', date: '2025-11-20', evaluateur: 'Youssef Alami', score_securite: 68, score_global: 68, nb_incidents_periode: 0, nb_at_periode: 0, points_positifs: 'Expérience technique reconnue en levage.', points_amelioration: 'Documents administratifs à renouveler en urgence. CACES grutier expiré.', recommandation: 'SURVEILLER' },
    ],
  },

  // ── 4. CHIMIE SAFE — Suspendu suite incident ──────────────────────────────
  {
    id: 'prest-004',
    code: 'PREST-004',
    nom: 'CHIMIE SAFE Interventions',
    siret: '74567890100078',
    adresse: 'Zone Industrielle Berrechid, Lot 22',
    ville: 'Berrechid',
    code_postal: '26100',
    secteur_activite: 'Nettoyage industriel & chimie',
    contact_principal: { nom: 'Hassan Tazi', poste: 'Responsable HSE', email: 'h.tazi@chimiesafe.ma', tel: '+212 6 64 56 78 90' },
    categories: ['NETTOYAGE_INDUSTRIEL', 'ESPACES_CONFINES'],
    statut: 'SUSPENDU',
    date_agrement: '2024-09-01',
    date_expiration_agrement: '2026-09-01',
    score_global: 38,
    nb_at_actives: 0,
    nb_incidents_ytd: 2,
    nb_audits_ytd: 2,
    notes: 'Suspendu le 2026-04-18 suite à un incident d\'exposition chimique sans EPI adaptés. Reprise conditionnée à une nouvelle évaluation HSE.',
    documents: [
      { id: 'd-004-1', type: 'RC',              libelle: 'Registre de commerce',  date_emission: '2026-01-01', date_expiration: '2027-01-01', statut: statutDocument('2027-01-01'), obligatoire: true },
      { id: 'd-004-2', type: 'ASSURANCE_RC',    libelle: 'Assurance RC Pro',      date_emission: '2026-01-01', date_expiration: '2027-01-01', statut: statutDocument('2027-01-01'), obligatoire: true },
      { id: 'd-004-3', type: 'PLAN_PREVENTION', libelle: 'Plan de prévention',    date_emission: '2026-01-15', date_expiration: '2027-01-15', statut: statutDocument('2027-01-15'), obligatoire: true },
    ],
    intervenants: [
      {
        id: 'int-004-1', nom_complet: 'Youssef Brahim', poste: 'Opérateur nettoyage',
        badge_actif: false,
        habilitations: [
          { type: 'ESPACE_CONFINE', date_obtention: '2025-03-01', date_expiration: '2027-03-01', statut: statutHabilitation('2027-03-01') },
        ],
      },
      {
        id: 'int-004-2', nom_complet: 'Driss Alaoui', poste: 'Opérateur chimie',
        badge_actif: false,
        habilitations: [
          { type: 'ATEX', date_obtention: '2024-06-01', date_expiration: '2026-06-01', statut: statutHabilitation('2026-06-01') },
        ],
      },
    ],
    evaluations: [
      { id: 'eval-004-1', date: '2026-04-20', evaluateur: 'Hassan Benali', score_securite: 38, score_global: 38, nb_incidents_periode: 2, nb_at_periode: 0, points_positifs: 'Compétences techniques en nettoyage industriel.', points_amelioration: 'Non-respect EPI. Procédures d\'urgence chimique non maîtrisées. Suspension immédiate.', recommandation: 'SUSPENDRE' },
      { id: 'eval-004-2', date: '2025-09-10', evaluateur: 'Youssef Alami', score_securite: 71, score_global: 71, nb_incidents_periode: 0, nb_at_periode: 0, points_positifs: 'Bonne organisation des équipes.', points_amelioration: 'Formation ATEX à planifier pour l\'ensemble de l\'équipe.', recommandation: 'SURVEILLER' },
    ],
  },

  // ── 5. MECA INDUSTRIE — En évaluation (nouveau) ───────────────────────────
  {
    id: 'prest-005',
    code: 'PREST-005',
    nom: 'MECA INDUSTRIE Plus',
    siret: '85678901200090',
    adresse: 'Parc Industriel Nouaceur, Bâtiment 7',
    ville: 'Nouaceur',
    code_postal: '27182',
    secteur_activite: 'Mécanique industrielle',
    contact_principal: { nom: 'Fatima Ouhab', poste: 'Directrice', email: 'f.ouhab@meca-industrie.ma', tel: '+212 6 65 67 89 01' },
    categories: ['MECANIQUE_INDUSTRIELLE', 'MAINTENANCE_GENERALE'],
    statut: 'EN_EVALUATION',
    date_agrement: '2026-04-01',
    date_expiration_agrement: '2026-10-01',
    score_global: undefined,
    nb_at_actives: 0,
    nb_incidents_ytd: 0,
    nb_audits_ytd: 0,
    documents: [
      { id: 'd-005-1', type: 'RC',               libelle: 'Registre de commerce', date_emission: '2026-03-15', date_expiration: '2027-03-15', statut: statutDocument('2027-03-15'), obligatoire: true },
      { id: 'd-005-2', type: 'ASSURANCE_RC',      libelle: 'Assurance RC Pro',     date_emission: '2026-04-01', date_expiration: '2027-04-01', statut: statutDocument('2027-04-01'), obligatoire: true },
      { id: 'd-005-3', type: 'PLAN_PREVENTION',   libelle: 'Plan de prévention',   date_emission: '2026-04-15', date_expiration: '2027-04-15', statut: statutDocument('2027-04-15'), obligatoire: true },
      { id: 'd-005-4', type: 'LISTE_INTERVENANTS', libelle: 'Liste du personnel',  date_emission: '2026-04-01', date_expiration: '2027-04-01', statut: statutDocument('2027-04-01'), obligatoire: true },
    ],
    intervenants: [
      {
        id: 'int-005-1', nom_complet: 'Rémi Chartier', poste: 'Mécanicien senior',
        badge_actif: false,
        habilitations: [
          { type: 'CACES_3', date_obtention: '2024-05-01', date_expiration: '2029-05-01', statut: statutHabilitation('2029-05-01') },
          { type: 'GESTES_SECOURS_SST', date_obtention: '2025-11-01', date_expiration: '2027-11-01', statut: statutHabilitation('2027-11-01') },
        ],
      },
    ],
    evaluations: [],
  },

  // ── 6. GÉNIE CIVIL MAROC — Agréé, bon score ──────────────────────────────
  {
    id: 'prest-006',
    code: 'PREST-006',
    nom: 'GÉNIE CIVIL MAROC',
    siret: '96789012300011',
    adresse: 'Zone Industrielle Ouled Salah, Lot 18',
    ville: 'Mohammedia',
    code_postal: '28810',
    secteur_activite: 'Génie civil & construction',
    contact_principal: { nom: 'Isabelle Renard', poste: 'Chargée d\'affaires', email: 'i.renard@gcmaroc.ma', tel: '+212 6 66 78 90 12' },
    categories: ['GENIE_CIVIL', 'MAINTENANCE_GENERALE'],
    statut: 'AGREE',
    date_agrement: '2025-06-01',
    date_expiration_agrement: '2027-06-01',
    score_global: 81,
    nb_at_actives: 0,
    nb_incidents_ytd: 1,
    nb_audits_ytd: 2,
    documents: [
      { id: 'd-006-1', type: 'RC',                  libelle: 'Registre de commerce',  date_emission: '2026-01-01', date_expiration: '2027-01-01', statut: statutDocument('2027-01-01'), obligatoire: true },
      { id: 'd-006-2', type: 'ASSURANCE_RC',         libelle: 'Assurance RC Pro',      date_emission: '2026-06-01', date_expiration: '2027-06-01', statut: statutDocument('2027-06-01'), obligatoire: true },
      { id: 'd-006-3', type: 'ASSURANCE_DECENNALE',  libelle: 'Assurance décennale',   date_emission: '2025-06-01', date_expiration: '2035-06-01', statut: statutDocument('2035-06-01'), obligatoire: true },
      { id: 'd-006-4', type: 'PLAN_PREVENTION',      libelle: 'Plan de prévention',    date_emission: '2026-05-01', date_expiration: '2026-08-15', statut: statutDocument('2026-08-15'), obligatoire: true },
      { id: 'd-006-5', type: 'CERTIFICATION_ISO',    libelle: 'ISO 45001:2018',        date_emission: '2024-01-01', date_expiration: '2027-01-01', statut: statutDocument('2027-01-01'), obligatoire: false },
    ],
    intervenants: [
      {
        id: 'int-006-1', nom_complet: 'Nicolas Perrin', poste: 'Chef de chantier',
        badge_actif: true, date_entree_site: '2026-05-05',
        habilitations: [
          { type: 'CACES_5', date_obtention: '2024-07-01', date_expiration: '2029-07-01', statut: statutHabilitation('2029-07-01') },
          { type: 'TRAVAIL_HAUTEUR', date_obtention: '2025-03-01', date_expiration: '2027-03-01', statut: statutHabilitation('2027-03-01') },
          { type: 'GESTES_SECOURS_SST', date_obtention: '2025-09-01', date_expiration: '2027-09-01', statut: statutHabilitation('2027-09-01') },
        ],
      },
      {
        id: 'int-006-2', nom_complet: 'Stéphane Moulin', poste: 'Maçon spécialisé',
        badge_actif: true,
        habilitations: [
          { type: 'CACES_1', date_obtention: '2023-05-01', date_expiration: '2028-05-01', statut: statutHabilitation('2028-05-01') },
        ],
      },
      {
        id: 'int-006-3', nom_complet: 'Abdel Mansouri', poste: 'Conducteur engins',
        badge_actif: true,
        habilitations: [
          { type: 'CACES_3', date_obtention: '2024-01-01', date_expiration: '2029-01-01', statut: statutHabilitation('2029-01-01') },
          { type: 'CACES_5', date_obtention: '2024-01-01', date_expiration: '2029-01-01', statut: statutHabilitation('2029-01-01') },
        ],
      },
    ],
    evaluations: [
      { id: 'eval-006-1', date: '2026-05-02', evaluateur: 'Hassan Benali', score_securite: 81, score_global: 81, nb_incidents_periode: 1, nb_at_periode: 0, points_positifs: 'Bonne organisation du chantier. Signalisation conforme.', points_amelioration: 'Incident bénin lié à une chute d\'objet — procédure de calfeutrement à renforcer.', recommandation: 'RENOUVELER' },
    ],
  },
];
