// ─────────────────────────────────────────────────────────────────────────────
// EmptyState — Composant état vide / no-data unifié
// ─────────────────────────────────────────────────────────────────────────────

import type { ElementType, ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { clsx } from 'clsx';

// ── Types ─────────────────────────────────────────────────────────────────────

type EmptyVariant = 'default' | 'search' | 'error' | 'filtered';

interface EmptyStateProps {
  /** Titre */
  title?: string;
  /** Description */
  description?: string;
  /** Icône Lucide */
  icon?: ElementType;
  /** Action CTA */
  action?: ReactNode;
  /** Variante de l'état vide */
  variant?: EmptyVariant;
  /** Taille */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ── Variantes ─────────────────────────────────────────────────────────────────

const DEFAULTS: Record<EmptyVariant, { title: string; description: string }> = {
  default:  { title: 'Aucun élément',       description: 'Rien à afficher pour le moment.' },
  search:   { title: 'Aucun résultat',       description: 'Aucun élément ne correspond à votre recherche.' },
  error:    { title: 'Une erreur est survenue', description: 'Impossible de charger les données.' },
  filtered: { title: 'Aucun résultat',       description: 'Aucun élément ne correspond aux filtres sélectionnés.' },
};

const SIZES: Record<NonNullable<EmptyStateProps['size']>, { wrap: string; icon: number; title: string; desc: string }> = {
  sm: { wrap: 'py-8',  icon: 32, title: 'text-sm font-semibold', desc: 'text-xs' },
  md: { wrap: 'py-14', icon: 44, title: 'text-base font-bold',   desc: 'text-sm' },
  lg: { wrap: 'py-20', icon: 56, title: 'text-lg font-bold',     desc: 'text-base' },
};

// ── Composant ─────────────────────────────────────────────────────────────────

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  variant = 'default',
  size = 'md',
  className,
}: EmptyStateProps) {
  const defaults = DEFAULTS[variant];
  const sz = SIZES[size];

  return (
    <div className={clsx(
      'flex flex-col items-center justify-center text-center px-6',
      sz.wrap,
      className,
    )}>
      {/* Icône dans un cercle */}
      <div className="mb-4 relative">
        <div
          className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center"
          style={{ width: sz.icon + 16, height: sz.icon + 16 }}
        >
          <Icon
            size={sz.icon * 0.6}
            className="text-[color:var(--text-muted)]"
            strokeWidth={1.5}
          />
        </div>
      </div>

      {/* Textes */}
      <p className={clsx('text-[color:var(--text-primary)] mb-1', sz.title)}>
        {title ?? defaults.title}
      </p>
      <p className={clsx('text-[color:var(--text-muted)] max-w-xs', sz.desc)}>
        {description ?? defaults.description}
      </p>

      {/* Action */}
      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  );
}

// ── EmptyState inline (dans un card) ─────────────────────────────────────────

interface InlineEmptyProps {
  message?: string;
  icon?: ElementType;
  className?: string;
}

export function InlineEmpty({ message = 'Aucun élément', icon: Icon = Inbox, className }: InlineEmptyProps) {
  return (
    <div className={clsx('flex items-center gap-2 py-4 text-[color:var(--text-muted)]', className)}>
      <Icon size={15} strokeWidth={1.5} />
      <span className="text-sm italic">{message}</span>
    </div>
  );
}
