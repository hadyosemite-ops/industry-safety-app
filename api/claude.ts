// ============================================================
// api/claude.ts — Proxy serverless Vercel vers l'API Messages d'Anthropic
// (Claude), utilisé par l'Assistant HSE (src/modules/assistant).
//
// Pourquoi un proxy plutôt qu'un appel direct depuis le navigateur ?
//   - La clé Anthropic (ANTHROPIC_API_KEY) ne doit JAMAIS atteindre le bundle
//     client. Contrairement à VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY —
//     volontairement publiques, protégées par les policies RLS Supabase —
//     une clé API Anthropic donne un accès direct et FACTURÉ à l'API : si
//     elle fuitait dans le JS servi au navigateur, n'importe qui pourrait
//     l'utiliser pour consommer le crédit du compte Anthropic du propriétaire.
//
//   ⚠️ IMPORTANT — CONFIGURATION VERCEL :
//   Ajoutez `ANTHROPIC_API_KEY` dans Project Settings → Environment
//   Variables, SANS le préfixe `VITE_`. Vite inline dans le bundle client
//   toute variable préfixée `VITE_` au moment du build ; un préfixe `VITE_`
//   ici transformerait ce secret serveur en secret exposé publiquement dans
//   le JS livré au navigateur. `process.env.ANTHROPIC_API_KEY` n'est lu que
//   côté serveur, dans cette fonction serverless — jamais par le bundle Vite.
//
// Authentification : ce endpoint ne doit être utilisable que par un
// utilisateur déjà authentifié dans l'app. Le client envoie le JWT Supabase
// de sa session (`session.access_token`) en `Authorization: Bearer <token>` ;
// on le valide auprès de Supabase (`auth.getUser(token)`) avant de
// transmettre quoi que ce soit à Anthropic. Sans cette vérification, l'URL de
// cette fonction serait un proxy Anthropic ouvert à quiconque la
// découvrirait (ex. dans le code source public du bundle), ce qui permettrait
// de brûler du crédit API sans limite.
//
// Runtime : Vercel détecte automatiquement tout fichier .ts/.js sous /api à
// la racine du repo comme une fonction serverless Node — exactement comme
// pour un projet Next.js, aucune configuration supplémentaire n'est requise
// dans vercel.json pour un projet Vite. Le runtime Node 18+/20+ de Vercel
// fournit `fetch` globalement : aucune dépendance supplémentaire
// (`@anthropic-ai/sdk`) n'est nécessaire pour appeler l'API Anthropic. Cette
// app n'ayant jusqu'ici aucune fonction serverless, on évite aussi d'ajouter
// `@vercel/node` comme dépendance juste pour ses types — `req`/`res` sont
// typés `any` ici, ce qui est suffisant pour ce handler minimal.
// ============================================================

import { createClient } from '@supabase/supabase-js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

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

  // VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY sont des valeurs publiques
  // (anon key, protégée par RLS) — on peut les relire côté serveur sans
  // problème, elles sont déjà présentes dans le bundle client.
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: 'Configuration serveur incomplète (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes).' });
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      res.status(401).json({ error: 'Session invalide ou expirée.' });
      return;
    }
  } catch (err) {
    res.status(401).json({ error: `Échec de la vérification de session : ${(err as Error).message}` });
    return;
  }

  // ── 2. Clé Anthropic — lue côté serveur uniquement, cf. bandeau ci-dessus ─
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY n'est pas configurée sur le serveur (Vercel → Environment Variables)." });
    return;
  }

  // ── 3. Construction du corps transmis à l'API Messages d'Anthropic ──────
  // On transmet tel quel le sous-ensemble envoyé par le client (model,
  // max_tokens, system, messages, tools, tool_choice), en n'imposant un
  // modèle par défaut que si le client n'en a pas fourni.
  const body = (req.body ?? {}) as Record<string, unknown>;
  const anthropicBody = {
    model: body.model ?? DEFAULT_MODEL,
    max_tokens: body.max_tokens ?? 1024,
    system: body.system,
    messages: body.messages,
    ...(body.tools ? { tools: body.tools } : {}),
    ...(body.tool_choice ? { tool_choice: body.tool_choice } : {}),
  };

  try {
    const upstream = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type': 'application/json',
      },
      body: JSON.stringify(anthropicBody),
    });

    // Passthrough du statut et du corps de la réponse Anthropic — y compris
    // en cas d'erreur (4xx/5xx), pour que le client puisse afficher le
    // message d'erreur d'Anthropic tel quel.
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: `Erreur de communication avec l'API Anthropic : ${(err as Error).message}` });
  }
}
