// ─────────────────────────────────────────────────────────────────────────────
// ToastProvider — notifications de confirmation/erreur unifiées pour toute
// l'app. Usage : const toast = useToast(); toast.success('Permis validé');
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext, useCallback, useContext, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200',
  error:   'bg-danger-50 text-[color:var(--badge-danger-text)] border-danger-200',
  info:    'bg-navy-50 text-[color:var(--badge-navy-text)] border-navy-200',
};

const DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((type: ToastType, message: string) => {
    const id = ++nextId.current;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), DURATION_MS);
  }, [remove]);

  const api = useMemo<ToastApi>(() => ({
    success: (message: string) => push('success', message),
    error:   (message: string) => push('error', message),
    info:    (message: string) => push('info', message),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none max-w-[calc(100vw-2rem)]"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map(t => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={clsx(
                'pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-2.5 py-2.5 rounded-xl shadow-lg border text-sm font-medium animate-fade-in-up max-w-sm backdrop-blur-md',
                STYLES[t.type],
              )}
            >
              <Icon size={16} className="flex-shrink-0" aria-hidden="true" />
              <span className="flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => remove(t.id)}
                aria-label="Fermer la notification"
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0.5"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast doit être utilisé à l\'intérieur de <ToastProvider>.');
  }
  return ctx;
}
