-- ============================================================
-- Migration 003 — Corrige la récursion infinie RLS sur `utilisateurs`
--
-- Les policies de la migration 002 lisaient `utilisateurs` depuis une
-- policy DE `utilisateurs` (ex: "site_id IN (SELECT site_id FROM
-- utilisateurs WHERE id = auth.uid())") : chaque lecture de la table
-- redéclenche l'évaluation de sa propre policy → boucle infinie
-- ("infinite recursion detected in policy for relation utilisateurs").
--
-- Fix standard Postgres/Supabase : passer par des fonctions
-- SECURITY DEFINER (propriété du rôle `postgres`, qui a BYPASSRLS)
-- pour que la lecture interne de `utilisateurs` ignore RLS et ne
-- redéclenche donc pas la policy.
-- ============================================================

CREATE OR REPLACE FUNCTION mon_site_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT site_id FROM utilisateurs WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION je_suis_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM utilisateurs WHERE id = auth.uid() AND 'ADMIN' = ANY(roles)
  )
$$;

-- Remplace les policies récursives par des versions utilisant les fonctions

DROP POLICY IF EXISTS "Utilisateurs visibles par site" ON utilisateurs;
CREATE POLICY "Utilisateurs visibles par site" ON utilisateurs
  FOR SELECT USING (
    id = auth.uid()
    OR site_id = mon_site_id()
  );

DROP POLICY IF EXISTS "Admin gère les utilisateurs de son site" ON utilisateurs;
CREATE POLICY "Admin gère les utilisateurs de son site" ON utilisateurs
  FOR ALL USING (
    je_suis_admin() AND site_id = mon_site_id()
  );

-- "Modification de son propre profil" (id = auth.uid()) ne touche pas
-- utilisateurs dans sa condition — elle n'était pas concernée par la
-- récursion, on la laisse telle quelle.
