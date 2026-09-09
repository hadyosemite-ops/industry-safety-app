// ─────────────────────────────────────────────────────────────────────────────
// ChatAssistant — Widget flottant "Assistant HSE", piloté par Claude
// (proxy /api/claude). Boucle de tool-use manuelle :
//   1. POST /api/claude avec l'historique + system prompt + TOOLS.
//   2. Pour chaque bloc `tool_use` de la réponse :
//        - outil "sûr"        → exécution immédiate (executeTool).
//        - outil "destructif" → carte de confirmation inline, exécution
//                                seulement après clic utilisateur (sinon
//                                on transmet un tool_result "décliné").
//   3. Les tool_result sont renvoyés à Claude dans un nouveau message `user`
//      (synthetic — non affiché comme bulle de conversation), et on boucle
//      tant que la réponse contient des `tool_use`.
//
// Monté une seule fois dans App.tsx (Layout, branche authentifiée) — visible
// sur toutes les pages sauf /login, /update-password, /permis/:token et le
// wizard de création d'AT (cf. hideSidebar dans App.tsx).
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { MessageCircle, X, Send, AlertTriangle, Check, Ban } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/ToastProvider';
import { RoleUtilisateur } from '@/modules/ptw/types';
import { toRoleUtilisateurs } from '@/modules/ptw/utils/roles';
import { TOOLS, executeTool, estOutilDestructif, type ToolContext } from '../tools';
import type { ChatMessage, ContentBlock, ToolUseBlock, ToolResultBlock, AnthropicMessagesResponse } from '../types';

const LABELS_OUTILS_DESTRUCTIFS: Record<string, string> = {
  suspendre_at: "Suspendre l'autorisation de travail",
  cloturer_at: "Clôturer l'autorisation de travail",
  supprimer_intervenant: "Supprimer l'intervenant",
};

function buildSystemPrompt(profile: { prenom: string; nom: string; roles: string[]; site_id: string } | null): string {
  const identite = profile
    ? `${profile.prenom} ${profile.nom} (rôles : ${profile.roles.join(', ') || 'aucun'}, site : ${profile.site_id})`
    : 'un utilisateur non identifié';

  return [
    `Tu es "Assistant HSE", l'assistant intégré à l'application de gestion HSE (sécurité industrielle) de l'entreprise.`,
    `Tu discutes actuellement avec ${identite}.`,
    '',
    "Tu peux consulter les indicateurs (KPI) des autorisations de travail (AT), et effectuer des actions de "
      + 'consultation/création/mise à jour sur les AT et les référentiels (sites, zones, intervenants), via les outils '
      + 'mis à ta disposition.',
    '',
    'Règles impératives :',
    "- Pour tout chiffre ou état des lieux, appelle l'outil get_kpis (ou lister_ats) plutôt que de réutiliser un "
      + 'chiffre déjà donné plus tôt dans la conversation : les données peuvent avoir changé.',
    '- Suspendre une AT, clôturer une AT et supprimer un intervenant sont des actions destructives ou irréversibles. '
      + "Le système affiche automatiquement à l'utilisateur une carte de confirmation avant toute exécution — tu ne "
      + "peux pas contourner cette étape et tu ne dois jamais affirmer qu'une de ces actions est terminée tant que le "
      + "résultat de l'outil ne le confirme pas. Annonce simplement à l'utilisateur qu'une confirmation lui sera "
      + 'demandée.',
    "- Si un outil renvoie une erreur, explique-la clairement en français, sans jargon technique inutile, et propose "
      + 'une alternative si possible.',
    '- Réponds toujours en français, de façon concise et professionnelle.',
  ].join('\n');
}

function texteDuMessage(content: ContentBlock[]): string {
  return content
    .filter((b): b is Extract<ContentBlock, { type: 'text' }> => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .trim();
}

function resumeInput(input: Record<string, unknown>): { label: string; valeur: string }[] {
  return Object.entries(input)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => ({ label: k, valeur: Array.isArray(v) ? v.join(', ') : String(v) }));
}

export function ChatAssistant() {
  const { session, profile } = useAuth();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingTool, setPendingTool] = useState<ToolUseBlock | null>(null);
  const confirmResolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const ctx: ToolContext = {
    userId: profile?.id ?? '',
    roles: toRoleUtilisateurs(profile?.roles) as RoleUtilisateur[],
    siteId: profile?.site_id ?? '',
  };

  function waitForUserConfirmation(block: ToolUseBlock): Promise<boolean> {
    return new Promise(resolve => {
      setPendingTool(block);
      confirmResolverRef.current = (confirmed: boolean) => {
        setPendingTool(null);
        confirmResolverRef.current = null;
        resolve(confirmed);
      };
    });
  }

  async function callClaude(historique: ChatMessage[]): Promise<AnthropicMessagesResponse | null> {
    if (!session?.access_token) {
      toast.error('Session expirée — reconnectez-vous pour utiliser l\'assistant.');
      return null;
    }
    try {
      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          max_tokens: 1024,
          system: buildSystemPrompt(profile),
          messages: historique.map(({ role, content }) => ({ role, content })),
          tools: TOOLS,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        const message = typeof data?.error === 'string'
          ? data.error
          : (data?.error?.message ?? `Erreur ${resp.status} lors de l'appel à l'assistant.`);
        throw new Error(message);
      }
      return data as AnthropicMessagesResponse;
    } catch (err) {
      toast.error(`Assistant HSE indisponible : ${(err as Error).message}`);
      return null;
    }
  }

  const runTurn = useCallback(async (historique: ChatMessage[]) => {
    setBusy(true);
    const reponse = await callClaude(historique);
    setBusy(false);
    if (!reponse) return;

    const assistantMessage: ChatMessage = { role: 'assistant', content: reponse.content };
    let courant = [...historique, assistantMessage];
    setMessages(courant);

    const appelsOutils = reponse.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
    if (appelsOutils.length === 0) return;

    const resultats: ToolResultBlock[] = [];
    for (const appel of appelsOutils) {
      if (estOutilDestructif(appel.name)) {
        const confirme = await waitForUserConfirmation(appel);
        if (confirme) {
          setBusy(true);
          const { content, isError } = await executeTool(appel.name, appel.input, ctx);
          setBusy(false);
          resultats.push({ type: 'tool_result', tool_use_id: appel.id, content, is_error: isError });
          toast.success('Action confirmée.');
        } else {
          resultats.push({
            type: 'tool_result',
            tool_use_id: appel.id,
            content: "L'utilisateur a annulé cette action. Ne pas la ré-exécuter sans nouvelle demande explicite.",
            is_error: true,
          });
          toast.info('Action annulée.');
        }
      } else {
        setBusy(true);
        const { content, isError } = await executeTool(appel.name, appel.input, ctx);
        setBusy(false);
        resultats.push({ type: 'tool_result', tool_use_id: appel.id, content, is_error: isError });
      }
    }

    const messageOutils: ChatMessage = { role: 'user', content: resultats, synthetic: true };
    courant = [...courant, messageOutils];
    setMessages(courant);

    await runTurn(courant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.access_token, profile]);

  async function envoyer() {
    const texte = input.trim();
    if (!texte || busy) return;
    setInput('');
    const messageUtilisateur: ChatMessage = { role: 'user', content: [{ type: 'text', text: texte }] };
    const historique = [...messages, messageUtilisateur];
    setMessages(historique);
    await runTurn(historique);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void envoyer();
    }
  }

  return (
    <>
      {/* ── Bouton flottant ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Fermer l'Assistant HSE" : "Ouvrir l'Assistant HSE"}
        aria-expanded={open}
        className={clsx(
          'fixed bottom-5 right-5 z-[90] w-14 h-14 rounded-full flex items-center justify-center',
          'shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95',
        )}
        style={{ background: 'linear-gradient(135deg, #00d4ff, #0077aa)', boxShadow: '0 4px 24px rgba(0,212,255,0.45)' }}
      >
        {open ? <X size={22} className="text-[#02101f]" /> : <MessageCircle size={22} className="text-[#02101f]" />}
      </button>

      {/* ── Panneau chat ── */}
      {open && (
        <div
          role="complementary"
          aria-label="Assistant HSE"
          className={clsx(
            'fixed z-[89] bottom-24 right-5 flex flex-col overflow-hidden',
            'w-[calc(100vw-2.5rem)] max-w-[380px] h-[min(600px,calc(100vh-8rem))]',
            'bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] rounded-2xl shadow-2xl',
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.14), rgba(0,119,170,0.08))' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg, #00d4ff, #0077aa)' }}>
              <MessageCircle size={16} className="text-[#02101f]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[color:var(--text-primary)] font-bold text-sm leading-none">Assistant HSE</p>
              <p className="text-[color:var(--text-muted)] text-[11px] mt-0.5">Propulsé par Claude</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="btn-icon">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-[color:var(--text-muted)] text-center mt-6">
                Posez une question sur vos autorisations de travail, ou demandez-moi d'en créer, valider, suspendre…
              </p>
            )}

            {messages.map((m, i) => {
              if (m.synthetic) return null; // tool_result interne — pas de bulle
              const texte = texteDuMessage(m.content);
              if (!texte) return null; // message purement tool_use côté assistant
              return (
                <div
                  key={i}
                  className={clsx(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words',
                    m.role === 'user'
                      ? 'ml-auto bg-[rgba(0,212,255,0.14)] text-[color:var(--text-primary)] rounded-br-sm'
                      : 'mr-auto bg-[var(--bg-hover)] text-[color:var(--text-primary)] rounded-bl-sm border border-[var(--border)]',
                  )}
                >
                  {texte}
                </div>
              );
            })}

            {/* Carte de confirmation pour outil destructif */}
            {pendingTool && (
              <div className="mr-auto max-w-[92%] rounded-2xl border border-[rgba(255,68,68,0.35)] bg-[rgba(255,68,68,0.08)] px-3.5 py-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-[color:var(--badge-danger-text)] flex-shrink-0" />
                  <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                    {LABELS_OUTILS_DESTRUCTIFS[pendingTool.name] ?? pendingTool.name}
                  </p>
                </div>
                <p className="text-xs text-[color:var(--text-secondary)]">
                  Cette action nécessite votre confirmation avant exécution.
                </p>
                {resumeInput(pendingTool.input).length > 0 && (
                  <ul className="text-xs text-[color:var(--text-muted)] space-y-0.5 border-t border-[var(--border)] pt-2">
                    {resumeInput(pendingTool.input).map(({ label, valeur }) => (
                      <li key={label}><strong className="text-[color:var(--text-secondary)]">{label} :</strong> {valeur}</li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => confirmResolverRef.current?.(false)}
                    className="btn-ghost flex items-center gap-1.5 text-xs flex-1 justify-center"
                  >
                    <Ban size={13} /> Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmResolverRef.current?.(true)}
                    className="flex items-center gap-1.5 justify-center flex-1 px-3 py-2 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-xs font-semibold transition-colors"
                  >
                    <Check size={13} /> Confirmer
                  </button>
                </div>
              </div>
            )}

            {busy && !pendingTool && (
              <div className="mr-auto flex items-center gap-2 text-xs text-[color:var(--text-muted)] px-1">
                <span className="w-3 h-3 border-2 border-[color:var(--text-muted)]/30 border-t-[#00d4ff] rounded-full animate-spin" />
                Réflexion en cours…
              </div>
            )}
          </div>

          {/* Saisie */}
          <div className="border-t border-[var(--border)] p-3 flex items-end gap-2 flex-shrink-0">
            <textarea
              className="form-input flex-1 resize-none text-sm py-2"
              rows={1}
              placeholder="Écrivez votre message…"
              value={input}
              disabled={busy}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              onClick={() => void envoyer()}
              disabled={busy || !input.trim()}
              aria-label="Envoyer"
              className="btn-icon disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              style={{ color: '#00d4ff' }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
