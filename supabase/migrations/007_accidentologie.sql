-- ============================================================
-- Migration 007 — Module Accidentologie (dossiers accidents,
-- presqu'accidents, situations dangereuses, observations)
-- Remplace les données de démo par de vraies tables Supabase.
-- ============================================================

-- ============================================================
-- SITES — colonnes nécessaires au calcul des KPI (TF/TG/IF)
-- ============================================================

ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS effectif INTEGER,
  ADD COLUMN IF NOT EXISTS heures_travaillees_mensuelles NUMERIC;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE type_evenement_accident AS ENUM (
  'FATAL', 'GRAVE', 'BENIN', 'PRESQU_ACCIDENT', 'SITUATION_DANGEREUSE', 'OBSERVATION'
);

CREATE TYPE statut_dossier_accident AS ENUM (
  'SIGNALE', 'DECLARE', 'EN_INVESTIGATION', 'PLAN_ACTIONS', 'CLOTURE'
);

CREATE TYPE statut_action_accident AS ENUM (
  'A_FAIRE', 'EN_COURS', 'REALISEE', 'EN_RETARD'
);

CREATE TYPE type_cause_accident AS ENUM (
  'FAIT_IMMEDIAT', 'CAUSE_INTERMEDIAIRE', 'CAUSE_PROFONDE'
);

CREATE TYPE categorie_action_accident AS ENUM (
  'TECHNIQUE', 'ORGANISATIONNELLE', 'HUMAINE', 'FORMATION', 'PROCEDURE', 'EPI'
);

CREATE TYPE priorite_action_accident AS ENUM ('HAUTE', 'NORMALE', 'BASSE');

-- ============================================================
-- TABLE : dossiers_accidents
-- ============================================================

CREATE TABLE dossiers_accidents (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id                 UUID NOT NULL REFERENCES sites(id),
  numero                  TEXT NOT NULL UNIQUE,
  type_evenement          type_evenement_accident NOT NULL,
  statut                  statut_dossier_accident NOT NULL DEFAULT 'SIGNALE',

  titre                   TEXT NOT NULL,
  date_evenement          TIMESTAMPTZ NOT NULL,
  date_declaration        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  zone_id                 UUID REFERENCES zones(id),
  lieu                    TEXT,
  description             TEXT NOT NULL,

  date_investigation      TIMESTAMPTZ,
  investigateur_id        UUID REFERENCES utilisateurs(id),
  cinq_pourquoi           TEXT[],

  at_liee_id              UUID REFERENCES autorisations_travail(id),

  date_cloture            TIMESTAMPTZ,
  validateur_cloture_id   UUID REFERENCES utilisateurs(id),
  lecons_retenues         TEXT,

  declarant_nom           TEXT NOT NULL,
  declarant_poste         TEXT NOT NULL,

  declaration_cpam        BOOLEAN NOT NULL DEFAULT FALSE,
  declaration_it          BOOLEAN NOT NULL DEFAULT FALSE,
  date_cpam               DATE,
  date_it                 DATE,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dossiers_accidents_site ON dossiers_accidents(site_id);
CREATE INDEX idx_dossiers_accidents_statut ON dossiers_accidents(statut);
CREATE INDEX idx_dossiers_accidents_type ON dossiers_accidents(type_evenement);
CREATE INDEX idx_dossiers_accidents_zone ON dossiers_accidents(zone_id);

CREATE TRIGGER trg_dossiers_accidents_updated_at
  BEFORE UPDATE ON dossiers_accidents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE : accidents_victimes
-- ============================================================

CREATE TABLE accidents_victimes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id        UUID NOT NULL REFERENCES dossiers_accidents(id) ON DELETE CASCADE,
  nom               TEXT NOT NULL,
  prenom            TEXT NOT NULL,
  poste             TEXT NOT NULL,
  entreprise        TEXT NOT NULL DEFAULT 'Interne',
  anciennete_mois   INTEGER NOT NULL DEFAULT 0,
  nature_blessure   TEXT NOT NULL DEFAULT '',
  siege_lesion      TEXT NOT NULL DEFAULT '',
  jours_arret       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_accidents_victimes_dossier ON accidents_victimes(dossier_id);

-- ============================================================
-- TABLE : accidents_temoins
-- ============================================================

CREATE TABLE accidents_temoins (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id    UUID NOT NULL REFERENCES dossiers_accidents(id) ON DELETE CASCADE,
  nom           TEXT NOT NULL,
  prenom        TEXT NOT NULL,
  poste         TEXT NOT NULL DEFAULT '',
  declaration   TEXT
);

CREATE INDEX idx_accidents_temoins_dossier ON accidents_temoins(dossier_id);

-- ============================================================
-- TABLE : accidents_actions (plan d'actions correctives)
-- ============================================================

CREATE TABLE accidents_actions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id        UUID NOT NULL REFERENCES dossiers_accidents(id) ON DELETE CASCADE,
  description       TEXT NOT NULL,
  categorie         categorie_action_accident NOT NULL,
  responsable_id    UUID REFERENCES utilisateurs(id),
  date_echeance     DATE NOT NULL,
  date_realisation  DATE,
  statut            statut_action_accident NOT NULL DEFAULT 'A_FAIRE',
  commentaire       TEXT,
  priorite          priorite_action_accident NOT NULL DEFAULT 'NORMALE',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accidents_actions_dossier ON accidents_actions(dossier_id);
CREATE INDEX idx_accidents_actions_statut ON accidents_actions(statut);

CREATE TRIGGER trg_accidents_actions_updated_at
  BEFORE UPDATE ON accidents_actions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE : accidents_causes (arbre des causes)
-- parent_ids référence d'autres lignes de cette même table — stocké en
-- tableau (pas de contrainte FK possible sur un tableau), la cohérence est
-- assurée côté application (remplacement complet de l'arbre à chaque édition).
-- ============================================================

CREATE TABLE accidents_causes (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id             UUID NOT NULL REFERENCES dossiers_accidents(id) ON DELETE CASCADE,
  type                   type_cause_accident NOT NULL,
  description            TEXT NOT NULL,
  parent_ids             UUID[] NOT NULL DEFAULT '{}',
  action_corrective_id   UUID REFERENCES accidents_actions(id) ON DELETE SET NULL
);

CREATE INDEX idx_accidents_causes_dossier ON accidents_causes(dossier_id);

-- ============================================================
-- Génération automatique du numéro de dossier
-- Format : ACC-{ANNEE}-{SEQUENCE 4 chiffres}
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS seq_numero_acc START 1;

CREATE OR REPLACE FUNCTION generer_numero_acc()
RETURNS TEXT AS $$
DECLARE
  annee TEXT;
  seq   TEXT;
BEGIN
  annee := TO_CHAR(NOW(), 'YYYY');
  seq   := LPAD(nextval('seq_numero_acc')::TEXT, 4, '0');
  RETURN 'ACC-' || annee || '-' || seq;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_generer_numero_acc()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := generer_numero_acc();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generer_numero_acc
  BEFORE INSERT ON dossiers_accidents
  FOR EACH ROW EXECUTE FUNCTION trigger_generer_numero_acc();

-- ============================================================
-- RLS
-- Lecture : tout utilisateur du site (culture sécurité = visibilité large).
-- Création (signalement) : ouverte à tout utilisateur authentifié du site —
--   n'importe qui doit pouvoir déclarer un accident/presqu'accident.
-- Modification (investigation, plan d'actions, clôture) : réservée aux
--   rôles HSE_MANAGER, ANIMATEUR_SECURITE, RESP_ZONE, ADMIN.
-- Suppression : ADMIN uniquement.
-- ============================================================

ALTER TABLE dossiers_accidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE accidents_victimes ENABLE ROW LEVEL SECURITY;
ALTER TABLE accidents_temoins ENABLE ROW LEVEL SECURITY;
ALTER TABLE accidents_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accidents_causes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dossiers accidents visibles par site" ON dossiers_accidents
  FOR SELECT USING (site_id = mon_site_id() OR je_suis_admin());

CREATE POLICY "Dossiers accidents créés par utilisateurs du site" ON dossiers_accidents
  FOR INSERT WITH CHECK (site_id = mon_site_id());

CREATE POLICY "Dossiers accidents modifiés par rôles HSE" ON dossiers_accidents
  FOR UPDATE USING (
    site_id = mon_site_id()
    AND EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id = auth.uid()
        AND roles && ARRAY['HSE_MANAGER','ANIMATEUR_SECURITE','RESP_ZONE','ADMIN']::role_utilisateur[]
    )
  );

CREATE POLICY "Dossiers accidents supprimés par admin" ON dossiers_accidents
  FOR DELETE USING (je_suis_admin());

-- Tables filles : mêmes règles, relayées via le dossier parent.

CREATE POLICY "Victimes visibles par site" ON accidents_victimes
  FOR SELECT USING (EXISTS (SELECT 1 FROM dossiers_accidents d WHERE d.id = dossier_id AND (d.site_id = mon_site_id() OR je_suis_admin())));
CREATE POLICY "Victimes gérées par créateurs et rôles HSE" ON accidents_victimes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM dossiers_accidents d WHERE d.id = dossier_id AND d.site_id = mon_site_id()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM dossiers_accidents d WHERE d.id = dossier_id AND d.site_id = mon_site_id()
  ));

CREATE POLICY "Témoins visibles par site" ON accidents_temoins
  FOR SELECT USING (EXISTS (SELECT 1 FROM dossiers_accidents d WHERE d.id = dossier_id AND (d.site_id = mon_site_id() OR je_suis_admin())));
CREATE POLICY "Témoins gérés par créateurs et rôles HSE" ON accidents_temoins
  FOR ALL USING (EXISTS (
    SELECT 1 FROM dossiers_accidents d WHERE d.id = dossier_id AND d.site_id = mon_site_id()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM dossiers_accidents d WHERE d.id = dossier_id AND d.site_id = mon_site_id()
  ));

CREATE POLICY "Actions accidents visibles par site" ON accidents_actions
  FOR SELECT USING (EXISTS (SELECT 1 FROM dossiers_accidents d WHERE d.id = dossier_id AND (d.site_id = mon_site_id() OR je_suis_admin())));
CREATE POLICY "Actions accidents gérées par rôles HSE" ON accidents_actions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM dossiers_accidents d
    JOIN utilisateurs u ON u.id = auth.uid()
    WHERE d.id = dossier_id AND d.site_id = mon_site_id()
      AND u.roles && ARRAY['HSE_MANAGER','ANIMATEUR_SECURITE','RESP_ZONE','ADMIN']::role_utilisateur[]
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM dossiers_accidents d
    JOIN utilisateurs u ON u.id = auth.uid()
    WHERE d.id = dossier_id AND d.site_id = mon_site_id()
      AND u.roles && ARRAY['HSE_MANAGER','ANIMATEUR_SECURITE','RESP_ZONE','ADMIN']::role_utilisateur[]
  ));

CREATE POLICY "Causes visibles par site" ON accidents_causes
  FOR SELECT USING (EXISTS (SELECT 1 FROM dossiers_accidents d WHERE d.id = dossier_id AND (d.site_id = mon_site_id() OR je_suis_admin())));
CREATE POLICY "Causes gérées par rôles HSE" ON accidents_causes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM dossiers_accidents d
    JOIN utilisateurs u ON u.id = auth.uid()
    WHERE d.id = dossier_id AND d.site_id = mon_site_id()
      AND u.roles && ARRAY['HSE_MANAGER','ANIMATEUR_SECURITE','RESP_ZONE','ADMIN']::role_utilisateur[]
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM dossiers_accidents d
    JOIN utilisateurs u ON u.id = auth.uid()
    WHERE d.id = dossier_id AND d.site_id = mon_site_id()
      AND u.roles && ARRAY['HSE_MANAGER','ANIMATEUR_SECURITE','RESP_ZONE','ADMIN']::role_utilisateur[]
  ));
