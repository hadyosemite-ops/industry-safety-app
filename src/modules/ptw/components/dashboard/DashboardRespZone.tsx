import { useState, useMemo } from 'react';
import {
  Shield, ClipboardCheck, Activity, AlertTriangle,
  CheckCircle2, Search, User, XCircle,
  ThumbsUp, LayoutList, LayoutDashboard,
} from 'lucide-react';
import { clsx } from 'clsx';
import { AT_DEMO, ATDemo } from './demo.data';
import type { StatutATDemo } from './demo.data';
import { ATApprovalCard } from './ATApprovalCard';
import { ATActiveCard } from './ATActiveCard';
import { ATSuspenduCard } from './ATSuspenduCard';
import { BadgeStatutAT, BadgeRisque } from './DashboardAnimateur';
import { KanbanView } from './KanbanView';
import { KpiCard, KpiGrid } from '@/components/ui/KpiCard';
import { EmptyState } from '@/components/ui/EmptyState';

// ── Types ─────────────────────────────────────────────────────────────────────

type Onglet = 'approuver' | 'actives' | 'suspendues' | 'toutes';
type Vue    = 'liste' | 'kanban';

// ── Toggle vue ────────────────────────────────────────────────────────────────

function VueToggle({ vue, onChange }: { vue: Vue; onChange: (v: Vue) => void }) {
  return (
    <div className="card flex items-center gap-0.5 p-1 flex-shrink-0">
      <button
        type="button"
        title="Vue liste"
        onClick={() => onChange('liste')}
        className={clsx(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
          vue === 'liste' ? 'bg-[#0077aa] text-white shadow-sm' : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)]',
        )}
      >
        <LayoutList size={15} />
      </button>
      <button
        type="button"
        title="Vue kanban"
        onClick={() => onChange('kanban')}
        className={clsx(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
          vue === 'kanban' ? 'bg-[#0077aa] text-white shadow-sm' : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)]',
        )}
      >
        <LayoutDashboard size={15} />
      </button>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function DashboardRespZone({ embedded = false }: { embedded?: boolean }) {
  const [onglet,    setOnglet]    = useState<Onglet>('approuver');
  const [vue,       setVue]       = useState<Vue>('liste');
  const [recherche, setRecherche] = useState('');

  // État local des AT (permet de simuler approbations/refus)
  const [atData, setAtData] = useState<ATDemo[]>(AT_DEMO);

  // KPIs
  const kpis = useMemo(() => ({
    aApprouver:   atData.filter(a => a.statut === 'VALIDEE').length,
    actives:      atData.filter(a => a.statut === 'ACTIVE').length,
    suspendues:   atData.filter(a => a.statut === 'SUSPENDUE').length,
    approuvees:   atData.filter(a => a.statut === 'APPROUVEE').length,
  }), [atData]);

  // Filtrage recherche
  const atFiltrees = useMemo(() => {
    const q = recherche.toLowerCase();
    return atData.filter(at =>
      !q ||
      at.numero_at.toLowerCase().includes(q) ||
      at.titre.toLowerCase().includes(q) ||
      at.entreprise_intervenante.toLowerCase().includes(q) ||
      at.zone.toLowerCase().includes(q),
    );
  }, [recherche, atData]);

  // Filtrage onglet
  const atAffichees = useMemo(() => {
    if (vue === 'kanban') return atFiltrees; // kanban = tout afficher dans les colonnes
    switch (onglet) {
      case 'approuver':  return atFiltrees.filter(a => a.statut === 'VALIDEE');
      case 'actives':    return atFiltrees.filter(a => a.statut === 'ACTIVE');
      case 'suspendues': return atFiltrees.filter(a => a.statut === 'SUSPENDUE');
      case 'toutes':     return atFiltrees;
    }
  }, [onglet, vue, atFiltrees]);

  const onglets: { id: Onglet; label: string; count: number; color?: string }[] = [
    { id: 'approuver',  label: 'À approuver', count: atData.filter(a => a.statut === 'VALIDEE').length,   color: 'teal' },
    { id: 'actives',    label: 'Actives',      count: atData.filter(a => a.statut === 'ACTIVE').length,    color: 'green' },
    { id: 'suspendues', label: 'Suspendues',   count: atData.filter(a => a.statut === 'SUSPENDUE').length, color: 'orange' },
    { id: 'toutes',     label: 'Toutes',       count: atData.length },
  ];

  // Handler kanban
  function handleKanbanTransition(atId: string, newStatut: StatutATDemo) {
    setAtData(prev => prev.map(at => at.id === atId ? { ...at, statut: newStatut } : at));
  }

  // Handlers
  function handleApprouver(atId: string, commentaire: string) {
    console.log('AT approuvée :', atId, commentaire);
    setAtData(prev => prev.map(at =>
      at.id === atId ? { ...at, statut: 'APPROUVEE' as const } : at,
    ));
  }

  function handleRefuser(atId: string, motif: string) {
    console.log('AT refusée :', atId, motif);
    setAtData(prev => prev.map(at =>
      at.id === atId ? { ...at, statut: 'SOUMISE' as const } : at,
    ));
  }

  return (
    <div className={embedded ? '' : 'min-h-screen'}>

      {/* ── Topbar — masqué si embedded ── */}
      {!embedded && (
        <header className="bg-[#0077aa] shadow-lg sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-base leading-none">Dashboard Resp. Zone</h1>
                <p className="text-white/50 text-xs mt-0.5">Approbation AT · PTW</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5">
              <User size={14} className="text-white/70" />
              <span className="text-white text-sm font-medium">Karim Benali</span>
              <span className="bg-white/15 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                Resp. Zone
              </span>
            </div>
          </div>
        </header>
      )}

      <main className={clsx(
        'mx-auto space-y-5',
        embedded ? 'px-6 py-6' : 'px-4 py-6',
        vue === 'kanban' ? 'max-w-full' : 'max-w-5xl',
      )}>

        {/* ── KPIs ── */}
        <KpiGrid cols={4}>
          <KpiCard icon={ClipboardCheck} label="AT à approuver"  color="navy"    value={kpis.aApprouver} sub="décision requise"        />
          <KpiCard icon={ThumbsUp}       label="AT approuvées"   color="neutral" value={kpis.approuvees} sub="en attente d'activation"  />
          <KpiCard icon={Activity}       label="AT actives"      color="success" value={kpis.actives}    sub="en cours de travaux"       />
          <KpiCard icon={AlertTriangle}  label="Suspensions"     color="safety"  value={kpis.suspendues} sub="AT arrêtées"               />
        </KpiGrid>

        {/* ── Règle métier rappel ── */}
        {kpis.aApprouver > 0 && (
          <div className="bg-navy-50 border border-navy-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <CheckCircle2 size={16} className="text-[color:var(--badge-navy-text)] flex-shrink-0" />
            <p className="text-sm text-[color:var(--badge-navy-text)]">
              <strong>{kpis.aApprouver} AT</strong> en attente de votre approbation.
              Tous les permis ont été validés terrain par l'Animateur de Sécurité.
            </p>
          </div>
        )}

        {/* ── Recherche + toggle vue ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher par numéro AT, titre, entreprise, zone…"
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
            />
          </div>
          <VueToggle vue={vue} onChange={setVue} />
        </div>

        {/* ── Onglets (liste seulement) ── */}
        {vue === 'liste' && (
          <div className="tabs-container overflow-x-auto">
            {onglets.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => setOnglet(o.id)}
                className={clsx(
                  'flex-shrink-0',
                  onglet === o.id ? 'tab-pill-active' : 'tab-pill-inactive',
                )}
              >
                {o.label}
                {o.count > 0 && (
                  <span className={clsx(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                    onglet === o.id      ? 'bg-amber-100 text-[color:var(--badge-amber-text)]'    :
                    o.color === 'teal'   ? 'bg-navy-100 text-[color:var(--badge-navy-text)]'      :
                    o.color === 'green'  ? 'bg-success-100 text-[color:var(--badge-success-text)]' :
                    o.color === 'orange' ? 'bg-safety-100 text-[color:var(--badge-safety-text)]'  :
                    'bg-[var(--bg-hover)] text-[color:var(--text-secondary)]',
                  )}>
                    {o.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Contenu ── */}
        {vue === 'kanban' ? (
          <KanbanView
            ats={atAffichees}
            role="RESP_ZONE"
            onTransition={handleKanbanTransition}
          />
        ) : (
          <div className="space-y-3">
            {atAffichees.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={ClipboardCheck}
                  variant={recherche ? 'search' : 'default'}
                  title={recherche ? 'Aucun résultat' : 'Aucune autorisation de travail'}
                  description={recherche ? `Aucun résultat pour "${recherche}".` : 'Rien à afficher dans cet onglet.'}
                  size="sm"
                />
              </div>
            ) : (
              atAffichees.map(at => {
                if (at.statut === 'VALIDEE') return (
                  <ATApprovalCard key={at.id} at={at} onApprouver={handleApprouver} onRefuser={handleRefuser} />
                );
                if (at.statut === 'ACTIVE')    return <ATActiveCard   key={at.id} at={at} />;
                if (at.statut === 'SUSPENDUE') return <ATSuspenduCard key={at.id} at={at} />;
                return (
                  <div key={at.id} className={clsx(
                    'card p-4 flex items-center gap-4',
                    at.statut === 'APPROUVEE' ? 'border-purple-500/30' : '',
                  )}>
                    {at.statut === 'APPROUVEE' ? (
                      <CheckCircle2 size={16} className="text-purple-500 flex-shrink-0" />
                    ) : at.statut === 'SOUMISE' ? (
                      <XCircle size={16} className="text-red-400 flex-shrink-0" />
                    ) : (
                      <ClipboardCheck size={16} className="text-[color:var(--text-secondary)] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[color:var(--text-primary)] truncate text-sm">{at.titre}</p>
                      <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{at.numero_at} · {at.entreprise_intervenante}</p>
                      {at.statut === 'APPROUVEE' && (
                        <p className="text-xs text-purple-600 mt-0.5 font-medium">Approuvée — en attente d'activation terrain</p>
                      )}
                      {at.statut === 'SOUMISE' && (
                        <p className="text-xs text-red-500 mt-0.5 font-medium">Renvoyée en correction — re-soumission Animateur requise</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <BadgeRisque niveau={at.niveau_risque} />
                      <BadgeStatutAT statut={at.statut} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </main>
    </div>
  );
}
