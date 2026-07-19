// ─────────────────────────────────────────────────────────────────────────────
// PageContainer — Wrapper unifié pour les pages de module
// Gère le padding, max-width, et les sections standards
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react';
import { clsx } from 'clsx';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PageContainerProps {
  children: ReactNode;
  /** Max width : 'md' = 768, 'lg' = 1024, 'xl' = 1280, '2xl' = 1536, 'full' = 100% */
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Padding horizontal */
  padX?: boolean;
  /** Padding top (espace après le header sticky) */
  padTop?: boolean;
  className?: string;
}

const MAX_W: Record<NonNullable<PageContainerProps['maxWidth']>, string> = {
  md:   'max-w-3xl',
  lg:   'max-w-5xl',
  xl:   'max-w-6xl',
  '2xl':'max-w-7xl',
  full: 'max-w-none',
};

// ── PageContainer ─────────────────────────────────────────────────────────────

export function PageContainer({
  children,
  maxWidth = 'xl',
  padX = true,
  padTop = true,
  className,
}: PageContainerProps) {
  return (
    <div className={clsx(
      'mx-auto w-full',
      MAX_W[maxWidth],
      padX   && 'px-6',
      padTop && 'pt-6',
      'pb-10',
      className,
    )}>
      {children}
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

interface SectionProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ title, description, action, children, className }: SectionProps) {
  return (
    <section className={clsx('space-y-4', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-base font-bold text-[color:var(--text-primary)] tracking-tight">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-[color:var(--text-secondary)] mt-0.5">{description}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

// ── PageSection avec séparateur ───────────────────────────────────────────────

interface PageSectionProps {
  children: ReactNode;
  className?: string;
}

export function PageSection({ children, className }: PageSectionProps) {
  return (
    <div className={clsx('space-y-6', className)}>
      {children}
    </div>
  );
}

// ── Toolbar (barre de filtres / actions sous le header) ───────────────────────

interface ToolbarProps {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function Toolbar({ left, right, className }: ToolbarProps) {
  return (
    <div className={clsx(
      'flex items-center justify-between gap-4 flex-wrap',
      className,
    )}>
      <div className="flex items-center gap-3 flex-1 min-w-0">{left}</div>
      <div className="flex items-center gap-2 flex-shrink-0">{right}</div>
    </div>
  );
}
