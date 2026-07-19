import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'navy';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-[var(--bg-elevated)] text-[color:var(--text-secondary)] border border-[var(--border)]',
  success:  'bg-[rgba(0,230,118,0.10)] text-[color:var(--badge-success-text)] border border-[rgba(0,230,118,0.3)]',
  warning:  'bg-[rgba(255,179,0,0.10)] text-[color:var(--badge-amber-text)] border border-[rgba(255,179,0,0.3)]',
  danger:   'bg-[rgba(255,68,68,0.10)] text-[color:var(--badge-danger-text)] border border-[rgba(255,68,68,0.3)]',
  info:     'bg-[rgba(0,212,255,0.10)] text-[color:var(--badge-navy-text)] border border-[rgba(0,212,255,0.3)]',
  purple:   'bg-violet-500/10 text-[color:var(--badge-purple-text)] border border-violet-400/30',
  navy:     'bg-[#00b8e0] text-[#02101f]',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center font-semibold rounded-full',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}
