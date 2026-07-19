import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';
import { cloneElement, isValidElement, useId, type ReactElement } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Associe automatiquement le <label> à son champ (id/htmlFor) et relie
// hint/erreur via aria-describedby, sans exiger que chaque appelant gère
// lui-même les identifiants. Ne s'applique que lorsque `children` est un
// unique élément de formulaire sans id déjà défini — sinon on laisse tel
// quel (ex. champs composites comme un stepper +/-).
// ─────────────────────────────────────────────────────────────────────────────

export function FormField({ label, error, required, hint, children, className }: FormFieldProps) {
  const autoId = useId();
  const hintId = hint ? `${autoId}-hint` : undefined;
  const errorId = error ? `${autoId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const canInject = isValidElement(children) && !(children.props as { id?: string }).id;
  const content = canInject
    ? cloneElement(children as ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>, {
        id: autoId,
        'aria-describedby': describedBy,
        'aria-invalid': Boolean(error),
      })
    : children;

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={canInject ? autoId : undefined} className="form-label">
        {label}
        {required && (
          <>
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            <span className="sr-only"> (obligatoire)</span>
          </>
        )}
      </label>
      {content}
      {hint && !error && (
        <p id={hintId} className="text-xs text-[color:var(--text-muted)]">{hint}</p>
      )}
      {error && (
        <p id={errorId} className="form-error" role="alert">
          <AlertCircle size={12} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
