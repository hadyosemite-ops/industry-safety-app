import { useState, useMemo, type ElementType } from 'react';
import {
  AlertTriangle, TrendingDown, TrendingUp,
  Search, CheckCircle2,
  BarChart2, FileWarning, Eye,
  LayoutGrid, List, Clock, MapPin, User, ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DOSSIERS_DEMO, KPIS_DEMO, HISTORIQUE_TF, OBJECTIF_TF } from '../data/demo.data';
import type { DossierAccident, TypeEvenement, StatutDossier } from '../types';
import { LABELS_TYPE, ICONES_TYPE } from '../types';
import { DossierCard, BadgeStatut } from './DossierCard';
import { DossierDetail } from './DossierDetail';
import { DeclarationWizard } from './DeclarationWizard';
import { ModuleHeader } from '@/components/ui/ModuleHeader';

const ACCIDENTS_VUE_KEY = 'hse-accidents-vue';

// ── Vue liste (tableau) ───────────────────────────────────────────────────────

function DossiersListe({ dossiers, onSelect }: { dossiers: DossierAccident[]; onSelect: (d: DossierAccident) => void }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-hover)]">
            <tr>
              <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Dossier</th>
              <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Type</th>
              <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Date</th>
              <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Zone</th>
              <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Victime</th>
              <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Actions</th>
              <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Statut</th>
              <th className="px-4 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {dossiers.map(d => {
              const dateEvt = format(new Date(d.date_evenement), 'dd MMM yyyy HH:mm', { locale: fr });
              const victime = d.victimes[0];
              const realisees = d.actions.filter(a => a.statut === 'REALISEE').length;
              return (
                <tr
                  key={d.id}
                  onClick={() => onSelect(d)}
                  className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <div className="text-xs font-mono text-[color:var(--text-muted)]">{d.numero}</div>
                    <div className="font-medium text-[color:var(--text-primary)] text-sm truncate max-w-xs">{d.titre}</div>
                  </td>
                  <td className="px-4 py-2.5 text-[color:var(--text-secondary)] whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <span>{ICONES_TYPE[d.type_evenement]}</span>
                      {LABELS_TYPE[d.type_evenement]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[color:var(--text-secondary)] whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={11} className="text-[color:var(--text-muted)]" />
                      {dateEvt}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[color:var(--text-secondary)] whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={11} className="text-[color:var(--text-muted)]" />
                      {d.zone_code}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[color:var(--text-secondary)] whitespace-nowrap">
                    {victime ? (
                      <span className="inline-flex items-center gap-1.5">
                        <User size={11} className="text-[color:var(--text-muted)]" />
                        {victime.prenom} {victime.nom}
                        {victime.jours_arret > 0 && (
                          <span className="text-orange-400 font-medium">· {victime.jours_arret}j</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[color:var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[color:var(--text-secondary)] whitespace-nowrap">
                    {d.actions.length > 0 ? `${realisees}/${d.actions.length}` : <span className="text-[color:var(--text-muted)]">—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    <BadgeStatut statut={d.statut} />
                  </td>
                  <td className="px-4 py-2.5">
                    <ChevronRight size={15} className="text-[color:var(--text-muted)]" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Onglets ────────────────────────────────────────────────────────────────────

type Onglet = 'tous' | StatutDossier | TypeEvenement;

// ── Composant KPI ─────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  trend,
  objectif,
  urgent,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  objectif?: string;
  urgent?: boolean;
}) {
  return (
    <div className={clsx(
      'card p-5 flex items-start gap-4',
      urgent && 'border-danger-300 shadow-glow-danger',
    )}>
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-end gap-2">
          <p className="text-2xl font-bold text-[color:var(--text-primary)] leading-none">{value}</p>
          {trend === 'down' && <TrendingDown size={16} className="text-green-500 mb-0.5" />}
          {trend === 'up'   && <TrendingUp   size={16} className="text-red-500 mb-0.5" />}
        </div>
        <p className="text-sm font-medium text-[color:var(--text-secondary)] mt-1">{label}</p>
        {sub && <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{sub}</p>}
        {objectif && <p className="text-xs text-[color:var(--badge-navy-text)] mt-0.5 font-medium">Obj. : {objectif}</p>}
      </div>
      {urgent && (
        <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full animate-pulse mt-1.5" />
      )}
    </div>
  );
}

// ── Mini sparkline TF (SVG simple) ────────────────────────────────────────────

function SparklineTF() {
  const data = HISTORIQUE_TF;
  const max = Math.max(...data.map(d => d.tf));
  const min = Math.min(...data.map(d => d.tf));
  const W = 200; const H = 40; const PAD = 4;

  const pts = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((d.tf - min) / (max - min + 0.1)) * (H - PAD * 2);
    return `${x},${y}`;
  }).join(' ');

  const objY = H - PAD - ((OBJECTIF_TF - min) / (max - min + 0.1)) * (H - PAD * 2);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-[color:var(--text-primary)]">Taux de Fréquence — 12 mois</p>
          <p className="text-xs text-[color:var(--text-muted)]">Accidents avec arrêt / 1M heures travaillées</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#0077aa] inline-block rounded" /> TF réel</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-400 border-dashed inline-block rounded" style={{borderTop:'1px dashed'}} /> Objectif {OBJECTIF_TF}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 60 }}>
        {/* Objectif */}
        <line x1={PAD} y1={objY} x2={W-PAD} y2={objY} stroke="#4ade80" strokeWidth="1" strokeDasharray="4,3" />
        {/* Courbe */}
        <polyline
          points={pts}
          fill="none"
          stroke="#00d4ff"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Dernier point */}
        {(() => {
          const last = data[data.length - 1];
          const x = W - PAD;
          const y = H - PAD - ((last.tf - min) / (max - min + 0.1)) * (H - PAD * 2);
          return <circle cx={x} cy={y} r="3" fill="#00d4ff" />;
        })()}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-[color:var(--text-muted)]">{data[0].mois}</span>
        <span className="text-xs text-[color:var(--text-muted)]">{data[data.length - 1].mois}</span>
      </div>
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────────────────────

export function DashboardAccidentologie() {
  const [onglet,       setOnglet]      = useState<Onglet>('tous');
  const [recherche,    setRecherche]   = useState('');
  const [dossierOuvert, setDossierOuvert] = useState<DossierAccident | null>(null);
  const [showWizard,   setShowWizard]  = useState(false);
  const [dossiers,     setDossiers]    = useState<DossierAccident[]>(DOSSIERS_DEMO);
  const [vue, setVue] = useState<'carte' | 'liste'>(
    () => (typeof window !== 'undefined' && window.localStorage.getItem(ACCIDENTS_VUE_KEY) === 'liste') ? 'liste' : 'carte',
  );

  function changerVue(next: 'carte' | 'liste') {
    setVue(next);
    window.localStorage.setItem(ACCIDENTS_VUE_KEY, next);
  }

  const kpis = KPIS_DEMO;


  // Filtrage
  const dossiersFiltres = useMemo(() => {
    const q = recherche.toLowerCase();
    return dossiers.filter(d => {
      const matchSearch = !q ||
        d.numero.toLowerCase().includes(q) ||
        d.titre.toLowerCase().includes(q) ||
        d.zone_code.toLowerCase().includes(q) ||
        d.victimes.some(v => `${v.nom} ${v.prenom}`.toLowerCase().includes(q));
      const matchOnglet =
        onglet === 'tous'              ||
        d.statut          === onglet   ||
        d.type_evenement  === onglet;
      return matchSearch && matchOnglet;
    });
  }, [recherche, onglet, dossiers]);

  // Compteurs onglets
  const counts = useMemo(() => ({
    tous:               dossiers.length,
    SIGNALE:            dossiers.filter(d => d.statut === 'SIGNALE').length,
    DECLARE:            dossiers.filter(d => d.statut === 'DECLARE').length,
    EN_INVESTIGATION:   dossiers.filter(d => d.statut === 'EN_INVESTIGATION').length,
    PLAN_ACTIONS:       dossiers.filter(d => d.statut === 'PLAN_ACTIONS').length,
    CLOTURE:            dossiers.filter(d => d.statut === 'CLOTURE').length,
    GRAVE:              dossiers.filter(d => d.type_evenement === 'GRAVE' || d.type_evenement === 'FATAL').length,
    PRESQU_ACCIDENT:    dossiers.filter(d => d.type_evenement === 'PRESQU_ACCIDENT').length,
  }), [dossiers]);

  const onglets: { id: Onglet; label: string; count: number; color?: string }[] = [
    { id: 'tous',             label: 'Tous',            count: counts.tous },
    { id: 'SIGNALE',          label: 'Signalés',        count: counts.SIGNALE,          color: 'gray' },
    { id: 'DECLARE',          label: 'Déclarés',        count: counts.DECLARE,          color: 'orange' },
    { id: 'EN_INVESTIGATION', label: 'En investigation',count: counts.EN_INVESTIGATION, color: 'blue' },
    { id: 'PLAN_ACTIONS',     label: "Plan d'actions",  count: counts.PLAN_ACTIONS,     color: 'violet' },
    { id: 'CLOTURE',          label: 'Clôturés',        count: counts.CLOTURE,          color: 'green' },
  ];

  function handleDossierUpdate(updated: DossierAccident) {
    setDossiers(prev => prev.map(d => d.id === updated.id ? updated : d));
    setDossierOuvert(updated);
  }

  function handleNouveauDossier(dossier: DossierAccident) {
    setDossiers(prev => [dossier, ...prev]);
    setShowWizard(false);
  }

  // ── Vue détail dossier ──
  if (dossierOuvert) {
    return (
      <DossierDetail
        dossier={dossierOuvert}
        onBack={() => setDossierOuvert(null)}
        onUpdate={handleDossierUpdate}
      />
    );
  }

  // ── Wizard déclaration ──
  if (showWizard) {
    return (
      <DeclarationWizard
        onCancel={() => setShowWizard(false)}
        onSoumettre={handleNouveauDossier}
      />
    );
  }

  return (
    <div className="min-h-screen">

      <ModuleHeader
        icon={AlertTriangle}
        title="Accidents & Incidents"
        subtitle="Déclaration · Investigation · Plan d'actions"
        action={{ label: 'Déclarer', onClick: () => setShowWizard(true) }}
      />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={AlertTriangle}
            label="Taux de Fréquence"
            value={kpis.tf.toFixed(1)}
            sub={`${kpis.nb_at_arret} AT avec arrêt`}
            color="bg-danger-50 text-[color:var(--badge-danger-text)]"
            trend="down"
            objectif={`< ${OBJECTIF_TF}`}
            urgent={kpis.tf > OBJECTIF_TF}
          />
          <KpiCard
            icon={TrendingDown}
            label="Taux de Gravité"
            value={kpis.tg.toFixed(2)}
            sub={`${kpis.jours_perdus} jours perdus`}
            color="bg-safety-50 text-[color:var(--badge-safety-text)]"
            trend="down"
            objectif={`< 0.30`}
          />
          <KpiCard
            icon={Eye}
            label="Presqu'accidents"
            value={kpis.nb_presqu_accidents}
            sub={`+ ${kpis.nb_situations} situations`}
            color="bg-success-50 text-[color:var(--badge-success-text)]"
            trend="neutral"
          />
          <KpiCard
            icon={CheckCircle2}
            label="Actions soldées"
            value={`${kpis.taux_actions_soldees}%`}
            sub="plans d'actions"
            color="bg-navy-50 text-[color:var(--badge-navy-text)]"
            trend={kpis.taux_actions_soldees >= 80 ? 'down' : 'up'}
            objectif="> 80%"
          />
        </div>

        {/* ── Ligne 2 KPIs + sparkline ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pyramide résumée */}
          <div className="card p-5">
            <p className="text-sm font-semibold text-[color:var(--text-primary)] mb-3">Répartition des événements</p>
            <div className="space-y-2">
              {(
                [
                  ['FATAL',               'text-[color:var(--badge-danger-text)]', 'bg-danger-100', 0],
                  ['GRAVE',               'text-[color:var(--badge-safety-text)]', 'bg-safety-100', kpis.nb_at_arret],
                  ['BENIN',               'text-[color:var(--badge-amber-text)]',  'bg-amber-100',  kpis.nb_at_sans_arret],
                  ['PRESQU_ACCIDENT',     'text-[color:var(--badge-success-text)]','bg-success-100',kpis.nb_presqu_accidents],
                  ['SITUATION_DANGEREUSE','text-[color:var(--badge-navy-text)]',   'bg-navy-100',   kpis.nb_situations],
                  ['OBSERVATION',         'text-[color:var(--badge-purple-text)]', 'bg-violet-500/10', kpis.nb_observations],
                ] as [TypeEvenement, string, string, number][]
              ).map(([type, textCls, bgCls, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full min-w-[24px] text-center', bgCls, textCls)}>
                    {count}
                  </span>
                  <span className="text-xs text-[color:var(--text-secondary)] truncate flex-1">{ICONES_TYPE[type]} {LABELS_TYPE[type]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sparkline TF — col-span-2 */}
          <div className="lg:col-span-2">
            <SparklineTF />
          </div>
        </div>

        {/* ── Alerte dossiers urgents ── */}
        {(counts.SIGNALE > 0 || counts.DECLARE > 0) && (
          <div className="bg-danger-50 border border-danger-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <FileWarning size={16} className="text-danger-600 flex-shrink-0" />
            <p className="text-sm text-[color:var(--badge-danger-text)]">
              {counts.SIGNALE > 0 && <><strong>{counts.SIGNALE} événement{counts.SIGNALE > 1 ? 's' : ''}</strong> signalé{counts.SIGNALE > 1 ? 's' : ''} en attente de déclaration. </>}
              {counts.DECLARE > 0 && <><strong>{counts.DECLARE} dossier{counts.DECLARE > 1 ? 's' : ''}</strong> déclaré{counts.DECLARE > 1 ? 's' : ''} sans investigation ouverte.</>}
            </p>
          </div>
        )}

        {/* ── Recherche ── */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-strong)] rounded-xl text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
            placeholder="Rechercher par numéro, titre, zone, victime…"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
        </div>

        {/* ── Onglets statut ── */}
        <div className="tabs-container overflow-x-auto">
          {onglets.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOnglet(o.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0',
                onglet === o.id ? 'bg-[#0077aa] text-white shadow-sm' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-hover)]',
              )}
            >
              {o.label}
              {o.count > 0 && (
                <span className={clsx(
                  'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                  onglet === o.id         ? 'bg-white/20 text-white' :
                  o.color === 'orange'    ? 'bg-safety-100 text-[color:var(--badge-safety-text)]' :
                  o.color === 'blue'      ? 'bg-navy-100 text-[color:var(--badge-navy-text)]' :
                  o.color === 'violet'    ? 'bg-violet-500/10 text-[color:var(--badge-purple-text)]' :
                  o.color === 'green'     ? 'bg-success-100 text-[color:var(--badge-success-text)]' :
                  'bg-[var(--bg-hover)] text-[color:var(--text-secondary)]',
                )}>
                  {o.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Onglets type (filtre secondaire) ── */}
        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto no-scrollbar -mx-1 px-1">
          <span className="text-xs text-[color:var(--text-muted)] font-medium flex-shrink-0">Filtrer par type :</span>
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--bg-hover)] flex-shrink-0">
            <button type="button" onClick={() => changerVue('carte')} aria-label="Affichage en cartes" title="Affichage en cartes"
              className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap',
                vue === 'carte' ? 'bg-[var(--bg-elevated)] text-[color:var(--text-primary)] shadow-sm' : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]')}>
              <LayoutGrid size={13} />Cartes
            </button>
            <button type="button" onClick={() => changerVue('liste')} aria-label="Affichage en liste" title="Affichage en liste"
              className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap',
                vue === 'liste' ? 'bg-[var(--bg-elevated)] text-[color:var(--text-primary)] shadow-sm' : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]')}>
              <List size={13} />Liste
            </button>
          </div>
          {(
            ['GRAVE', 'BENIN', 'PRESQU_ACCIDENT', 'SITUATION_DANGEREUSE', 'OBSERVATION'] as TypeEvenement[]
          ).map(type => {
            const cnt = dossiers.filter(d => d.type_evenement === type).length;
            const isActive = onglet === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setOnglet(isActive ? 'tous' : type)}
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap flex-shrink-0',
                  isActive
                    ? 'bg-[#0077aa] text-white border-[#00d4ff]'
                    : 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] border-[var(--border)] hover:border-[var(--border)]',
                )}
              >
                <span>{ICONES_TYPE[type]}</span>
                <span>{LABELS_TYPE[type]}</span>
                <span className="bg-[var(--bg-hover)] text-[color:var(--text-secondary)] px-1.5 rounded-full text-xs"
                  style={isActive ? { background: 'rgba(255,255,255,0.2)', color: 'white' } : {}}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Liste dossiers ── */}
        {dossiersFiltres.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-12 h-12 bg-[var(--bg-hover)] rounded-xl flex items-center justify-center mx-auto mb-3">
              <BarChart2 size={20} className="text-[color:var(--text-muted)]" />
            </div>
            <p className="text-[color:var(--text-secondary)] font-medium">Aucun dossier</p>
            <p className="text-[color:var(--text-muted)] text-sm mt-1">
              {recherche ? 'Aucun résultat pour cette recherche.' : 'Aucun événement dans cette catégorie.'}
            </p>
          </div>
        ) : vue === 'carte' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-20">
            {dossiersFiltres.map(d => (
              <DossierCard key={d.id} dossier={d} onClick={setDossierOuvert} />
            ))}
          </div>
        ) : (
          <div className="pb-20">
            <DossiersListe dossiers={dossiersFiltres} onSelect={setDossierOuvert} />
          </div>
        )}

      </main>
    </div>
  );
}
