// ─────────────────────────────────────────────────────────────────────────────
// ModuleHeader — Header unifié pour tous les modules
// Design : fond navy, onglets intégrés, boutons CTA
// ─────────────────────────────────────────────────────────────────────────────

import type { ElementType, ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { clsx } from 'clsx';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ModuleTab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

export interface ModuleAction {
  label: string;
  icon?: ElementType;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
}

interface ModuleHeaderProps {
  icon: ElementType;
  title: string;
  subtitle?: string;
  /** Bouton unique — rétro-compat */
  action?: ModuleAction;
  /** Plusieurs boutons (prioritaire sur action) */
  actions?: ModuleAction[];
  tabs?: ModuleTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function ModuleHeader({
  icon: Icon,
  title,
  subtitle,
  action,
  actions,
  tabs,
  activeTab,
  onTabChange,
}: ModuleHeaderProps) {
  const allActions: ModuleAction[] = actions ?? (action ? [action] : []);
  const hasTabs = tabs && tabs.length > 0;

  return (
    <header
      className="sticky top-0 z-30 border-b border-white/[0.06]"
      style={{ background: 'rgba(5,14,31,0.92)', backdropFilter: 'blur(12px)', boxShadow: '0 2px 20px rgba(0,0,0,0.35)' }}
    >

      {/* ── Ligne principale ── */}
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between gap-4 h-[60px]">

        {/* Gauche — icône + titre */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 bg-white/[0.10] rounded-lg border border-white/[0.12] flex items-center justify-center flex-shrink-0">
            <Icon size={16} className="text-white" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-[15px] leading-none tracking-tight truncate">{title}</h1>
            {subtitle && (
              <p className="text-white/40 text-[11px] mt-0.5 truncate font-medium">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Droite — boutons */}
        {allActions.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {allActions.map((act, i) => {
              const ActIcon = act.icon ?? Plus;

              // Le premier bouton quand il y en a plusieurs = ghost
              const isSecondary = allActions.length > 1 && i < allActions.length - 1;

              if (act.variant === 'danger') {
                return (
                  <button
                    key={act.label}
                    type="button"
                    onClick={act.onClick}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold
                               bg-danger-600 hover:bg-danger-700 text-white
                               transition-all duration-150 active:scale-95"
                  >
                    <ActIcon size={14} strokeWidth={2.5} />
                    <span>{act.label}</span>
                  </button>
                );
              }

              if (act.variant === 'ghost' || isSecondary) {
                return (
                  <button
                    key={act.label}
                    type="button"
                    onClick={act.onClick}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold
                               bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/[0.15]
                               transition-all duration-150 active:scale-95"
                  >
                    <ActIcon size={14} strokeWidth={2} />
                    <span>{act.label}</span>
                  </button>
                );
              }

              // Bouton principal = dégradé cyan
              return (
                <button
                  key={act.label}
                  type="button"
                  onClick={act.onClick}
                  style={{ background: 'linear-gradient(135deg, #00d4ff, #0077aa)' }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-bold
                             text-[#02101f] hover:brightness-110
                             shadow-sm transition-all duration-150 active:scale-95"
                >
                  <ActIcon size={14} strokeWidth={2.5} />
                  <span>{act.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Onglets ── */}
      {hasTabs && (
        <div className="max-w-6xl mx-auto px-6 border-t border-white/[0.08]">
          <div className="flex gap-0.5 overflow-x-auto no-scrollbar">
            {tabs!.map(tab => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange?.(tab.id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-3 text-[13px] font-semibold',
                    'transition-all duration-150 whitespace-nowrap flex-shrink-0',
                    'relative',
                    isActive
                      ? 'text-white'
                      : 'text-white/45 hover:text-white/75',
                  )}
                >
                  {/* Soulignement actif */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00d4ff] rounded-t-full shadow-[0_0_8px_rgba(0,212,255,0.6)]" />
                  )}

                  {tab.icon && (
                    <span className={clsx(
                      'flex-shrink-0',
                      isActive ? 'text-[#00d4ff]' : 'text-white/40',
                    )}>
                      {tab.icon}
                    </span>
                  )}
                  <span>{tab.label}</span>

                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={clsx(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                      isActive
                        ? 'bg-[#00d4ff] text-[#02101f]'
                        : 'bg-white/10 text-white/60',
                    )}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
