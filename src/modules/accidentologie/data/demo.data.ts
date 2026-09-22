// ─────────────────────────────────────────────────────────────────────────────
// Module Accidentologie — Données de référence statiques
// (Les dossiers et KPI viennent désormais de Supabase — voir services/.
// Seule la tendance historique du graphique TF reste illustrative en
// attendant un historique mensuel réel côté base.)
// ─────────────────────────────────────────────────────────────────────────────

// Données historiques pour graphiques (12 derniers mois)
export const HISTORIQUE_TF = [
  { mois: 'Juin 25',  tf: 6.1 },
  { mois: 'Juil 25', tf: 5.8 },
  { mois: 'Août 25', tf: 5.4 },
  { mois: 'Sep 25',  tf: 4.9 },
  { mois: 'Oct 25',  tf: 5.2 },
  { mois: 'Nov 25',  tf: 4.7 },
  { mois: 'Déc 25',  tf: 3.9 },
  { mois: 'Jan 26',  tf: 4.5 },
  { mois: 'Fév 26',  tf: 3.8 },
  { mois: 'Mar 26',  tf: 4.1 },
  { mois: 'Avr 26',  tf: 3.7 },
  { mois: 'Mai 26',  tf: 4.2 },
];

export const OBJECTIF_TF = 3.0;
export const OBJECTIF_TG = 0.30;
