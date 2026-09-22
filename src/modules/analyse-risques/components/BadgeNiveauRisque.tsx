import { clsx } from 'clsx';
import { CheckCircle2, AlertTriangle, FileWarning, XCircle, type LucideIcon } from 'lucide-react';
import type { NiveauCriticite } from '../types';
import { COULEURS_NIVEAU, LABELS_NIVEAU } from '../types';

// Une icône distincte par niveau — jamais la couleur seule (accessibilité
// daltonisme), en plus du symbole textuel (MOTIFS_NIVEAU) utilisé dans la
// matrice pour les contextes non-React (tooltip natif, export CSV…).
const ICONES_NIVEAU: Record<NiveauCriticite, LucideIcon> = {
  FAIBLE:   CheckCircle2,
  MODERE:   AlertTriangle,
  ELEVE:    FileWarning,
  CRITIQUE: XCircle,
};

interface Props {
  niveau: NiveauCriticite | null | undefined;
  taille?: 'sm' | 'md';
  className?: string;
}

export function BadgeNiveauRisque({ niveau, taille = 'md', className }: Props) {
  if (!niveau) {
    return (
      <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-hover)] text-[color:var(--text-muted)]', className)}>
        Non coté
      </span>
    );
  }

  const c = COULEURS_NIVEAU[niveau];
  const Icon = ICONES_NIVEAU[niveau];

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-full font-semibold border',
      taille === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
      c.badge_bg, c.badge_text, c.border,
      className,
    )}>
      <Icon size={taille === 'sm' ? 11 : 13} />
      {LABELS_NIVEAU[niveau]}
    </span>
  );
}
