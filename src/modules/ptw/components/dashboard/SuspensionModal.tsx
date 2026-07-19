import { useRef, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import type { ATView } from '../../types/dashboardView';
import { TypeEcart } from '../../types';
import { useModalA11y } from '@/hooks/useModalA11y';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  at: ATView;
  onClose: () => void;
  onConfirmer: (data: SuspensionFormData) => void;
}

export interface SuspensionFormData {
  type_ecart: TypeEcart;
  description_ecart: string;
  mesures_correctives: string;
}

// ── Données référence ─────────────────────────────────────────────────────────

const TYPES_ECART: { value: TypeEcart; label: string; desc: string; icon: string }[] = [
  { value: TypeEcart.EPI_MANQUANT,             label: 'EPI manquant / non conforme', desc: 'EPI absents, endommagés ou périmés', icon: '🦺' },
  { value: TypeEcart.ZONE_NON_SECURISEE,       label: 'Zone non sécurisée',          desc: 'Balisage insuffisant ou absent',    icon: '⚠️' },
  { value: TypeEcart.INTERVENANT_NON_HABILITE, label: 'Intervenant non habilité',    desc: 'Personne sans habilitation requise', icon: '🚫' },
  { value: TypeEcart.DEFAUT_ISOLATION,         label: 'Défaut de consignation',      desc: 'LOTO ou isolation non conforme',    icon: '🔒' },
  { value: TypeEcart.ECART_PROCEDURE,          label: 'Non-respect procédure',       desc: 'Écart par rapport au permis signé', icon: '📋' },
  { value: TypeEcart.RISQUE_TIERS,             label: 'Risque pour tiers',           desc: 'Danger identifié pour d\'autres',  icon: '👥' },
  { value: TypeEcart.AUTRE,                    label: 'Autre',                       desc: 'Autre type d\'écart constaté',     icon: '📌' },
];

// ── Composant ─────────────────────────────────────────────────────────────────

export function SuspensionModal({ at, onClose, onConfirmer }: Props) {
  const [typeEcart, setTypeEcart] = useState<TypeEcart>(TypeEcart.EPI_MANQUANT);
  const [description, setDescription] = useState('');
  const [mesures, setMesures] = useState('');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [etape, setEtape] = useState<'form' | 'confirm'>('form');
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(modalRef, onClose);

  function valider() {
    const e: Record<string, string> = {};
    if (!description.trim()) e.description = 'Décrivez l\'écart observé.';
    if (!mesures.trim())     e.mesures     = 'Précisez les mesures correctives requises.';
    if (Object.keys(e).length > 0) { setErreurs(e); return; }
    setEtape('confirm');
  }

  function confirmer() {
    onConfirmer({ type_ecart: typeEcart, description_ecart: description, mesures_correctives: mesures });
  }

  const typeSelectionne = TYPES_ECART.find(t => t.value === typeEcart)!;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="modal-overlay" onClick={onClose} />

      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="suspension-modal-title"
        className="relative bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] w-full sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] rounded-t-2xl overflow-hidden focus:outline-none"
      >

        {/* Header */}
        <div className="bg-orange-600 px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 id="suspension-modal-title" className="text-white font-bold text-base">Suspendre l'AT</h2>
            <p className="text-orange-100 text-xs mt-0.5 truncate">{at.numero_at} · {at.zone}</p>
          </div>
          <button type="button" onClick={onClose} className="text-orange-200 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* Alerte */}
        <div className="bg-safety-50 border-b border-safety-100 px-5 py-3">
          <p className="text-[color:var(--badge-safety-text)] text-sm">
            <strong>Attention :</strong> la suspension arrête immédiatement tous les travaux liés à cette AT.
            Tous les permis actifs seront suspendus en cascade.
          </p>
        </div>

        {etape === 'form' ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

              {/* Type d'écart */}
              <div>
                <label className="block text-sm font-semibold text-[color:var(--text-primary)] mb-2.5">
                  Type d'écart constaté <span className="text-danger-400">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {TYPES_ECART.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTypeEcart(t.value)}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all duration-150',
                        typeEcart === t.value
                          ? 'border-safety-400 bg-safety-50 shadow-sm'
                          : 'border-[var(--border)] bg-[var(--bg-hover)] hover:border-[var(--border)]',
                      )}
                    >
                      <span className="text-xl leading-none flex-shrink-0">{t.icon}</span>
                      <div className="min-w-0">
                        <p className={clsx('text-sm font-medium', typeEcart === t.value ? 'text-[color:var(--badge-safety-text)]' : 'text-[color:var(--text-primary)]')}>
                          {t.label}
                        </p>
                        <p className="text-xs text-[color:var(--text-muted)] truncate">{t.desc}</p>
                      </div>
                      {typeEcart === t.value && (
                        <div className="ml-auto w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-[color:var(--text-primary)] mb-1.5">
                  Description de l'écart <span className="text-danger-400">*</span>
                </label>
                <textarea
                  className={clsx(
                    'w-full border rounded-xl px-3 py-2.5 text-sm text-[color:var(--text-primary)] bg-[var(--bg-input)] resize-none focus:outline-none focus:ring-2',
                    erreurs.description
                      ? 'border-danger-400 focus:ring-danger-200'
                      : 'border-[var(--border-strong)] focus:ring-safety-200 focus:border-safety-400',
                  )}
                  rows={3}
                  placeholder="Décrivez précisément ce qui a été observé sur le terrain…"
                  value={description}
                  onChange={e => { setDescription(e.target.value); setErreurs(p => ({ ...p, description: '' })); }}
                />
                {erreurs.description && <p className="text-danger-400 text-xs mt-1">{erreurs.description}</p>}
              </div>

              {/* Mesures correctives */}
              <div>
                <label className="block text-sm font-semibold text-[color:var(--text-primary)] mb-1.5">
                  Mesures correctives requises <span className="text-danger-400">*</span>
                </label>
                <textarea
                  className={clsx(
                    'w-full border rounded-xl px-3 py-2.5 text-sm text-[color:var(--text-primary)] bg-[var(--bg-input)] resize-none focus:outline-none focus:ring-2',
                    erreurs.mesures
                      ? 'border-danger-400 focus:ring-danger-200'
                      : 'border-[var(--border-strong)] focus:ring-safety-200 focus:border-safety-400',
                  )}
                  rows={3}
                  placeholder="Que doit-on faire pour lever cette suspension ? Matériel, formation, procédure…"
                  value={mesures}
                  onChange={e => { setMesures(e.target.value); setErreurs(p => ({ ...p, mesures: '' })); }}
                />
                {erreurs.mesures && <p className="text-danger-400 text-xs mt-1">{erreurs.mesures}</p>}
              </div>
            </div>

            <div className="border-t border-[var(--border)] px-5 py-4 bg-[var(--bg-hover)] flex items-center gap-3 flex-shrink-0">
              <button type="button" onClick={onClose} className="btn-ghost flex-1 sm:flex-none">
                Annuler
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={valider}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-safety-600 text-white text-sm font-semibold hover:bg-safety-500 transition-colors shadow-sm"
              >
                <AlertTriangle size={15} />
                Suspendre l'AT
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 px-5 py-5">
              <div className="bg-safety-50 border border-safety-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{typeSelectionne.icon}</span>
                  <div>
                    <p className="font-bold text-[color:var(--badge-safety-text)]">{typeSelectionne.label}</p>
                    <p className="text-xs text-safety-400">Type d'écart</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[color:var(--badge-safety-text)] uppercase tracking-wider mb-1">Écart constaté</p>
                  <p className="text-sm text-[color:var(--badge-safety-text)]">{description}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[color:var(--badge-safety-text)] uppercase tracking-wider mb-1">Mesures requises</p>
                  <p className="text-sm text-[color:var(--badge-safety-text)]">{mesures}</p>
                </div>
              </div>
              <p className="text-center text-sm text-[color:var(--text-secondary)] mt-4">
                Confirmez-vous la suspension de l'AT <strong>{at.numero_at}</strong> ?
              </p>
            </div>

            <div className="border-t border-[var(--border)] px-5 py-4 bg-[var(--bg-hover)] flex items-center gap-3 flex-shrink-0">
              <button type="button" onClick={() => setEtape('form')} className="btn-ghost">
                ← Modifier
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={confirmer}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-safety-600 text-white text-sm font-semibold hover:bg-safety-500 transition-colors shadow-sm"
              >
                <AlertTriangle size={15} />
                Confirmer la suspension
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
