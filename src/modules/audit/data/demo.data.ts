// ─────────────────────────────────────────────────────────────────────────────
// Module Audit HSE — Données démo
// Planning annuel 2026 + audits réalisés avec réponses complètes
// ─────────────────────────────────────────────────────────────────────────────

import type { PlanAudit, Audit, EcartAudit } from '../types';
import { calculerScore, SECTIONS_ORDRE } from '../types';
import { CHECKLIST_STANDARD } from './checklist.data';

// ── Planning annuel 2026 ──────────────────────────────────────────────────────

export const PLANNING_2026: PlanAudit[] = [
  // ── Zone A - Production ───────────────────────────────────────────────────
  { id: 'plan-001', zone: 'Zone A - Production',   type_audit: 'TERRAIN',    auditeur: 'Dupont M.',    semaine: 2,  annee: 2026, statut: 'VALIDE',   audit_id: 'aud-001' },
  { id: 'plan-002', zone: 'Zone A - Production',   type_audit: 'TERRAIN',    auditeur: 'Martin S.',   semaine: 6,  annee: 2026, statut: 'VALIDE',   audit_id: 'aud-002' },
  { id: 'plan-003', zone: 'Zone A - Production',   type_audit: 'TERRAIN',    auditeur: 'Dupont M.',    semaine: 10, annee: 2026, statut: 'VALIDE',   audit_id: 'aud-003' },
  { id: 'plan-004', zone: 'Zone A - Production',   type_audit: 'SYSTEME',    auditeur: 'Bernard A.',   semaine: 13, annee: 2026, statut: 'VALIDE',   audit_id: 'aud-004' },
  { id: 'plan-005', zone: 'Zone A - Production',   type_audit: 'TERRAIN',    auditeur: 'Martin S.',   semaine: 18, annee: 2026, statut: 'REALISE',  audit_id: 'aud-005' },
  { id: 'plan-006', zone: 'Zone A - Production',   type_audit: 'TERRAIN',    auditeur: 'Dupont M.',    semaine: 22, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-007', zone: 'Zone A - Production',   type_audit: 'COMPLIANCE', auditeur: 'Bernard A.',   semaine: 26, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-008', zone: 'Zone A - Production',   type_audit: 'TERRAIN',    auditeur: 'Dupont M.',    semaine: 30, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-009', zone: 'Zone A - Production',   type_audit: 'TERRAIN',    auditeur: 'Martin S.',   semaine: 35, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-010', zone: 'Zone A - Production',   type_audit: 'SUIVI',      auditeur: 'Dupont M.',    semaine: 40, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-011', zone: 'Zone A - Production',   type_audit: 'TERRAIN',    auditeur: 'Martin S.',   semaine: 44, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-012', zone: 'Zone A - Production',   type_audit: 'TERRAIN',    auditeur: 'Dupont M.',    semaine: 50, annee: 2026, statut: 'PLANIFIE' },

  // ── Zone B - Packaging ────────────────────────────────────────────────────
  { id: 'plan-013', zone: 'Zone B - Packaging',    type_audit: 'TERRAIN',    auditeur: 'Martin S.',   semaine: 3,  annee: 2026, statut: 'VALIDE',   audit_id: 'aud-006' },
  { id: 'plan-014', zone: 'Zone B - Packaging',    type_audit: 'TERRAIN',    auditeur: 'Dupont M.',    semaine: 8,  annee: 2026, statut: 'VALIDE',   audit_id: 'aud-007' },
  { id: 'plan-015', zone: 'Zone B - Packaging',    type_audit: 'TERRAIN',    auditeur: 'Martin S.',   semaine: 15, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-016', zone: 'Zone B - Packaging',    type_audit: 'SYSTEME',    auditeur: 'Bernard A.',   semaine: 26, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-017', zone: 'Zone B - Packaging',    type_audit: 'TERRAIN',    auditeur: 'Dupont M.',    semaine: 38, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-018', zone: 'Zone B - Packaging',    type_audit: 'TERRAIN',    auditeur: 'Martin S.',   semaine: 48, annee: 2026, statut: 'PLANIFIE' },

  // ── Zone C - Énergie ──────────────────────────────────────────────────────
  { id: 'plan-019', zone: 'Zone C - Énergie',      type_audit: 'TERRAIN',    auditeur: 'Bernard A.',   semaine: 4,  annee: 2026, statut: 'VALIDE',   audit_id: 'aud-008' },
  { id: 'plan-020', zone: 'Zone C - Énergie',      type_audit: 'COMPLIANCE', auditeur: 'Bernard A.',   semaine: 14, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-021', zone: 'Zone C - Énergie',      type_audit: 'TERRAIN',    auditeur: 'Dupont M.',    semaine: 24, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-022', zone: 'Zone C - Énergie',      type_audit: 'TERRAIN',    auditeur: 'Martin S.',   semaine: 36, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-023', zone: 'Zone C - Énergie',      type_audit: 'SUIVI',      auditeur: 'Bernard A.',   semaine: 46, annee: 2026, statut: 'PLANIFIE' },

  // ── Zone D - Chimie ───────────────────────────────────────────────────────
  { id: 'plan-024', zone: 'Zone D - Chimie',       type_audit: 'TERRAIN',    auditeur: 'Dupont M.',    semaine: 5,  annee: 2026, statut: 'VALIDE',   audit_id: 'aud-009' },
  { id: 'plan-025', zone: 'Zone D - Chimie',       type_audit: 'COMPLIANCE', auditeur: 'Bernard A.',   semaine: 12, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-026', zone: 'Zone D - Chimie',       type_audit: 'TERRAIN',    auditeur: 'Martin S.',   semaine: 20, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-027', zone: 'Zone D - Chimie',       type_audit: 'TERRAIN',    auditeur: 'Dupont M.',    semaine: 32, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-028', zone: 'Zone D - Chimie',       type_audit: 'SUIVI',      auditeur: 'Bernard A.',   semaine: 42, annee: 2026, statut: 'PLANIFIE' },

  // ── Zone E - Logistique ───────────────────────────────────────────────────
  { id: 'plan-029', zone: 'Zone E - Logistique',   type_audit: 'TERRAIN',    auditeur: 'Martin S.',   semaine: 7,  annee: 2026, statut: 'VALIDE',   audit_id: 'aud-010' },
  { id: 'plan-030', zone: 'Zone E - Logistique',   type_audit: 'TERRAIN',    auditeur: 'Dupont M.',    semaine: 16, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-031', zone: 'Zone E - Logistique',   type_audit: 'SYSTEME',    auditeur: 'Bernard A.',   semaine: 26, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-032', zone: 'Zone E - Logistique',   type_audit: 'TERRAIN',    auditeur: 'Martin S.',   semaine: 39, annee: 2026, statut: 'PLANIFIE' },
  { id: 'plan-033', zone: 'Zone E - Logistique',   type_audit: 'COMPLIANCE', auditeur: 'Bernard A.',   semaine: 50, annee: 2026, statut: 'PLANIFIE' },
];

// ── Helpers privés ─────────────────────────────────────────────────────────────

function rep(itemId: string, reponse: 'CONFORME' | 'PARTIELLEMENT' | 'NON_CONFORME' | 'NA',
  opts?: { commentaire?: string; niveau_ecart?: 'MAJEUR' | 'MINEUR' | 'OBSERVATION' }
) {
  return { item_id: itemId, reponse, ...opts };
}

// Génère des réponses "bon élève" pour tous les items non spécifiés
function fillReponses(
  overrides: ReturnType<typeof rep>[],
  defaultReponse: 'CONFORME' | 'PARTIELLEMENT' = 'CONFORME',
): ReturnType<typeof rep>[] {
  const map = new Map(overrides.map(r => [r.item_id, r]));
  return CHECKLIST_STANDARD.map(item => map.get(item.id) ?? rep(item.id, defaultReponse));
}

// ── Écarts réutilisables ───────────────────────────────────────────────────────

const ECART_EPI_01: EcartAudit = {
  id: 'ec-001', item_id: 'EPI-01', section: 'EPI',
  description: '3 opérateurs sans casque observés en zone presses lors du passage de l\'auditeur.',
  niveau: 'MAJEUR', reglementaire: true,
  action_corrective: 'Sensibilisation immédiate + affichage pictogrammes EPI renforcés. Contrôle surprise J+7.',
  responsable: 'Chef d\'atelier Production', date_echeance: '2026-02-10', statut: 'CLOS',
  date_cloture: '2026-02-08',
};

const ECART_ELC_02: EcartAudit = {
  id: 'ec-002', item_id: 'ELC-02', section: 'ELECTRICITE',
  description: 'Procédure LOTO non respectée lors de la maintenance préventive presse P-07 : équipement mis sous énergie sans consignation.',
  niveau: 'MAJEUR', reglementaire: true,
  action_corrective: 'Rappel procédure LOTO à toute l\'équipe maintenance. Vérification des cadenassats disponibles. Formation recyclage LOTO en S08.',
  responsable: 'Responsable Maintenance', date_echeance: '2026-02-20', statut: 'EN_COURS',
};

const ECART_OPR_01: EcartAudit = {
  id: 'ec-003', item_id: 'OPR-01', section: 'ORDRE_PROPRETE',
  description: 'Allée de circulation entre les racks A3 et A4 obstruée par palettes non rangées (largeur résiduelle ~55 cm).',
  niveau: 'MINEUR', reglementaire: false,
  action_corrective: 'Réorganisation zone de dépose temporaire. Marquage au sol délimitant les zones palettes en attente.',
  responsable: 'Chef d\'équipe Logistique', date_echeance: '2026-03-05', statut: 'OUVERT',
};

const ECART_RCH_04: EcartAudit = {
  id: 'ec-004', item_id: 'RCH-04', section: 'RISQUES_CHIMIQUES',
  description: 'Zone ATEX Zone D non classifiée dans le document DRZE (mis à jour en 2024). Équipement électrique non certifié Ex trouvé dans la zone.',
  niveau: 'MAJEUR', reglementaire: true,
  action_corrective: 'Mise à jour immédiate du DRZE. Remplacement équipement non conforme sous 30j. Vérification par organisme agréé.',
  responsable: 'Responsable HSE Bernard A.', date_echeance: '2026-01-31', statut: 'CLOS',
  date_cloture: '2026-01-28',
};

const ECART_INC_02: EcartAudit = {
  id: 'ec-005', item_id: 'INC-02', section: 'INCENDIE',
  description: 'Issue de secours IS-03 bloquée par palettes de matières premières. Signalisation lumineuse hors service.',
  niveau: 'MAJEUR', reglementaire: true,
  action_corrective: 'Dégagement immédiat de l\'issue (réalisé le jour même). Remplacement bloc éclairage de sécurité. Contrôle annuel planifié.',
  responsable: 'Responsable Maintenance', date_echeance: '2026-02-05', statut: 'CLOS',
  date_cloture: '2026-01-25',
};

const ECART_MAN_02: EcartAudit = {
  id: 'ec-006', item_id: 'MAN-02', section: 'MANUTENTION',
  description: 'Chariot élévateur C-04 : VGP expirée depuis 3 mois. Aucune inspection par organisme agréé réalisée.',
  niveau: 'MAJEUR', reglementaire: true,
  action_corrective: 'Mise hors service du chariot C-04 immédiate. Planification VGP avec organisme agréé sous 10j.',
  responsable: 'Chef de zone Logistique', date_echeance: '2026-02-14', statut: 'CLOS',
  date_cloture: '2026-02-12',
};

const ECART_SEC_02: EcartAudit = {
  id: 'ec-007', item_id: 'SEC-02', section: 'SECOURS',
  description: 'Équipe nuit (22h-06h) : aucun SST présent. Formation du dernier SST expirée (> 24 mois).',
  niveau: 'MAJEUR', reglementaire: true,
  action_corrective: 'Inscription immédiate de 2 opérateurs équipe nuit en formation SST recyclage (session S09). Interim SST par chef d\'équipe formé.',
  responsable: 'RH + HSE', date_echeance: '2026-03-01', statut: 'EN_COURS',
};

const ECART_TAH_01: EcartAudit = {
  id: 'ec-008', item_id: 'TAH-01', section: 'TRAVAIL_HAUTEUR',
  description: 'Travaux de maintenance toiture en zone packaging : 2 intervenants sans harnais, protection collective absente.',
  niveau: 'MAJEUR', reglementaire: true,
  action_corrective: 'Arrêt immédiat du chantier. Mise en place d\'un permis de travail spécifique hauteur. Fourniture harnais + ligne de vie.',
  responsable: 'Responsable HSE Bernard A.', date_echeance: '2026-02-22', statut: 'CLOS',
  date_cloture: '2026-02-20',
};

// ── Audits réalisés ────────────────────────────────────────────────────────────

// Calcul automatique des scores
function buildAudit(
  base: Omit<Audit, 'score_global' | 'scores_sections'>,
): Audit {
  const scoreGlobal = calculerScore(base.reponses, CHECKLIST_STANDARD);
  const scoresSections: Partial<Record<import('../types').SectionId, number>> = {};
  for (const sec of SECTIONS_ORDRE) {
    scoresSections[sec] = calculerScore(base.reponses, CHECKLIST_STANDARD, sec);
  }
  return { ...base, score_global: scoreGlobal, scores_sections: scoresSections };
}

// aud-001 : Zone A S02 — Score moyen (NC LOTO + EPI)
const aud001 = buildAudit({
  id: 'aud-001', plan_id: 'plan-001',
  numero: 'AUD-2026-0001',
  type_audit: 'TERRAIN', statut: 'VALIDE',
  zone: 'Zone A - Production', zone_code: 'ZA',
  date_audit: '2026-01-09T09:00:00',
  duree_minutes: 95,
  auditeur: 'Dupont M.', auditeur_poste: 'Animateur HSE',
  accompagnateur: 'Leroy F. (Chef d\'atelier)',
  reponses: fillReponses([
    rep('EPI-01', 'NON_CONFORME', { commentaire: '3 opérateurs sans casque zone presses', niveau_ecart: 'MAJEUR' }),
    rep('EPI-02', 'PARTIELLEMENT', { commentaire: 'Gants détériorés sur 2 postes', niveau_ecart: 'MINEUR' }),
    rep('ELC-02', 'NON_CONFORME', { commentaire: 'LOTO non appliqué presse P-07', niveau_ecart: 'MAJEUR' }),
    rep('ELC-04', 'PARTIELLEMENT', { commentaire: 'Câble rallonge posé au sol zone humide', niveau_ecart: 'OBSERVATION' }),
    rep('OPR-03', 'PARTIELLEMENT', { commentaire: 'Tache d\'huile non signalisée devant presse P-12', niveau_ecart: 'OBSERVATION' }),
  ]),
  ecarts: [ECART_EPI_01, ECART_ELC_02],
  points_positifs: 'Extincteurs tous contrôlés à jour. Zones ATEX bien balisées. Documentation FDS complète.',
  synthese: 'Audit révèle 2 écarts MAJEURS à traiter en priorité. La conformité LOTO est insuffisante : action de formation recyclage planifiée. Le port des EPI doit être renforcé par la hiérarchie de proximité.',
  date_soumission: '2026-01-09T11:45:00',
  date_validation: '2026-01-10T14:00:00',
  validateur: 'Bernard A.',
});

// aud-002 : Zone A S06 — Bon score post-correction
const aud002 = buildAudit({
  id: 'aud-002', plan_id: 'plan-002',
  numero: 'AUD-2026-0004',
  type_audit: 'TERRAIN', statut: 'VALIDE',
  zone: 'Zone A - Production', zone_code: 'ZA',
  date_audit: '2026-02-06T08:30:00',
  duree_minutes: 80,
  auditeur: 'Martin S.', auditeur_poste: 'Animateur HSE',
  accompagnateur: 'Leroy F. (Chef d\'atelier)',
  reponses: fillReponses([
    rep('EPI-02', 'PARTIELLEMENT', { commentaire: 'Stock de remplacement gants insuffisant', niveau_ecart: 'OBSERVATION' }),
    rep('OPR-05', 'PARTIELLEMENT', { commentaire: 'Zone stockage solvants : étiquetage à compléter', niveau_ecart: 'MINEUR' }),
  ]),
  ecarts: [{
    id: 'ec-101', item_id: 'OPR-05', section: 'ORDRE_PROPRETE',
    description: 'Quelques contenants solvants sans étiquette complète (n° lot manquant).',
    niveau: 'MINEUR', reglementaire: false,
    action_corrective: 'Ré-étiquetage systématique. Procédure de contrôle réception à renforcer.',
    responsable: 'Chef d\'atelier Production', date_echeance: '2026-02-20', statut: 'CLOS', date_cloture: '2026-02-17',
  }],
  points_positifs: 'Amélioration notable LOTO : procédure respectée à 100%. EPI port conforme. Ordre et propreté très satisfaisants.',
  synthese: 'Nette progression depuis audit S02. Les actions correctives LOTO et EPI ont été efficaces. Score section Électricité passe de 54% à 92%.',
  date_soumission: '2026-02-06T10:30:00',
  date_validation: '2026-02-07T09:00:00',
  validateur: 'Bernard A.',
});

// aud-003 : Zone A S10 — Excellent
const aud003 = buildAudit({
  id: 'aud-003', plan_id: 'plan-003',
  numero: 'AUD-2026-0007',
  type_audit: 'TERRAIN', statut: 'VALIDE',
  zone: 'Zone A - Production', zone_code: 'ZA',
  date_audit: '2026-03-06T09:00:00',
  duree_minutes: 75,
  auditeur: 'Dupont M.', auditeur_poste: 'Animateur HSE',
  accompagnateur: 'Leroy F. (Chef d\'atelier)',
  reponses: fillReponses([], 'CONFORME'),
  ecarts: [],
  points_positifs: 'Zone exemplaire. 100% conformité EPI. LOTO systématiquement appliqué. 5S impeccable. Exercice évacuation réalisé en S09.',
  synthese: 'Zone A atteint le niveau Excellence MASE pour la première fois. Félicitations à l\'équipe. À maintenir.',
  date_soumission: '2026-03-06T10:45:00',
  date_validation: '2026-03-07T08:00:00',
  validateur: 'Bernard A.',
});

// aud-004 : Zone A S13 — Audit système
const aud004 = buildAudit({
  id: 'aud-004', plan_id: 'plan-004',
  numero: 'AUD-2026-0009',
  type_audit: 'SYSTEME', statut: 'VALIDE',
  zone: 'Zone A - Production', zone_code: 'ZA',
  date_audit: '2026-03-27T14:00:00',
  duree_minutes: 150,
  auditeur: 'Bernard A.', auditeur_poste: 'Responsable HSE',
  accompagnateur: 'Direction Production',
  reponses: fillReponses([
    rep('PTW-03', 'PARTIELLEMENT', { commentaire: 'Intervenants extérieurs peu au fait des risques spécifiques zone A', niveau_ecart: 'MINEUR' }),
    rep('SEC-05', 'PARTIELLEMENT', { commentaire: 'Exercice évacuation réalisé mais sans simulation feu réel', niveau_ecart: 'OBSERVATION' }),
  ]),
  ecarts: [{
    id: 'ec-102', item_id: 'PTW-03', section: 'PTW',
    description: 'Les entreprises extérieures ne reçoivent pas systématiquement le plan de prévention avant intervention.',
    niveau: 'MINEUR', reglementaire: true,
    action_corrective: 'Systématisation du plan de prévention dans le processus d\'accueil. Check-list d\'accueil renforcée.',
    responsable: 'Coordinateur HSE Dupont M.', date_echeance: '2026-04-15', statut: 'EN_COURS',
  }],
  points_positifs: 'Documentation ISO 45001 à jour. Revue de direction trimestrielle réalisée. Indicateurs TF/TG en amélioration.',
  synthese: 'Audit système révèle une bonne maturité du SMSé. Point d\'amélioration sur la gestion des entreprises extérieures.',
  date_soumission: '2026-03-27T16:30:00',
  date_validation: '2026-03-28T10:00:00',
  validateur: 'Direction HSE',
});

// aud-005 : Zone A S18 — Réalisé non validé
const aud005 = buildAudit({
  id: 'aud-005', plan_id: 'plan-005',
  numero: 'AUD-2026-0013',
  type_audit: 'TERRAIN', statut: 'REALISE',
  zone: 'Zone A - Production', zone_code: 'ZA',
  date_audit: '2026-05-02T08:00:00',
  duree_minutes: 85,
  auditeur: 'Martin S.', auditeur_poste: 'Animateur HSE',
  accompagnateur: 'Leroy F. (Chef d\'atelier)',
  reponses: fillReponses([
    rep('SEC-02', 'NON_CONFORME', { commentaire: 'Équipe nuit sans SST valide', niveau_ecart: 'MAJEUR' }),
    rep('EPI-04', 'PARTIELLEMENT', { commentaire: 'Stock EPI anti-bruit insuffisant (< 2 semaines)', niveau_ecart: 'OBSERVATION' }),
    rep('MAN-06', 'PARTIELLEMENT', { commentaire: 'Chariots garés partiellement dans allée', niveau_ecart: 'MINEUR' }),
  ]),
  ecarts: [ECART_SEC_02],
  points_positifs: 'Bonne gestion produits chimiques. FDS toutes accessibles. Rétentions en bon état.',
  synthese: 'Audit en attente de validation. 1 NC majeure SST équipe nuit nécessite action immédiate.',
  date_soumission: '2026-05-02T10:15:00',
  at_concernee: 'AT-2026-0041',
});

// aud-006 : Zone B S03 — Score moyen (hauteur)
const aud006 = buildAudit({
  id: 'aud-006', plan_id: 'plan-013',
  numero: 'AUD-2026-0002',
  type_audit: 'TERRAIN', statut: 'VALIDE',
  zone: 'Zone B - Packaging', zone_code: 'ZB',
  date_audit: '2026-01-16T10:00:00',
  duree_minutes: 90,
  auditeur: 'Martin S.', auditeur_poste: 'Animateur HSE',
  accompagnateur: 'Nantes P. (Chef packaging)',
  reponses: fillReponses([
    rep('TAH-01', 'NON_CONFORME', { commentaire: 'Travaux toiture sans harnais ni protection collective', niveau_ecart: 'MAJEUR' }),
    rep('TAH-02', 'PARTIELLEMENT', { commentaire: '1 harnais sans fiche de contrôle à jour', niveau_ecart: 'MINEUR' }),
    rep('INC-02', 'NON_CONFORME', { commentaire: 'IS-03 bloquée, éclairage sécurité HS', niveau_ecart: 'MAJEUR' }),
    rep('OPR-06', 'PARTIELLEMENT', { commentaire: 'Marquage au sol effacé zone B2', niveau_ecart: 'MINEUR' }),
  ]),
  ecarts: [ECART_TAH_01, ECART_INC_02],
  points_positifs: 'Port des EPI conforme à 100%. Extincteurs tous vérifiés. Bonnes pratiques 5S dans l\'ensemble.',
  synthese: '2 NC majeures critiques traitées immédiatement. Travaux en hauteur : renforcement du système de permis de travail nécessaire.',
  date_soumission: '2026-01-16T12:00:00',
  date_validation: '2026-01-17T09:00:00',
  validateur: 'Bernard A.',
});

// aud-007 : Zone B S08 — Bon score
const aud007 = buildAudit({
  id: 'aud-007', plan_id: 'plan-014',
  numero: 'AUD-2026-0005',
  type_audit: 'TERRAIN', statut: 'VALIDE',
  zone: 'Zone B - Packaging', zone_code: 'ZB',
  date_audit: '2026-02-20T09:30:00',
  duree_minutes: 70,
  auditeur: 'Dupont M.', auditeur_poste: 'Animateur HSE',
  reponses: fillReponses([
    rep('OPR-06', 'PARTIELLEMENT', { commentaire: 'Remaquage sol en cours, 30% restant', niveau_ecart: 'OBSERVATION' }),
    rep('SEC-05', 'PARTIELLEMENT', { commentaire: 'Exercice évacuation non encore réalisé S08', niveau_ecart: 'MINEUR' }),
  ]),
  ecarts: [],
  points_positifs: 'Actions correctives S03 toutes closes. Permis feu systématiquement utilisés. Harnais vérifiés.',
  synthese: 'Zone B en nette amélioration. Les NC majeures S03 sont closes. Remaquage sol en bonne voie.',
  date_soumission: '2026-02-20T11:00:00',
  date_validation: '2026-02-21T08:00:00',
  validateur: 'Bernard A.',
});

// aud-008 : Zone C Énergie S04 — NC électrique grave
const aud008 = buildAudit({
  id: 'aud-008', plan_id: 'plan-019',
  numero: 'AUD-2026-0003',
  type_audit: 'TERRAIN', statut: 'VALIDE',
  zone: 'Zone C - Énergie', zone_code: 'ZC',
  date_audit: '2026-01-23T08:00:00',
  duree_minutes: 110,
  auditeur: 'Bernard A.', auditeur_poste: 'Responsable HSE',
  accompagnateur: 'Petit R. (Responsable énergie)',
  reponses: fillReponses([
    rep('ELC-01', 'PARTIELLEMENT', { commentaire: '1 électricien : habilitation B2V expirée', niveau_ecart: 'MAJEUR' }),
    rep('ELC-05', 'NON_CONFORME', { commentaire: 'Contrôle périodique CONSUEL non réalisé (retard 8 mois)', niveau_ecart: 'MAJEUR' }),
    rep('ELC-03', 'PARTIELLEMENT', { commentaire: 'Armoire TGBT accessible sans habilitation', niveau_ecart: 'MAJEUR' }),
    rep('RCH-04', 'NON_CONFORME', { commentaire: 'DRZE non mis à jour + équipement non ATEX en zone classée', niveau_ecart: 'MAJEUR' }),
    rep('ELC-06', 'PARTIELLEMENT', { commentaire: 'Gants isolants classe 2 manquants (1 sur 2 paires conforme)', niveau_ecart: 'MINEUR' }),
  ]),
  ecarts: [ECART_RCH_04, {
    id: 'ec-201', item_id: 'ELC-05', section: 'ELECTRICITE',
    description: 'Vérification générale périodique des installations électriques non réalisée depuis 8 mois (retard sur obligation légale annuelle).',
    niveau: 'MAJEUR', reglementaire: true,
    action_corrective: 'Planification immédiate VGP avec organisme agréé Socotec. Visite planifiée le 30/01/2026.',
    responsable: 'Responsable Maintenance', date_echeance: '2026-02-05', statut: 'CLOS', date_cloture: '2026-02-03',
  }],
  points_positifs: 'Procédures de consignation documentées. Formation LOTO récente pour 4 électriciens.',
  synthese: 'Zone C Énergie : audit sévère, 4 NC majeures électriques/ATEX. Priorité absolue sur la mise en conformité. Accès TGBT sécurisé immédiatement.',
  date_soumission: '2026-01-23T10:30:00',
  date_validation: '2026-01-24T09:00:00',
  validateur: 'Direction HSE',
});

// aud-009 : Zone D Chimie S05 — Audit chimie spécialisé
const aud009 = buildAudit({
  id: 'aud-009', plan_id: 'plan-024',
  numero: 'AUD-2026-0006',
  type_audit: 'TERRAIN', statut: 'VALIDE',
  zone: 'Zone D - Chimie', zone_code: 'ZD',
  date_audit: '2026-01-30T09:00:00',
  duree_minutes: 120,
  auditeur: 'Dupont M.', auditeur_poste: 'Animateur HSE',
  accompagnateur: 'Moreau L. (Responsable chimie)',
  reponses: fillReponses([
    rep('RCH-01', 'PARTIELLEMENT', { commentaire: '4 contenants sans pictogrammes SGH mis à jour', niveau_ecart: 'MINEUR' }),
    rep('RCH-05', 'PARTIELLEMENT', { commentaire: 'Rétention bac HCl : capacité 95% (limite 110%)', niveau_ecart: 'MINEUR' }),
    rep('RCH-07', 'PARTIELLEMENT', { commentaire: 'Fontaine rince-œil zone D3 : pression insuffisante', niveau_ecart: 'MINEUR' }),
    rep('EPI-05', 'PARTIELLEMENT', { commentaire: 'Gants NBR : taille L en rupture de stock', niveau_ecart: 'OBSERVATION' }),
    rep('SEC-06', 'PARTIELLEMENT', { commentaire: 'Consignes neutralisation acide non affichées en zone D3', niveau_ecart: 'MINEUR' }),
  ]),
  ecarts: [{
    id: 'ec-301', item_id: 'RCH-05', section: 'RISQUES_CHIMIQUES',
    description: 'Rétention HCl à 95% de sa capacité nominale. La réglementation exige 110% du plus grand contenant.',
    niveau: 'MINEUR', reglementaire: true,
    action_corrective: 'Transfert partiel HCl vers rétention secondaire. Réduction du stock en zone primaire. Commande bac rétention supplémentaire.',
    responsable: 'Responsable chimie Moreau L.', date_echeance: '2026-02-14', statut: 'CLOS', date_cloture: '2026-02-10',
  }],
  points_positifs: 'Excellente tenue des FDS (100% à jour). CMR stockés et tracés conformément. Procédure transfert acide bien respectée. EPI chimiques globalement disponibles.',
  synthese: 'Zone D chimie : niveau satisfaisant avec marges d\'amélioration sur la signalétique et l\'entretien des équipements de lavage oculaire.',
  date_soumission: '2026-01-30T11:30:00',
  date_validation: '2026-01-31T10:00:00',
  validateur: 'Bernard A.',
});

// aud-010 : Zone E Logistique S07 — Problème chariot
const aud010 = buildAudit({
  id: 'aud-010', plan_id: 'plan-029',
  numero: 'AUD-2026-0008',
  type_audit: 'TERRAIN', statut: 'VALIDE',
  zone: 'Zone E - Logistique', zone_code: 'ZE',
  date_audit: '2026-02-13T08:30:00',
  duree_minutes: 85,
  auditeur: 'Martin S.', auditeur_poste: 'Animateur HSE',
  accompagnateur: 'Simon T. (Chef de zone logistique)',
  reponses: fillReponses([
    rep('MAN-01', 'PARTIELLEMENT', { commentaire: '1 cariste : CACES R489 valide mais autorisation interne non signée', niveau_ecart: 'MINEUR' }),
    rep('MAN-02', 'NON_CONFORME', { commentaire: 'Chariot C-04 : VGP expirée depuis 3 mois', niveau_ecart: 'MAJEUR' }),
    rep('MAN-03', 'PARTIELLEMENT', { commentaire: 'Intersection allée 7 : signalisation priorité effacée', niveau_ecart: 'MINEUR' }),
    rep('OPR-01', 'PARTIELLEMENT', { commentaire: 'Allée A3-A4 obstruée par palettes (~55cm)', niveau_ecart: 'MINEUR' }),
    rep('EPI-01', 'PARTIELLEMENT', { commentaire: '2 caristes sans gilet haute visibilité', niveau_ecart: 'MINEUR' }),
  ]),
  ecarts: [ECART_MAN_02, ECART_OPR_01],
  points_positifs: 'Élingues et sangles de levage toutes taggées couleur 2026. Chariots rechargés dans zones dédiées. Bonne séparation piétons/engins dans l\'ensemble.',
  synthese: '1 NC majeure réglementaire (VGP chariot expirée) traité immédiatement. Logistique en bonne progression sur les élingues et le levage.',
  date_soumission: '2026-02-13T10:15:00',
  date_validation: '2026-02-14T09:30:00',
  validateur: 'Bernard A.',
});

// ── Export principal ───────────────────────────────────────────────────────────

export const AUDITS_DEMO: Audit[] = [
  aud001, aud002, aud003, aud004, aud005,
  aud006, aud007, aud008, aud009, aud010,
];

// ── KPIs globaux ───────────────────────────────────────────────────────────────

export interface KpisAudit {
  nb_audits_realises: number;
  nb_audits_planifies: number;
  taux_realisation: number;           // %
  score_moyen_global: number;         // 0-100
  nb_nc_majeures_ouvertes: number;
  nb_nc_total: number;
  taux_cloture_ecarts: number;        // %
  zones_sous_seuil: string[];         // zones < 80%
}

function computeKpis(): KpisAudit {
  const realises = AUDITS_DEMO;
  const planifies = PLANNING_2026.filter(p => p.statut === 'PLANIFIE').length;

  const scores = realises.map(a => a.score_global ?? 0);
  const scoreMoyen = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;

  const allEcarts = realises.flatMap(a => a.ecarts);
  const ncMajeuresOuvertes = allEcarts.filter(e => e.niveau === 'MAJEUR' && e.statut !== 'CLOS').length;
  const clos = allEcarts.filter(e => e.statut === 'CLOS').length;
  const tauxCloture = allEcarts.length ? Math.round((clos / allEcarts.length) * 100) : 100;

  // Score moyen par zone
  const scoresByZone: Record<string, number[]> = {};
  for (const a of realises) {
    if (a.score_global !== undefined) {
      (scoresByZone[a.zone] ??= []).push(a.score_global);
    }
  }
  const zonesSousSeuil = Object.entries(scoresByZone)
    .filter(([, s]) => Math.round(s.reduce((a, b) => a + b, 0) / s.length) < 80)
    .map(([zone]) => zone);

  return {
    nb_audits_realises: realises.length,
    nb_audits_planifies: planifies,
    taux_realisation: Math.round((realises.length / (realises.length + planifies)) * 100),
    score_moyen_global: scoreMoyen,
    nb_nc_majeures_ouvertes: ncMajeuresOuvertes,
    nb_nc_total: allEcarts.length,
    taux_cloture_ecarts: tauxCloture,
    zones_sous_seuil: zonesSousSeuil,
  };
}

export const KPIS_AUDIT: KpisAudit = computeKpis();

// ── Évolution score moyen par zone (pour sparkline) ───────────────────────────

export const EVOLUTION_ZONE_A: { semaine: number; score: number }[] = [
  { semaine: 2,  score: aud001.score_global ?? 0 },
  { semaine: 6,  score: aud002.score_global ?? 0 },
  { semaine: 10, score: aud003.score_global ?? 0 },
  { semaine: 13, score: aud004.score_global ?? 0 },
  { semaine: 18, score: aud005.score_global ?? 0 },
];
