// ─────────────────────────────────────────────────────────────────────────────
// Module Audit HSE — Dashboard principal
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, type ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  ClipboardCheck, Calendar, BarChart2, AlertTriangle,
  CheckCircle2, Clock, ChevronRight, Plus, Filter,
} from 'lucide-react';
import { KpiCard, KpiGrid } from '@/components/ui/KpiCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModuleHeader } from '@/components/ui/ModuleHeader';

import { AUDITS_DEMO, KPIS_AUDIT, PLANNING_2026, EVOLUTION_ZONE_A } from '../data/demo.data';
import { CHECKLIST_STANDARD } from '../data/checklist.data';
import {
  niveauConformite, LABELS_TYPE_AUDIT, LABELS_STATUT_AUDIT,
  ICONES_TYPE_AUDIT, LABELS_SECTION, ICONES_SECTION, COULEURS_SECTION,
  calculerScore,
  type Audit, type SectionId, type StatutAudit, type TypeAudit,
} from '../types';
import { PlanningAnnuel } from './PlanningAnnuel';
import { FormulaireAudit } from './FormulaireAudit';
import { RapportAudit } from './RapportAudit';

// ── Tabs ───────────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'planning' | 'audits';

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <BarChart2 size={15} /> },
  { id: 'planning',  label: 'Planning annuel', icon: <Calendar size={15} /> },
  { id: 'audits',    label: 'Audits réalisés', icon: <ClipboardCheck size={15} /> },
];

// ── Score radar simplifié (bar chart SVG) ─────────────────────────────────────

function ScoresSections({ audit }: { audit: Audit }) {
  const sections: SectionId[] = [
    'EPI', 'ORDRE_PROPRETE', 'TRAVAIL_HAUTEUR', 'RISQUES_CHIMIQUES',
    'ELECTRICITE', 'INCENDIE', 'MANUTENTION', 'PTW', 'SECOURS',
  ];

  return (
    <div className="space-y-2">
      {sections.map(sec => {
        const score = audit.scores_sections?.[sec] ?? calculerScore(audit.reponses, CHECKLIST_STANDARD, sec);
        const nc = niveauConformite(score);
        const col = COULEURS_SECTION[sec];
        return (
          <div key={sec} className="flex items-center gap-2">
            <span className="text-base w-5 text-center flex-shrink-0">{ICONES_SECTION[sec]}</span>
            <span className="text-xs text-[color:var(--text-secondary)] w-36 truncate flex-shrink-0">{LABELS_SECTION[sec].split(' — ')[1]}</span>
            <div className="flex-1 h-3 rounded-full bg-[var(--bg-hover)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${score}%`, backgroundColor: col.border }}
              />
            </div>
            <span className={clsx('text-[11px] font-semibold w-8 text-right', nc.color)}>{score}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Sparkline évolution ───────────────────────────────────────────────────────

function SparklineEvolution({ data }: { data: { semaine: number; score: number }[] }) {
  if (data.length < 2) return null;
  const W = 200; const H = 60; const PAD = 6;
  const maxS = Math.max(...data.map(d => d.score));
  const minS = Math.min(...data.map(d => d.score));
  const range = maxS - minS || 1;
  const xs = data.map((_, i) => PAD + (i / (data.length - 1)) * (W - PAD * 2));
  const ys = data.map(d => H - PAD - ((d.score - minS) / range) * (H - PAD * 2));
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
  const fill = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ')
    + ` L ${xs[xs.length-1]} ${H} L ${xs[0]} ${H} Z`;
  const lastScore = data[data.length - 1].score;
  const nc = niveauConformite(lastScore);

  return (
    <div className="flex items-center gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-36 h-10">
        <path d={fill} fill="rgba(59,130,246,0.08)" />
        <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r="3" fill="#3b82f6" />
        ))}
      </svg>
      <div>
        <p className={clsx('text-lg font-bold', nc.color)}>{lastScore}%</p>
        <p className="text-[10px] text-[color:var(--text-muted)]">S{data[data.length-1].semaine}</p>
      </div>
    </div>
  );
}

// ── Carte audit dans la liste ─────────────────────────────────────────────────

interface AuditCardProps {
  audit: Audit;
  onSelect: (a: Audit) => void;
}

function AuditCard({ audit, onSelect }: AuditCardProps) {
  const score = audit.score_global ?? 0;
  const nc = niveauConformite(score);
  const ncMajeurs = audit.ecarts.filter(e => e.niveau === 'MAJEUR').length;
  const ncOuverts = audit.ecarts.filter(e => e.statut !== 'CLOS').length;

  return (
    <button
      onClick={() => onSelect(audit)}
      className="card-hover w-full text-left p-4 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-[color:var(--text-primary)] truncate">{audit.zone}</span>
            <span className="text-xs text-[color:var(--text-muted)] font-mono">{audit.numero}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-hover)] text-[color:var(--text-secondary)]">
              {ICONES_TYPE_AUDIT[audit.type_audit]} {LABELS_TYPE_AUDIT[audit.type_audit]}
            </span>
            <span className="text-[11px] text-[color:var(--text-muted)]">
              {new Date(audit.date_audit).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[11px] text-[color:var(--text-muted)]">— {audit.auditeur}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className={clsx('text-center px-3 py-1.5 rounded-xl border', nc.bg, nc.border)}>
            <p className={clsx('text-xl font-bold leading-none', nc.color)}>{score}%</p>
            <p className={clsx('text-[9px] font-medium mt-0.5', nc.color)}>{nc.label}</p>
          </div>
          <ChevronRight size={15} className="text-[color:var(--text-secondary)] group-hover:text-blue-400 transition-colors" />
        </div>
      </div>

      {audit.ecarts.length > 0 && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border)]">
          {ncMajeurs > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-danger-50 text-[color:var(--badge-danger-text)] font-medium">
              <AlertTriangle size={9} /> {ncMajeurs} MAJEUR{ncMajeurs > 1 ? 'S' : ''}
            </span>
          )}
          {ncOuverts > 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-50 text-[color:var(--badge-amber-text)] font-medium">
              <Clock size={9} /> {ncOuverts} ouvert{ncOuverts > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-success-50 text-[color:var(--badge-success-text)] font-medium">
              <CheckCircle2 size={9} /> Tous clos
            </span>
          )}
          <span className="text-[10px] text-[color:var(--text-muted)]">{audit.ecarts.length} écart{audit.ecarts.length > 1 ? 's' : ''} total</span>
        </div>
      )}
    </button>
  );
}

// ── Synthèse zones ────────────────────────────────────────────────────────────

const ZONES_SYNTHESE = ['Zone A - Production', 'Zone B - Packaging', 'Zone C - Énergie', 'Zone D - Chimie', 'Zone E - Logistique'];

function SyntheseZones() {
  const auditsParZone = useMemo(() => {
    const map = new Map<string, typeof AUDITS_DEMO>();
    for (const zone of ZONES_SYNTHESE) {
      map.set(zone, AUDITS_DEMO.filter(a => a.zone === zone && a.score_global !== undefined));
    }
    return map;
  }, []);

  return (
    <div className="card p-5">
      <p className="section-title flex items-center gap-2 mb-4"><BarChart2 size={12} />Score moyen par zone</p>
      <div className="space-y-3">
        {ZONES_SYNTHESE.map(zone => {
          const audits = auditsParZone.get(zone) ?? [];
          if (audits.length === 0) return null;
          const avg = Math.round(audits.reduce((s, a) => s + (a.score_global ?? 0), 0) / audits.length);
          const nc = niveauConformite(avg);
          const lastAudit = audits[audits.length - 1];
          const prev = audits.length > 1 ? audits[audits.length - 2].score_global ?? 0 : avg;
          const diff = avg - prev;

          return (
            <div key={zone} className="flex items-center gap-3">
              <div className="w-28 truncate text-xs text-[color:var(--text-secondary)] flex-shrink-0">{zone.split(' - ')[1]}</div>
              <div className="flex-1 h-3 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${avg}%`, backgroundColor: avg >= 80 ? '#10b981' : avg >= 60 ? '#f59e0b' : '#ef4444' }}
                />
              </div>
              <span className={clsx('text-xs font-bold w-9 text-right', nc.color)}>{avg}%</span>
              {diff !== 0 && (
                <span className={clsx('text-[10px] font-medium w-8', diff > 0 ? 'text-green-600' : 'text-red-500')}>
                  {diff > 0 ? '▲' : '▼'}{Math.abs(diff)}
                </span>
              )}
              <span className="text-[10px] text-[color:var(--text-muted)] w-14 flex-shrink-0">
                S{String(new Date(lastAudit.date_audit).getMonth() + 1).padStart(2,'0')} {audits.length} audit{audits.length > 1 ? 's' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Activité récente ──────────────────────────────────────────────────────────

function ActiviteRecente() {
  const recent = useMemo(() =>
    [...AUDITS_DEMO]
      .sort((a, b) => new Date(b.date_audit).getTime() - new Date(a.date_audit).getTime())
      .slice(0, 5),
  []);

  return (
    <div className="card p-5">
      <p className="section-title flex items-center gap-2 mb-4"><Clock size={12} />Activité récente</p>
      <div className="space-y-1">
        {recent.map(audit => {
          const score = audit.score_global ?? 0;
          const nc = niveauConformite(score);
          const barColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
          return (
            <div key={audit.id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
              <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: barColor }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[color:var(--text-primary)] truncate">{audit.zone}</p>
                <p className="text-[10px] text-[color:var(--text-muted)]">
                  {new Date(audit.date_audit).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} — {audit.auditeur}
                </p>
              </div>
              <span className={clsx('text-sm font-bold', nc.color)}>{score}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Alertes NC majeures ouvertes ──────────────────────────────────────────────

function AlertesNcMajeures() {
  const ouvertes = useMemo(() =>
    AUDITS_DEMO.flatMap(a =>
      a.ecarts
        .filter(e => e.niveau === 'MAJEUR' && e.statut !== 'CLOS')
        .map(e => ({ ...e, zone: a.zone, numero: a.numero }))
    ),
  []);

  if (ouvertes.length === 0) return null;

  return (
    <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-danger-500" />
        <h3 className="text-sm font-bold text-[color:var(--badge-danger-text)]">
          {ouvertes.length} NC majeure{ouvertes.length > 1 ? 's' : ''} en cours de traitement
        </h3>
      </div>
      <div className="space-y-2">
        {ouvertes.map(e => (
          <div key={e.id} className="bg-[var(--bg-hover)] rounded-xl p-3 flex items-start gap-3">
            <AlertTriangle size={14} className="text-danger-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[color:var(--badge-danger-text)] truncate">{e.zone} — {e.description.slice(0, 80)}…</p>
              <p className="text-[10px] text-[color:var(--badge-danger-text)] mt-0.5">
                Resp : {e.responsable} · Échéance : {new Date(e.date_echeance).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-[color:var(--badge-amber-text)] flex-shrink-0">
              {e.statut.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Onglet Dashboard ───────────────────────────────────────────────────────────

function TabDashboard({ onNouvelAudit }: { onNouvelAudit: () => void }) {
  const kpi = KPIS_AUDIT;

  return (
    <div className="space-y-6">
      {/* Alertes */}
      <AlertesNcMajeures />

      {/* KPIs */}
      <KpiGrid cols={4}>
        <KpiCard
          icon={ClipboardCheck}
          label="Audits réalisés"
          value={`${kpi.nb_audits_realises}/${kpi.nb_audits_realises + kpi.nb_audits_planifies}`}
          sub={`${kpi.taux_realisation}% du plan annuel`}
          color="navy"
        />
        <KpiCard
          icon={BarChart2}
          label="Score moyen"
          value={`${kpi.score_moyen_global}%`}
          sub={niveauConformite(kpi.score_moyen_global).label}
          color={kpi.score_moyen_global >= 80 ? 'success' : kpi.score_moyen_global >= 60 ? 'amber' : 'danger'}
        />
        <KpiCard
          icon={AlertTriangle}
          label="NC majeures ouvertes"
          value={kpi.nb_nc_majeures_ouvertes}
          sub={`sur ${kpi.nb_nc_total} écarts total`}
          color={kpi.nb_nc_majeures_ouvertes > 0 ? 'danger' : 'success'}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Taux clôture écarts"
          value={`${kpi.taux_cloture_ecarts}%`}
          sub={`${kpi.nb_nc_total - kpi.nb_nc_majeures_ouvertes} / ${kpi.nb_nc_total}`}
          color={kpi.taux_cloture_ecarts >= 80 ? 'success' : 'amber'}
        />
      </KpiGrid>

      {/* Grille principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Synthèse zones */}
        <div className="lg:col-span-2">
          <SyntheseZones />
        </div>

        {/* Activité récente */}
        <ActiviteRecente />
      </div>

      {/* Évolution Zone A + meilleur audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution Zone A */}
        <div className="card p-5">
          <p className="section-title flex items-center gap-2 mb-4"><BarChart2 size={12} />Évolution Zone A — Production 2026</p>
          <SparklineEvolution data={EVOLUTION_ZONE_A} />
          <div className="mt-4 flex flex-wrap gap-2">
            {EVOLUTION_ZONE_A.map(d => {
              const nc = niveauConformite(d.score);
              return (
                <div key={d.semaine} className={clsx('rounded-lg px-2.5 py-1.5 text-center border', nc.bg, nc.border)}>
                  <p className="text-[9px] text-[color:var(--text-muted)]">S{String(d.semaine).padStart(2,'0')}</p>
                  <p className={clsx('text-sm font-bold', nc.color)}>{d.score}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dernier audit détaillé */}
        <div className="card p-5">
          <p className="section-title flex items-center gap-2 mb-3"><ClipboardCheck size={12} />Dernier audit — scores sections</p>
          {(() => {
            const last = [...AUDITS_DEMO].sort((a, b) =>
              new Date(b.date_audit).getTime() - new Date(a.date_audit).getTime()
            )[0];
            return (
              <>
                <p className="text-xs text-[color:var(--text-secondary)] mb-3">
                  {last.zone} · {last.numero} ·{' '}
                  {new Date(last.date_audit).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
                </p>
                <ScoresSections audit={last} />
              </>
            );
          })()}
        </div>
      </div>

      {/* Bouton nouvel audit */}
      <div className="flex justify-end">
        <button onClick={onNouvelAudit} className="btn-primary">
          <Plus size={15} />
          Nouvel audit terrain
        </button>
      </div>
    </div>
  );
}

// ── Onglet Audits réalisés ─────────────────────────────────────────────────────

function TabAudits({ onSelect }: { onSelect: (a: Audit) => void }) {
  const [filterType, setFilterType]     = useState<TypeAudit | 'TOUS'>('TOUS');
  const [filterStatut, setFilterStatut] = useState<StatutAudit | 'TOUS'>('TOUS');
  const [filterZone, setFilterZone]     = useState<string>('TOUTES');

  const zones = [...new Set(AUDITS_DEMO.map(a => a.zone))];

  const filtered = useMemo(() => {
    return AUDITS_DEMO.filter(a => {
      if (filterType !== 'TOUS' && a.type_audit !== filterType) return false;
      if (filterStatut !== 'TOUS' && a.statut !== filterStatut) return false;
      if (filterZone !== 'TOUTES' && a.zone !== filterZone) return false;
      return true;
    }).sort((a, b) => new Date(b.date_audit).getTime() - new Date(a.date_audit).getTime());
  }, [filterType, filterStatut, filterZone]);

  const types: (TypeAudit | 'TOUS')[]   = ['TOUS', 'TERRAIN', 'SYSTEME', 'COMPLIANCE', 'SUIVI'];
  const statuts: (StatutAudit | 'TOUS')[] = ['TOUS', 'VALIDE', 'REALISE', 'EN_COURS'];

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="card p-3 flex flex-wrap items-center gap-3">
        <Filter size={13} className="text-[color:var(--text-muted)] flex-shrink-0" />

        <div className="flex items-center gap-1 flex-wrap">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={clsx(
                'text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors',
                filterType === t ? 'bg-[#0077aa] text-white' : 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)]',
              )}
            >
              {t === 'TOUS' ? 'Tous types' : LABELS_TYPE_AUDIT[t]}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-[var(--bg-hover)]" />

        <div className="flex items-center gap-1 flex-wrap">
          {statuts.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatut(s)}
              className={clsx(
                'text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors',
                filterStatut === s ? 'bg-[#0077aa] text-white' : 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)]',
              )}
            >
              {s === 'TOUS' ? 'Tous statuts' : LABELS_STATUT_AUDIT[s]}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-[var(--bg-hover)]" />

        <select
          value={filterZone}
          onChange={e => setFilterZone(e.target.value)}
          className="text-[11px] px-2 py-1 rounded-lg bg-[var(--bg-hover)] border-0 text-[color:var(--text-secondary)] cursor-pointer"
        >
          <option value="TOUTES">Toutes zones</option>
          {zones.map(z => <option key={z} value={z}>{z}</option>)}
        </select>

        <span className="text-[11px] text-[color:var(--text-muted)] ml-auto">{filtered.length} audit{filtered.length > 1 ? 's' : ''}</span>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={ClipboardCheck}
              variant="filtered"
              title="Aucun audit"
              description="Aucun audit ne correspond aux filtres sélectionnés."
              size="sm"
            />
          </div>
        ) : (
          filtered.map(a => <AuditCard key={a.id} audit={a} onSelect={onSelect} />)
        )}
      </div>
    </div>
  );
}

// ── Dashboard Audit principal ─────────────────────────────────────────────────

export function DashboardAudit() {
  const [tab, setTab]             = useState<Tab>('dashboard');
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [showFormulaire, setShowFormulaire] = useState(false);

  // Affichage rapport d'un audit
  if (selectedAudit) {
    return (
      <RapportAudit
        audit={selectedAudit}
        onBack={() => setSelectedAudit(null)}
      />
    );
  }

  // Formulaire nouvel audit
  if (showFormulaire) {
    return (
      <FormulaireAudit
        onBack={() => setShowFormulaire(false)}
        onSubmit={() => setShowFormulaire(false)}
      />
    );
  }

  return (
    <div className="min-h-screen">

      <ModuleHeader
        icon={ClipboardCheck}
        title="Audit HSE"
        subtitle="ISO 45001:2018 · MASE 2022 · Planning 2026"
        action={{ label: 'Nouvel audit', onClick: () => setShowFormulaire(true) }}
        tabs={TABS.map(t => ({
          id: t.id,
          label: t.label,
          icon: t.icon,
          badge: t.id === 'audits' ? AUDITS_DEMO.length : undefined,
        }))}
        activeTab={tab}
        onTabChange={id => setTab(id as Tab)}
      />

      {/* ── Contenu ── */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {tab === 'dashboard' && <TabDashboard onNouvelAudit={() => setShowFormulaire(true)} />}
        {tab === 'planning'  && (
          <PlanningAnnuel
            planning={PLANNING_2026}
            audits={AUDITS_DEMO}
            onPlanClick={(_plan, audit) => {
              if (audit) {
                setSelectedAudit(audit);
              } else {
                setShowFormulaire(true);
              }
            }}
          />
        )}
        {tab === 'audits'    && <TabAudits onSelect={setSelectedAudit} />}
      </main>
    </div>
  );
}
