-- ============================================================
-- Migration 001 — Module PTW : Permit to Work
-- Industry Safety App
-- ============================================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE statut_at AS ENUM (
  'BROUILLON',
  'SOUMISE',
  'VALIDEE',      -- Tous permis validés par l'Animateur
  'APPROUVEE',    -- GO du Resp. Zone (dernier mot)
  'ACTIVE',       -- Travaux en cours
  'SUSPENDUE',    -- Suspendue par l'Animateur (cascade sur permis)
  'CLOTUREE'
);

CREATE TYPE statut_permis AS ENUM (
  'EN_ATTENTE',
  'VALIDE',
  'SUSPENDU',     -- Cascade depuis suspension AT uniquement
  'CLOS',
  'REJETE'
);

CREATE TYPE type_permis AS ENUM (
  'TRAVAIL_CHAUD',
  'ESPACE_CONFINE',
  'ELECTRIQUE_LOTO',
  'TRAVAIL_HAUTEUR',
  'ATEX_CHIMIQUE',
  'EXCAVATION',
  'TRAVAUX_PRESSION',
  'TRAVAUX_GENERAUX'
);

CREATE TYPE role_utilisateur AS ENUM (
  'DEMANDEUR',
  'ANIMATEUR_SECURITE',
  'RESP_ZONE',
  'HSE_MANAGER',
  'EXECUTANT',
  'ADMIN'
);

CREATE TYPE niveau_risque AS ENUM ('MODERE', 'ELEVE', 'CRITIQUE');

CREATE TYPE type_audit AS ENUM ('PROGRAMME', 'INOPINE', 'LEVEE_SUSPENSION');

CREATE TYPE resultat_audit AS ENUM ('CONFORME', 'NON_CONFORME', 'CONFORME_RESERVES');

CREATE TYPE type_ecart AS ENUM (
  'EPI_MANQUANT',
  'ZONE_NON_SECURISEE',
  'INTERVENANT_NON_HABILITE',
  'CONDITION_METEO',
  'DEFAUT_ISOLATION',
  'ECART_PROCEDURE',
  'RISQUE_TIERS',
  'AUTRE'
);

-- ============================================================
-- TABLE : sites
-- ============================================================

CREATE TABLE sites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom         TEXT NOT NULL,
  adresse     TEXT NOT NULL,
  code_site   TEXT NOT NULL UNIQUE,
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE : utilisateurs
-- Étend auth.users de Supabase
-- ============================================================

CREATE TABLE utilisateurs (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  nom             TEXT NOT NULL,
  prenom          TEXT NOT NULL,
  roles           role_utilisateur[] NOT NULL DEFAULT '{}',
  site_id         UUID NOT NULL REFERENCES sites(id),
  habilitations   TEXT[],
  telephone       TEXT,
  actif           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE : zones
-- ============================================================

CREATE TABLE zones (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id               UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  nom                   TEXT NOT NULL,
  code_zone             TEXT NOT NULL,
  description           TEXT,
  niveau_risque_defaut  niveau_risque NOT NULL DEFAULT 'MODERE',
  responsable_id        UUID REFERENCES utilisateurs(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(site_id, code_zone)
);

-- ============================================================
-- FONCTION : Génération automatique du numéro AT
-- Format : AT-{ANNEE}-{SITE}-{SEQUENCE 4 chiffres}
-- Ex: AT-2026-IND-0042
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS seq_numero_at START 1;

CREATE OR REPLACE FUNCTION generer_numero_at(site_code TEXT)
RETURNS TEXT AS $$
DECLARE
  annee TEXT;
  seq   TEXT;
BEGIN
  annee := TO_CHAR(NOW(), 'YYYY');
  seq   := LPAD(nextval('seq_numero_at')::TEXT, 4, '0');
  RETURN 'AT-' || annee || '-' || UPPER(site_code) || '-' || seq;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE : autorisations_travail (AT)
-- Document chapeau — contient N permis
-- ============================================================

CREATE TABLE autorisations_travail (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_at                 TEXT NOT NULL UNIQUE,
  site_id                   UUID NOT NULL REFERENCES sites(id),
  zone_id                   UUID NOT NULL REFERENCES zones(id),
  demandeur_id              UUID NOT NULL REFERENCES utilisateurs(id),
  animateur_id              UUID REFERENCES utilisateurs(id),
  approbateur_id            UUID REFERENCES utilisateurs(id),

  -- Description
  titre                     TEXT NOT NULL,
  description_travaux       TEXT NOT NULL,
  entreprise_intervenante   TEXT NOT NULL,
  chef_chantier             TEXT NOT NULL,
  nombre_intervenants_prevu INTEGER NOT NULL DEFAULT 1,

  -- Temporalité
  date_debut_prevue         TIMESTAMPTZ NOT NULL,
  date_fin_prevue           TIMESTAMPTZ NOT NULL,
  date_debut_effective      TIMESTAMPTZ,
  date_fin_effective        TIMESTAMPTZ,

  -- Évaluation risques (JSON structuré)
  evaluation_risques        JSONB NOT NULL DEFAULT '{}',

  -- Workflow
  statut                    statut_at NOT NULL DEFAULT 'BROUILLON',
  statut_precedent          statut_at,  -- Conservé pour restauration après levée suspension

  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT chk_dates CHECK (date_fin_prevue > date_debut_prevue),
  CONSTRAINT chk_intervenants CHECK (nombre_intervenants_prevu > 0)
);

-- ============================================================
-- TABLE : permis
-- Lié à une AT — 1 AT → N Permis
-- ============================================================

CREATE TABLE permis (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  at_id                    UUID NOT NULL REFERENCES autorisations_travail(id) ON DELETE CASCADE,
  type_permis              type_permis NOT NULL,
  statut                   statut_permis NOT NULL DEFAULT 'EN_ATTENTE',
  statut_avant_suspension  statut_permis,  -- Sauvegardé lors de la suspension AT

  -- Contenu
  checklist_reponses       JSONB NOT NULL DEFAULT '[]',
  mesures_prevention       TEXT[] NOT NULL DEFAULT '{}',
  epi_requis               TEXT[] NOT NULL DEFAULT '{}',
  equipements_concernes    TEXT[],
  intervenants             JSONB NOT NULL DEFAULT '[]',

  -- Validation terrain (Animateur de Sécurité)
  valide_par               UUID REFERENCES utilisateurs(id),
  valide_le                TIMESTAMPTZ,
  commentaire_validation   TEXT,

  -- Rejet
  rejete_par               UUID REFERENCES utilisateurs(id),
  rejete_le                TIMESTAMPTZ,
  motif_rejet              TEXT,

  -- QR Code unique pour accès terrain
  qr_code_token            TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE : audits_at
-- Entité séparée — traçabilité propre
-- Créé par l'Animateur de Sécurité
-- ============================================================

CREATE TABLE audits_at (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  at_id             UUID NOT NULL REFERENCES autorisations_travail(id) ON DELETE CASCADE,
  auditeur_id       UUID NOT NULL REFERENCES utilisateurs(id),

  type_audit        type_audit NOT NULL,
  date_audit        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Checklist et constats
  checklist_audit   JSONB NOT NULL DEFAULT '[]',
  ecarts_constates  TEXT,
  points_positifs   TEXT,
  photos            JSONB DEFAULT '[]',

  -- Résultat
  resultat          resultat_audit NOT NULL,
  recommandations   TEXT,

  -- Signature et géolocalisation
  signature_base64  TEXT,
  localisation_gps  JSONB,          -- { lat: number, lng: number }

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE : suspensions_at
-- Exclusivement par l'Animateur de Sécurité
--
-- RÈGLE MÉTIER #1 :
--   - Seule l'AT est suspendue (jamais un permis individuel)
--   - Le trigger cascade_suspension_at gère les permis fils
--   - La levée nécessite un audit de type LEVEE_SUSPENSION
-- ============================================================

CREATE TABLE suspensions_at (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  at_id                 UUID NOT NULL REFERENCES autorisations_travail(id) ON DELETE CASCADE,
  animateur_id          UUID NOT NULL REFERENCES utilisateurs(id),

  -- Motif
  motif_suspension      TEXT NOT NULL,
  type_ecart            type_ecart NOT NULL,
  description_ecart     TEXT NOT NULL,
  photos_ecart          JSONB DEFAULT '[]',

  -- Mesures correctives
  mesures_correctives   TEXT NOT NULL,
  delai_correction      TIMESTAMPTZ,

  -- Levée de suspension
  audit_levee_id        UUID REFERENCES audits_at(id),   -- Audit de type LEVEE_SUSPENSION obligatoire
  levee_par             UUID REFERENCES utilisateurs(id),
  date_levee            TIMESTAMPTZ,
  commentaire_levee     TEXT,

  -- Horodatage
  date_suspension       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contrainte : une seule suspension ouverte par AT
  CONSTRAINT chk_une_suspension_ouverte UNIQUE NULLS NOT DISTINCT (at_id, date_levee)
  -- Note: Cette contrainte empêche d'avoir 2 suspensions ouvertes simultanées
);

-- ============================================================
-- TABLE : historique_statuts_at
-- Audit trail immuable — jamais modifié, jamais supprimé
-- ============================================================

CREATE TABLE historique_statuts_at (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  at_id        UUID NOT NULL REFERENCES autorisations_travail(id) ON DELETE CASCADE,
  statut_avant statut_at NOT NULL,
  statut_apres statut_at NOT NULL,
  acteur_id    UUID NOT NULL REFERENCES utilisateurs(id),
  motif        TEXT,
  metadata     JSONB,
  ip_address   INET,
  user_agent   TEXT,
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immuable : aucun UPDATE ni DELETE autorisé
CREATE RULE no_update_historique AS ON UPDATE TO historique_statuts_at DO INSTEAD NOTHING;
CREATE RULE no_delete_historique AS ON DELETE TO historique_statuts_at DO INSTEAD NOTHING;

-- ============================================================
-- TABLE : intervenants_permis
-- Check-in / Check-out terrain via QR Code
-- ============================================================

CREATE TABLE intervenants_permis (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permis_id       UUID NOT NULL REFERENCES permis(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES utilisateurs(id),   -- Null si intervenant externe
  nom_complet     TEXT NOT NULL,
  entreprise      TEXT,
  habilitations   TEXT[],
  check_in_at     TIMESTAMPTZ,
  check_out_at    TIMESTAMPTZ,
  check_in_gps    JSONB          -- { lat: number, lng: number }
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- 1. updated_at automatique
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_at_updated_at
  BEFORE UPDATE ON autorisations_travail
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_permis_updated_at
  BEFORE UPDATE ON permis
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Génération automatique du numéro AT
CREATE OR REPLACE FUNCTION trigger_generer_numero_at()
RETURNS TRIGGER AS $$
DECLARE
  site_code TEXT;
BEGIN
  SELECT code_site INTO site_code FROM sites WHERE id = NEW.site_id;
  NEW.numero_at := generer_numero_at(site_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generer_numero_at
  BEFORE INSERT ON autorisations_travail
  FOR EACH ROW
  WHEN (NEW.numero_at IS NULL OR NEW.numero_at = '')
  EXECUTE FUNCTION trigger_generer_numero_at();

-- 3. RÈGLE MÉTIER #1 — Cascade suspension AT → Permis
--    Quand une AT passe en SUSPENDUE :
--      - Sauvegarde le statut actuel de chaque permis dans statut_avant_suspension
--      - Passe tous les permis actifs en SUSPENDU
--    Quand une AT quitte SUSPENDUE :
--      - Restaure le statut précédent de chaque permis
CREATE OR REPLACE FUNCTION cascade_suspension_at()
RETURNS TRIGGER AS $$
BEGIN
  -- AT → SUSPENDUE : suspendre tous les permis non-clos/non-rejetés
  IF NEW.statut = 'SUSPENDUE' AND OLD.statut != 'SUSPENDUE' THEN
    UPDATE permis
    SET
      statut_avant_suspension = statut,
      statut = 'SUSPENDU'
    WHERE
      at_id = NEW.id
      AND statut NOT IN ('CLOS', 'REJETE', 'SUSPENDU');

  -- AT quitte SUSPENDUE : restaurer les permis
  ELSIF OLD.statut = 'SUSPENDUE' AND NEW.statut != 'SUSPENDUE' THEN
    UPDATE permis
    SET
      statut = COALESCE(statut_avant_suspension, 'EN_ATTENTE'),
      statut_avant_suspension = NULL
    WHERE
      at_id = NEW.id
      AND statut = 'SUSPENDU';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cascade_suspension_at
  AFTER UPDATE OF statut ON autorisations_travail
  FOR EACH ROW EXECUTE FUNCTION cascade_suspension_at();

-- 4. RÈGLE MÉTIER #2 — Bloquer approbation AT si permis non tous validés
--    Vérifie avant que le statut passe à APPROUVEE
CREATE OR REPLACE FUNCTION verifier_permis_avant_approbation()
RETURNS TRIGGER AS $$
DECLARE
  nb_permis_total     INTEGER;
  nb_permis_valides   INTEGER;
BEGIN
  IF NEW.statut = 'APPROUVEE' AND OLD.statut = 'VALIDEE' THEN
    SELECT COUNT(*) INTO nb_permis_total
    FROM permis WHERE at_id = NEW.id AND statut != 'REJETE';

    SELECT COUNT(*) INTO nb_permis_valides
    FROM permis WHERE at_id = NEW.id AND statut = 'VALIDE';

    IF nb_permis_total = 0 THEN
      RAISE EXCEPTION 'APPROBATION_BLOQUEE_AUCUN_PERMIS: L''AT doit avoir au moins un permis.';
    END IF;

    IF nb_permis_valides < nb_permis_total THEN
      RAISE EXCEPTION 'APPROBATION_BLOQUEE_PERMIS_NON_VALIDES: % permis sur % sont validés. Tous doivent être validés avant approbation.',
        nb_permis_valides, nb_permis_total;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verifier_approbation_at
  BEFORE UPDATE OF statut ON autorisations_travail
  FOR EACH ROW EXECUTE FUNCTION verifier_permis_avant_approbation();

-- 5. RÈGLE MÉTIER #3 — Bloquer clôture AT si permis non tous clos ou suspension ouverte
CREATE OR REPLACE FUNCTION verifier_cloture_at()
RETURNS TRIGGER AS $$
DECLARE
  nb_permis_non_clos    INTEGER;
  nb_suspensions_ouvertes INTEGER;
BEGIN
  IF NEW.statut = 'CLOTUREE' AND OLD.statut != 'CLOTUREE' THEN
    -- Vérifier que tous les permis sont clos
    SELECT COUNT(*) INTO nb_permis_non_clos
    FROM permis
    WHERE at_id = NEW.id AND statut NOT IN ('CLOS', 'REJETE');

    IF nb_permis_non_clos > 0 THEN
      RAISE EXCEPTION 'CLOTURE_BLOQUEE_PERMIS_NON_CLOS: % permis doivent être clôturés avant de clôturer l''AT.',
        nb_permis_non_clos;
    END IF;

    -- Vérifier qu'il n'y a pas de suspension ouverte
    SELECT COUNT(*) INTO nb_suspensions_ouvertes
    FROM suspensions_at
    WHERE at_id = NEW.id AND date_levee IS NULL;

    IF nb_suspensions_ouvertes > 0 THEN
      RAISE EXCEPTION 'CLOTURE_BLOQUEE_SUSPENSION_OUVERTE: Une suspension est encore en cours de traitement.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verifier_cloture_at
  BEFORE UPDATE OF statut ON autorisations_travail
  FOR EACH ROW EXECUTE FUNCTION verifier_cloture_at();

-- 6. Vérifier transition VALIDEE : tous les permis doivent être validés
CREATE OR REPLACE FUNCTION verifier_validation_at()
RETURNS TRIGGER AS $$
DECLARE
  nb_permis_non_valides INTEGER;
BEGIN
  IF NEW.statut = 'VALIDEE' AND OLD.statut = 'SOUMISE' THEN
    SELECT COUNT(*) INTO nb_permis_non_valides
    FROM permis
    WHERE at_id = NEW.id
      AND statut NOT IN ('VALIDE', 'REJETE')
      AND statut = 'EN_ATTENTE';

    IF nb_permis_non_valides > 0 THEN
      RAISE EXCEPTION 'VALIDATION_BLOQUEE_PERMIS_EN_ATTENTE: % permis sont encore en attente de validation.',
        nb_permis_non_valides;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verifier_validation_at
  BEFORE UPDATE OF statut ON autorisations_travail
  FOR EACH ROW EXECUTE FUNCTION verifier_validation_at();

-- ============================================================
-- INDEX DE PERFORMANCE
-- ============================================================

CREATE INDEX idx_at_site_id      ON autorisations_travail(site_id);
CREATE INDEX idx_at_zone_id      ON autorisations_travail(zone_id);
CREATE INDEX idx_at_statut       ON autorisations_travail(statut);
CREATE INDEX idx_at_demandeur    ON autorisations_travail(demandeur_id);
CREATE INDEX idx_at_animateur    ON autorisations_travail(animateur_id);
CREATE INDEX idx_at_dates        ON autorisations_travail(date_debut_prevue, date_fin_prevue);
CREATE INDEX idx_at_numero       ON autorisations_travail(numero_at);

CREATE INDEX idx_permis_at_id    ON permis(at_id);
CREATE INDEX idx_permis_statut   ON permis(statut);
CREATE INDEX idx_permis_type     ON permis(type_permis);
CREATE INDEX idx_permis_qr       ON permis(qr_code_token);

CREATE INDEX idx_audits_at_id    ON audits_at(at_id);
CREATE INDEX idx_audits_auditeur ON audits_at(auditeur_id);
CREATE INDEX idx_audits_type     ON audits_at(type_audit);

CREATE INDEX idx_susp_at_id      ON suspensions_at(at_id);
CREATE INDEX idx_susp_ouverte    ON suspensions_at(at_id) WHERE date_levee IS NULL;

CREATE INDEX idx_hist_at_id      ON historique_statuts_at(at_id);
CREATE INDEX idx_hist_timestamp  ON historique_statuts_at(timestamp DESC);

CREATE INDEX idx_interv_permis   ON intervenants_permis(permis_id);
CREATE INDEX idx_interv_user     ON intervenants_permis(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE autorisations_travail ENABLE ROW LEVEL SECURITY;
ALTER TABLE permis                ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits_at             ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspensions_at        ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique_statuts_at ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervenants_permis   ENABLE ROW LEVEL SECURITY;

-- Politique : un utilisateur ne voit que les AT de son site
CREATE POLICY "AT visibles par site" ON autorisations_travail
  FOR SELECT USING (
    site_id IN (
      SELECT site_id FROM utilisateurs WHERE id = auth.uid()
    )
  );

-- Politique : création d'AT — uniquement DEMANDEUR, HSE_MANAGER, ADMIN
CREATE POLICY "Création AT" ON autorisations_travail
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM utilisateurs
      WHERE id = auth.uid()
        AND roles && ARRAY['DEMANDEUR', 'HSE_MANAGER', 'ADMIN']::role_utilisateur[]
        AND site_id = autorisations_travail.site_id
    )
  );

-- Politique : modification AT
CREATE POLICY "Modification AT" ON autorisations_travail
  FOR UPDATE USING (
    site_id IN (SELECT site_id FROM utilisateurs WHERE id = auth.uid())
  );

-- Politique : permis visibles si AT visible
CREATE POLICY "Permis visibles" ON permis
  FOR ALL USING (
    at_id IN (
      SELECT id FROM autorisations_travail
      WHERE site_id IN (SELECT site_id FROM utilisateurs WHERE id = auth.uid())
    )
  );

-- Politique : audits
CREATE POLICY "Audits visibles" ON audits_at
  FOR ALL USING (
    at_id IN (
      SELECT id FROM autorisations_travail
      WHERE site_id IN (SELECT site_id FROM utilisateurs WHERE id = auth.uid())
    )
  );

-- Politique : suspensions
CREATE POLICY "Suspensions visibles" ON suspensions_at
  FOR ALL USING (
    at_id IN (
      SELECT id FROM autorisations_travail
      WHERE site_id IN (SELECT site_id FROM utilisateurs WHERE id = auth.uid())
    )
  );

-- Politique : historique (lecture seule)
CREATE POLICY "Historique visible" ON historique_statuts_at
  FOR SELECT USING (
    at_id IN (
      SELECT id FROM autorisations_travail
      WHERE site_id IN (SELECT site_id FROM utilisateurs WHERE id = auth.uid())
    )
  );

-- ============================================================
-- DONNÉES DE RÉFÉRENCE : Templates Checklist par type de permis
-- ============================================================

CREATE TABLE templates_checklist (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type_permis type_permis NOT NULL UNIQUE,
  version     TEXT NOT NULL DEFAULT '1.0',
  items       JSONB NOT NULL DEFAULT '[]',
  actif       BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertion des templates de base
INSERT INTO templates_checklist (type_permis, items) VALUES
('TRAVAIL_CHAUD', '[
  {"id":"TC01","libelle":"Zone délimitée et balisée","categorie":"ZONE","obligatoire":true},
  {"id":"TC02","libelle":"Extincteur positionné à moins de 5m","categorie":"SECURITE","obligatoire":true},
  {"id":"TC03","libelle":"Permis atmosphérique effectué (gaz, O2)","categorie":"ATMOSPHERIQUE","obligatoire":true},
  {"id":"TC04","libelle":"Matières inflammables éloignées ou protégées","categorie":"ZONE","obligatoire":true},
  {"id":"TC05","libelle":"Surveillant de chantier désigné","categorie":"ORGANISATION","obligatoire":true},
  {"id":"TC06","libelle":"EPI : masque, gants, tablier de soudeur","categorie":"EPI","obligatoire":true},
  {"id":"TC07","libelle":"Communication avec la salle de contrôle établie","categorie":"COMMUNICATION","obligatoire":false},
  {"id":"TC08","libelle":"Alarme incendie testée","categorie":"SECURITE","obligatoire":false}
]'),
('ESPACE_CONFINE', '[
  {"id":"EC01","libelle":"Analyse atmosphérique réalisée (O2, gaz toxiques, explosifs)","categorie":"ATMOSPHERIQUE","obligatoire":true},
  {"id":"EC02","libelle":"Ventilation forcée en place","categorie":"SECURITE","obligatoire":true},
  {"id":"EC03","libelle":"Surveillant à l''extérieur désigné","categorie":"ORGANISATION","obligatoire":true},
  {"id":"EC04","libelle":"Harnais et trépied de secours disponibles","categorie":"EPI","obligatoire":true},
  {"id":"EC05","libelle":"Détecteur de gaz personnel fourni","categorie":"EPI","obligatoire":true},
  {"id":"EC06","libelle":"Plan de sauvetage établi et communiqué","categorie":"URGENCE","obligatoire":true},
  {"id":"EC07","libelle":"Isolations mécaniques et électriques confirmées","categorie":"ISOLATION","obligatoire":true},
  {"id":"EC08","libelle":"Contact radio permanent établi","categorie":"COMMUNICATION","obligatoire":true}
]'),
('ELECTRIQUE_LOTO', '[
  {"id":"EL01","libelle":"Consignation électrique réalisée (LOTO)","categorie":"ISOLATION","obligatoire":true},
  {"id":"EL02","libelle":"VAT (Vérification Absence Tension) effectuée","categorie":"ISOLATION","obligatoire":true},
  {"id":"EL03","libelle":"Cadenas de consignation posés par chaque intervenant","categorie":"ISOLATION","obligatoire":true},
  {"id":"EL04","libelle":"Habilitation électrique vérifiée (niveau requis)","categorie":"HABILITATION","obligatoire":true},
  {"id":"EL05","libelle":"EPI diélectriques fournis","categorie":"EPI","obligatoire":true},
  {"id":"EL06","libelle":"Panneau de signalisation posé","categorie":"ZONE","obligatoire":true},
  {"id":"EL07","libelle":"Schéma électrique disponible","categorie":"DOCUMENTATION","obligatoire":false}
]'),
('TRAVAIL_HAUTEUR', '[
  {"id":"TH01","libelle":"Harnais de sécurité vérifié (date de contrôle valide)","categorie":"EPI","obligatoire":true},
  {"id":"TH02","libelle":"Points d''ancrage identifiés et validés","categorie":"SECURITE","obligatoire":true},
  {"id":"TH03","libelle":"Zone de travail balisée en bas","categorie":"ZONE","obligatoire":true},
  {"id":"TH04","libelle":"Échafaudage/nacelle vérifié et conforme","categorie":"EQUIPEMENT","obligatoire":true},
  {"id":"TH05","libelle":"Conditions météo vérifiées (vent < 45 km/h)","categorie":"METEO","obligatoire":true},
  {"id":"TH06","libelle":"Formation travaux en hauteur vérifiée","categorie":"HABILITATION","obligatoire":true},
  {"id":"TH07","libelle":"Procédure de sauvetage définie","categorie":"URGENCE","obligatoire":false}
]'),
('TRAVAUX_GENERAUX', '[
  {"id":"TG01","libelle":"Zone de travail délimitée","categorie":"ZONE","obligatoire":true},
  {"id":"TG02","libelle":"EPI de base fournis (casque, chaussures, gilet)","categorie":"EPI","obligatoire":true},
  {"id":"TG03","libelle":"Risques identifiés et mesures en place","categorie":"SECURITE","obligatoire":true},
  {"id":"TG04","libelle":"Outillage vérifié","categorie":"EQUIPEMENT","obligatoire":false},
  {"id":"TG05","libelle":"Numéros d''urgence affichés","categorie":"URGENCE","obligatoire":true}
]');
