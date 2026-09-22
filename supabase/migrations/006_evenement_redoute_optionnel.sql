-- ============================================================
-- Migration 006 — Rend « Événement redouté » optionnel
-- Module Analyse des Risques Industriels
-- Le champ reste en base (données existantes conservées) mais
-- n'est plus obligatoire à la saisie.
-- ============================================================

ALTER TABLE risques_industriels
  ALTER COLUMN evenement_redoute DROP NOT NULL;
