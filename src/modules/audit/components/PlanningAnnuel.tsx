// ─────────────────────────────────────────────────────────────────────────────
// Module Audit HSE — Planning annuel (Gantt S01-S52 + Calendrier mensuel)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { clsx } from 'clsx';
import { Grid, Calendar, ChevronLeft, ChevronRight, Info, FileText, ClipboardList } from 'lucide-react';

import type { PlanAudit, Audit, StatutAudit, TypeAudit } from '../types';
import { LABELS_TYPE_AUDIT, ICONES_TYPE_AUDIT, LABELS_STATUT_AUDIT, niveauConformite } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'gantt' | 'calendar';

interface Props {
  planning:    PlanAudit[];
  audits:      Audit[];
  onPlanClick: (plan: PlanAudit, audit: Audit | undefined) => void;
}

// ── Couleurs par type d'audit ─────────────────────────────────────────────────

const TYPE_COLORS: Record<TypeAudit, { bg: string; text: string; border: string; dot: string }> = {
  TERRAIN:    { bg: 'bg-blue-500/10',   text: 'text-blue-300',   border: 'border-blue-500/30',   dot: '#3b82f6' },
  SYSTEME:    { bg: 'bg-purple-500/10', text: 'text-purple-300', border: 'border-purple-500/30', dot: '#8b5cf6' },
  COMPLIANCE: { bg: 'bg-orange-500/10', text: 'text-orange-300', border: 'border-orange-500/30', dot: '#f97316' },
  SUIVI:      { bg: 'bg-teal-500/10',   text: 'text-[color:var(--badge-teal-text)]',   border: 'border-teal-500/30',   dot: '#14b8a6' },
};

const STATUT_OPACITY: Record<StatutAudit, string> = {
  VALIDE:   'opacity-100',
  REALISE:  'opacity-90',
  EN_COURS: 'opacity-80',
  PLANIFIE: 'opacity-50',
  ANNULE:   'opacity-30',
};

// ── Distribution réelle des semaines ISO 2026 par mois ────────────────────────
// Janvier(4) Fév(4) Mar(5) Avr(4) Mai(4) Juin(5) Juil(4) Août(5) Sep(4) Oct(4) Nov(4) Déc(5) = 52
const MOIS_LABELS   = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MOIS_SEMAINES = [4,   4,   5,   4,   4,   5,   4,   5,   4,   4,   4,   5  ]; // total = 52

// ── Légende ───────────────────────────────────────────────────────────────────

function Legende() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[color:var(--text-secondary)]">
      <div className="flex items-center gap-1.5 font-semibold text-[color:var(--text-secondary)]">
        <Info size={11} />
        <span>Types :</span>
      </div>
      {(Object.entries(TYPE_COLORS) as [TypeAudit, typeof TYPE_COLORS[TypeAudit]][]).map(([type, c]) => (
        <div key={type} className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c.dot }} />
          <span>{LABELS_TYPE_AUDIT[type]}</span>
        </div>
      ))}
      <div className="w-px h-3 bg-[var(--bg-hover)] mx-1" />
      <div className="flex items-center gap-1.5 font-semibold text-[color:var(--text-secondary)]">Statuts :</div>
      <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500 opacity-100" /><span>Validé</span></div>
      <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500 opacity-75" /><span>Réalisé</span></div>
      <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500 opacity-50" /><span>Planifié</span></div>
      <div className="w-px h-3 bg-[var(--bg-hover)] mx-1" />
      <div className="flex items-center gap-1 text-[color:var(--text-muted)] italic">Clic → voir rapport</div>
    </div>
  );
}

// ── Tooltip sur survol ────────────────────────────────────────────────────────

interface TooltipPlan {
  plan:   PlanAudit;
  audit?: Audit;
  x:      number;
  y:      number;
}

function PlanTooltip({ plan, audit, x, y }: TooltipPlan) {
  const c = TYPE_COLORS[plan.type_audit];
  const hasReport = !!audit;
  return (
    <div
      className="fixed z-50 card shadow-xl p-3 w-60 pointer-events-none"
      style={{ left: Math.min(x + 12, window.innerWidth - 260), top: Math.max(y - 90, 8) }}
    >
      <div className={clsx('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full mb-2', c.bg, c.text)}>
        {ICONES_TYPE_AUDIT[plan.type_audit]} {LABELS_TYPE_AUDIT[plan.type_audit]}
      </div>
      <p className="text-xs font-bold text-[color:var(--text-primary)] mb-0.5">{plan.zone}</p>
      <p className="text-[11px] text-[color:var(--text-secondary)]">Semaine {plan.semaine} · {plan.annee}</p>
      <p className="text-[11px] text-[color:var(--text-secondary)]">Auditeur : {plan.auditeur}</p>
      <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between">
        <span className={clsx(
          'text-[10px] px-2 py-0.5 rounded-full font-medium',
          plan.statut === 'VALIDE'   ? 'bg-success-100 text-[color:var(--badge-success-text)]' :
          plan.statut === 'REALISE'  ? 'bg-blue-500/10 text-blue-300'   :
          plan.statut === 'EN_COURS' ? 'bg-amber-100 text-[color:var(--badge-amber-text)]' :
          'bg-[var(--bg-hover)] text-[color:var(--text-secondary)]',
        )}>
          {LABELS_STATUT_AUDIT[plan.statut]}
        </span>
        {audit && (
          <span className="text-[10px] font-bold text-[color:var(--text-primary)]">
            Score : {audit.score_global ?? '—'}%
          </span>
        )}
      </div>
      <div className={clsx(
        'mt-2 pt-2 border-t border-[var(--border)] flex items-center gap-1 text-[10px] font-semibold',
        hasReport ? 'text-[color:var(--badge-navy-text)]' : 'text-[color:var(--text-muted)]',
      )}>
        {hasReport
          ? <><FileText size={10} /> Cliquer pour voir le rapport</>
          : <><ClipboardList size={10} /> Cliquer pour saisir l'audit</>
        }
      </div>
    </div>
  );
}

// ── Vue Gantt ─────────────────────────────────────────────────────────────────

const ZONES = [
  'Zone A - Production',
  'Zone B - Packaging',
  'Zone C - Énergie',
  'Zone D - Chimie',
  'Zone E - Logistique',
];

function GanttView({ planning, audits, onPlanClick }: Props) {
  const [tooltip, setTooltip] = useState<TooltipPlan | null>(null);

  const ROW_H     = 36;
  const CELL_PCT  = 100 / 52; // % de largeur par semaine — le planning occupe toute la largeur dispo
  const MIN_TOTAL_W = 728;    // plancher px pour rester lisible sur petit écran (scroll horizontal en dessous)

  const currentWeek = Math.ceil(
    (new Date().getTime() - new Date('2026-01-01').getTime()) / (7 * 86400000),
  );

  // Positions cumulées (en nombre de semaines) des colonnes mois
  const moisOffsets = MOIS_SEMAINES.reduce<number[]>((acc, _sw, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + MOIS_SEMAINES[i - 1]);
    return acc;
  }, []);

  return (
    <div className="card overflow-hidden">
      {/* En-tête mois — largeur proportionnelle aux semaines réelles */}
      <div className="flex border-b border-[var(--border)]">
        <div className="w-44 flex-shrink-0 bg-[var(--bg-hover)] border-r border-[var(--border)] px-4 py-2 text-[11px] font-semibold text-[color:var(--text-secondary)] uppercase tracking-wide">
          Zone
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex" style={{ width: '100%', minWidth: MIN_TOTAL_W }}>
            {MOIS_LABELS.map((m, i) => (
              <div
                key={i}
                className="flex-shrink-0 text-center text-[10px] font-semibold text-[color:var(--text-muted)] py-2 border-r border-[var(--border)]"
                style={{ width: `${MOIS_SEMAINES[i] * CELL_PCT}%` }}
              >
                {m}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lignes zones */}
      <div className="overflow-x-auto">
        {ZONES.map((zone, zi) => {
          const planZone = planning.filter(p => p.zone === zone);
          return (
            <div
              key={zone}
              className={clsx(
                'flex border-b border-[var(--border)] hover:bg-navy-50 transition-colors',
                zi % 2 !== 0 && 'bg-[var(--bg-hover)]',
              )}
              style={{ height: ROW_H }}
            >
              {/* Label zone */}
              <div className="w-44 flex-shrink-0 border-r border-[var(--border)] px-4 flex items-center">
                <span className="text-xs font-medium text-[color:var(--text-primary)] truncate">{zone.split(' - ')[1]}</span>
              </div>

              {/* Cellules semaines */}
              <div className="flex-1 relative" style={{ width: '100%', minWidth: MIN_TOTAL_W }}>
                {/* Séparateurs mois */}
                {moisOffsets.slice(1).map((x, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-r border-[var(--border)] pointer-events-none"
                    style={{ left: `${x * CELL_PCT}%` }}
                  />
                ))}
                {/* Séparateurs semaines */}
                {Array.from({ length: 52 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-r border-[var(--border)] pointer-events-none"
                    style={{ left: `${i * CELL_PCT}%`, width: `${CELL_PCT}%` }}
                  />
                ))}

                {/* Ligne semaine courante */}
                <div
                  className="absolute top-0 h-full w-px bg-red-400/60 z-10 pointer-events-none"
                  style={{ left: `${(currentWeek - 1) * CELL_PCT + CELL_PCT / 2}%` }}
                />

                {/* Plans */}
                {planZone.map(plan => {
                  const audit  = audits.find(a => a.id === plan.audit_id);
                  const c      = TYPE_COLORS[plan.type_audit];
                  const score  = audit?.score_global;
                  const hasReport = !!audit;

                  return (
                    <div
                      key={plan.id}
                      className={clsx(
                        'absolute top-1/2 -translate-y-1/2 rounded-md transition-all z-20',
                        'cursor-pointer hover:scale-125 hover:z-30 hover:shadow-md',
                        STATUT_OPACITY[plan.statut],
                        hasReport && 'ring-1 ring-white ring-offset-0',
                      )}
                      style={{
                        left:            `calc(${(plan.semaine - 1) * CELL_PCT}% + 1px)`,
                        width:           `calc(${CELL_PCT}% - 2px)`,
                        height:          22,
                        backgroundColor: c.dot,
                      }}
                      onClick={() => onPlanClick(plan, audit)}
                      onMouseEnter={e => setTooltip({ plan, audit, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {score !== undefined && (
                        <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white">
                          {score}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Numéros semaines */}
      <div className="flex border-t border-[var(--border)]">
        <div className="w-44 flex-shrink-0 bg-[var(--bg-hover)] border-r border-[var(--border)]" />
        <div className="overflow-x-auto">
          <div className="flex" style={{ width: '100%', minWidth: MIN_TOTAL_W }}>
            {Array.from({ length: 52 }, (_, i) => (
              <div
                key={i}
                className={clsx(
                  'flex-shrink-0 text-center text-[8px] text-[color:var(--text-secondary)] py-1',
                  i === currentWeek - 1 && 'text-red-400 font-bold',
                )}
                style={{ width: `${CELL_PCT}%` }}
              >
                {i % 4 === 0 ? i + 1 : ''}
              </div>
            ))}
          </div>
        </div>
      </div>

      {tooltip && <PlanTooltip {...tooltip} />}
    </div>
  );
}

// ── Vue Calendrier mensuel ────────────────────────────────────────────────────


function firstDayOfWeekISO(year: number, week: number): Date {
  const jan4       = new Date(year, 0, 4);
  const dayOfWeek  = jan4.getDay() || 7;
  const startWeek1 = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
  return new Date(startWeek1.getTime() + (week - 1) * 7 * 86400000);
}

function CalendarView({ planning, audits, onPlanClick }: Props) {
  const [currentMonth, setCurrentMonth] = useState(0);

  const MOIS_NOMS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                     'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const year  = 2026;
  const month = currentMonth;

  const firstDay  = new Date(year, month, 1);
  const dayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const startDate = new Date(firstDay.getTime() - dayOfWeek * 86400000);

  const days: Date[] = Array.from({ length: 42 }, (_, i) =>
    new Date(startDate.getTime() + i * 86400000),
  );

  return (
    <div className="space-y-4">
      {/* Navigation mois */}
      <div className="flex items-center justify-between card px-5 py-3">
        <button
          onClick={() => setCurrentMonth(m => Math.max(0, m - 1))}
          disabled={currentMonth === 0}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <h3 className="text-base font-bold text-[color:var(--text-primary)]">{MOIS_NOMS[month]} {year}</h3>
        <button
          onClick={() => setCurrentMonth(m => Math.min(11, m + 1))}
          disabled={currentMonth === 11}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="card overflow-hidden">
        {/* En-tête jours */}
        <div className="grid grid-cols-7 border-b border-[var(--border)]">
          {JOURS.map(j => (
            <div key={j} className="text-center text-[11px] font-semibold text-[color:var(--text-muted)] py-2">
              {j}
            </div>
          ))}
        </div>

        {/* Grille jours */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const isCurrentMonth = day.getMonth() === month;
            const isToday        = day.toDateString() === new Date().toDateString();

            // Plans affichés le lundi de chaque semaine
            const plansThisWeek = isCurrentMonth && day.getDay() === 1
              ? planning.filter(p => {
                  const startOfPlanWeek = firstDayOfWeekISO(2026, p.semaine);
                  return startOfPlanWeek.toDateString() === day.toDateString();
                })
              : [];

            return (
              <div
                key={idx}
                className={clsx(
                  'min-h-[90px] p-1.5 border-r border-b border-[var(--border)]',
                  !isCurrentMonth && 'bg-[var(--bg-hover)]',
                  isToday && 'bg-navy-50',
                  idx % 7 === 6 && 'border-r-0',
                )}
              >
                {/* Numéro du jour */}
                <div className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold mb-1',
                  isToday ? 'bg-[#0077aa] text-white' :
                  isCurrentMonth ? 'text-[color:var(--text-primary)]' : 'text-[color:var(--text-secondary)]',
                )}>
                  {day.getDate()}
                </div>

                {/* Plans de la semaine (affichés le lundi) */}
                {plansThisWeek.map(plan => {
                  const audit     = audits.find(a => a.id === plan.audit_id);
                  const c         = TYPE_COLORS[plan.type_audit];
                  const score     = audit?.score_global;
                  const hasReport = !!audit;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => onPlanClick(plan, audit)}
                      title={`${plan.zone} · ${plan.auditeur}${score !== undefined ? ` · ${score}%` : ''}`}
                      className={clsx(
                        'w-full text-left text-[9px] font-medium px-1.5 py-0.5 rounded-md mb-0.5 truncate transition-all',
                        'hover:brightness-95 hover:shadow-sm cursor-pointer',
                        c.bg, c.text,
                        STATUT_OPACITY[plan.statut],
                        hasReport && 'ring-1 ring-current ring-opacity-30',
                      )}
                    >
                      <span>{ICONES_TYPE_AUDIT[plan.type_audit]}</span>{' '}
                      {plan.zone.split(' - ')[1]}
                      {score !== undefined && (
                        <span className={clsx('ml-1 font-bold', niveauConformite(score).color)}>
                          {score}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats du mois */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['TERRAIN', 'SYSTEME', 'COMPLIANCE', 'SUIVI'] as TypeAudit[]).map(type => {
          const count = planning.filter(p => {
            const start = firstDayOfWeekISO(2026, p.semaine);
            return p.type_audit === type && start.getMonth() === month && start.getFullYear() === year;
          }).length;
          const c = TYPE_COLORS[type];
          return (
            <div key={type} className={clsx('rounded-xl p-3 text-center border', c.bg, c.border)}>
              <p className="text-xl font-bold" style={{ color: c.dot }}>{count}</p>
              <p className={clsx('text-[10px] font-medium', c.text)}>{LABELS_TYPE_AUDIT[type]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Planning Annuel principal ─────────────────────────────────────────────────

export function PlanningAnnuel({ planning, audits, onPlanClick }: Props) {
  const [view, setView] = useState<ViewMode>('gantt');

  const stats = {
    total:    planning.length,
    valides:  planning.filter(p => p.statut === 'VALIDE').length,
    realises: planning.filter(p => p.statut === 'REALISE').length,
    planifies:planning.filter(p => p.statut === 'PLANIFIE').length,
  };

  return (
    <div className="space-y-4">
      {/* Barre de contrôle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[color:var(--text-secondary)]">
            <span className="font-bold text-green-600">{stats.valides}</span> validés
          </span>
          <span className="text-[color:var(--text-secondary)]">
            <span className="font-bold text-blue-600">{stats.realises}</span> réalisés
          </span>
          <span className="text-[color:var(--text-secondary)]">
            <span className="font-bold text-[color:var(--text-muted)]">{stats.planifies}</span> planifiés
          </span>
          <span className="text-[color:var(--text-secondary)]">|</span>
          <span className="text-[color:var(--text-secondary)]">
            <span className="font-bold text-[color:var(--text-primary)]">{stats.total}</span> total
          </span>
        </div>

        <div className="tabs-container">
          <button
            onClick={() => setView('gantt')}
            className={clsx('flex items-center gap-1.5', view === 'gantt' ? 'tab-pill-active' : 'tab-pill-inactive')}
          >
            <Grid size={13} />
            Gantt
          </button>
          <button
            onClick={() => setView('calendar')}
            className={clsx('flex items-center gap-1.5', view === 'calendar' ? 'tab-pill-active' : 'tab-pill-inactive')}
          >
            <Calendar size={13} />
            Calendrier
          </button>
        </div>
      </div>

      {/* Légende */}
      <Legende />

      {/* Vue */}
      {view === 'gantt'    && <GanttView    planning={planning} audits={audits} onPlanClick={onPlanClick} />}
      {view === 'calendar' && <CalendarView planning={planning} audits={audits} onPlanClick={onPlanClick} />}
    </div>
  );
}
