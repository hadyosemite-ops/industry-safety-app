// ─────────────────────────────────────────────────────────────────────────────
// AjouterPermisModal — permet de compléter une AT en BROUILLON (créée
// manuellement ou via l'Assistant HSE) en lui ajoutant un permis de travail,
// avec la même checklist/formulaire que l'étape 2 de l'assistant de création
// (StepPermis/PermisFormCard), mais utilisable à tout moment tant que l'AT
// n'a pas encore été soumise.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { TypePermis } from '../../types';
import type { PermisFormData } from '../creation/ATCreationWizard';
import { TYPES_PERMIS, creerPermisVide } from '../creation/StepPermis';
import { PermisFormCard } from '../creation/PermisFormCard';
import { useModalA11y } from '@/hooks/useModalA11y';

interface Props {
  numeroAt: string;
  onClose: () => void;
  onSave: (payload: PermisFormData) => Promise<boolean>;
}

export function AjouterPermisModal({ numeroAt, onClose, onSave }: Props) {
  const [permis, setPermis] = useState<PermisFormData | null>(null);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(modalRef, () => !pending && onClose());

  function choisirType(type: TypePermis) {
    setPermis(creerPermisVide(type));
    setErreurs({});
  }

  async function handleSave() {
    if (!permis) return;
    if (permis.intervenants.length === 0) {
      setErreurs({ interv_0: 'Ajoutez au moins un intervenant.' });
      return;
    }
    setPending(true);
    const ok = await onSave(permis);
    setPending(false);
    if (ok) onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="modal-overlay fixed" onClick={pending ? undefined : onClose} />
      <div className="relative min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          ref={modalRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ajout-permis-modal-title"
          className="relative bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] rounded-t-2xl overflow-hidden focus:outline-none"
        >
          <div className="bg-[#0077aa] px-5 py-4 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="min-w-0">
              <h2 id="ajout-permis-modal-title" className="text-white font-bold text-base truncate">
                Ajouter un permis
              </h2>
              <p className="text-white/60 text-xs mt-0.5 font-mono">{numeroAt}</p>
            </div>
            <button type="button" onClick={onClose} disabled={pending} className="text-white/60 hover:text-white transition-colors flex-shrink-0 p-1">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {!permis ? (
              <div className="p-5">
                <p className="font-semibold text-[color:var(--text-primary)] mb-4">Choisissez le type de permis</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {TYPES_PERMIS.map(tp => (
                    <button
                      key={tp.value}
                      type="button"
                      onClick={() => choisirType(tp.value)}
                      className={clsx(
                        'group flex flex-col items-center gap-2 p-4 border-2 rounded-xl text-center transition-all duration-150 cursor-pointer',
                        tp.couleur,
                      )}
                    >
                      <span className="text-2xl">{tp.icon}</span>
                      <span className="text-xs font-bold text-[color:var(--text-primary)] leading-tight">{tp.label}</span>
                      <span className="text-xs text-[color:var(--text-secondary)] leading-tight">{tp.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <PermisFormCard
                permis={permis}
                erreurs={erreurs}
                index={0}
                onChange={patch => setPermis(p => (p ? { ...p, ...patch } : p))}
              />
            )}
          </div>

          {permis && (
            <div className="border-t border-[var(--border)] px-5 py-4 bg-[var(--bg-hover)] flex-shrink-0 space-y-2.5">
              {erreurs.interv_0 && (
                <p className="flex items-center gap-1.5 text-xs text-[color:var(--badge-danger-text)]">
                  <AlertCircle size={13} /> {erreurs.interv_0}
                </p>
              )}
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => setPermis(null)} disabled={pending} className="btn-ghost">
                  ← Changer de type
                </button>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={onClose} disabled={pending} className="btn-ghost">
                    Annuler
                  </button>
                  <button type="button" onClick={() => void handleSave()} disabled={pending} className="btn-primary">
                    {pending ? 'Ajout en cours…' : 'Ajouter le permis'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
