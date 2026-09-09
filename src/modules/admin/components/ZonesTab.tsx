// ─────────────────────────────────────────────────────────────────────────────
// Onglet Zones — liste + création/édition/suppression, scopé au site de
// l'utilisateur connecté.
// RLS : écriture (création/modification) réservée à ADMIN/HSE_MANAGER,
// suppression réservée à ADMIN. Le bouton "Nouvelle zone" est donc affiché
// pour ADMIN et HSE_MANAGER ; le bouton "Supprimer" est masqué pour les
// non-ADMIN (cas sans ambiguïté, contrairement à l'édition d'un site).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, MapPinned } from 'lucide-react';
import { clsx } from 'clsx';
import type { UtilisateurProfile } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/ToastProvider';
import { FormField } from '@/components/ui/FormField';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useModalA11y } from '@/hooks/useModalA11y';
import * as zonesService from '../services/zonesService';
import * as utilisateursService from '../services/utilisateursService';
import { NiveauRisque } from '../types';
import type { Zone, Utilisateur, CreateZonePayload, UpdateZonePayload } from '../types';

interface Props {
  profile: UtilisateurProfile;
}

const NIVEAU_LABELS: Record<NiveauRisque, string> = {
  [NiveauRisque.MODERE]: 'Modéré',
  [NiveauRisque.ELEVE]: 'Élevé',
  [NiveauRisque.CRITIQUE]: 'Critique',
};

const NIVEAU_BADGE: Record<NiveauRisque, string> = {
  [NiveauRisque.MODERE]: 'badge-neutral',
  [NiveauRisque.ELEVE]: 'badge-amber',
  [NiveauRisque.CRITIQUE]: 'badge-danger',
};

export function ZonesTab({ profile }: Props) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalZone, setModalZone] = useState<Zone | 'new' | null>(null);
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);
  const toast = useToast();

  const isAdmin = profile.roles.includes('ADMIN');
  const canWrite = isAdmin || profile.roles.includes('HSE_MANAGER');

  async function refetch() {
    setLoading(true);
    setError(null);
    const [zonesRes, usersRes] = await Promise.all([
      zonesService.listerZones(profile.site_id),
      utilisateursService.listerUtilisateurs(profile.site_id),
    ]);

    if (zonesRes.error || !zonesRes.data) {
      setError(zonesRes.error?.message ?? 'Impossible de charger les zones.');
      setZones([]);
    } else {
      setZones(zonesRes.data);
    }
    if (usersRes.data) setUtilisateurs(usersRes.data);
    setLoading(false);
  }

  useEffect(() => { void refetch(); }, [profile.site_id]);

  function nomResponsable(id?: string) {
    if (!id) return '—';
    const u = utilisateurs.find(u => u.id === id);
    return u ? `${u.prenom} ${u.nom}` : '—';
  }

  async function handleSave(payload: CreateZonePayload | UpdateZonePayload) {
    const isNew = modalZone === 'new';
    const result = isNew
      ? await zonesService.creerZone(payload as CreateZonePayload)
      : await zonesService.modifierZone((modalZone as Zone).id, payload as UpdateZonePayload);

    if (result.error) {
      toast.error(`Action refusée : ${result.error.message}`);
      return;
    }

    toast.success(isNew ? 'Zone créée avec succès.' : 'Zone modifiée avec succès.');
    setModalZone(null);
    void refetch();
  }

  async function handleDelete() {
    if (!zoneToDelete) return;
    const result = await zonesService.supprimerZone(zoneToDelete.id);
    if (result.error) {
      toast.error(`Suppression refusée : ${result.error.message}`);
      setZoneToDelete(null);
      return;
    }
    toast.success('Zone supprimée.');
    setZoneToDelete(null);
    void refetch();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title flex items-center gap-2">
          <MapPinned size={12} />
          Zones ({zones.length})
        </p>
        {canWrite && (
          <button type="button" className="btn-primary" onClick={() => setModalZone('new')}>
            <Plus size={14} strokeWidth={2.5} />
            Nouvelle zone
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-[color:var(--badge-danger-text)] mb-3">{error}</p>
      )}

      {!loading && !error && zones.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="Aucune zone enregistrée"
          description={canWrite ? 'Créez la première zone du site.' : 'Aucune zone n\'a encore été créée sur ce site.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-hover)]">
              <tr>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold">Nom</th>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold">Code</th>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold">Risque défaut</th>
                <th className="text-left px-3 py-2.5 text-[color:var(--text-muted)] font-semibold">Responsable</th>
                <th className="text-right px-3 py-2.5 text-[color:var(--text-muted)] font-semibold w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-[color:var(--text-muted)]">Chargement…</td></tr>
              ) : (
                zones.map(zone => (
                  <tr key={zone.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-[color:var(--text-primary)]">{zone.nom}</p>
                      {zone.description && (
                        <p className="text-xs text-[color:var(--text-muted)] truncate max-w-xs">{zone.description}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-[color:var(--text-secondary)]">{zone.code_zone}</td>
                    <td className="px-3 py-2.5">
                      <span className={NIVEAU_BADGE[zone.niveau_risque_defaut]}>
                        {NIVEAU_LABELS[zone.niveau_risque_defaut]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[color:var(--text-secondary)]">{nomResponsable(zone.responsable_id)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canWrite && (
                          <button
                            type="button"
                            className="btn-icon-sm"
                            aria-label={`Modifier ${zone.nom}`}
                            title="Modifier"
                            onClick={() => setModalZone(zone)}
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            className="btn-icon-sm hover:!text-[color:var(--badge-danger-text)]"
                            aria-label={`Supprimer ${zone.nom}`}
                            title="Supprimer"
                            onClick={() => setZoneToDelete(zone)}
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

      {modalZone && (
        <ZoneModal
          zone={modalZone === 'new' ? null : modalZone}
          siteId={profile.site_id}
          utilisateurs={utilisateurs}
          onClose={() => setModalZone(null)}
          onSave={handleSave}
        />
      )}

      {zoneToDelete && (
        <ConfirmDialog
          title="Supprimer la zone"
          message={`Voulez-vous vraiment supprimer la zone « ${zoneToDelete.nom} » ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          danger
          onConfirm={handleDelete}
          onCancel={() => setZoneToDelete(null)}
        />
      )}
    </div>
  );
}

// ── Modal création/édition ───────────────────────────────────────────────────

function ZoneModal({
  zone, siteId, utilisateurs, onClose, onSave,
}: {
  zone: Zone | null;
  siteId: string;
  utilisateurs: Utilisateur[];
  onClose: () => void;
  onSave: (payload: CreateZonePayload | UpdateZonePayload) => Promise<void>;
}) {
  const [nom, setNom] = useState(zone?.nom ?? '');
  const [codeZone, setCodeZone] = useState(zone?.code_zone ?? '');
  const [description, setDescription] = useState(zone?.description ?? '');
  const [niveau, setNiveau] = useState<NiveauRisque>(zone?.niveau_risque_defaut ?? NiveauRisque.MODERE);
  const [responsableId, setResponsableId] = useState(zone?.responsable_id ?? '');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(modalRef, onClose);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (!nom.trim()) e2.nom = 'Le nom de la zone est requis.';
    if (!codeZone.trim()) e2.codeZone = 'Le code de la zone est requis.';
    if (Object.keys(e2).length > 0) { setErreurs(e2); return; }

    setPending(true);
    try {
      await onSave({
        site_id: siteId,
        nom: nom.trim(),
        code_zone: codeZone.trim(),
        description: description.trim() || undefined,
        niveau_risque_defaut: niveau,
        responsable_id: responsableId || null,
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
        aria-labelledby="zone-modal-title"
        className="relative bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] w-full sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] rounded-t-2xl overflow-hidden focus:outline-none"
      >
        <div className="bg-[#0077aa] px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-[#00b8e0] rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPinned size={18} className="text-[#02101f]" />
          </div>
          <h2 id="zone-modal-title" className="text-white font-bold text-base flex-1">
            {zone ? 'Modifier la zone' : 'Nouvelle zone'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <FormField label="Nom de la zone" required error={erreurs.nom}>
              <input
                className={clsx('form-input', erreurs.nom && 'form-input-error')}
                value={nom}
                onChange={e => { setNom(e.target.value); setErreurs(p => ({ ...p, nom: '' })); }}
                placeholder="Ex : Atelier chaudronnerie"
              />
            </FormField>

            <FormField label="Code zone" required error={erreurs.codeZone}>
              <input
                className={clsx('form-input', erreurs.codeZone && 'form-input-error')}
                value={codeZone}
                onChange={e => { setCodeZone(e.target.value); setErreurs(p => ({ ...p, codeZone: '' })); }}
                placeholder="Ex : Z-CHAUD-01"
              />
            </FormField>

            <FormField label="Description" hint="Optionnel">
              <textarea
                className="form-textarea"
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description de la zone"
              />
            </FormField>

            <FormField label="Niveau de risque par défaut" required>
              <select
                className="form-select"
                value={niveau}
                onChange={e => setNiveau(e.target.value as NiveauRisque)}
              >
                {Object.values(NiveauRisque).map(n => (
                  <option key={n} value={n}>{NIVEAU_LABELS[n]}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Responsable de zone" hint="Optionnel — parmi les utilisateurs du site">
              <select
                className="form-select"
                value={responsableId}
                onChange={e => setResponsableId(e.target.value)}
              >
                <option value="">Aucun</option>
                {utilisateurs.map(u => (
                  <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="border-t border-[var(--border)] px-5 py-4 bg-[var(--bg-hover)] flex items-center justify-end gap-3 flex-shrink-0">
            <button type="button" onClick={onClose} disabled={pending} className="btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? 'Enregistrement…' : zone ? 'Enregistrer' : 'Créer la zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
