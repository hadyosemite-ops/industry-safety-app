# Déploiement — Industry Safety App

Guide pour mettre l'app en ligne (Supabase + Vercel) et la partager avec d'autres utilisateurs.

## 1. Créer le projet Supabase

1. Va sur [supabase.com](https://supabase.com) → New Project.
2. Choisis un nom, une région proche de tes utilisateurs, et un mot de passe de base de données (à conserver précieusement).
3. Une fois le projet créé, va dans **Settings → API** : note l'**URL du projet** et la clé **anon public**.

## 2. Exécuter les migrations

Dans le tableau de bord Supabase → **SQL Editor** → New query :

1. Colle le contenu de `supabase/migrations/001_ptw_schema.sql`, exécute.
2. Colle le contenu de `supabase/migrations/002_rls_utilisateurs_sites.sql`, exécute.

(Alternative si tu as la CLI Supabase installée en local : `supabase link` puis `supabase db push`.)

## 3. Créer le premier site

Toujours dans le SQL Editor :

```sql
insert into sites (nom, adresse, code_site)
values ('Mon site principal', 'Adresse du site', 'IND');
```

C'est le site auquel les nouveaux comptes seront rattachés par défaut (le trigger `handle_new_user` prend automatiquement le premier site actif si aucun `site_id` n'est fourni à l'invitation).

## 4. Inviter les utilisateurs

Dans **Authentication → Users → Invite user**, entre l'email de chaque collègue. Un email d'invitation leur permet de définir leur mot de passe.

Par défaut, un utilisateur invité reçoit le rôle `DEMANDEUR`. Pour te donner (ou donner à quelqu'un) le rôle `ADMIN` :

```sql
update utilisateurs set roles = array['ADMIN']::role_utilisateur[] where email = 'ton.email@entreprise.com';
```

Rôles disponibles : `DEMANDEUR`, `ANIMATEUR_SECURITE`, `RESP_ZONE`, `HSE_MANAGER`, `EXECUTANT`, `ADMIN` (un utilisateur peut avoir plusieurs rôles — `roles` est un tableau).

## 5. Configurer les variables d'environnement locales (optionnel, pour tester en local)

```bash
cp .env.example .env.local
```

Renseigne `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` avec les valeurs de l'étape 1, puis `npm install && npm run dev`.

## 6. Pousser le code sur GitHub

```bash
git remote add origin https://github.com/<ton-compte>/industry-safety-app.git
git push -u origin master
```

(Crée d'abord le dépôt vide sur GitHub s'il n'existe pas encore.)

## 7. Déployer sur Vercel

1. Sur [vercel.com](https://vercel.com) → Add New → Project → importe le dépôt GitHub.
2. Framework preset : **Vite** (détecté automatiquement).
3. Dans **Environment Variables**, ajoute :
   - `VITE_SUPABASE_URL` = l'URL de ton projet Supabase
   - `VITE_SUPABASE_ANON_KEY` = la clé anon public
4. Deploy.

Vercel te donne une URL publique (`https://ton-app.vercel.app`) — c'est le lien à partager avec tes utilisateurs. Ils se connectent avec l'email/mot de passe défini lors de l'invitation (étape 4).

Un `vercel.json` est déjà présent à la racine pour que le routage côté client (React Router) fonctionne correctement sur Vercel (sans lui, actualiser une page sur `/at` renverrait une 404).

## Notes / limites actuelles

- **Module PTW (Autorisations de travail)** : branché sur les vraies données Supabase.
- **Modules Audit, Accidentologie, Prestataires** : encore sur données de démonstration statiques — à brancher dans un prochain chantier.
- **Page terrain QR (`/permis/:token`)** : volontairement accessible sans connexion (pour un accès rapide sur le terrain via scan), mais les RLS actuelles bloquent les lectures anonymes sur les tables `permis`/`autorisations_travail`. Il faudra décider du modèle d'accès (compte terrain dédié, ou fonction Postgres `SECURITY DEFINER` dédiée au token QR) avant de rebrancher cette page en réel.
