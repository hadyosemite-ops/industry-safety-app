-- ============================================================
-- Migration 005 — Module Analyse des Risques Industriels
-- Phases Installation & Opération · Matrice F×G · Plan d'action ·
-- Réévaluation du risque résiduel (règle ALARP)
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE phase_risque AS ENUM ('INSTALLATION', 'OPERATION');

-- Distinct de l'enum existant `niveau_risque` (3 valeurs, utilisé par
-- zones.niveau_risque_defaut) — la matrice F×G de ce module a 4 niveaux.
CREATE TYPE niveau_criticite AS ENUM ('FAIBLE', 'MODERE', 'ELEVE', 'CRITIQUE');

CREATE TYPE statut_risque AS ENUM ('OUVERT', 'EN_COURS', 'SOUS_SURVEILLANCE', 'CLOTURE');

CREATE TYPE type_mesure_hierarchie AS ENUM (
  'ELIMINATION',
  'SUBSTITUTION',
  'CONTROLE_TECHNIQUE',
  'CONTROLE_ADMINISTRATIF',
  'EPI'
);

CREATE TYPE statut_action_risque AS ENUM ('PLANIFIEE', 'EN_COURS', 'REALISEE', 'VERIFIEE');

CREATE TYPE type_cotation AS ENUM ('INITIALE', 'INTERMEDIAIRE', 'RESIDUELLE');

-- ============================================================
-- FONCTION : classification F×G → niveau de criticité
-- 1-4 Faible · 5-9 Modéré · 10-14 Élevé · 15-25 Critique
-- IMMUTABLE requis pour être utilisée dans une colonne GENERATED.
-- ============================================================

CREATE OR REPLACE FUNCTION niveau_depuis_score(score INTEGER)
RETURNS niveau_criticite AS $$
BEGIN
  IF score IS NULL THEN RETURN NULL; END IF;
  IF score >= 15 THEN RETURN 'CRITIQUE'; END IF;
  IF score >= 10 THEN RETURN 'ELEVE'; END IF;
  IF score >= 5  THEN RETURN 'MODERE'; END IF;
  RETURN 'FAIBLE';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- FONCTION : échéance auto selon le niveau de criticité
-- Critique = immédiat (J+1) · Élevé = 30j · Modéré = 6 mois · Faible = 1 an
-- ============================================================

CREATE OR REPLACE FUNCTION echeance_depuis_niveau(niveau niveau_criticite, depuis TIMESTAMPTZ DEFAULT NOW())
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE niveau
    WHEN 'CRITIQUE' THEN RETURN depuis + INTERVAL '1 day';
    WHEN 'ELEVE'    THEN RETURN depuis + INTERVAL '30 days';
    WHEN 'MODERE'   THEN RETURN depuis + INTERVAL '180 days';
    ELSE                 RETURN depuis + INTERVAL '365 days';
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- SÉQUENCE + FONCTION : génération numéro risque
-- Format : RI-{ANNEE}-{SITE}-{SEQUENCE 4 chiffres} — ex. RI-2026-IND-0031
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS seq_numero_ri START 1;

CREATE OR REPLACE FUNCTION generer_numero_ri(site_code TEXT)
RETURNS TEXT AS $$
DECLARE
  annee TEXT;
  seq   TEXT;
BEGIN
  annee := TO_CHAR(NOW(), 'YYYY');
  seq   := LPAD(nextval('seq_numero_ri')::TEXT, 4, '0');
  RETURN 'RI-' || annee || '-' || UPPER(site_code) || '-' || seq;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE : risques_industriels (registre des risques)
-- ============================================================

CREATE TABLE risques_industriels (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero                TEXT NOT NULL UNIQUE,
  site_id               UUID NOT NULL REFERENCES sites(id),
  zone_id               UUID REFERENCES zones(id),

  -- Identification du risque
  phase                 phase_risque NOT NULL,
  activite              TEXT NOT NULL,
  danger                TEXT NOT NULL,
  situation_dangereuse  TEXT NOT NULL,
  evenement_redoute     TEXT NOT NULL,
  consequence_potentielle TEXT NOT NULL,

  -- Cotation initiale (jamais recotée — sert de référence "avant")
  frequence_initiale    SMALLINT NOT NULL CHECK (frequence_initiale BETWEEN 1 AND 5),
  gravite_initiale      SMALLINT NOT NULL CHECK (gravite_initiale BETWEEN 1 AND 5),
  score_initial         SMALLINT GENERATED ALWAYS AS (frequence_initiale * gravite_initiale) STORED,
  niveau_initial        niveau_criticite GENERATED ALWAYS AS (niveau_depuis_score(frequence_initiale * gravite_initiale)) STORED,

  -- Moyens de protection existants au moment de l'identification
  -- [{ description: string, hierarchie: type_mesure_hierarchie }]
  moyens_protection     JSONB NOT NULL DEFAULT '[]',

  -- Cotation résiduelle (renseignée après vérification de clôture d'action)
  frequence_residuelle  SMALLINT CHECK (frequence_residuelle BETWEEN 1 AND 5),
  gravite_residuelle    SMALLINT CHECK (gravite_residuelle BETWEEN 1 AND 5),
  score_residuel        SMALLINT GENERATED ALWAYS AS (frequence_residuelle * gravite_residuelle) STORED,
  niveau_residuel        niveau_criticite GENERATED ALWAYS AS (niveau_depuis_score(frequence_residuelle * gravite_residuelle)) STORED,

  -- Règle ALARP : résiduel 5-9 accepté seulement avec justification
  justification_alarp   TEXT,

  statut                statut_risque NOT NULL DEFAULT 'OUVERT',
  responsable_id        UUID REFERENCES utilisateurs(id),

  date_identification    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_derniere_cotation TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- RÈGLE ALARP (métier §D) : résiduel 5-9 nécessite une justification
  CONSTRAINT chk_alarp CHECK (
    score_residuel IS NULL OR score_residuel < 5 OR score_residuel > 9
    OR justification_alarp IS NOT NULL
  )
);

-- ============================================================
-- TABLE : cotations_risques
-- Historique immuable des cotations — alimente la timeline "avant/après"
-- ============================================================

CREATE TABLE cotations_risques (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risque_id     UUID NOT NULL REFERENCES risques_industriels(id) ON DELETE CASCADE,
  type          type_cotation NOT NULL,
  frequence     SMALLINT NOT NULL CHECK (frequence BETWEEN 1 AND 5),
  gravite       SMALLINT NOT NULL CHECK (gravite BETWEEN 1 AND 5),
  score         SMALLINT GENERATED ALWAYS AS (frequence * gravite) STORED,
  niveau        niveau_criticite GENERATED ALWAYS AS (niveau_depuis_score(frequence * gravite)) STORED,
  auteur_id     UUID REFERENCES utilisateurs(id),
  commentaire   TEXT,
  date          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immuable : aucun UPDATE ni DELETE (même convention que historique_statuts_at)
CREATE RULE no_update_cotations AS ON UPDATE TO cotations_risques DO INSTEAD NOTHING;
CREATE RULE no_delete_cotations AS ON DELETE TO cotations_risques DO INSTEAD NOTHING;

-- ============================================================
-- TABLE : actions_risques (plan d'action)
-- ============================================================

CREATE TABLE actions_risques (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risque_id           UUID NOT NULL REFERENCES risques_industriels(id) ON DELETE CASCADE,

  description         TEXT NOT NULL,
  type_mesure         type_mesure_hierarchie NOT NULL,
  responsable_id      UUID REFERENCES utilisateurs(id),

  date_creation       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date_echeance       TIMESTAMPTZ NOT NULL,   -- calculée par trigger à l'insertion

  statut              statut_action_risque NOT NULL DEFAULT 'PLANIFIEE',
  date_realisation    TIMESTAMPTZ,
  date_verification   TIMESTAMPTZ,
  verificateur_id     UUID REFERENCES utilisateurs(id),

  -- Preuve de clôture (upload photo/doc) — mêmes conventions que
  -- audits_at.photos / suspensions_at.photos_ecart : tableau de
  -- { url, nom, type } pointant vers le storage Supabase.
  preuve_cloture      JSONB DEFAULT '[]',

  commentaire         TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- 1. updated_at automatique (réutilise la fonction déjà créée en migration 001)
CREATE TRIGGER trg_risques_updated_at
  BEFORE UPDATE ON risques_industriels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_actions_risques_updated_at
  BEFORE UPDATE ON actions_risques
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Génération automatique du numéro de risque
CREATE OR REPLACE FUNCTION trigger_generer_numero_ri()
RETURNS TRIGGER AS $$
DECLARE
  site_code TEXT;
BEGIN
  SELECT code_site INTO site_code FROM sites WHERE id = NEW.site_id;
  NEW.numero := generer_numero_ri(site_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generer_numero_ri
  BEFORE INSERT ON risques_industriels
  FOR EACH ROW
  WHEN (NEW.numero IS NULL OR NEW.numero = '')
  EXECUTE FUNCTION trigger_generer_numero_ri();

-- 3. Cotation INITIALE créée automatiquement à l'identification du risque
CREATE OR REPLACE FUNCTION creer_cotation_initiale()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO cotations_risques (risque_id, type, frequence, gravite, auteur_id, commentaire, date)
  VALUES (NEW.id, 'INITIALE', NEW.frequence_initiale, NEW.gravite_initiale, NEW.responsable_id, 'Cotation initiale', NEW.date_identification);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_creer_cotation_initiale
  AFTER INSERT ON risques_industriels
  FOR EACH ROW EXECUTE FUNCTION creer_cotation_initiale();

-- 4. RÈGLE MÉTIER (§D Réévaluation) — à chaque recotation résiduelle :
--    - horodate date_derniere_cotation
--    - historise la cotation RESIDUELLE
--    - si score résiduel ≥ 10 (Élevé/Critique) : bloque le passage direct
--      en SOUS_SURVEILLANCE/CLOTURE — une nouvelle action est obligatoire
--      (retour au plan d'action), donc le statut est forcé à EN_COURS
CREATE OR REPLACE FUNCTION appliquer_reevaluation_risque()
RETURNS TRIGGER AS $$
DECLARE
  v_score INTEGER;
BEGIN
  IF NEW.frequence_residuelle IS NOT NULL AND NEW.gravite_residuelle IS NOT NULL
     AND (NEW.frequence_residuelle IS DISTINCT FROM OLD.frequence_residuelle
          OR NEW.gravite_residuelle IS DISTINCT FROM OLD.gravite_residuelle) THEN

    v_score := NEW.frequence_residuelle * NEW.gravite_residuelle;
    NEW.date_derniere_cotation := NOW();

    IF v_score >= 10 AND NEW.statut IN ('SOUS_SURVEILLANCE', 'CLOTURE') THEN
      RAISE EXCEPTION 'ACTION_OBLIGATOIRE_RISQUE_RESIDUEL: score résiduel % (Élevé/Critique) — une nouvelle action corrective est obligatoire avant clôture ou mise sous surveillance.', v_score;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_appliquer_reevaluation_risque
  BEFORE UPDATE OF frequence_residuelle, gravite_residuelle, statut ON risques_industriels
  FOR EACH ROW EXECUTE FUNCTION appliquer_reevaluation_risque();

-- Historisation de la cotation résiduelle (AFTER, une fois la ligne validée)
CREATE OR REPLACE FUNCTION historiser_cotation_residuelle()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.frequence_residuelle IS NOT NULL AND NEW.gravite_residuelle IS NOT NULL
     AND (NEW.frequence_residuelle IS DISTINCT FROM OLD.frequence_residuelle
          OR NEW.gravite_residuelle IS DISTINCT FROM OLD.gravite_residuelle) THEN
    INSERT INTO cotations_risques (risque_id, type, frequence, gravite, auteur_id, commentaire, date)
    VALUES (
      NEW.id, 'RESIDUELLE', NEW.frequence_residuelle, NEW.gravite_residuelle,
      NEW.responsable_id,
      COALESCE(NEW.justification_alarp, 'Réévaluation après clôture des actions'),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_historiser_cotation_residuelle
  AFTER UPDATE OF frequence_residuelle, gravite_residuelle ON risques_industriels
  FOR EACH ROW EXECUTE FUNCTION historiser_cotation_residuelle();

-- 5. Échéance automatique d'une action selon le niveau courant du risque
--    (résiduel si déjà coté, sinon initial) au moment de la création
CREATE OR REPLACE FUNCTION calculer_echeance_action()
RETURNS TRIGGER AS $$
DECLARE
  v_niveau niveau_criticite;
BEGIN
  IF NEW.date_echeance IS NULL THEN
    SELECT COALESCE(niveau_residuel, niveau_initial) INTO v_niveau
    FROM risques_industriels WHERE id = NEW.risque_id;

    NEW.date_echeance := echeance_depuis_niveau(COALESCE(v_niveau, 'MODERE'), NEW.date_creation);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculer_echeance_action
  BEFORE INSERT ON actions_risques
  FOR EACH ROW EXECUTE FUNCTION calculer_echeance_action();

-- 6. Horodatage auto des transitions de statut d'action (réalisation / vérification)
CREATE OR REPLACE FUNCTION horodater_statut_action()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.statut = 'REALISEE' AND OLD.statut != 'REALISEE' AND NEW.date_realisation IS NULL THEN
    NEW.date_realisation := NOW();
  END IF;
  IF NEW.statut = 'VERIFIEE' AND OLD.statut != 'VERIFIEE' AND NEW.date_verification IS NULL THEN
    NEW.date_verification := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_horodater_statut_action
  BEFORE UPDATE OF statut ON actions_risques
  FOR EACH ROW EXECUTE FUNCTION horodater_statut_action();

-- ============================================================
-- INDEX DE PERFORMANCE
-- ============================================================

CREATE INDEX idx_ri_site_id     ON risques_industriels(site_id);
CREATE INDEX idx_ri_zone_id     ON risques_industriels(zone_id);
CREATE INDEX idx_ri_phase       ON risques_industriels(phase);
CREATE INDEX idx_ri_statut      ON risques_industriels(statut);
CREATE INDEX idx_ri_niveau_init ON risques_industriels(niveau_initial);
CREATE INDEX idx_ri_niveau_res  ON risques_industriels(niveau_residuel);
CREATE INDEX idx_ri_numero      ON risques_industriels(numero);

CREATE INDEX idx_cotations_risque_id ON cotations_risques(risque_id);
CREATE INDEX idx_cotations_date      ON cotations_risques(date DESC);

CREATE INDEX idx_actions_ri_risque_id ON actions_risques(risque_id);
CREATE INDEX idx_actions_ri_statut    ON actions_risques(statut);
CREATE INDEX idx_actions_ri_echeance  ON actions_risques(date_echeance);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Convention : fonctions SECURITY DEFINER mon_site_id() / je_suis_admin()
-- établies en migration 003 pour éviter la récursion RLS.
-- ============================================================

ALTER TABLE risques_industriels ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotations_risques   ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions_risques     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Risques visibles par site" ON risques_industriels
  FOR SELECT USING (site_id = mon_site_id());

CREATE POLICY "Risques créés par le site" ON risques_industriels
  FOR INSERT WITH CHECK (
    site_id = mon_site_id()
    AND EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id = auth.uid()
        AND roles && ARRAY['HSE_MANAGER','ANIMATEUR_SECURITE','RESP_ZONE','ADMIN']::role_utilisateur[]
    )
  );

CREATE POLICY "Risques modifiés par le site" ON risques_industriels
  FOR UPDATE USING (
    site_id = mon_site_id()
    AND EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id = auth.uid()
        AND roles && ARRAY['HSE_MANAGER','ANIMATEUR_SECURITE','RESP_ZONE','ADMIN']::role_utilisateur[]
    )
  );

CREATE POLICY "Risques supprimés par admin" ON risques_industriels
  FOR DELETE USING (je_suis_admin() AND site_id = mon_site_id());

CREATE POLICY "Cotations visibles si risque visible" ON cotations_risques
  FOR SELECT USING (
    risque_id IN (SELECT id FROM risques_industriels WHERE site_id = mon_site_id())
  );

CREATE POLICY "Cotations créées si risque visible" ON cotations_risques
  FOR INSERT WITH CHECK (
    risque_id IN (SELECT id FROM risques_industriels WHERE site_id = mon_site_id())
  );

CREATE POLICY "Actions visibles si risque visible" ON actions_risques
  FOR ALL USING (
    risque_id IN (SELECT id FROM risques_industriels WHERE site_id = mon_site_id())
  );
