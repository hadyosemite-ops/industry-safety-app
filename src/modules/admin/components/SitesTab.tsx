// ─────────────────────────────────────────────────────────────────────────────
// Onglet Sites — liste + création/édition
// RLS : lecture ouverte à tout utilisateur authentifié, écriture (création ET
// modification) réservée à ADMIN. Le bouton "Nouveau site" est donc masqué
// pour les non-ADMIN (cas sans ambiguïté). La modification, elle, reste
// accessible dans l'UI : si un HSE_MANAGER tente de modifier un site, la
// requête sera rejetée par la policy RLS et l'erreur remontée en toast — on
// ne pré-devine pas ce cas plutôt que de dupliquer la logique de rôle partout.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Building2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { UtilisateurProfile } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/ToastProvider';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { useModalA11y } from '@/hooks/useModalA11y';
import * as sitesService from '../services/sitesService';
import type { Site, CreateSitePayload, UpdateSitePayload } from '../types';

interface Props {
  profile: UtilisateurProfile;
}

export function SitesTab({ profile }: Props) {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalSite, setModalSite] = useState<Site | 'new' | null>(null);
  const toast = useToast();

  const isAdmin = profile.roles.includes('ADMIN');

  async function refetch() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await sitesService.listerSites();
    if (err || !data) {
      setError(err?.message ?? 'Impossible de charger les sites.');
      setSites([]);
    } else {
      setSites(data);
    }
    setLoading(false);
  }

  useEffect(() => { void refetch(); }, []);

  async function handleSave(payload: CreateSitePayload | UpdateSitePayload) {
    const isNew = modalSite === 'new';
    const result = isNew
      ? await sitesService.creerSite(payload as CreateSitePayload)
      : await sitesService.modifierSite((modalSite as Site).id, payload as UpdateSitePayload);

    if (result.error) {
      toast.error(
        result.error.code === 'CREATE_ERROR' || result.error.code === 'UPDATE_ERROR'
          ? `Action refusée : ${result.error.message}`
          : result.error.message,
      );
      return;
    }

    toast.success(isNew ? 'Site créé avec succès.' : 'Site modifié avec succès.');
    setModalSite(null);
    void refetch();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title flex items-center gap-2">
          <Building2 size={12} />
          Sites ({sites.length})
        </p>
        {isAdmin && (
          <button type="button" className="btn-primary" onClick={() => setModalSite('new')}>
            <Plus size={14} strokeWidth={2.5} />
            Nouveau site
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-[color:var(--badge-danger-text)] mb-3">{error}</p>
      )}

      {!loading && !error && sites.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucun site enregistré"
          description={isAdmin ? 'Créez le premier site pour commencer.' : 'Aucun site n\'a encore été créé.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-hover)]">
              <tr>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold">Nom</th>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold">Code site</th>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold">Adresse</th>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold w-24">Statut</th>
                <th className="text-right px-3 py-2.5 text-[color:var(--text-muted)] font-semibold w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-[color:var(--text-muted)]">Chargement…</td></tr>
              ) : (
                sites.map(site => (
                  <tr key={site.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="px-3 py-2.5 font-medium text-[color:var(--text-primary)]">{site.nom}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-[color:var(--text-secondary)]">{site.code_site}</td>
                    <td className="px-3 py-2.5 text-[color:var(--text-secondary)]">{site.adresse}</td>
                    <td className="px-3 py-2.5">
                      <span className={site.actif ? 'badge-success' : 'badge-neutral'}>
                        {site.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        className="btn-icon-sm"
                        aria-label={`Modifier ${site.nom}`}
                        title="Modifier"
                        onClick={() => setModalSite(site)}
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalSite && (
        <SiteModal
          site={modalSite === 'new' ? null : modalSite}
          onClose={() => setModalSite(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ── Modal création/édition ───────────────────────────────────────────────────

function SiteModal({
  site, onClose, onSave,
}: {
  site: Site | null;
  onClose: () => void;
  onSave: (payload: CreateSitePayload | UpdateSitePayload) => Promise<void>;
}) {
  const [nom, setNom] = useState(site?.nom ?? '');
  const [adresse, setAdresse] = useState(site?.adresse ?? '');
  const [codeSite, setCodeSite] = useState(site?.code_site ?? '');
  const [actif, setActif] = useState(site?.actif ?? true);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(modalRef, onClose);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!nom.trim()) e2.nom = 'Le nom du site est requis.';
    if (!codeSite.trim()) e2.codeSite = 'Le code site est requis.';
    if (!adresse.trim()) e2.adresse = 'L\'adresse est requise.';
    if (Object.keys(e2).length > 0) { setErreurs(e2); return; }

    setPending(true);
    try {
      await onSave({ nom: nom.trim(), adresse: adresse.trim(), code_site: codeSite.trim(), actif });
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
        aria-labelledby="site-modal-title"
        className="relative bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] w-full sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] rounded-t-2xl overflow-hidden focus:outline-none"
      >
        <div className="bg-[#0077aa] px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-[#00b8e0] rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-[#02101f]" />
          </div>
          <h2 id="site-modal-title" className="text-white font-bold text-base flex-1">
            {site ? 'Modifier le site' : 'Nouveau site'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <FormField label="Nom du site" required error={erreurs.nom}>
              <input
                className={clsx('form-input', erreurs.nom && 'form-input-error')}
                value={nom}
                onChange={e => { setNom(e.target.value); setErreurs(p => ({ ...p, nom: '' })); }}
                placeholder="Ex : Site industriel Nord"
              />
            </FormField>

            <FormField label="Code site" required error={erreurs.codeSite} hint="Identifiant court unique">
              <input
                className={clsx('form-input', erreurs.codeSite && 'form-input-error')}
                value={codeSite}
                onChange={e => { setCodeSite(e.target.value); setErreurs(p => ({ ...p, codeSite: '' })); }}
                placeholder="Ex : SITE-NORD-01"
              />
            </FormField>

            <FormField label="Adresse" required error={erreurs.adresse}>
              <textarea
                className={clsx('form-textarea', erreurs.adresse && 'form-input-error')}
                rows={2}
                value={adresse}
                onChange={e => { setAdresse(e.target.value); setErreurs(p => ({ ...p, adresse: '' })); }}
                placeholder="Adresse complète du site"
              />
            </FormField>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={actif}
                onChange={e => setActif(e.target.checked)}
                className="w-4 h-4 rounded accent-[#00d4ff]"
              />
              <span className="text-sm text-[color:var(--text-secondary)]">Site actif</span>
            </label>
          </div>

          <div className="border-t border-[var(--border)] px-5 py-4 bg-[var(--bg-hover)] flex items-center justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} disabled={pending} className="btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Enregistrement…' : site ? 'Enregistrer' : 'Créer le site'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
