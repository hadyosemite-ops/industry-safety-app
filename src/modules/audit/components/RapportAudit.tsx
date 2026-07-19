// ─────────────────────────────────────────────────────────────────────────────
// Module Audit HSE — Rapport d'audit
// Synthèse exécutive · Scores sections · Tableau écarts · Plan d'actions
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  ArrowLeft, FileText, Download, CheckCircle2, AlertTriangle,
  Clock, XCircle, TrendingUp, User, Calendar, MapPin, Printer, BarChart2,
} from 'lucide-react';

import { CHECKLIST_STANDARD } from '../data/checklist.data';
import {
  calculerScore, niveauConformite,
  LABELS_SECTION, ICONES_SECTION, COULEURS_SECTION, SECTIONS_ORDRE,
  LABELS_TYPE_AUDIT, LABELS_STATUT_AUDIT,
  type Audit, type EcartAudit,
} from '../types';

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  audit:  Audit;
  onBack: () => void;
}

// ── Gauge score ───────────────────────────────────────────────────────────────

function ScoreGauge({ score, size = 96 }: { score: number; size?: number }) {
  const nc     = niveauConformite(score);
  const R      = size / 2 - 8;
  const cx     = size / 2;
  const cy     = size / 2;
  const circ   = 2 * Math.PI * R;
  const arc    = circ * 0.75; // 270°
  const offset = arc - (score / 100) * arc;
  const strokeColor =
    score >= 95 ? '#10b981' : score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[135deg]">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} strokeLinecap="round"
          strokeDasharray={`${arc} ${circ - arc}`} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={strokeColor} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={clsx('font-bold leading-none', nc.color, size >= 96 ? 'text-2xl' : 'text-lg')}>{score}%</span>
        <span className={clsx('font-medium mt-0.5', nc.color, size >= 96 ? 'text-[10px]' : 'text-[9px]')}>{nc.label}</span>
      </div>
    </div>
  );
}

// ── Bar chart section ─────────────────────────────────────────────────────────

function SectionBars({ audit }: { audit: Audit }) {
  return (
    <div className="space-y-2.5">
      {SECTIONS_ORDRE.map(sec => {
        const score = audit.scores_sections?.[sec] ?? calculerScore(audit.reponses, CHECKLIST_STANDARD, sec);
        const nc    = niveauConformite(score);
        const col   = COULEURS_SECTION[sec];
        const ncItems = CHECKLIST_STANDARD.filter(i =>
          i.section === sec && audit.reponses.find(r => r.item_id === i.id)?.reponse === 'NON_CONFORME'
        ).length;

        return (
          <div key={sec} className="flex items-center gap-3">
            <span className="text-base w-6 text-center flex-shrink-0">{ICONES_SECTION[sec]}</span>
            <div className="w-36 flex-shrink-0">
              <span className="text-[11px] text-[color:var(--text-secondary)] truncate block">{LABELS_SECTION[sec].split(' — ')[1]}</span>
            </div>
            <div className="flex-1 h-4 rounded-full bg-[var(--bg-hover)] overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${score}%`, backgroundColor: col.border }}
              />
              {/* Seuil 80% */}
              <div className="absolute top-0 h-full w-px bg-white/25" style={{ left: '80%' }} />
            </div>
            <span className={clsx('text-xs font-bold w-9 text-right flex-shrink-0', nc.color)}>{score}%</span>
            {ncItems > 0 && (
              <span className="text-[10px] text-red-500 w-8 flex-shrink-0">-{ncItems}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Tableau des écarts ────────────────────────────────────────────────────────

const NIVEAU_STYLE: Record<EcartAudit['niveau'], { bg: string; text: string; dot: string }> = {
  MAJEUR:      { bg: 'bg-danger-50',  text: 'text-[color:var(--badge-danger-text)]', dot: '#ef4444' },
  MINEUR:      { bg: 'bg-amber-50',   text: 'text-[color:var(--badge-amber-text)]',  dot: '#f59e0b' },
  OBSERVATION: { bg: 'bg-navy-50',    text: 'text-[color:var(--badge-navy-text)]',   dot: '#3b82f6' },
};

const STATUT_STYLE: Record<EcartAudit['statut'], { bg: string; text: string; icon: ReactNode }> = {
  OUVERT:   { bg: 'bg-danger-100',  text: 'text-[color:var(--badge-danger-text)]',  icon: <XCircle size={10} /> },
  EN_COURS: { bg: 'bg-amber-100',   text: 'text-[color:var(--badge-amber-text)]',   icon: <Clock   size={10} /> },
  CLOS:     { bg: 'bg-success-100', text: 'text-[color:var(--badge-success-text)]', icon: <CheckCircle2 size={10} /> },
};

function TableauEcarts({ ecarts }: { ecarts: EcartAudit[] }) {
  const sorted = [...ecarts].sort((a, b) => {
    const order = { MAJEUR: 0, MINEUR: 1, OBSERVATION: 2 };
    return order[a.niveau] - order[b.niveau];
  });

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-[color:var(--text-muted)]">
        <CheckCircle2 size={32} className="mx-auto mb-2 text-green-400" />
        <p className="text-sm font-medium text-green-500">Aucun écart — Audit conforme ✓</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-xs">
        <thead className="bg-[var(--bg-hover)]">
          <tr>
            <th className="text-left px-3 py-2 text-[color:var(--text-muted)] font-semibold w-8">#</th>
            <th className="text-left px-3 py-2 text-[color:var(--text-muted)] font-semibold">Section</th>
            <th className="text-left px-3 py-2 text-[color:var(--text-muted)] font-semibold">Description</th>
            <th className="text-left px-3 py-2 text-[color:var(--text-muted)] font-semibold w-20">Niveau</th>
            <th className="text-left px-3 py-2 text-[color:var(--text-muted)] font-semibold">Action corrective</th>
            <th className="text-left px-3 py-2 text-[color:var(--text-muted)] font-semibold w-28">Responsable</th>
            <th className="text-left px-3 py-2 text-[color:var(--text-muted)] font-semibold w-20">Échéance</th>
            <th className="text-left px-3 py-2 text-[color:var(--text-muted)] font-semibold w-20">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--border)]">
          {sorted.map((e, i) => {
            const ns = NIVEAU_STYLE[e.niveau];
            const ss = STATUT_STYLE[e.statut];
            return (
              <tr key={e.id} className={clsx('hover:bg-[var(--bg-hover)]', e.niveau === 'MAJEUR' ? 'bg-danger-50/30' : '')}>
                <td className="px-3 py-2.5 text-[color:var(--text-muted)]">{i + 1}</td>
                <td className="px-3 py-2.5">
                  <span className="flex items-center gap-1">
                    <span>{ICONES_SECTION[e.section]}</span>
                    <span className="text-[color:var(--text-secondary)] truncate max-w-[80px]">{LABELS_SECTION[e.section].split(' — ')[1]}</span>
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-[color:var(--text-primary)] line-clamp-2 max-w-[200px]">{e.description}</p>
                  {e.reglementaire && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-orange-500/10 text-orange-300 mt-0.5">
                      Réglementaire
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span className={clsx('inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold', ns.bg, ns.text)}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ns.dot }} />
                    {e.niveau}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <p className="text-[color:var(--text-secondary)] line-clamp-2 max-w-[160px]">{e.action_corrective}</p>
                </td>
                <td className="px-3 py-2.5 text-[color:var(--text-secondary)] whitespace-nowrap">{e.responsable.split(' ')[0]}</td>
                <td className="px-3 py-2.5 text-[color:var(--text-muted)] whitespace-nowrap">
                  {new Date(e.date_echeance).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </td>
                <td className="px-3 py-2.5">
                  <span className={clsx('inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium', ss.bg, ss.text)}>
                    {ss.icon}
                    {e.statut.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Radar en SVG (polygon) ────────────────────────────────────────────────────

function RadarSVG({ audit }: { audit: Audit }) {
  const sections = SECTIONS_ORDRE;
  const n = sections.length;
  const CX = 140; const CY = 140; const R = 100;

  const angles = sections.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2);

  function ptGrid(angle: number, r: number) {
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  }

  const scores = sections.map(sec =>
    (audit.scores_sections?.[sec] ?? calculerScore(audit.reponses, CHECKLIST_STANDARD, sec)) / 100
  );

  const dataPoints = scores.map((s, i) => ptGrid(angles[i], s * R));

  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-[240px] mx-auto">
      {/* Cercles de fond */}
      {[0.25, 0.5, 0.75, 1].map(r => (
        <polygon
          key={r}
          points={angles.map(a => `${ptGrid(a, r * R).x},${ptGrid(a, r * R).y}`).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"
        />
      ))}

      {/* Axes */}
      {angles.map((angle, i) => {
        const p = ptGrid(angle, R);
        return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
      })}

      {/* Seuil 80% */}
      <polygon
        points={angles.map(a => `${ptGrid(a, 0.8 * R).x},${ptGrid(a, 0.8 * R).y}`).join(' ')}
        fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="4,2" opacity="0.6"
      />

      {/* Données */}
      <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
        fill="rgba(0,212,255,0.15)" stroke="#00d4ff" strokeWidth="2" strokeLinejoin="round" />

      {/* Points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#00d4ff" />
      ))}

      {/* Labels */}
      {angles.map((angle, i) => {
        const p = ptGrid(angle, R + 18);
        const col = COULEURS_SECTION[sections[i]];
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fill={col.text} fontWeight="600">
            {ICONES_SECTION[sections[i]]}
          </text>
        );
      })}

      {/* Valeurs % */}
      {scores.map((s, i) => {
        const p = ptGrid(angles[i], s * R);
        const score = Math.round(s * 100);
        return (
          <g key={`val-${i}`}>
            <rect x={p.x - 14} y={p.y - 8} width={28} height={14} rx="4" fill="#0a1628" filter="url(#shadow)" />
            <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize="9" fontWeight="bold"
              fill={score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'}>
              {score}%
            </text>
          </g>
        );
      })}

      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.1" />
        </filter>
      </defs>
    </svg>
  );
}

// ── Rapport principal ─────────────────────────────────────────────────────────

export function RapportAudit({ audit, onBack }: Props) {
  const [activeSection, setActiveSection] = useState<'synthese' | 'ecarts' | 'actions'>('synthese');

  const score     = audit.score_global ?? 0;
  const ncMajeurs = audit.ecarts.filter(e => e.niveau === 'MAJEUR').length;
  const ncMineurs = audit.ecarts.filter(e => e.niveau === 'MINEUR').length;
  const ncObs     = audit.ecarts.filter(e => e.niveau === 'OBSERVATION').length;
  const ncOuverts = audit.ecarts.filter(e => e.statut !== 'CLOS').length;
  const ncClos    = audit.ecarts.filter(e => e.statut === 'CLOS').length;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-[var(--bg-elevated)] border-b border-[var(--border)] px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-xl hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[color:var(--text-primary)] leading-none">Rapport d'audit</h1>
              <span className="text-xs font-mono text-[color:var(--text-muted)]">{audit.numero}</span>
            </div>
            <p className="text-[11px] text-[color:var(--text-muted)] mt-0.5">{audit.zone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            'text-[11px] font-semibold px-2.5 py-1 rounded-full border',
            audit.statut === 'VALIDE'  ? 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200' :
            audit.statut === 'REALISE' ? 'bg-navy-50 text-[color:var(--badge-navy-text)] border-navy-200'   :
            'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] border-[var(--border)]',
          )}>
            {LABELS_STATUT_AUDIT[audit.statut]}
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors border border-[var(--border)]"
          >
            <Printer size={14} />
            Imprimer
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#0077aa] text-white rounded-xl text-sm font-semibold hover:bg-[#0088cc] transition-colors shadow-sm"
          >
            <Download size={14} />
            Export PDF
          </button>
        </div>
      </header>

      <main className="px-8 py-6 space-y-6">
        {/* ── Carte d'identité ── */}
        <div className="card p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* Score gauge */}
            <div className="flex justify-center">
              <ScoreGauge score={score} size={120} />
            </div>

            {/* Meta */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-[color:var(--text-muted)]" />
                <span className="text-sm font-semibold text-[color:var(--text-primary)]">{audit.zone}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-hover)] text-[color:var(--text-secondary)]">
                  {LABELS_TYPE_AUDIT[audit.type_audit]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-[color:var(--text-muted)]" />
                <span className="text-sm text-[color:var(--text-secondary)]">
                  {new Date(audit.date_audit).toLocaleDateString('fr-FR', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
                {audit.duree_minutes && (
                  <span className="text-xs text-[color:var(--text-muted)]">({audit.duree_minutes} min)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <User size={13} className="text-[color:var(--text-muted)]" />
                <span className="text-sm text-[color:var(--text-secondary)]">{audit.auditeur}</span>
                {audit.accompagnateur && (
                  <span className="text-xs text-[color:var(--text-muted)]">+ {audit.accompagnateur}</span>
                )}
              </div>
              {audit.validateur && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-green-500" />
                  <span className="text-xs text-[color:var(--text-secondary)]">
                    Validé par {audit.validateur} le {new Date(audit.date_validation!).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>

            {/* Stats écarts */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                <div className="text-center bg-danger-50 rounded-xl p-2 border border-danger-100">
                  <p className="text-lg font-bold text-[color:var(--badge-danger-text)]">{ncMajeurs}</p>
                  <p className="text-[9px] text-[color:var(--badge-danger-text)] font-medium">MAJEUR</p>
                </div>
                <div className="text-center bg-amber-50 rounded-xl p-2 border border-amber-100">
                  <p className="text-lg font-bold text-[color:var(--badge-amber-text)]">{ncMineurs}</p>
                  <p className="text-[9px] text-[color:var(--badge-amber-text)] font-medium">MINEUR</p>
                </div>
                <div className="text-center bg-navy-50 rounded-xl p-2 border border-navy-100">
                  <p className="text-lg font-bold text-[color:var(--badge-navy-text)]">{ncObs}</p>
                  <p className="text-[9px] text-[color:var(--badge-navy-text)] font-medium">OBS.</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[color:var(--text-muted)]">{ncClos} clos / {audit.ecarts.length} total</span>
                {ncOuverts > 0
                  ? <span className="text-[color:var(--badge-amber-text)] font-medium">{ncOuverts} ouvert{ncOuverts > 1 ? 's' : ''}</span>
                  : <span className="text-[color:var(--badge-success-text)] font-medium flex items-center gap-0.5"><CheckCircle2 size={10} /> Tous clos</span>
                }
              </div>
              {/* Taux clôture */}
              <div className="h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-700"
                  style={{ width: audit.ecarts.length > 0 ? `${(ncClos / audit.ecarts.length) * 100}%` : '100%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs rapport ── */}
        <div className="card overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-[var(--border)]">
            {([
              { id: 'synthese', label: 'Synthèse & scores', icon: <BarChart2 size={14} /> },
              { id: 'ecarts',   label: `Écarts (${audit.ecarts.length})`, icon: <AlertTriangle size={14} /> },
              { id: 'actions',  label: 'Plan d\'actions', icon: <CheckCircle2 size={14} /> },
            ] as { id: typeof activeSection; label: string; icon: ReactNode }[]).map(t => (
              <button
                key={t.id}
                onClick={() => setActiveSection(t.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeSection === t.id
                    ? 'border-[#00d4ff] text-[color:var(--badge-navy-text)]'
                    : 'border-transparent text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]',
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* ── Synthèse ── */}
            {activeSection === 'synthese' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Radar */}
                  <div>
                    <h3 className="text-sm font-bold text-[color:var(--text-secondary)] mb-3">Radar sections</h3>
                    <RadarSVG audit={audit} />
                    <p className="text-[10px] text-[color:var(--text-muted)] text-center mt-1">Seuil MASE 80% = ligne verte pointillée</p>
                  </div>

                  {/* Bar chart */}
                  <div>
                    <h3 className="text-sm font-bold text-[color:var(--text-secondary)] mb-3">Scores par section</h3>
                    <SectionBars audit={audit} />
                    <div className="mt-3 flex items-center gap-3 text-[10px] text-[color:var(--text-muted)]">
                      <div className="flex items-center gap-1"><div className="w-3 h-px" style={{ borderTop: '1px dashed rgba(255,255,255,0.3)' }} /><span>Seuil 80%</span></div>
                      <div className="flex items-center gap-1"><span className="text-red-400">-N</span><span>= NC dans la section</span></div>
                    </div>
                  </div>
                </div>

                {/* Points positifs & synthèse narrative */}
                {(audit.points_positifs || audit.synthese) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {audit.points_positifs && (
                      <div className="bg-success-50 rounded-xl border border-success-100 p-4">
                        <h4 className="text-xs font-bold text-[color:var(--badge-success-text)] mb-2 flex items-center gap-1.5">
                          <TrendingUp size={13} /> Points positifs
                        </h4>
                        <p className="text-xs text-[color:var(--badge-success-text)]/90 leading-relaxed">{audit.points_positifs}</p>
                      </div>
                    )}
                    {audit.synthese && (
                      <div className="bg-navy-50 rounded-xl border border-navy-100 p-4">
                        <h4 className="text-xs font-bold text-[color:var(--badge-navy-text)] mb-2 flex items-center gap-1.5">
                          <FileText size={13} /> Synthèse générale
                        </h4>
                        <p className="text-xs text-navy-100/90 leading-relaxed">{audit.synthese}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Écarts ── */}
            {activeSection === 'ecarts' && (
              <div className="space-y-4">
                {ncMajeurs > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-danger-50 border border-danger-200 rounded-xl text-sm font-semibold text-[color:var(--badge-danger-text)]">
                    <AlertTriangle size={15} />
                    {ncMajeurs} NC majeure{ncMajeurs > 1 ? 's' : ''} réglementaire{ncMajeurs > 1 ? 's' : ''} identifiée{ncMajeurs > 1 ? 's' : ''}
                  </div>
                )}
                <TableauEcarts ecarts={audit.ecarts} />
              </div>
            )}

            {/* ── Plan d'actions ── */}
            {activeSection === 'actions' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-[color:var(--text-primary)]">Plan d'actions correctives</h3>
                  <div className="flex items-center gap-3 text-xs text-[color:var(--text-secondary)]">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" />Ouvert ({audit.ecarts.filter(e => e.statut === 'OUVERT').length})</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" />En cours ({audit.ecarts.filter(e => e.statut === 'EN_COURS').length})</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-400" />Clos ({ncClos})</span>
                  </div>
                </div>

                {audit.ecarts.length === 0 ? (
                  <div className="text-center py-8 text-[color:var(--text-muted)]">
                    <CheckCircle2 size={28} className="mx-auto mb-2 text-green-400" />
                    <p className="text-sm text-green-500 font-medium">Aucune action requise</p>
                  </div>
                ) : (
                  audit.ecarts
                    .sort((a, b) => {
                      const order = { OUVERT: 0, EN_COURS: 1, CLOS: 2 };
                      return order[a.statut] - order[b.statut];
                    })
                    .map((e, i) => {
                      const ns = NIVEAU_STYLE[e.niveau];
                      const ss = STATUT_STYLE[e.statut];
                      const overdue = e.statut !== 'CLOS' && new Date(e.date_echeance) < new Date();
                      return (
                        <div
                          key={e.id}
                          className={clsx(
                            'border rounded-xl p-3.5',
                            e.statut === 'CLOS' ? 'border-success-100 bg-success-50/30 opacity-75' :
                            overdue ? 'border-danger-200 bg-danger-50/40' :
                            'border-[var(--border)] bg-[var(--bg-hover)]',
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* Num + niveau */}
                            <div className="flex-shrink-0 text-center w-8">
                              <span className="text-xs font-bold text-[color:var(--text-muted)]">{i + 1}</span>
                              <div className="w-full h-1 rounded-full mt-1" style={{ backgroundColor: ns.dot }} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', ns.bg, ns.text)}>
                                  {e.niveau}
                                </span>
                                <span className="text-[11px] text-[color:var(--text-secondary)]">
                                  {ICONES_SECTION[e.section]} {LABELS_SECTION[e.section].split(' — ')[1]}
                                </span>
                                {overdue && (
                                  <span className="text-[10px] font-bold text-[color:var(--badge-danger-text)] bg-danger-100 px-1.5 py-0.5 rounded-full">
                                    ⚠️ En retard
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-[color:var(--text-primary)] mb-1">{e.description}</p>
                              <p className="text-xs text-[color:var(--text-secondary)]">
                                <span className="font-medium text-[color:var(--text-primary)]">Action :</span> {e.action_corrective}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-[10px] text-[color:var(--text-muted)]">
                                <span className="flex items-center gap-1"><User size={9} />{e.responsable}</span>
                                <span className="flex items-center gap-1">
                                  <Calendar size={9} />
                                  {new Date(e.date_echeance).toLocaleDateString('fr-FR')}
                                </span>
                                {e.date_cloture && (
                                  <span className="text-green-500 flex items-center gap-1">
                                    <CheckCircle2 size={9} /> Clos le {new Date(e.date_cloture).toLocaleDateString('fr-FR')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className={clsx('flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium', ss.bg, ss.text)}>
                              {ss.icon}
                              {e.statut.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

