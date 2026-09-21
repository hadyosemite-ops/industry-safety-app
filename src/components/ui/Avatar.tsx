// ─────────────────────────────────────────────────────────────────────────────
// Avatar — Chip d'initiales en dégradé, couleur déterministe par nom
// Usage : <Avatar name="Jean Dupont" /> → "JD" sur fond dégradé stable
// ─────────────────────────────────────────────────────────────────────────────

import { clsx } from 'clsx';

interface AvatarProps {
  /** Nom complet (ou toute chaîne) utilisé pour les initiales + la couleur */
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Dégradés repris de la palette FleetOS (cyan, violet, ambre, succès, danger) —
// choisis pour rester lisibles en mode sombre et en mode clair.
const GRADIENTS = [
  'linear-gradient(135deg, #00d4ff, #0077aa)',
  'linear-gradient(135deg, #a394ff, #6d5bd0)',
  'linear-gradient(135deg, #ffc233, #e6a100)',
  'linear-gradient(135deg, #33ea92, #00a855)',
  'linear-gradient(135deg, #ff8c66, #e6543a)',
  'linear-gradient(135deg, #4de6ff, #3a7bd5)',
];

const SIZES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-11 h-11 text-sm',
};

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getInitiales(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const initiales = getInitiales(name);
  const gradient  = GRADIENTS[hashString(name) % GRADIENTS.length];

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white',
        SIZES[size],
        className,
      )}
      style={{ background: gradient, boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}
      title={name}
      aria-hidden="true"
    >
      {initiales}
    </div>
  );
}
