// ─────────────────────────────────────────────────────────────────────────────
// StatusBadge — Système de badges unifié pour toute l'application
// Usage : <StatusBadge status="ACTIVE" />  ou  <StatusBadge label="En cours" color="amber" />
// ─────────────────────────────────────────────────────────────────────────────

import { clsx } from 'clsx';

// ── Types ─────────────────────────────────────────────────────────────────────

type BadgeColor = 'navy' | 'success' | 'danger' | 'amber' | 'safety' | 'neutral' | 'purple' | 'teal';
type BadgeSize  = 'xs' | 'sm' | 'md';
type BadgeVariant = 'filled' | 'soft' | 'outline';

interface StatusBadgeProps {
  /** Libellé affiché */
  label: string;
  /** Couleur */
  color?: BadgeColor;
  /** Taille */
  size?: BadgeSize;
  /** Style */
  variant?: BadgeVariant;
  /** Afficher le point de statut */
  dot?: boolean;
  /** Icône optionnelle (texte/emoji) */
  icon?: string;
  className?: string;
}

// ── Palettes ──────────────────────────────────────────────────────────────────

const COLORS: Record<BadgeColor, Record<BadgeVariant, string>> = {
  navy:    {
    filled:  'bg-[#00b8e0]  text-[#02101f]    border-transparent',
    soft:    'bg-[rgba(0,212,255,0.10)] text-[color:var(--badge-navy-text)] border-[rgba(0,212,255,0.3)]',
    outline: 'bg-transparent text-[color:var(--badge-navy-text)] border-[rgba(0,212,255,0.4)]',
  },
  success: {
    filled:  'bg-[#00c765]  text-[#02101f]    border-transparent',
    soft:    'bg-[rgba(0,230,118,0.10)] text-[color:var(--badge-success-text)] border-[rgba(0,230,118,0.3)]',
    outline: 'bg-transparent text-[color:var(--badge-success-text)] border-[rgba(0,230,118,0.4)]',
  },
  danger:  {
    filled:  'bg-[#e63939]  text-white        border-transparent',
    soft:    'bg-[rgba(255,68,68,0.10)] text-[color:var(--badge-danger-text)] border-[rgba(255,68,68,0.3)]',
    outline: 'bg-transparent text-[color:var(--badge-danger-text)] border-[rgba(255,68,68,0.4)]',
  },
  amber:   {
    filled:  'bg-[#ffb300]  text-[#02101f]    border-transparent',
    soft:    'bg-[rgba(255,179,0,0.10)] text-[color:var(--badge-amber-text)] border-[rgba(255,179,0,0.3)]',
    outline: 'bg-transparent text-[color:var(--badge-amber-text)] border-[rgba(255,179,0,0.4)]',
  },
  safety:  {
    filled:  'bg-[#ff7a1a]  text-white        border-transparent',
    soft:    'bg-[rgba(255,140,66,0.10)] text-[color:var(--badge-safety-text)] border-[rgba(255,140,66,0.3)]',
    outline: 'bg-transparent text-[color:var(--badge-safety-text)] border-[rgba(255,140,66,0.4)]',
  },
  neutral: {
    filled:  'bg-[#2a5070]  text-white        border-transparent',
    soft:    'bg-[var(--bg-elevated)] text-[color:var(--text-secondary)] border-[var(--border)]',
    outline: 'bg-transparent text-[color:var(--text-secondary)] border-[var(--border)]',
  },
  purple: {
    filled:  'bg-violet-600 text-white        border-transparent',
    soft:    'bg-violet-500/10 text-[color:var(--badge-purple-text)] border-violet-400/30',
    outline: 'bg-transparent text-[color:var(--badge-purple-text)] border-violet-400/40',
  },
  teal: {
    filled:  'bg-teal-600  text-white         border-transparent',
    soft:    'bg-teal-500/10 text-[color:var(--badge-teal-text)] border-teal-400/30',
    outline: 'bg-transparent text-[color:var(--badge-teal-text)] border-teal-400/40',
  },
};

const DOT_COLORS: Record<BadgeColor, string> = {
  navy:    'bg-[#00d4ff]',
  success: 'bg-[#00e676]',
  danger:  'bg-[#ff4444]',
  amber:   'bg-[#ffb300]',
  safety:  'bg-[#ff7a1a]',
  neutral: 'bg-slate-400',
  purple:  'bg-violet-400',
  teal:    'bg-teal-400',
};

const SIZES: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 gap-1',
  sm: 'text-xs     px-2   py-0.5 gap-1',
  md: 'text-xs     px-2.5 py-1   gap-1.5',
};

const DOT_SIZES: Record<BadgeSize, string> = {
  xs: 'w-1   h-1',
  sm: 'w-1.5 h-1.5',
  md: 'w-1.5 h-1.5',
};

// ── Composant ─────────────────────────────────────────────────────────────────

export function StatusBadge({
  label,
  color = 'neutral',
  size = 'sm',
  variant = 'soft',
  dot = false,
  icon,
  className,
}: StatusBadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center font-semibold rounded-full border whitespace-nowrap',
      COLORS[color][variant],
      SIZES[size],
      className,
    )}>
      {dot && (
        <span className={clsx(
          'rounded-full flex-shrink-0',
          DOT_COLORS[color],
          DOT_SIZES[size],
        )} />
      )}
      {icon && <span className="flex-shrink-0 leading-none">{icon}</span>}
      {label}
    </span>
  );
}

// ── Presets métier ────────────────────────────────────────────────────────────
// Permet d'utiliser un `status` string au lieu de reconfigurer chaque fois

export type StatusPreset =
  | 'SOUMISE' | 'VALIDEE' | 'APPROUVEE' | 'ACTIVE' | 'SUSPENDUE' | 'CLOTUREE'  // AT
  | 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'SUSPENDU' | 'CLOS'                    // Permis
  | 'PLANIFIE' | 'EN_COURS' | 'REALISE' | 'ANNULE'                              // Audit
  | 'ACTIF' | 'SUSPENDU_P' | 'BLACKLISTE' | 'EN_EVALUATION'                     // Prestataire
  | 'OUVERT' | 'EN_INVESTIGATION' | 'CLOTURE'                                    // Incident
  | string;

interface PresetConfig { label: string; color: BadgeColor; dot?: boolean }

const STATUS_PRESETS: Record<string, PresetConfig> = {
  // AT
  SOUMISE:      { label: 'Soumise',     color: 'navy',    dot: true },
  VALIDEE:      { label: 'Validée',     color: 'teal',    dot: true },
  APPROUVEE:    { label: 'Approuvée',   color: 'purple',  dot: true },
  ACTIVE:       { label: 'Active',      color: 'success', dot: true },
  SUSPENDUE:    { label: 'Suspendue',   color: 'safety',  dot: true },
  CLOTUREE:     { label: 'Clôturée',    color: 'neutral', dot: true },

  // Permis
  EN_ATTENTE:   { label: 'En attente',  color: 'amber',   dot: true },
  VALIDE:       { label: 'Validé',      color: 'success', dot: true },
  REJETE:       { label: 'Rejeté',      color: 'danger',  dot: true },
  SUSPENDU:     { label: 'Suspendu',    color: 'safety',  dot: true },
  CLOS:         { label: 'Clos',        color: 'neutral', dot: true },

  // Audit
  PLANIFIE:     { label: 'Planifié',    color: 'navy',    dot: true },
  EN_COURS:     { label: 'En cours',    color: 'amber',   dot: true },
  REALISE:      { label: 'Réalisé',     color: 'success', dot: true },
  ANNULE:       { label: 'Annulé',      color: 'neutral', dot: true },

  // Prestataire
  ACTIF:        { label: 'Actif',       color: 'success', dot: true },
  SUSPENDU_P:   { label: 'Suspendu',    color: 'safety',  dot: true },
  BLACKLISTE:   { label: 'Blacklisté',  color: 'danger',  dot: true },
  EN_EVALUATION:{ label: 'Évaluation',  color: 'amber',   dot: true },

  // Incident
  OUVERT:         { label: 'Ouvert',          color: 'danger',  dot: true },
  EN_INVESTIGATION:{ label: 'Investigation',  color: 'amber',   dot: true },
  CLOTURE:        { label: 'Clôturé',         color: 'neutral', dot: true },

  // Risque
  CRITIQUE:     { label: '⚠ Critique',  color: 'danger',  dot: false },
  ELEVE:        { label: 'Élevé',        color: 'safety',  dot: false },
  MODERE:       { label: 'Modéré',       color: 'amber',   dot: false },
  FAIBLE:       { label: 'Faible',       color: 'success', dot: false },
};

interface StatusPresetBadgeProps {
  status: StatusPreset;
  size?: BadgeSize;
  variant?: BadgeVariant;
  className?: string;
}

export function StatusPresetBadge({ status, size = 'sm', variant = 'soft', className }: StatusPresetBadgeProps) {
  const preset = STATUS_PRESETS[status];
  if (!preset) {
    return <StatusBadge label={status} color="neutral" size={size} variant={variant} className={className} />;
  }
  return (
    <StatusBadge
      label={preset.label}
      color={preset.color}
      dot={preset.dot}
      size={size}
      variant={variant}
      className={className}
    />
  );
}
