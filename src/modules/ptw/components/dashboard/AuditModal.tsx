import { useRef, useState } from 'react';
import { X, ClipboardCheck, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import type { ATView } from '../../types/dashboardView';
import { useModalA11y } from '@/hooks/useModalA11y';

// ── Types ─────────────────────────────────────────────────────────────────────

type TypeAudit = 'PROGRAMME' | 'INOPINE';
type ResultatAudit = 'CONFORME' | 'NON_CONFORME' | 'CONFORME_RESERVES';

interface Props {
  at: ATView;
  onClose: () => void;
  onConfirmer: (data: AuditFormData) => void;
}

export interface AuditFormData {
  type_audit: TypeAudit;
  resultat: ResultatAudit;
  observations: string;
  ecarts: string;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function AuditModal({ at, onClose, onConfirmer }: Props) {
  const [typeAudit,    setTypeAudit]    = useState<TypeAudit>('PROGRAMME');
  const [resultat,     setResultat]     = useState<ResultatAudit>('CONFORME');
  const [observations, setObservations] = useState('');
  const [ecarts,       setEcarts]       = useState('');
  const [erreurs,      setErreurs]      = useState<Record<string, string>>({});
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(modalRef, onClose);

  const TYPES_AUDIT: { value: TypeAudit; label: string; desc: string; icon: string }[] = [
    { value: 'PROGRAMME', label: 'Audit programmé', desc: 'Visite planifiée dans le planning de contrôle', icon: '📅' },
    { value: 'INOPINE',   label: 'Audit inopiné',   desc: 'Visite de contrôle impromptue sur le terrain', icon: '🔍' },
  ];

  const RESULTATS: {
    value: ResultatAudit; label: string; desc: string;
    icon: React.ElementType; cls: string; activeCls: string;
  }[] = [
    { value: 'CONFORME',          label: 'Conforme',          desc: 'Situation conforme au permis',          icon: CheckCircle2, cls: 'border-[var(--border)]', activeCls: 'border-success-400 bg-success-50' },
    { value: 'CONFORME_RESERVES', label: 'Conforme avec réserves', desc: 'Points mineurs à corriger',        icon: AlertCircle,  cls: 'border-[var(--border)]', activeCls: 'border-amber-400 bg-amber-50' },
    { value: 'NON_CONFORME',      label: 'Non conforme',      desc: 'Écarts significatifs — action requise', icon: XCircle,      cls: 'border-[var(--border)]', activeCls: 'border-danger-400 bg-danger-50' },
  ];

  function handleConfirmer() {
    const e: Record<string, string> = {};
    if (!observations.trim()) e.observations = 'Les observations sont obligatoires.';
    if (resultat !== 'CONFORME' && !ecarts.trim()) e.ecarts = 'Décrivez les écarts constatés.';
    if (Object.keys(e).length > 0) { setErreurs(e); return; }
    onConfirmer({ type_audit: typeAudit, resultat, observations, ecarts });
  }

  const resultatSelectionne = RESULTATS.find(r => r.value === resultat)!;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="modal-overlay" onClick={onClose} />

      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-modal-title"
        className="relative bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] w-full sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] rounded-t-2xl overflow-hidden focus:outline-none"
      >

        {/* Header */}
        <div className="bg-[#0077aa] px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardCheck size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 id="audit-modal-title" className="text-white font-bold text-base">Réaliser un audit</h2>
            <p className="text-white/50 text-xs mt-0.5 truncate">{at.numero_at} · {at.zone}</p>
          </div>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Type audit */}
          <div>
            <label className="block text-sm font-semibold text-[color:var(--text-primary)] mb-2">
              Type d'audit <span className="text-danger-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES_AUDIT.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTypeAudit(t.value)}
                  className={clsx(
                    'flex flex-col items-start p-3 rounded-xl border transition-all duration-150 text-left',
                    typeAudit === t.value
                      ? 'border-[#00d4ff] bg-navy-50/30 shadow-sm'
                      : 'border-[var(--border)] bg-[var(--bg-hover)] hover:border-[var(--border)]',
                  )}
                >
                  <span className="text-xl mb-1">{t.icon}</span>
                  <span className={clsx('text-sm font-semibold', typeAudit === t.value ? 'text-[color:var(--badge-navy-text)]' : 'text-[color:var(--text-primary)]')}>
                    {t.label}
                  </span>
                  <span className="text-xs text-[color:var(--text-muted)] mt-0.5 leading-tight">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Résultat */}
          <div>
            <label className="block text-sm font-semibold text-[color:var(--text-primary)] mb-2">
              Résultat de l'audit <span className="text-danger-400">*</span>
            </label>
            <div className="space-y-2">
              {RESULTATS.map(r => {
                const Icon = r.icon;
                const isActive = resultat === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setResultat(r.value)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-150 text-left',
                      isActive ? r.activeCls : r.cls + ' bg-[var(--bg-hover)] hover:border-[var(--border)]',
                    )}
                  >
                    <Icon size={18} className={clsx(
                      'flex-shrink-0',
                      isActive
                        ? r.value === 'CONFORME' ? 'text-success-500'
                        : r.value === 'CONFORME_RESERVES' ? 'text-amber-600'
                        : 'text-danger-500'
                        : 'text-[color:var(--text-muted)]',
                    )} />
                    <div className="flex-1">
                      <p className={clsx('text-sm font-medium', isActive ? 'text-[color:var(--text-primary)]' : 'text-[color:var(--text-secondary)]')}>
                        {r.label}
                      </p>
                      <p className="text-xs text-[color:var(--text-muted)]">{r.desc}</p>
                    </div>
                    {isActive && (
                      <div className={clsx(
                        'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                        r.value === 'CONFORME' ? 'bg-success-500' :
                        r.value === 'CONFORME_RESERVES' ? 'bg-amber-500' : 'bg-danger-500',
                      )}>
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-sm font-semibold text-[color:var(--text-primary)] mb-1.5">
              Observations terrain <span className="text-danger-400">*</span>
            </label>
            <textarea
              className={clsx(
                'w-full border rounded-xl px-3 py-2.5 text-sm text-[color:var(--text-primary)] bg-[var(--bg-input)] resize-none focus:outline-none focus:ring-2',
                erreurs.observations
                  ? 'border-danger-400 focus:ring-danger-200'
                  : 'border-[var(--border-strong)] focus:ring-navy-200 focus:border-navy-400',
              )}
              rows={3}
              placeholder="Décrivez ce que vous avez observé sur le terrain lors de cette visite…"
              value={observations}
              onChange={e => { setObservations(e.target.value); setErreurs(p => ({ ...p, observations: '' })); }}
            />
            {erreurs.observations && <p className="text-danger-400 text-xs mt-1">{erreurs.observations}</p>}
          </div>

          {/* Écarts (si non conforme) */}
          {resultat !== 'CONFORME' && (
            <div>
              <label className="block text-sm font-semibold text-[color:var(--text-primary)] mb-1.5">
                Écarts constatés <span className="text-danger-400">*</span>
              </label>
              <textarea
                className={clsx(
                  'w-full border rounded-xl px-3 py-2.5 text-sm text-[color:var(--text-primary)] bg-[var(--bg-input)] resize-none focus:outline-none focus:ring-2',
                  erreurs.ecarts
                    ? 'border-danger-400 focus:ring-danger-200'
                    : resultat === 'NON_CONFORME'
                    ? 'border-danger-200 focus:ring-danger-200 focus:border-danger-400'
                    : 'border-amber-200 focus:ring-amber-200 focus:border-amber-400',
                )}
                rows={3}
                placeholder="Listez les écarts par rapport au permis de travail…"
                value={ecarts}
                onChange={e => { setEcarts(e.target.value); setErreurs(p => ({ ...p, ecarts: '' })); }}
              />
              {erreurs.ecarts && <p className="text-danger-400 text-xs mt-1">{erreurs.ecarts}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-5 py-4 bg-[var(--bg-hover)] flex items-center gap-3 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={handleConfirmer}
            className={clsx(
              'flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-semibold transition-colors shadow-sm',
              resultatSelectionne.value === 'CONFORME'          ? 'bg-success-600 hover:bg-success-700' :
              resultatSelectionne.value === 'CONFORME_RESERVES' ? 'bg-amber-500 hover:bg-amber-600' :
              'bg-danger-600 hover:bg-danger-700',
            )}
          >
            <ClipboardCheck size={15} />
            Enregistrer l'audit
          </button>
        </div>
      </div>
    </div>
  );
}
