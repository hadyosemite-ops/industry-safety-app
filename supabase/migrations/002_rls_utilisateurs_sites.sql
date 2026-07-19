-- ============================================================
-- Migration 002 — RLS manquantes (utilisateurs, sites, zones,
-- templates_checklist) + création automatique du profil à l'inscription
-- ============================================================

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE utilisateurs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites              ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones              ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_checklist ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- utilisateurs
-- Visible : soi-même + collègues du même site (nécessaire pour les
-- jointures type "demandeur:utilisateurs!demandeur_id(...)" utilisées
-- dans atService)
-- ------------------------------------------------------------

CREATE POLICY "Utilisateurs visibles par site" ON utilisateurs
  FOR SELECT USING (
    id = auth.uid()
    OR site_id IN (SELECT site_id FROM utilisateurs WHERE id = auth.uid())
  );

-- Un utilisateur peut modifier ses propres infos de contact (pas ses rôles)
CREATE POLICY "Modification de son propre profil" ON utilisateurs
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Un ADMIN peut tout gérer sur son site (rôles inclus)
CREATE POLICY "Admin gère les utilisateurs de son site" ON utilisateurs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM utilisateurs u
      WHERE u.id = auth.uid()
        AND 'ADMIN' = ANY(u.roles)
        AND u.site_id = utilisateurs.site_id
    )
  );

-- ------------------------------------------------------------
-- sites — lecture pour tout utilisateur authentifié (nécessaire pour
-- les sélecteurs de site) ; écriture réservée à la clé service_role
-- (pas de policy INSERT/UPDATE côté client)
-- ------------------------------------------------------------

CREATE POLICY "Sites visibles par tous les authentifiés" ON sites
  FOR SELECT USING (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- zones — visibles par les utilisateurs du même site
-- ------------------------------------------------------------

CREATE POLICY "Zones visibles par site" ON zones
  FOR SELECT USING (
    site_id IN (SELECT site_id FROM utilisateurs WHERE id = auth.uid())
  );

-- ------------------------------------------------------------
-- templates_checklist — référentiel commun, lecture pour tous les
-- authentifiés, pas d'écriture côté client
-- ------------------------------------------------------------

CREATE POLICY "Templates checklist visibles par tous" ON templates_checklist
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- CRÉATION AUTOMATIQUE DU PROFIL UTILISATEUR
-- Déclenché à chaque inscription (auth.users). Le site, nom, prénom
-- et rôle initial doivent être passés en metadata au moment de
-- l'invitation/inscription (voir README déploiement) :
--   { "site_id": "...", "nom": "...", "prenom": "...", "role": "DEMANDEUR" }
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_site_id UUID;
  v_role    role_utilisateur;
BEGIN
  -- site_id fourni en metadata sinon premier site actif (mono-site par défaut)
  v_site_id := COALESCE(
    (NEW.raw_user_meta_data->>'site_id')::UUID,
    (SELECT id FROM sites WHERE actif = TRUE ORDER BY created_at LIMIT 1)
  );

  v_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::role_utilisateur,
    'DEMANDEUR'::role_utilisateur
  );

  IF v_site_id IS NULL THEN
    -- Aucun site en base : impossible de créer le profil, on laisse
    -- l'admin le faire manuellement (évite de bloquer la création du compte auth)
    RETURN NEW;
  END IF;

  INSERT INTO utilisateurs (id, email, nom, prenom, roles, site_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    ARRAY[v_role],
    v_site_id
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;
CREATE TRIGGER trg_handle_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
