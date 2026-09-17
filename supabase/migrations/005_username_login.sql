-- ============================================================
-- Migration 005 — Connexion par nom d'utilisateur (au lieu d'email)
--
-- Supabase Auth reste fondamentalement basé sur l'email (invitations,
-- réinitialisation de mot de passe) : on ne touche pas à ça. On ajoute
-- juste un alias "nom d'utilisateur" que l'écran de connexion résout
-- en email AVANT d'appeler signInWithPassword, via une fonction
-- SECURITY DEFINER appelable par le rôle anon (utilisateur pas encore
-- authentifié à ce stade).
-- ============================================================

ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS username TEXT;

-- Unicité (insensible à la casse) sur les valeurs renseignées uniquement —
-- plusieurs utilisateurs sans username (NULL) restent possibles.
CREATE UNIQUE INDEX IF NOT EXISTS idx_utilisateurs_username_unique
  ON utilisateurs (LOWER(username))
  WHERE username IS NOT NULL;

-- Résout un nom d'utilisateur en email. Ne renvoie que l'email (ou NULL) —
-- aucune autre colonne exposée. Utilisée par le formulaire de connexion et
-- par "mot de passe oublié", donc appelable par un visiteur non authentifié.
CREATE OR REPLACE FUNCTION username_to_email(p_username TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT email FROM utilisateurs
  WHERE LOWER(username) = LOWER(p_username) AND actif = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION username_to_email(TEXT) TO anon, authenticated;

-- Un ADMIN doit pouvoir définir/modifier le username des comptes de son site
-- (déjà couvert par la policy "Admin gère les utilisateurs de son site" de
-- la migration 003, qui autorise UPDATE sans restriction de colonnes —
-- aucune policy supplémentaire nécessaire ici).
