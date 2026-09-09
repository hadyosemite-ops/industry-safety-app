// ─────────────────────────────────────────────────────────────────────────────
// Onglet Intervenants externes — annuaire réutilisable des personnes et
// entreprises externes (migration 004_referentiels.sql), scopé au site de
// l'utilisateur connecté.
// RLS : écriture (création/modification) réservée à DEMANDEUR/HSE_MANAGER/
// ADMIN, suppression réservée à ADMIN.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, HardHat, Phone, Mail } from 'lucide-react';
import { clsx } from 'clsx';
import type { UtilisateurProfile } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/ToastProvider';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TagInput } from '@/components/ui/TagInput';
import { useModalA11y } from '@/hooks/useModalA11y';
import * as intervenantsService from '../services/intervenantsService';
import type {
  IntervenantExterne, CreateIntervenantExternePayload, UpdateIntervenantExternePayload,
} from '../types';

interface Props {
  profile: UtilisateurProfile;
}

export function IntervenantsTab({ profile }: Props) {
  const [intervenants, setIntervenants] = useState<IntervenantExterne[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalIntervenant, setModalIntervenant] = useState<IntervenantExterne | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<IntervenantExterne | null>(null);
  const toast = useToast();

  const isAdmin = profile.roles.includes('ADMIN');
  const canWrite = isAdmin || profile.roles.includes('HSE_MANAGER') || profile.roles.includes('DEMANDEUR');

  async function refetch() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await intervenantsService.listerIntervenants(profile.site_id);
    if (err || !data) {
      setError(err?.message ?? 'Impossible de charger les intervenants.');
      setIntervenants([]);
    } else {
      setIntervenants(data);
    }
    setLoading(false);
  }

  useEffect(() => { void refetch(); }, [profile.site_id]);

  async function handleSave(payload: CreateIntervenantExternePayload | UpdateIntervenantExternePayload) {
    const isNew = modalIntervenant === 'new';
    const result = isNew
      ? await intervenantsService.creerIntervenant(payload as CreateIntervenantExternePayload)
      : await intervenantsService.modifierIntervenant(
          (modalIntervenant as IntervenantExterne).id,
          payload as UpdateIntervenantExternePayload,
        );

    if (result.error) {
      toast.error(`Action refusée : ${result.error.message}`);
      return;
    }

    toast.success(isNew ? 'Intervenant ajouté avec succès.' : 'Intervenant modifié avec succès.');
    setModalIntervenant(null);
    void refetch();
  }

  async function handleDelete() {
    if (!toDelete) return;
    const result = await intervenantsService.supprimerIntervenant(toDelete.id);
    if (result.error) {
      toast.error(`Suppression refusée : ${result.error.message}`);
      setToDelete(null);
      return;
    }
    toast.success('Intervenant supprimé.');
    setToDelete(null);
    void refetch();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title flex items-center gap-2">
          <HardHat size={12} />
          Intervenants externes ({intervenants.length})
        </p>
        {canWrite && (
          <button type="button" className="btn-primary" onClick={() => setModalIntervenant('new')}>
            <Plus size={14} strokeWidth={2.5} />
            Nouvel intervenant
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-[color:var(--badge-danger-text)] mb-3">{error}</p>
      )}

      {!loading && !error && intervenants.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title="Aucun intervenant externe"
          description={canWrite ? 'Ajoutez une personne ou entreprise externe réutilisable.' : 'Aucun intervenant externe n\'a encore été ajouté.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-hover)]">
              <tr>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold">Nom</th>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold">Entreprise</th>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold">Habilitations</th>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold">Contact</th>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold w-20">Statut</th>
                <th className="text-right px-3 py-2.5 text-[color:var(--text-muted)] font-semibold w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {loading ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-[color:var(--text-muted)]">Chargement…</td></tr>
              ) : (
                intervenants.map(i => (
                  <tr key={i.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="px-3 py-2.5 font-medium text-[color:var(--text-primary)]">{i.nom_complet}</td>
                    <td className="px-3 py-2.5 text-[color:var(--text-secondary)]">{i.entreprise || '—'}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(i.habilitations ?? []).length > 0
                          ? i.habilitations!.map(h => (
                              <span key={h} className="badge-navy">{h}</span>
                            ))
                          : <span className="text-[color:var(--text-muted)]">—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[color:var(--text-secondary)] whitespace-nowrap">
                      {i.telephone && <span className="flex items-center gap-1 mb-0.5"><Phone size={11} />{i.telephone}</span>}
                      {i.email && <span className="flex items-center gap-1"><Mail size={11} />{i.email}</span>}
                      {!i.telephone && !i.email && '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={i.actif ? 'badge-success' : 'badge-neutral'}>
                        {i.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canWrite && (
                          <button
                            type="button"
                            className="btn-icon-sm"
                            aria-label={`Modifier ${i.nom_complet}`}
                            title="Modifier"
                            onClick={() => setModalIntervenant(i)}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            className="btn-icon-sm hover:!text-[color:var(--badge-danger-text)]"
                            aria-label={`Supprimer ${i.nom_complet}`}
                            title="Supprimer"
                            onClick={() => setToDelete(i)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalIntervenant && (
        <IntervenantModal
          intervenant={modalIntervenant === 'new' ? null : modalIntervenant}
          siteId={profile.site_id}
          onClose={() => setModalIntervenant(null)}
          onSave={handleSave}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Supprimer l'intervenant"
          message={`Voulez-vous vraiment supprimer « ${toDelete.nom_complet} » de l'annuaire ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          danger
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

// ── Modal création/édition ───────────────────────────────────────────────────

function IntervenantModal({
  intervenant, siteId, onClose, onSave,
}: {
  intervenant: IntervenantExterne | null;
  siteId: string;
  onClose: () => void;
  onSave: (payload: CreateIntervenantExternePayload | UpdateIntervenantExternePayload) => Promise<void>;
}) {
  const [nomComplet, setNomComplet] = useState(intervenant?.nom_complet ?? '');
  const [entreprise, setEntreprise] = useState(intervenant?.entreprise ?? '');
  const [habilitations, setHabilitations] = useState<string[]>(intervenant?.habilitations ?? []);
  const [telephone, setTelephone] = useState(intervenant?.telephone ?? '');
  const [email, setEmail] = useState(intervenant?.email ?? '');
  const [actif, setActif] = useState(intervenant?.actif ?? true);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(modalRef, onClose);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!nomComplet.trim()) e2.nomComplet = 'Le nom complet est requis.';
    if (Object.keys(e2).length > 0) { setErreurs(e2); return; }

    setPending(true);
    try {
      await onSave({
        site_id: siteId,
        nom_complet: nomComplet.trim(),
        entreprise: entreprise.trim() || undefined,
        habilitations,
        telephone: telephone.trim() || undefined,
        email: email.trim() || undefined,
        actif,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="modal-overlay" onClick={pending ? undefined : onClose} />
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intervenant-modal-title"
        className="relative bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] w-full sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] rounded-t-2xl overflow-hidden focus:outline-none"
      >
        <div className="bg-[#0077aa] px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-[#00b8e0] rounded-xl flex items-center justify-center flex-shrink-0">
            <HardHat size={18} className="text-[#02101f]" />
          </div>
          <h2 id="intervenant-modal-title" className="text-white font-bold text-base flex-1">
            {intervenant ? 'Modifier l\'intervenant' : 'Nouvel intervenant externe'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <FormField label="Nom complet" required error={erreurs.nomComplet}>
              <input
                className={clsx('form-input', erreurs.nomComplet && 'form-input-error')}
                value={nomComplet}
                onChange={e => { setNomComplet(e.target.value); setErreurs(p => ({ ...p, nomComplet: '' })); }}
                placeholder="Ex : Jean Dupont"
              />
            </FormField>

            <FormField label="Entreprise" hint="Optionnel">
              <input
                className="form-input"
                value={entreprise}
                onChange={e => setEntreprise(e.target.value)}
                placeholder="Ex : SARL Maintenance Pro"
              />
            </FormField>

            <FormField label="Habilitations" hint="Ex : H0, B1, CACES R482 — Entrée pour ajouter">
              <TagInput
                value={habilitations}
                onChange={setHabilitations}
                placeholder="Ajouter une habilitation…"
              />
            </FormField>

            <FormField label="Téléphone" hint="Optionnel">
              <input
                type="tel"
                className="form-input"
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
                placeholder="Ex : 06 12 34 56 78"
              />
            </FormField>

            <FormField label="Email" hint="Optionnel">
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ex : jean.dupont@entreprise.fr"
              />
            </FormField>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={actif}
                onChange={e => setActif(e.target.checked)}
                className="w-4 h-4 rounded accent-[#00d4ff]"
              />
              <span className="text-sm text-[color:var(--text-secondary)]">Intervenant actif</span>
            </label>
          </div>

          <div className="border-t border-[var(--border)] px-5 py-4 bg-[var(--bg-hover)] flex items-center justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} disabled={pending} className="btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Enregistrement…' : intervenant ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
