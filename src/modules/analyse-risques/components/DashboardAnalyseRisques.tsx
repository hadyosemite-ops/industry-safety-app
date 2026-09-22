import { useEffect, useMemo, useState, type ElementType } from 'react';
import { clsx } from 'clsx';
import {
  Radar, ShieldCheck, TrendingDown, CheckCircle2, Eye, LayoutDashboard,
  ListChecks, Grid3x3, ClipboardList, BarChart2,
} from 'lucide-react';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import type { RisqueIndustriel, ActionRisque, PhaseRisque } from '../types';
import {
  LABELS_PHASE, calculerTauxCritiquesMaitrises, calculerTauxClotureDelais,
  actionEstEnRetard, actionEcheanceProche,
} from '../types';
import { useRisquesDashboardData } from '../hooks/useRisquesDashboardData';
import { MatriceRisques, type CelluleSelection } from './MatriceRisques';
import { RegistreRisques } from './RegistreRisques';
import { RisqueDetail } from './RisqueDetail';
import { RisqueWizard } from './RisqueWizard';
import { PlanActionKanban } from './PlanActionKanban';

// KPIs Taux de Fréquence / Taux de Gravité / presqu'accidents proviennent du
// module Accidentologie (mêmes définitions ISO/OHSAS que le reste de l'app) —
// ce module-ci n'a pas vocation à recalculer heures travaillées/effectif.
import { KPIS_DEMO as KPIS_ACCIDENTOLOGIE } from '@/modules/accidentologie/data/demo.data';

// ── Compteur animé ────────────────────────────────────────────────────────────

function CompteurAnime({ valeur, suffixe = '', decimales = 0 }: { valeur: number; suffixe?: string; decimales?: number }) {
  const [affiche, setAffiche] = useState(0);

  useEffect(() => {
    let frame: number;
    const debut = performance.now();
    const duree = 700;
    const depart = affiche;
    function tick(now: number) {
      const t = Math.min(1, (now - debut) / duree);
      const ease = 1 - Math.pow(1 - t, 3);
      setAffiche(depart + (valeur - depart) * ease);
      if (t < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valeur]);

  return <>{affiche.toFixed(decimales)}{suffixe}</>;
}

function KpiCard({ icon: Icon, label, valeur, suffixe, decimales, sub, color, urgent }: {
  icon: ElementType; label: string; valeur: number; suffixe?: string; decimales?: number; sub?: string; color: string; urgent?: boolean;
}) {
  return (
    <div className={clsx('card p-5 flex items-start gap-4', urgent && 'border-danger-300 shadow-glow-danger')}>
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold text-[color:var(--text-primary)] leading-none">
          <CompteurAnime valeur={valeur} suffixe={suffixe} decimales={decimales} />
        </p>
        <p className="text-sm font-medium text-[color:var(--text-secondary)] mt-1">{label}</p>
        {sub && <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
      {urgent && <span className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full animate-pulse mt-1.5" />}
    </div>
  );
}

// ── Onglets ────────────────────────────────────────────────────────────────────

type Onglet = 'apercu' | 'registre' | 'matrice' | 'plan-action';

const ONGLETS: { id: Onglet; label: string; icon: ElementType }[] = [
  { id: 'apercu',      label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: 'registre',    label: 'Registre',       icon: ListChecks },
  { id: 'matrice',     label: 'Matrice',        icon: Grid3x3 },
  { id: 'plan-action', label: "Plan d'action",  icon: ClipboardList },
];

// ── Dashboard principal ───────────────────────────────────────────────────────

export function DashboardAnalyseRisques() {
  const { risques, loading, refetch } = useRisquesDashboardData();
  const [onglet, setOnglet] = useState<Onglet>('apercu');
  const [phaseFiltre, setPhaseFiltre] = useState<PhaseRisque | 'TOUS'>('TOUS');
  const [celluleFiltre, setCelluleFiltre] = useState<CelluleSelection | null>(null);
  const [risqueOuvert, setRisqueOuvert] = useState<RisqueIndustriel | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const risquesFiltres = useMemo(
    () => phaseFiltre === 'TOUS' ? risques : risques.filter(r => r.phase === phaseFiltre),
    [risques, phaseFiltre],
  );

  const toutesActions = useMemo<ActionRisque[]>(() => risquesFiltres.flatMap(r =>
    (r.actions ?? []).map(a => ({ ...a, risque_numero: r.numero, risque_danger: r.danger, risque_phase: r.phase })),
  ), [risquesFiltres]);

  const kpis = useMemo(() => {
    const nbCritiques = risquesFiltres.filter(r => (r.niveau_residuel ?? r.niveau_initial) === 'CRITIQUE').length;
    return {
      pctCritiquesMaitrises: calculerTauxCritiquesMaitrises(risquesFiltres),
      tauxClotureDelais: calculerTauxClotureDelais(toutesActions),
      nbOuverts: risquesFiltres.filter(r => r.statut !== 'CLOTURE').length,
      nbCritiques,
      nbActionsEnRetard: toutesActions.filter(actionEstEnRetard).length,
      nbActionsEcheanceProche: toutesActions.filter(a => actionEcheanceProche(a)).length,
    };
  }, [risquesFiltres, toutesActions]);

  function ouvrirRisque(id: string) {
    const r = risques.find(x => x.id === id);
    if (r) setRisqueOuvert(r);
  }

  // ── Vue détail ──
  if (risqueOuvert) {
    return (
      <RisqueDetail
        risque={risqueOuvert}
        onBack={() => { setRisqueOuvert(null); void refetch(); }}
        onUpdate={updated => setRisqueOuvert(updated)}
      />
    );
  }

  // ── Wizard création ──
  if (showWizard) {
    return (
      <RisqueWizard
        registreExistant={risques}
        onCancel={() => setShowWizard(false)}
        onCree={nouveau => { setShowWizard(false); void refetch(); setRisqueOuvert(nouveau); }}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <ModuleHeader
        icon={Radar}
        title="Analyse des Risques Industriels"
        subtitle="Installation · Opération · Matrice F×G · Plan d'action"
        action={{ label: 'Nouveau risque', onClick: () => setShowWizard(true) }}
      />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Filtre phase global */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['TOUS', 'INSTALLATION', 'OPERATION'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPhaseFiltre(p)}
              className={clsx(
                'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors',
                phaseFiltre === p ? 'bg-[#0077aa] text-white shadow-sm' : 'text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)]',
              )}
            >
              {p === 'TOUS' ? 'Toutes les phases' : LABELS_PHASE[p]}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={TrendingDown} label="Taux de Fréquence" valeur={KPIS_ACCIDENTOLOGIE.tf} decimales={1} sub="Accidentologie site" color="bg-danger-50 text-[color:var(--badge-danger-text)]" />
          <KpiCard icon={TrendingDown} label="Taux de Gravité" valeur={KPIS_ACCIDENTOLOGIE.tg} decimales={2} sub="Accidentologie site" color="bg-safety-50 text-[color:var(--badge-safety-text)]" />
          <KpiCard icon={ShieldCheck} label="Critiques sous maîtrise" valeur={kpis.pctCritiquesMaitrises} suffixe="%" sub={`${kpis.nbCritiques} risque(s) critique(s)`} color="bg-navy-50 text-[color:var(--badge-navy-text)]" urgent={kpis.pctCritiquesMaitrises < 60 && kpis.nbCritiques > 0} />
          <KpiCard icon={CheckCircle2} label="Actions clôturées à temps" valeur={kpis.tauxClotureDelais} suffixe="%" sub={`${kpis.nbActionsEnRetard} action(s) en retard`} color="bg-success-50 text-[color:var(--badge-success-text)]" urgent={kpis.nbActionsEnRetard > 0} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard icon={Eye} label="Presqu'accidents remontés" valeur={KPIS_ACCIDENTOLOGIE.nb_presqu_accidents} sub="Culture de remontée proactive" color="bg-violet-500/10 text-[color:var(--badge-purple-text)]" />
          <KpiCard icon={BarChart2} label="Risques ouverts" valeur={kpis.nbOuverts} sub={`sur ${risquesFiltres.length} au registre`} color="bg-[var(--bg-hover)] text-[color:var(--text-secondary)]" />
        </div>

        {/* Onglets */}
        <div className="tabs-container overflow-x-auto">
          {ONGLETS.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOnglet(o.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0',
                onglet === o.id ? 'bg-[#0077aa] text-white shadow-sm' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-hover)]',
              )}
            >
              <o.icon size={14} /> {o.label}
              {o.id === 'plan-action' && kpis.nbActionsEnRetard > 0 && (
                <span className="text-[10px] px-1.5 rounded-full bg-white/20 font-bold">{kpis.nbActionsEnRetard}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-12 text-center text-[color:var(--text-muted)] text-sm">Chargement du registre des risques…</div>
        ) : (
          <>
            {onglet === 'apercu' && (
              <div className="space-y-6">
                <MatriceRisques risques={risquesFiltres} celluleActive={celluleFiltre} onSelectCellule={setCelluleFiltre} />
                <RegistreRisques
                  risques={risquesFiltres}
                  onSelect={r => setRisqueOuvert(r)}
                  celluleFiltre={celluleFiltre}
                  onResetCellule={() => setCelluleFiltre(null)}
                />
              </div>
            )}

            {onglet === 'registre' && (
              <RegistreRisques
                risques={risquesFiltres}
                onSelect={r => setRisqueOuvert(r)}
                celluleFiltre={celluleFiltre}
                onResetCellule={() => setCelluleFiltre(null)}
              />
            )}

            {onglet === 'matrice' && (
              <MatriceRisques risques={risquesFiltres} celluleActive={celluleFiltre} onSelectCellule={setCelluleFiltre} />
            )}

            {onglet === 'plan-action' && (
              <PlanActionKanban
                actions={toutesActions}
                onActionsChange={() => void refetch()}
                onSelectRisque={ouvrirRisque}
              />
            )}
          </>
        )}

      </main>
    </div>
  );
}
