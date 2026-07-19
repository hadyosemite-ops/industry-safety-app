// ─────────────────────────────────────────────────────────────────────────────
// Checklist standard Audit HSE Terrain
// Benchmark : ISO 45001:2018 + MASE 2022 + Code du travail France
// ~70 items répartis en 9 sections
// ─────────────────────────────────────────────────────────────────────────────

import type { ChecklistItem } from '../types';

export const CHECKLIST_STANDARD: ChecklistItem[] = [

  // ── §1 — EPI & Équipements de protection ─────────────────────────────────
  { id: 'EPI-01', section: 'EPI', ponderation: 3, reglementaire: true,
    question: 'Tous les opérateurs présents portent les EPI obligatoires définis pour le poste (casque, chaussures, lunettes…).' },
  { id: 'EPI-02', section: 'EPI', ponderation: 3, reglementaire: true,
    question: 'Les EPI sont en bon état (pas de détérioration visible, pas de dépassement de date de péremption).' },
  { id: 'EPI-03', section: 'EPI', ponderation: 2, reglementaire: true,
    question: 'Les EPI sont conformes aux normes CE applicables (marquage visible).' },
  { id: 'EPI-04', section: 'EPI', ponderation: 2, reglementaire: false,
    question: 'Un stock suffisant d\'EPI de remplacement est disponible à proximité du poste.' },
  { id: 'EPI-05', section: 'EPI', ponderation: 1, reglementaire: false,
    question: 'Les EPI spécifiques aux risques chimiques (gants NBR, lunettes étanches, tablier) sont disponibles.' },
  { id: 'EPI-06', section: 'EPI', ponderation: 2, reglementaire: false,
    question: 'Les consignes de port des EPI sont affichées et visibles aux accès du poste.' },
  { id: 'EPI-07', section: 'EPI', ponderation: 1, reglementaire: false,
    question: 'Les protections auditives (bouchons/casque antibruit) sont disponibles dans les zones > 80 dB.' },

  // ── §2 — Ordre & propreté (5S) ────────────────────────────────────────────
  { id: 'OPR-01', section: 'ORDRE_PROPRETE', ponderation: 2, reglementaire: false,
    question: 'Les allées de circulation et accès aux équipements de secours sont dégagées (largeur ≥ 80 cm).' },
  { id: 'OPR-02', section: 'ORDRE_PROPRETE', ponderation: 2, reglementaire: false,
    question: 'Les déchets sont triés et placés dans les contenants appropriés, sans débordement.' },
  { id: 'OPR-03', section: 'ORDRE_PROPRETE', ponderation: 2, reglementaire: false,
    question: 'Les sols sont secs et exempts de déversements (huile, eau, produits chimiques).' },
  { id: 'OPR-04', section: 'ORDRE_PROPRETE', ponderation: 1, reglementaire: false,
    question: 'Les outils et équipements sont rangés à leurs emplacements désignés après utilisation.' },
  { id: 'OPR-05', section: 'ORDRE_PROPRETE', ponderation: 1, reglementaire: false,
    question: 'Les zones de stockage respectent les quantités maximales autorisées et la séparation des produits incompatibles.' },
  { id: 'OPR-06', section: 'ORDRE_PROPRETE', ponderation: 2, reglementaire: false,
    question: 'Le marquage au sol (zones de circulation, emplacements machines, zones interdites) est visible et en bon état.' },

  // ── §3 — Travaux en hauteur ───────────────────────────────────────────────
  { id: 'TAH-01', section: 'TRAVAIL_HAUTEUR', ponderation: 3, reglementaire: true,
    question: 'Tout travail en hauteur > 2m fait l\'objet d\'une protection collective (garde-corps, filet, PIRL) ou d\'un harnais anti-chute.' },
  { id: 'TAH-02', section: 'TRAVAIL_HAUTEUR', ponderation: 3, reglementaire: true,
    question: 'Les harnais de sécurité utilisés sont contrôlés périodiquement (fiche de contrôle à jour, date d\'inspection < 12 mois).' },
  { id: 'TAH-03', section: 'TRAVAIL_HAUTEUR', ponderation: 3, reglementaire: true,
    question: 'Les échelles d\'accès sont fixées, en bon état, dépassent de 1m au-delà du débouché, angle 75°.' },
  { id: 'TAH-04', section: 'TRAVAIL_HAUTEUR', ponderation: 2, reglementaire: true,
    question: 'Les nacelles et PEMP sont utilisées par du personnel habilité CACES R486 (registre à jour).' },
  { id: 'TAH-05', section: 'TRAVAIL_HAUTEUR', ponderation: 2, reglementaire: false,
    question: 'Un périmètre de sécurité au sol est matérialisé sous la zone de travail en hauteur.' },
  { id: 'TAH-06', section: 'TRAVAIL_HAUTEUR', ponderation: 1, reglementaire: false,
    question: 'Un plan de prévention est en place pour les entreprises extérieures intervenant en hauteur.' },

  // ── §4 — Risques chimiques ────────────────────────────────────────────────
  { id: 'RCH-01', section: 'RISQUES_CHIMIQUES', ponderation: 3, reglementaire: true,
    question: 'Tous les contenants de produits chimiques sont étiquetés (pictogrammes SGH, mentions de danger).' },
  { id: 'RCH-02', section: 'RISQUES_CHIMIQUES', ponderation: 3, reglementaire: true,
    question: 'Les Fiches de Données de Sécurité (FDS) des produits utilisés sont accessibles sur le poste.' },
  { id: 'RCH-03', section: 'RISQUES_CHIMIQUES', ponderation: 2, reglementaire: true,
    question: 'Les produits CMR (Cancérogènes, Mutagènes, Reprotoxiques) sont stockés séparément, accès restreint.', sous_type: 'CMR' },
  { id: 'RCH-04', section: 'RISQUES_CHIMIQUES', ponderation: 3, reglementaire: true,
    question: 'Les zones ATEX sont identifiées et classifiées. Les équipements présents sont certifiés ATEX correspondant.', sous_type: 'ATEX' },
  { id: 'RCH-05', section: 'RISQUES_CHIMIQUES', ponderation: 2, reglementaire: true,
    question: 'Les rétentions de produits chimiques sont fonctionnelles et de capacité suffisante (110% du plus grand contenant).' },
  { id: 'RCH-06', section: 'RISQUES_CHIMIQUES', ponderation: 2, reglementaire: false,
    question: 'Les produits incompatibles (oxydants/réducteurs, acides/bases) sont stockés dans des armoires séparées.' },
  { id: 'RCH-07', section: 'RISQUES_CHIMIQUES', ponderation: 1, reglementaire: false,
    question: 'Des douches et fontaines rince-œil sont disponibles et contrôlées dans les zones chimiques.' },

  // ── §5 — Électricité & consignation (LOTO) ───────────────────────────────
  { id: 'ELC-01', section: 'ELECTRICITE', ponderation: 3, reglementaire: true,
    question: 'Les habilitations électriques du personnel intervenant sur des installations électriques sont valides et en cours.' },
  { id: 'ELC-02', section: 'ELECTRICITE', ponderation: 3, reglementaire: true,
    question: 'La procédure de consignation LOTO (Lockout/Tagout) est appliquée avant toute intervention sur équipement sous énergie.' },
  { id: 'ELC-03', section: 'ELECTRICITE', ponderation: 3, reglementaire: true,
    question: 'Les armoires électriques sont fermées à clé, accessibles uniquement aux personnes habilitées.' },
  { id: 'ELC-04', section: 'ELECTRICITE', ponderation: 2, reglementaire: true,
    question: 'Les câbles et rallonges électriques ne présentent pas de détérioration visible (usure, coupure, contact sol humide).' },
  { id: 'ELC-05', section: 'ELECTRICITE', ponderation: 2, reglementaire: true,
    question: 'Le contrôle périodique des installations électriques (CONSUEL / organisme agréé) est à jour.' },
  { id: 'ELC-06', section: 'ELECTRICITE', ponderation: 1, reglementaire: false,
    question: 'Les équipements de protection électrique (gants isolants, VAT) sont présents et vérifiés.' },

  // ── §6 — Incendie & explosion ─────────────────────────────────────────────
  { id: 'INC-01', section: 'INCENDIE', ponderation: 3, reglementaire: true,
    question: 'Les extincteurs sont en place, accessibles, contrôlés annuellement (étiquette à jour < 12 mois).' },
  { id: 'INC-02', section: 'INCENDIE', ponderation: 3, reglementaire: true,
    question: 'Les issues de secours sont déverrouillées, dégagées, signalisées, avec éclairage de sécurité fonctionnel.' },
  { id: 'INC-03', section: 'INCENDIE', ponderation: 3, reglementaire: true,
    question: 'Le plan d\'évacuation est affiché et lisible. Les points de rassemblement sont identifiés.' },
  { id: 'INC-04', section: 'INCENDIE', ponderation: 2, reglementaire: true,
    question: 'Les déclencheurs manuels d\'alarme incendie sont accessibles et testés périodiquement.' },
  { id: 'INC-05', section: 'INCENDIE', ponderation: 2, reglementaire: false,
    question: 'Les sprinklers / têtes de détection ne sont pas obstrués (distance ≥ 50 cm avec objets).' },
  { id: 'INC-06', section: 'INCENDIE', ponderation: 2, reglementaire: false,
    question: 'Les travaux par points chauds (soudure, meulage) font l\'objet d\'un permis feu signé.' },
  { id: 'INC-07', section: 'INCENDIE', ponderation: 1, reglementaire: false,
    question: 'Les matières combustibles sont éloignées des sources de chaleur (distance ≥ 1m).' },

  // ── §7 — Manutention & engins ─────────────────────────────────────────────
  { id: 'MAN-01', section: 'MANUTENTION', ponderation: 3, reglementaire: true,
    question: 'Les caristes et conducteurs d\'engins disposent d\'un CACES valide et d\'une autorisation interne de conduite.', sous_type: 'LEVAGE' },
  { id: 'MAN-02', section: 'MANUTENTION', ponderation: 3, reglementaire: true,
    question: 'Les chariots élévateurs et engins sont vérifiés annuellement par un organisme agréé (VGP à jour).', sous_type: 'LEVAGE' },
  { id: 'MAN-03', section: 'MANUTENTION', ponderation: 2, reglementaire: true,
    question: 'Les allées de circulation engins/piétons sont séparées ou la signalisation est claire (priorité, vitesse, sens).' },
  { id: 'MAN-04', section: 'MANUTENTION', ponderation: 2, reglementaire: false,
    question: 'Les charges soulevées ne dépassent pas la charge nominale des engins (plaque de charge visible et lisible).' },
  { id: 'MAN-05', section: 'MANUTENTION', ponderation: 2, reglementaire: true,
    question: 'Les élingues, sangles, crochets de levage sont contrôlés et taggés (couleur de l\'année en cours).', sous_type: 'LEVAGE' },
  { id: 'MAN-06', section: 'MANUTENTION', ponderation: 1, reglementaire: false,
    question: 'Les chariots sont rechargés / garés dans les zones dédiées, hors des allées de passage.' },

  // ── §8 — Permis de travail (PTW) ──────────────────────────────────────────
  { id: 'PTW-01', section: 'PTW', ponderation: 3, reglementaire: true,
    question: 'Toute intervention nécessitant un permis de travail (AT) dispose d\'une AT approuvée et affichée sur le terrain.' },
  { id: 'PTW-02', section: 'PTW', ponderation: 3, reglementaire: true,
    question: 'Les isolements et consignations requis par l\'AT sont effectifs et vérifiés avant toute intervention.' },
  { id: 'PTW-03', section: 'PTW', ponderation: 2, reglementaire: true,
    question: 'Les intervenants sous AT connaissent les risques liés à leur intervention et les mesures de prévention.' },
  { id: 'PTW-04', section: 'PTW', ponderation: 2, reglementaire: false,
    question: 'La liste des intervenants sur l\'AT est à jour (check-in réalisé). Pas d\'intervenant non déclaré.' },
  { id: 'PTW-05', section: 'PTW', ponderation: 2, reglementaire: false,
    question: 'Les zones d\'intervention sont balisées, accès restreint aux personnes autorisées.' },
  { id: 'PTW-06', section: 'PTW', ponderation: 1, reglementaire: false,
    question: 'Les déchets générés par les travaux AT sont gérés conformément aux exigences environnementales.' },

  // ── §9 — Secours & urgences ───────────────────────────────────────────────
  { id: 'SEC-01', section: 'SECOURS', ponderation: 3, reglementaire: true,
    question: 'Les trousses de premiers secours sont présentes, complètes, non périmées et accessibles.' },
  { id: 'SEC-02', section: 'SECOURS', ponderation: 3, reglementaire: true,
    question: 'Au moins un Sauveteur Secouriste du Travail (SST) est présent par équipe (formation < 24 mois).' },
  { id: 'SEC-03', section: 'SECOURS', ponderation: 3, reglementaire: true,
    question: 'Les numéros d\'urgence (SAMU 15, Pompiers 18, RH, HSE) sont affichés aux postes de travail.' },
  { id: 'SEC-04', section: 'SECOURS', ponderation: 2, reglementaire: true,
    question: 'Les défibrillateurs automatiques (DAE) sont accessibles, contrôlés et signalés.' },
  { id: 'SEC-05', section: 'SECOURS', ponderation: 2, reglementaire: false,
    question: 'Les exercices d\'évacuation ont été réalisés dans l\'année (registre de sécurité à jour).' },
  { id: 'SEC-06', section: 'SECOURS', ponderation: 1, reglementaire: false,
    question: 'Les consignes spécifiques aux risques chimiques (neutralisation, rinçage) sont affichées en zone chimique.' },
];

// Utilitaire : items par section
export function getItemsBySection(section: import('../types').SectionId): ChecklistItem[] {
  return CHECKLIST_STANDARD.filter(i => i.section === section);
}

// Utilitaire : toutes les sections dans l'ordre
export const SECTIONS_ORDRE: import('../types').SectionId[] = [
  'EPI', 'ORDRE_PROPRETE', 'TRAVAIL_HAUTEUR', 'RISQUES_CHIMIQUES',
  'ELECTRICITE', 'INCENDIE', 'MANUTENTION', 'PTW', 'SECOURS',
];
