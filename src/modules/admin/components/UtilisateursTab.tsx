// ─────────────────────────────────────────────────────────────────────────────
// Onglet Utilisateurs — liste des comptes du site + création/gestion des
// rôles/statut. La création (bouton "Ajouter un utilisateur") passe par
// api/create-user.ts (réservé ADMIN) : l'admin définit lui-même un mot de
// passe temporaire, qu'il communique ensuite à la personne (pas d'email
// d'invitation, voir ce fichier pour le détail).
// RLS (migration 002, "Admin gère les utilisateurs de son site") : seul un
// ADMIN peut gérer les utilisateurs de son site — le bouton "Modifier" et
// "Ajouter un utilisateur" sont donc masqués pour les non-ADMIN.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { Pencil, UserCog, UserPlus, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import type { UtilisateurProfile } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/ToastProvider';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { useModalA11y } from '@/hooks/useModalA11y';
import * as utilisateursService from '../services/utilisateursService';
import { RoleUtilisateur } from '../types';
import type { Utilisateur, UpdateUtilisateurRolesPayload, CreateUtilisateurPayload } from '../types';

interface Props {
  profile: UtilisateurProfile;
}

const ROLE_LABELS: Record<RoleUtilisateur, string> = {
  [RoleUtilisateur.DEMANDEUR]: 'Demandeur',
  [RoleUtilisateur.ANIMATEUR_SECURITE]: 'Animateur Sécurité',
  [RoleUtilisateur.RESP_ZONE]: 'Responsable de zone',
  [RoleUtilisateur.HSE_MANAGER]: 'HSE Manager',
  [RoleUtilisateur.EXECUTANT]: 'Exécutant',
  [RoleUtilisateur.ADMIN]: 'Administrateur',
};

export function UtilisateursTab({ profile }: Props) {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalUser, setModalUser] = useState<Utilisateur | null>(null);
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  const { session } = useAuth();

  const isAdmin = profile.roles.includes('ADMIN');

  async function refetch() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await utilisateursService.listerUtilisateurs(profile.site_id);
    if (err || !data) {
      setError(err?.message ?? 'Impossible de charger les utilisateurs.');
      setUtilisateurs([]);
    } else {
      setUtilisateurs(data);
    }
    setLoading(false);
  }

  useEffect(() => { void refetch(); }, [profile.site_id]);

  async function handleSave(payload: UpdateUtilisateurRolesPayload) {
    if (!modalUser) return;
    const result = await utilisateursService.modifierRolesEtStatut(modalUser.id, payload);
    if (result.error) {
      toast.error(`Action refusée : ${result.error.message}`);
      return;
    }
    toast.success('Utilisateur mis à jour avec succès.');
    setModalUser(null);
    void refetch();
  }

  async function handleCreate(input: { email: string; password: string; nom: string; prenom: string; roles: RoleUtilisateur[] }) {
    if (!session?.access_token) {
      toast.error('Session expirée — reconnectez-vous.');
      return { error: 'Session expirée — reconnectez-vous.' };
    }
    const payload: CreateUtilisateurPayload = {
      email: input.email,
      password: input.password,
      nom: input.nom,
      prenom: input.prenom,
      role: input.roles[0],
    };
    const result = await utilisateursService.creerUtilisateur(payload, session.access_token);
    if (result.error) {
      return { error: result.error.message };
    }
    // Le trigger de création n'applique que le premier rôle (metadata
    // `role`, singulier — migration 002) : si l'admin en a sélectionné
    // plusieurs, on complète juste après.
    if (input.roles.length > 1 && result.data) {
      await utilisateursService.modifierRolesEtStatut(result.data.id, { roles: input.roles, actif: true });
    }
    toast.success(`Compte créé pour ${payload.email}. Communique-lui le mot de passe temporaire.`);
    setCreating(false);
    void refetch();
    return {};
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title flex items-center gap-2">
          <UserCog size={12} />
          Utilisateurs du site ({utilisateurs.length})
        </p>
        {isAdmin && (
          <button type="button" className="btn-secondary flex items-center gap-1.5 text-xs" onClick={() => setCreating(true)}>
            <UserPlus size={14} />
            Ajouter un utilisateur
          </button>
        )}
      </div>

      <p className="text-xs text-[color:var(--text-muted)] mb-4">
        {isAdmin
          ? 'Crée un compte directement depuis cet écran, ou gère les rôles et le statut des comptes existants.'
          : 'Cet écran affiche les utilisateurs de ton site.'}
      </p>

      {error && (
        <p className="text-sm text-[color:var(--badge-danger-text)] mb-3">{error}</p>
      )}

      {!loading && !error && utilisateurs.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Aucun utilisateur"
          description="Aucun utilisateur n'est encore rattaché à ce site."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-hover)]">
              <tr>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold">Nom</th>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold">Email</th>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold">Rôles</th>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold w-20">Statut</th>
                {isAdmin && <th className="text-right px-3 py-2.5 text-[color:var(--text-muted)] font-semibold w-16">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {loading ? (
                <tr><td colSpan={isAdmin ? 5 : 4} className="px-3 py-6 text-center text-[color:var(--text-muted)]">Chargement…</td></tr>
              ) : (
                utilisateurs.map(u => (
                  <tr key={u.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="px-3 py-2.5 font-medium text-[color:var(--text-primary)]">{u.prenom} {u.nom}</td>
                    <td className="px-3 py-2.5 text-[color:var(--text-secondary)]">{u.email}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map(r => (
                          <span key={r} className="badge-navy">{ROLE_LABELS[r] ?? r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={u.actif ? 'badge-success' : 'badge-neutral'}>
                        {u.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          className="btn-icon-sm"
                          aria-label={`Modifier les rôles de ${u.prenom} ${u.nom}`}
                          title="Modifier rôles / statut"
                          onClick={() => setModalUser(u)}
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalUser && (
        <UtilisateurRolesModal
          utilisateur={modalUser}
          onClose={() => setModalUser(null)}
          onSave={handleSave}
        />
      )}

      {creating && (
        <CreateUtilisateurModal
          onClose={() => setCreating(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

// ── Modal édition rôles / statut ─────────────────────────────────────────────

function UtilisateurRolesModal({
  utilisateur, onClose, onSave,
}: {
  utilisateur: Utilisateur;
  onClose: () => void;
  onSave: (payload: UpdateUtilisateurRolesPayload) => Promise<void>;
}) {
  const [roles, setRoles] = useState<RoleUtilisateur[]>(utilisateur.roles);
  const [actif, setActif] = useState(utilisateur.actif);
  const [erreur, setErreur] = useState('');
  const [pending, setPending] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(modalRef, onClose);

  function toggleRole(role: RoleUtilisateur) {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
    setErreur('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (roles.length === 0) { setErreur('Sélectionnez au moins un rôle.'); return; }

    setPending(true);
    try {
      await onSave({ roles, actif });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="modal-overlay fixed" onClick={pending ? undefined : onClose} />
      <div className="relative min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="utilisateur-modal-title"
        className="relative bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] w-full sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] rounded-t-2xl overflow-hidden focus:outline-none"
      >
        <div className="bg-[#0077aa] px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-[#00b8e0] rounded-xl flex items-center justify-center flex-shrink-0">
            <UserCog size={18} className="text-[#02101f]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="utilisateur-modal-title" className="text-white font-bold text-base truncate">
              {utilisateur.prenom} {utilisateur.nom}
            </h2>
            <p className="text-white/60 text-xs mt-0.5 truncate">{utilisateur.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            <div>
              <label className="form-label">
                Rôles <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {Object.values(RoleUtilisateur).map(role => {
                  const selected = roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={clsx(
                        'flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-150',
                        selected
                          ? 'border-[#00d4ff] bg-[rgba(0,212,255,0.08)]'
                          : 'border-[var(--border)] bg-[var(--bg-hover)] hover:border-[var(--border-strong)]',
                      )}
                    >
                      <span className={clsx('text-sm font-medium', selected ? 'text-[color:var(--text-primary)]' : 'text-[color:var(--text-secondary)]')}>
                        {ROLE_LABELS[role]}
                      </span>
                      {selected && (
                        <div className="w-5 h-5 bg-[#00d4ff] rounded-full flex items-center justify-center flex-shrink-0">
                          <Check size={12} className="text-[#02101f]" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {erreur && <p className="form-error" role="alert">{erreur}</p>}
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={actif}
                onChange={e => setActif(e.target.checked)}
                className="w-4 h-4 rounded accent-[#00d4ff]"
              />
              <span className="text-sm text-[color:var(--text-secondary)]">Compte actif</span>
            </label>
          </div>

          <div className="border-t border-[var(--border)] px-5 py-4 bg-[var(--bg-hover)] flex items-center justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} disabled={pending} className="btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}

// ── Modal création d'utilisateur ─────────────────────────────────────────────

function CreateUtilisateurModal({
  onClose, onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { email: string; password: string; nom: string; prenom: string; roles: RoleUtilisateur[] }) => Promise<{ error?: string }>;
}) {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<RoleUtilisateur[]>([RoleUtilisateur.DEMANDEUR]);
  const [erreur, setErreur] = useState('');
  const [pending, setPending] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(modalRef, onClose);

  function toggleRole(role: RoleUtilisateur) {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
    setErreur('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (roles.length === 0) { setErreur('Sélectionnez au moins un rôle.'); return; }
    if (password.length < 6) { setErreur('Le mot de passe doit contenir au moins 6 caractères.'); return; }

    setPending(true);
    setErreur('');
    const { error } = await onCreate({ email, password, nom, prenom, roles });
    setPending(false);
    if (error) setErreur(error);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="modal-overlay fixed" onClick={pending ? undefined : onClose} />
      <div className="relative min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="creer-utilisateur-modal-title"
        className="relative bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] w-full sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] rounded-t-2xl overflow-hidden focus:outline-none"
      >
        <div className="bg-[#0077aa] px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-[#00b8e0] rounded-xl flex items-center justify-center flex-shrink-0">
            <UserPlus size={18} className="text-[#02101f]" />
          </div>
          <h2 id="creer-utilisateur-modal-title" className="text-white font-bold text-base truncate">
            Ajouter un utilisateur
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Prénom" required>
                <input
                  type="text"
                  required
                  value={prenom}
                  onChange={e => setPrenom(e.target.value)}
                  className="form-input"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Nom" required>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  className="form-input"
                  autoComplete="off"
                />
              </FormField>
            </div>

            <FormField label="Email" required>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="form-input"
                placeholder="prenom.nom@entreprise.com"
                autoComplete="off"
              />
            </FormField>

            <FormField
              label="Mot de passe temporaire"
              required
              hint="6 caractères minimum. À communiquer toi-même à la personne — aucun email n'est envoyé."
            >
              <input
                type="text"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input"
                autoComplete="off"
              />
            </FormField>

            <div>
              <label className="form-label">
                Rôles <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {Object.values(RoleUtilisateur).map(role => {
                  const selected = roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={clsx(
                        'flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-150',
                        selected
                          ? 'border-[#00d4ff] bg-[rgba(0,212,255,0.08)]'
                          : 'border-[var(--border)] bg-[var(--bg-hover)] hover:border-[var(--border-strong)]',
                      )}
                    >
                      <span className={clsx('text-sm font-medium', selected ? 'text-[color:var(--text-primary)]' : 'text-[color:var(--text-secondary)]')}>
                        {ROLE_LABELS[role]}
                      </span>
                      {selected && (
                        <div className="w-5 h-5 bg-[#00d4ff] rounded-full flex items-center justify-center flex-shrink-0">
                          <Check size={12} className="text-[#02101f]" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {erreur && <p className="form-error" role="alert">{erreur}</p>}
            </div>
          </div>

          <div className="border-t border-[var(--border)] px-5 py-4 bg-[var(--bg-hover)] flex items-center justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} disabled={pending} className="btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Création…' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
