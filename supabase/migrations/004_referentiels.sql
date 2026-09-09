-- ============================================================
-- Migration 004 — Référentiels (rubrique "Base de données")
-- Ajoute : annuaire des intervenants/entreprises externes réutilisable
-- + policies d'écriture manquantes sur sites et zones (jusqu'ici
-- gérables uniquement via SQL direct).
-- ============================================================

-- ============================================================
-- TABLE : intervenants_externes
-- Annuaire réutilisable de personnes/entreprises externes, à
-- sélectionner lors de la création d'une AT au lieu de retaper les
-- informations à chaque fois.
-- ============================================================

CREATE TABLE intervenants_externes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id       UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  nom_complet   TEXT NOT NULL,
  entreprise    TEXT,
  habilitations TEXT[],
  telephone     TEXT,
  email         TEXT,
  actif         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interv_ext_site ON intervenants_externes(site_id);

CREATE TRIGGER trg_interv_ext_updated_at
  BEFORE UPDATE ON intervenants_externes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE intervenants_externes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Intervenants visibles par site" ON intervenants_externes
  FOR SELECT USING (site_id = mon_site_id());

CREATE POLICY "Intervenants créés par créateurs AT et admins" ON intervenants_externes
  FOR INSERT WITH CHECK (
    site_id = mon_site_id()
    AND EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id = auth.uid()
        AND roles && ARRAY['DEMANDEUR','HSE_MANAGER','ADMIN']::role_utilisateur[]
    )
  );

CREATE POLICY "Intervenants modifiés par créateurs AT et admins" ON intervenants_externes
  FOR UPDATE USING (
    site_id = mon_site_id()
    AND EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id = auth.uid()
        AND roles && ARRAY['DEMANDEUR','HSE_MANAGER','ADMIN']::role_utilisateur[]
    )
  );

CREATE POLICY "Intervenants supprimés par admin" ON intervenants_externes
  FOR DELETE USING (je_suis_admin() AND site_id = mon_site_id());

-- ============================================================
-- ZONES — policies d'écriture manquantes
-- (seule une policy SELECT existait depuis la migration 002)
-- ============================================================

CREATE POLICY "Zones créées par admin et HSE manager" ON zones
  FOR INSERT WITH CHECK (
    site_id = mon_site_id()
    AND EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id = auth.uid() AND roles && ARRAY['ADMIN','HSE_MANAGER']::role_utilisateur[]
    )
  );

CREATE POLICY "Zones modifiées par admin et HSE manager" ON zones
  FOR UPDATE USING (
    site_id = mon_site_id()
    AND EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id = auth.uid() AND roles && ARRAY['ADMIN','HSE_MANAGER']::role_utilisateur[]
    )
  );

CREATE POLICY "Zones supprimées par admin" ON zones
  FOR DELETE USING (je_suis_admin() AND site_id = mon_site_id());

-- ============================================================
-- SITES — policies d'écriture manquantes (ADMIN uniquement)
-- (seule une policy SELECT existait depuis la migration 002)
-- ============================================================

CREATE POLICY "Sites créés par admin" ON sites
  FOR INSERT WITH CHECK (je_suis_admin());

CREATE POLICY "Sites modifiés par admin de ce site" ON sites
  FOR UPDATE USING (je_suis_admin() AND id = mon_site_id());

-- Note : "utilisateurs" a déjà sa policy de gestion complète
-- ("Admin gère les utilisateurs de son site", migration 003) —
-- rien à ajouter ici pour la rubrique Utilisateurs.
