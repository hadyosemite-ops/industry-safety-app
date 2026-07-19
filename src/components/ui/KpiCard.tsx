// ─────────────────────────────────────────────────────────────────────────────
// KpiCard — Carte métrique KPI unifiée
// Usage : <KpiCard label="AT actives" value={12} trend={+2} icon={Shield} color="navy" />
// ─────────────────────────────────────────────────────────────────────────────

import type { ElementType, ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';

// ── Types ─────────────────────────────────────────────────────────────────────

type KpiColor = 'navy' | 'success' | 'danger' | 'amber' | 'safety' | 'neutral';

interface KpiCardProps {
  /** Libellé de la métrique */
  label: string;
  /** Valeur principale */
  value: string | number;
  /** Sous-valeur ou unité */
  sub?: string;
  /** Variation par rapport à la période précédente */
  trend?: number;
  /** Texte de contexte du trend (ex: "vs mois dernier") */
  trendLabel?: string;
  /** Icône Lucide */
  icon?: ElementType;
  /** Contenu libre en bas (ex: progress bar) */
  footer?: ReactNode;
  /** Palette couleur */
  color?: KpiColor;
  /** Loader skeleton */
  loading?: boolean;
  /** Clic sur la card */
  onClick?: () => void;
  className?: string;
}

// ── Palettes couleur ──────────────────────────────────────────────────────────

const PALETTE: Record<KpiColor, {
  bg: string; icon: string; iconBg: string; value: string;
}> = {
  navy:    { bg: 'card',  icon: 'text-[color:var(--badge-navy-text)]',    iconBg: 'bg-[rgba(0,212,255,0.10)] border-[rgba(0,212,255,0.25)]', value: 'text-[color:var(--text-primary)]' },
  success: { bg: 'card',  icon: 'text-[color:var(--badge-success-text)]', iconBg: 'bg-[rgba(0,230,118,0.10)] border-[rgba(0,230,118,0.25)]', value: 'text-[color:var(--text-primary)]' },
  danger:  { bg: 'card',  icon: 'text-[color:var(--badge-danger-text)]',  iconBg: 'bg-[rgba(255,68,68,0.10)] border-[rgba(255,68,68,0.25)]', value: 'text-[color:var(--text-primary)]' },
  amber:   { bg: 'card',  icon: 'text-[color:var(--badge-amber-text)]',   iconBg: 'bg-[rgba(255,179,0,0.10)] border-[rgba(255,179,0,0.25)]', value: 'text-[color:var(--text-primary)]' },
  safety:  { bg: 'card',  icon: 'text-[color:var(--badge-safety-text)]',  iconBg: 'bg-[rgba(255,140,66,0.10)] border-[rgba(255,140,66,0.25)]', value: 'text-[color:var(--text-primary)]' },
  neutral: { bg: 'card',  icon: 'text-[color:var(--text-muted)]',         iconBg: 'bg-[var(--bg-elevated)] border-[var(--border)]', value: 'text-[color:var(--text-primary)]' },
};

// ── Composant skeleton ────────────────────────────────────────────────────────

function KpiCardSkeleton() {
  return (
    <div className="card shadow-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-9 w-9 rounded-lg" />
      </div>
      <div className="skeleton h-8 w-16 rounded" />
      <div className="skeleton h-3 w-20 rounded" />
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function KpiCard({
  label, value, sub, trend, trendLabel = 'vs période préc.',
  icon: Icon, footer, color = 'navy', loading = false,
  onClick, className,
}: KpiCardProps) {
  if (loading) return <KpiCardSkeleton />;

  const pal = PALETTE[color];

  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;
  const trendNeutral  = trend !== undefined && trend === 0;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'shadow-card p-5 flex flex-col gap-3',
        'transition-all duration-200',
        pal.bg,
        onClick
          ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-0'
          : '',
        className,
      )}
    >
      {/* ── Header : label + icône ── */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[color:var(--text-secondary)] leading-tight">{label}</p>
        {Icon && (
          <div className={clsx(
            'w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0',
            pal.iconBg,
          )}>
            <Icon size={17} className={pal.icon} strokeWidth={1.75} />
          </div>
        )}
      </div>

      {/* ── Valeur ── */}
      <div className="flex items-baseline gap-2">
        <span className={clsx('text-3xl font-bold tracking-tight font-tight', pal.value)}>
          {value}
        </span>
        {sub && (
          <span className="text-sm text-[color:var(--text-muted)] font-medium">{sub}</span>
        )}
      </div>

      {/* ── Trend ── */}
      {trend !== undefined && (
        <div className="flex items-center gap-1.5">
          <span className={clsx(
            'inline-flex items-center gap-0.5 text-xs font-semibold',
            trendPositive ? 'text-[color:var(--badge-success-text)]' :
            trendNegative ? 'text-[color:var(--badge-danger-text)]'  :
            'text-[color:var(--text-muted)]',
          )}>
            {trendPositive && <TrendingUp  size={12} />}
            {trendNegative && <TrendingDown size={12} />}
            {trendNeutral  && <Minus size={12} />}
            {trendPositive ? '+' : ''}{trend}
          </span>
          <span className="text-xs text-[color:var(--text-muted)]">{trendLabel}</span>
        </div>
      )}

      {/* ── Footer libre ── */}
      {footer && (
        <div className="border-t border-[var(--border-faint)] pt-3">
          {footer}
        </div>
      )}
    </div>
  );
}

// ── Grille KPI helper ─────────────────────────────────────────────────────────

interface KpiGridProps {
  children: ReactNode;
  cols?: 2 | 3 | 4 | 5;
  className?: string;
}

export function KpiGrid({ children, cols = 4, className }: KpiGridProps) {
  return (
    <div className={clsx(
      'grid gap-4',
      cols === 2 ? 'grid-cols-1 sm:grid-cols-2' :
      cols === 3 ? 'grid-cols-1 sm:grid-cols-3' :
      cols === 4 ? 'grid-cols-2 lg:grid-cols-4' :
                   'grid-cols-2 lg:grid-cols-5',
      className,
    )}>
      {children}
    </div>
  );
}
