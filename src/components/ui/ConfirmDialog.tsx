// ─────────────────────────────────────────────────────────────────────────────
// ConfirmDialog — confirmation générique avant une action destructive
// (suppression, blacklist, rejet…). Accessible : role=dialog, focus trap,
// fermeture Échap, gérés par useModalA11y comme les autres modales de l'app.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { useModalA11y } from '@/hooks/useModalA11y';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** true = style danger (rouge), false = style neutre/accent cyan */
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  useModalA11y(modalRef, onCancel);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-overlay" onClick={pending ? undefined : onCancel} />
      <div
        ref={modalRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            danger ? 'bg-[rgba(255,68,68,0.10)] border border-[rgba(255,68,68,0.3)]' : 'bg-[rgba(0,212,255,0.10)] border border-[rgba(0,212,255,0.3)]',
          )}>
            <AlertTriangle size={18} className={danger ? 'text-[color:var(--badge-danger-text)]' : 'text-[color:var(--badge-navy-text)]'} aria-hidden="true" />
          </div>
          <h2 id="confirm-dialog-title" className="font-bold text-[color:var(--text-primary)] text-base">{title}</h2>
        </div>

        <p id="confirm-dialog-message" className="text-sm text-[color:var(--text-secondary)]">{message}</p>

        <div className="flex justify-end gap-2.5 pt-1">
          <button type="button" onClick={onCancel} disabled={pending} className="btn-ghost">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className={clsx(
              'flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed',
              danger ? 'bg-danger-600 hover:bg-danger-700 text-white' : 'btn-primary',
            )}
          >
            {pending && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
            )}
            {pending ? 'Traitement…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
