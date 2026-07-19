// ─────────────────────────────────────────────────────────────────────────────
// Module AT — Dashboard unifié
// 3 onglets : Vue générale · Validation Animateur · Validation Resp. Zone
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useMemo } from 'react';
import {
  ShieldCheck, CheckCircle2, Activity, AlertTriangle, Clock,
  CircleDot, ChevronRight, Users, PauseCircle, Plus, X,
  BarChart3,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import type { ATView } from '../../types/dashboardView';
import { StatutAT } from '../../types';
import { DashboardAnimateur } from './DashboardAnimateur';
import { DashboardRespZone } from './DashboardRespZone';
import { BadgeStatutAT, BadgeRisque } from './DashboardAnimateur';
import { KanbanView, ATDetailModal } from './KanbanView';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { KpiCard, KpiGrid } from '@/components/ui/KpiCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useModalA11y } from '@/hooks/useModalA11y';
import { AUDITS_DEMO } from '@/modules/audit/data/demo.data';
import { useATDashboardData } from '../../hooks/useATDashboardData';
import { usePTWActions } from '../../hooks/usePTWActions';

// ── Types ─────────────────────────────────────────────────────────────────────

type OngletPrincipal = 'generale' | 'animateur' | 'resp_zone';

// ── Répartition par statut (donut SVG) ───────────────────────────────────────

const STATUT_CONFIG: Record<string, { label: string; dot: string }> = {
  SOUMISE:   { label: 'À valider',  dot: '#3b82f6' },
  VALIDEE:   { label: 'Validée',    dot: '#14b8a6' },
  APPROUVEE: { label: 'Approuvée',  dot: '#8b5cf6' },
  ACTIVE:    { label: 'Active',     dot: '#22c55e' },
  SUSPENDUE: { label: 'Suspendue',  dot: '#f97316' },
  CLOTUREE:  { label: 'Clôturée',   dot: '#94a3b8' },
};

function RepartitionStatuts({ ats }: { ats: ATView[] }) {
  const repartition = useMemo(() => {
    const counts: Record<string, number> = {};
    ats.forEach(at => { counts[at.statut] = (counts[at.statut] ?? 0) + 1; });
    return counts;
  }, [ats]);

  const total    = ats.length || 1;
  const R        = 74;
  const CX = 92, CY = 92;
  const SW       = 26;
  const CIRC     = 2 * Math.PI * R;
  let cumOffset  = 0;

  const segments = Object.entries(STATUT_CONFIG)
    .map(([statut, cfg]) => ({ statut, ...cfg, count: repartition[statut] ?? 0 }))
    .filter(s => s.count > 0);

  const dominant = segments.reduce<typeof segments[number] | null>(
    (max, s) => (!max || s.count > max.count) ? s : max, null,
  );

  return (
    <div className="card p-5 h-full flex flex-col">
      <p className="section-title flex items-center gap-2 mb-4">
        <CircleDot size={12} />
        Répartition par statut
      </p>

      <div className="flex-1 flex items-center gap-8">
        {/* Donut */}
        <div className="relative flex-shrink-0">
          <svg width={184} height={184} viewBox="0 0 184 184">
            <circle cx={CX} cy={CY} r={R} fill="none" className="stroke-[var(--bg-hover)]" strokeWidth={SW} />
            {segments.map(seg => {
              const len     = (seg.count / total) * CIRC;
              const dashLen = Math.max(len - 2, 0);
              const offset  = CIRC - cumOffset;
              cumOffset    += len;
              return (
                <circle key={seg.statut} cx={CX} cy={CY} r={R}
                  fill="none" stroke={seg.dot} strokeWidth={SW}
                  strokeDasharray={`${dashLen} ${CIRC}`}
                  strokeDashoffset={offset} strokeLinecap="butt"
                  transform={`rotate(-90 ${CX} ${CY})`}
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
              );
            })}
            <text x={CX} y={CY - 8} textAnchor="middle" fontSize="30" fontWeight="700" className="fill-[color:var(--text-primary)]">
              {ats.length}
            </text>
            <text x={CX} y={CY + 14} textAnchor="middle" fontSize="11" letterSpacing="0.5" className="fill-[color:var(--text-muted)]">
              AT TOTAL
            </text>
          </svg>
        </div>

        {/* Légende */}
        <div className="flex-1 space-y-3.5 min-w-0">
          {segments.map(seg => {
            const pct = Math.round((seg.count / total) * 100);
            return (
              <div key={seg.statut} className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.dot }} />
                <span className="text-sm text-[color:var(--text-secondary)] flex-1 truncate">{seg.label}</span>
                <div className="w-24 h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden flex-shrink-0">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: seg.dot }} />
                </div>
                <span className="text-sm font-bold text-[color:var(--text-primary)] w-6 text-right">{seg.count}</span>
                <span className="text-xs text-[color:var(--text-muted)] w-9 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insight */}
      {dominant && (
        <div className="mt-4 pt-3 border-t border-[var(--border-faint)] flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: dominant.dot }} />
          Statut le plus fréquent : <span className="font-semibold text-[color:var(--text-primary)]">{dominant.label}</span>
          <span className="text-[color:var(--text-muted)]">({dominant.count}/{ats.length} AT)</span>
        </div>
      )}
    </div>
  );
}

// ── AT actives vs Audits réalisés ─────────────────────────────────────────────

function ActivesVsAuditees({ ats }: { ats: ATView[] }) {
  const data = useMemo(() => {
    const map = new Map<string, { actives: number; audits: number }>();

    ats.filter(a => a.statut === StatutAT.ACTIVE).forEach(at => {
      const jour = at.date_debut_prevue.slice(0, 10);
      const entry = map.get(jour) ?? { actives: 0, audits: 0 };
      entry.actives += 1;
      map.set(jour, entry);
    });
    AUDITS_DEMO.forEach(audit => {
      const jour = audit.date_audit.slice(0, 10);
      const entry = map.get(jour) ?? { actives: 0, audits: 0 };
      entry.audits += 1;
      map.set(jour, entry);
    });

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([jour, v]) => {
        let label = jour;
        try { label = format(new Date(jour), 'dd MMM', { locale: fr }); } catch { /* garde la valeur brute */ }
        return { label, ...v };
      });
  }, [ats]);

  const max = Math.max(...data.map(d => Math.max(d.actives, d.audits)), 1);
  const barZone = 76;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="section-title flex items-center gap-2">
          <Activity size={12} />
          AT actives / Audits réalisés
        </p>
        <div className="flex items-center gap-3 text-[10px] text-[color:var(--text-muted)]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#00d4ff]" /> AT actives</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#f97316]" /> Audits</span>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-[color:var(--text-muted)] italic text-center py-6">Aucune donnée sur la période.</p>
      ) : (
        <div className="flex items-end gap-3" style={{ height: barZone + 34 }}>
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1 min-w-0">
              <div className="flex items-end gap-1 w-full justify-center" style={{ height: barZone }}>
                <div
                  className="w-3 rounded-t-md transition-all duration-300"
                  style={{ height: `${d.actives > 0 ? Math.max((d.actives / max) * barZone, 4) : 0}px`, backgroundColor: '#00d4ff' }}
                  title={`${d.actives} AT active${d.actives > 1 ? 's' : ''}`}
                />
                <div
                  className="w-3 rounded-t-md transition-all duration-300"
                  style={{ height: `${d.audits > 0 ? Math.max((d.audits / max) * barZone, 4) : 0}px`, backgroundColor: '#f97316' }}
                  title={`${d.audits} audit${d.audits > 1 ? 's' : ''}`}
                />
              </div>
              <span className="text-[9px] text-[color:var(--text-muted)] leading-none whitespace-nowrap">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Alertes urgentes ──────────────────────────────────────────────────────────

function AlertesUrgentes({ ats }: { ats: ATView[] }) {
  const alertes = useMemo(() => {
    const suspendues = ats.filter(a => a.statut === StatutAT.SUSPENDUE);
    const critiques  = ats.filter(a => a.niveau_risque === 'CRITIQUE' && a.statut === StatutAT.ACTIVE);
    const aValider   = ats.filter(a => a.statut === StatutAT.SOUMISE);

    return [
      ...suspendues.map(at => ({
        id: at.id, type: 'suspension' as const,
        msg: `AT ${at.numero_at} suspendue`,
        detail: at.titre,
        sub: at.zone,
      })),
      ...critiques.map(at => ({
        id: at.id, type: 'critique' as const,
        msg: 'Risque CRITIQUE actif',
        detail: at.titre,
        sub: at.zone,
      })),
      ...aValider.slice(0, 2).map(at => ({
        id: at.id, type: 'pending' as const,
        msg: 'En attente de validation',
        detail: at.titre,
        sub: at.entreprise_intervenante,
      })),
    ].slice(0, 5);
  }, [ats]);

  if (alertes.length === 0) {
    return (
      <div className="flex items-center gap-3 bg-success-50 border border-success-200 rounded-xl px-5 py-4">
        <CheckCircle2 size={18} className="text-success-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-[color:var(--badge-success-text)]">Aucune alerte active</p>
          <p className="text-xs text-success-400 mt-0.5">Toutes les AT sont sous contrôle.</p>
        </div>
      </div>
    );
  }

  const ALERT_STYLE = {
    suspension: {
      bar:  'bg-safety-500',
      bg:   'bg-safety-50 border-safety-200',
      icon: '⏸',
      label:'bg-safety-100 text-[color:var(--badge-safety-text)]',
      text: 'text-[color:var(--badge-safety-text)]',
      sub:  'text-safety-400',
    },
    critique: {
      bar:  'bg-danger-500',
      bg:   'bg-danger-50 border-danger-200',
      icon: '🔴',
      label:'bg-danger-100 text-[color:var(--badge-danger-text)]',
      text: 'text-[color:var(--badge-danger-text)]',
      sub:  'text-danger-400',
    },
    pending: {
      bar:  'bg-navy-500',
      bg:   'bg-navy-50 border-navy-200',
      icon: '🔵',
      label:'bg-navy-100 text-[color:var(--badge-navy-text)]',
      text: 'text-[color:var(--badge-navy-text)]',
      sub:  'text-[color:var(--badge-navy-text)]',
    },
  };

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <p className="section-title flex items-center gap-2">
          <AlertTriangle size={12} />
          Alertes & points d'attention
        </p>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-safety-100 text-[color:var(--badge-safety-text)]">
          {alertes.length}
        </span>
      </div>

      <div className="space-y-2">
        {alertes.map(a => {
          const s = ALERT_STYLE[a.type];
          return (
            <div key={a.id + a.type}
              className={clsx(
                'flex items-start gap-3 px-4 py-3 rounded-xl border overflow-hidden relative',
                s.bg,
              )}
            >
              {/* Barre latérale */}
              <div className={clsx('absolute left-0 top-0 bottom-0 w-1', s.bar)} />
              <div className="pl-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded', s.label)}>
                    {a.type === 'suspension' ? 'SUSPENSION' : a.type === 'critique' ? 'CRITIQUE' : 'EN ATTENTE'}
                  </span>
                  <span className="text-xs text-[color:var(--text-muted)]">{a.sub}</span>
                </div>
                <p className={clsx('text-sm font-semibold truncate', s.text)}>{a.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Liste AT filtrée (drill-down depuis une carte KPI) ────────────────────────

function ListeATModal({
  title, ats, onClose,
}: {
  title: string;
  ats:   ATView[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<ATView | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(modalRef, onClose);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="modal-overlay" onClick={onClose} />
        <div
          ref={modalRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby="liste-at-modal-title"
          className="relative bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] w-full sm:max-w-xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] rounded-t-2xl overflow-hidden focus:outline-none"
        >
          <div className="bg-[#0077aa] px-5 py-4 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="min-w-0">
              <h2 id="liste-at-modal-title" className="text-white font-bold text-base truncate">{title}</h2>
              <p className="text-white/60 text-xs mt-0.5">{ats.length} autorisation{ats.length > 1 ? 's' : ''}</p>
            </div>
            <button type="button" onClick={onClose} className="text-white/60 hover:text-white transition-colors flex-shrink-0 p-1">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {ats.length === 0 ? (
              <p className="text-sm text-[color:var(--text-muted)] italic text-center py-10">
                Aucune AT dans cette catégorie.
              </p>
            ) : (
              <div className="space-y-1">
                {ats.map(at => (
                  <button
                    key={at.id}
                    type="button"
                    onClick={() => setSelected(at)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-hover)] transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-[color:var(--text-muted)] font-mono">{at.numero_at}</span>
                        <BadgeStatutAT statut={at.statut} />
                      </div>
                      <p className="text-sm font-semibold text-[color:var(--text-primary)] truncate leading-snug">{at.titre}</p>
                      <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{at.zone} · {at.entreprise_intervenante}</p>
                    </div>
                    <BadgeRisque niveau={at.niveau_risque} />
                    <ChevronRight size={14} className="text-[color:var(--text-muted)] flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && <ATDetailModal at={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

// ── Mini graphique en barres (sans dépendance externe) ────────────────────────

function MiniBarChart({
  data, color, height = 110,
}: {
  data: { label: string; value: number }[];
  color: string;
  height?: number;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barZone = height - 34; // place réservée à la valeur + au libellé

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1 min-w-0">
          <span className="text-[10px] font-bold text-[color:var(--text-primary)] leading-none">
            {d.value > 0 ? d.value : ''}
          </span>
          <div
            className="w-full rounded-t-md transition-all duration-300"
            style={{
              height: `${d.value > 0 ? Math.max((d.value / max) * barZone, 4) : 0}px`,
              backgroundColor: color,
            }}
          />
          <span className="text-[9px] text-[color:var(--text-muted)] leading-none whitespace-nowrap">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Courbes d'évolution ────────────────────────────────────────────────────────

function EvolutionAT({ ats }: { ats: ATView[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    ats.forEach(at => {
      const jour = at.date_debut_prevue.slice(0, 10);
      map.set(jour, (map.get(jour) ?? 0) + 1);
    });
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([jour, count]) => {
        let label = jour;
        try { label = format(new Date(jour), 'dd MMM', { locale: fr }); } catch { /* garde la valeur brute */ }
        return { label, value: count };
      });
  }, [ats]);

  return (
    <div className="card p-5">
      <p className="section-title flex items-center gap-2 mb-4">
        <BarChart3 size={12} />
        Évolution du nombre d'AT
      </p>
      <MiniBarChart data={data} color="#00d4ff" />
    </div>
  );
}

function EvolutionIntervenants({ ats }: { ats: ATView[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    ats.forEach(at => {
      const jour  = at.date_debut_prevue.slice(0, 10);
      const nb    = at.permis.flatMap(p => p.intervenants).length;
      map.set(jour, (map.get(jour) ?? 0) + nb);
    });
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([jour, count]) => {
        let label = jour;
        try { label = format(new Date(jour), 'dd MMM', { locale: fr }); } catch { /* garde la valeur brute */ }
        return { label, value: count };
      });
  }, [ats]);

  return (
    <div className="card p-5">
      <p className="section-title flex items-center gap-2 mb-4">
        <Users size={12} />
        Nombre d'intervenants
      </p>
      <MiniBarChart data={data} color="#4de6ff" />
    </div>
  );
}

function EcartsAudit() {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    AUDITS_DEMO.forEach(audit => {
      const mois = audit.date_audit.slice(0, 7);
      map.set(mois, (map.get(mois) ?? 0) + audit.ecarts.length);
    });
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, count]) => {
        let label = mois;
        try { label = format(new Date(`${mois}-01`), 'MMM', { locale: fr }); } catch { /* garde la valeur brute */ }
        return { label, value: count };
      });
  }, []);

  return (
    <div className="card p-5">
      <p className="section-title flex items-center gap-2 mb-4">
        <AlertTriangle size={12} />
        Écarts d'audit
      </p>
      <MiniBarChart data={data} color="#f97316" />
    </div>
  );
}

// ── Vue générale ──────────────────────────────────────────────────────────────

function VueGenerale({ ats, loading, error }: { ats: ATView[]; loading: boolean; error: string | null }) {
  const [listeFiltre, setListeFiltre] = useState<{ title: string; ats: ATView[] } | null>(null);

  const listes = useMemo(() => ({
    total:        ats,
    actives:      ats.filter(a => a.statut === StatutAT.ACTIVE),
    aValider:     ats.filter(a => [StatutAT.SOUMISE, StatutAT.VALIDEE].includes(a.statut)),
    suspendues:   ats.filter(a => a.statut === StatutAT.SUSPENDUE),
    critiques:    ats.filter(a => a.niveau_risque === 'CRITIQUE'),
  }), [ats]);

  const kpis = useMemo(() => ({
    total:        listes.total.length,
    actives:      listes.actives.length,
    aValider:     listes.aValider.length,
    suspendues:   listes.suspendues.length,
    critiques:    listes.critiques.length,
    intervenants: ats.flatMap(a => a.permis.flatMap(p => p.intervenants)).length,
  }), [listes, ats]);

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-danger-200 bg-danger-50 text-sm text-[color:var(--badge-danger-text)]">
        <AlertTriangle size={15} className="flex-shrink-0" />
        {error}
      </div>
    );
  }

  if (!loading && ats.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={ShieldCheck}
          title="Aucune autorisation de travail"
          description="Aucune AT n'a encore été créée sur ce site."
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* KPIs — cliquer pour voir les AT concernées */}
      <KpiGrid cols={3}>
        <KpiCard
          icon={ShieldCheck} label="AT totales"        color="navy"
          value={kpis.total} sub="sur le site" loading={loading}
          onClick={() => setListeFiltre({ title: 'Toutes les AT', ats: listes.total })}
        />
        <KpiCard
          icon={Activity}    label="AT actives"        color="success"
          value={kpis.actives} sub="travaux en cours" loading={loading}
          onClick={() => setListeFiltre({ title: 'AT actives', ats: listes.actives })}
        />
        <KpiCard
          icon={Clock}       label="En attente"        color="amber"
          value={kpis.aValider} sub="validation requise" loading={loading}
          onClick={() => setListeFiltre({ title: 'AT en attente de validation', ats: listes.aValider })}
        />
        <KpiCard
          icon={PauseCircle} label="Suspensions"       color="safety"
          value={kpis.suspendues} sub="AT arrêtées" loading={loading}
          onClick={() => setListeFiltre({ title: 'AT suspendues', ats: listes.suspendues })}
        />
        <KpiCard
          icon={AlertTriangle} label="Risques critiques" color="danger"
          value={kpis.critiques} sub="niveau critique" loading={loading}
          onClick={() => setListeFiltre({ title: 'AT à risque critique', ats: listes.critiques })}
        />
        <KpiCard
          icon={Users}       label="Intervenants"      color="neutral"
          value={kpis.intervenants} sub="toutes AT confondues" loading={loading}
          onClick={() => setListeFiltre({ title: 'AT avec intervenants recensés', ats: listes.total })}
        />
      </KpiGrid>

      {/* Courbes d'évolution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <EvolutionAT ats={ats} />
        <EcartsAudit />
        <EvolutionIntervenants ats={ats} />
      </div>

      {/* Alertes */}
      <AlertesUrgentes ats={ats} />

      {/* Répartition + AT actives vs Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RepartitionStatuts ats={ats} />
        <ActivesVsAuditees ats={ats} />
      </div>

      {/* Suivi des autorisations — Kanban (lecture seule) */}
      <p className="section-title">Suivi des autorisations</p>
      <KanbanView ats={ats} role="OBSERVATEUR" />

      {listeFiltre && (
        <ListeATModal
          title={listeFiltre.title}
          ats={listeFiltre.ats}
          onClose={() => setListeFiltre(null)}
        />
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function DashboardAT() {
  const [onglet, setOnglet] = useState<OngletPrincipal>('generale');
  const navigate = useNavigate();

  const { ats, loading, error, refetch } = useATDashboardData();
  const actions = usePTWActions(refetch);

  const countAnimateur = useMemo(() => ats.filter(a => a.statut === StatutAT.SOUMISE).length, [ats]);
  const countRespZone  = useMemo(() => ats.filter(a => a.statut === StatutAT.VALIDEE).length, [ats]);

  return (
    <div className="min-h-screen">

      <ModuleHeader
        icon={ShieldCheck}
        title="Autorisation de Travail"
        subtitle="PTW · Permis de travail · Sécurité industrielle"
        action={{ label: 'Nouvelle AT', icon: Plus, onClick: () => navigate('/at/nouvelle') }}
        tabs={[
          { id: 'generale',  label: 'Vue générale',       icon: <CircleDot size={14} /> },
          { id: 'animateur', label: 'Validation Animateur', badge: countAnimateur },
          { id: 'resp_zone', label: 'Validation Resp. Zone', badge: countRespZone },
        ]}
        activeTab={onglet}
        onTabChange={id => setOnglet(id as OngletPrincipal)}
      />

      <main className="max-w-6xl mx-auto px-6 py-6">

        {onglet === 'generale' && <VueGenerale ats={ats} loading={loading} error={error} />}

        {onglet === 'animateur' && (
          <div className="-mx-6">
            <DashboardAnimateur embedded ats={ats} loading={loading} error={error} actions={actions} />
          </div>
        )}

        {onglet === 'resp_zone' && (
          <div className="-mx-6">
            <DashboardRespZone embedded ats={ats} loading={loading} error={error} actions={actions} />
          </div>
        )}

      </main>
    </div>
  );
}
