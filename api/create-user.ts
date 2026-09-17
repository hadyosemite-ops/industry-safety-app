// ============================================================
// api/create-user.ts — Proxy serverless Vercel pour la création de comptes
// utilisateurs depuis l'écran "Base de données > Utilisateurs".
//
// Pourquoi une fonction serverless plutôt qu'un appel direct depuis le
// navigateur ?
//   Créer un compte auth (auth.users) nécessite l'API d'administration de
//   Supabase (`auth.admin.createUser`), qui exige la clé SUPABASE_SERVICE_ROLE_KEY.
//   Cette clé contourne toutes les policies RLS : elle ne doit JAMAIS
//   atteindre le bundle client, exactement comme ANTHROPIC_API_KEY dans
//   api/claude.ts. Elle n'est lue qu'ici, côté serveur.
//
//   ⚠️ IMPORTANT — CONFIGURATION VERCEL :
//   Ajoutez `SUPABASE_SERVICE_ROLE_KEY` dans Project Settings → Environment
//   Variables, SANS le préfixe `VITE_` (sinon elle serait inlinée dans le
//   bundle client par Vite — voir le bandeau équivalent dans api/claude.ts).
//   Récupérez sa valeur dans le dashboard Supabase → Project Settings → API
//   → "service_role" secret.
//
// Autorisation : seul un utilisateur ADMIN du site peut créer un compte, et
// uniquement pour son propre site (site_id repris depuis SON profil, jamais
// depuis une valeur envoyée par le client — évite qu'un admin d'un site
// crée un compte sur un autre site en trafiquant la requête).
//
// Le profil métier (table `utilisateurs`) n'est PAS inséré ici : il est créé
// automatiquement par le trigger Postgres `trg_handle_new_user` (migration
// 002) à partir des `user_metadata` transmis à `auth.admin.createUser`.
// ============================================================

import { createClient } from '@supabase/supabase-js';

const ROLES_VALIDES = ['DEMANDEUR', 'ANIMATEUR_SECURITE', 'RESP_ZONE', 'HSE_MANAGER', 'EXECUTANT', 'ADMIN'];

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée — utilisez POST.' });
    return;
  }

  // ── 1. Authentification — vérifie le JWT Supabase de l'appelant ──────────
  const authHeader: string | undefined = req.headers?.authorization ?? req.headers?.Authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentification requise (en-tête Authorization manquant).' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: 'Configuration serveur incomplète (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes).' });
    return;
  }
  if (!serviceRoleKey) {
    res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY n'est pas configurée sur le serveur (Vercel → Environment Variables)." });
    return;
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);

  if (authError || !userData?.user) {
    res.status(401).json({ error: 'Session invalide ou expirée.' });
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // ── 2. Autorisation — l'appelant doit être ADMIN de son site ─────────────
  const { data: appelant, error: profilError } = await supabaseAdmin
    .from('utilisateurs')
    .select('id, site_id, roles')
    .eq('id', userData.user.id)
    .single();

  if (profilError || !appelant) {
    res.status(403).json({ error: 'Profil introuvable — action refusée.' });
    return;
  }
  if (!Array.isArray(appelant.roles) || !appelant.roles.includes('ADMIN')) {
    res.status(403).json({ error: 'Seul un administrateur peut créer un utilisateur.' });
    return;
  }

  // ── 3. Validation du corps de la requête ──────────────────────────────────
  const body = (req.body ?? {}) as Record<string, unknown>;
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const nom = typeof body.nom === 'string' ? body.nom.trim() : '';
  const prenom = typeof body.prenom === 'string' ? body.prenom.trim() : '';
  const role = typeof body.role === 'string' ? body.role : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Adresse email invalide.' });
    return;
  }
  if (!password || password.length < 6) {
    res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    return;
  }
  if (!nom || !prenom) {
    res.status(400).json({ error: 'Nom et prénom sont requis.' });
    return;
  }
  if (!ROLES_VALIDES.includes(role)) {
    res.status(400).json({ error: 'Rôle initial invalide.' });
    return;
  }

  // ── 4. Création du compte auth — le trigger `trg_handle_new_user` crée
  //      automatiquement la ligne `utilisateurs` correspondante à partir des
  //      user_metadata ci-dessous (voir migration 002).
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      site_id: appelant.site_id,
      nom,
      prenom,
      role,
    },
  });

  if (createError || !created?.user) {
    const message = createError?.message ?? '';
    const friendly = message.includes('already been registered') || message.includes('already registered')
      ? 'Un compte existe déjà avec cet email.'
      : message || 'Échec de la création du compte.';
    res.status(400).json({ error: friendly });
    return;
  }

  res.status(200).json({ data: { id: created.user.id, email: created.user.email } });
}
