import { useState, useMemo } from 'react';
import {
  ShieldCheck, ClipboardList, Zap, AlertTriangle, Search,
  CheckCircle2, Clock, Activity, ChevronRight, User,
  LayoutList, LayoutDashboard, QrCode,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { ATView, PermisView } from '../../types/dashboardView';
import { ICONES_PERMIS, LABELS_PERMIS } from '../../types/dashboardView';
import { StatutAT, StatutPermis, type NiveauRisque } from '../../types';
import { Link } from 'react-router-dom';
import { ATValidationCard } from './ATValidationCard';
import { ATActiveCard } from './ATActiveCard';
import { ATSuspenduCard } from './ATSuspenduCard';
import { KanbanView } from './KanbanView';
import { KpiCard, KpiGrid } from '@/components/ui/KpiCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import type { PTWActions } from '../../hooks/usePTWActions';

// ── Types ─────────────────────────────────────────────────────────────────────

type Onglet = 'valider' | 'actives' | 'suspendues' | 'toutes';
type Vue    = 'liste' | 'kanban';

export interface ValidationAction {
  type: 'approuver' | 'rejeter';
  permisId: string;
  atId: string;
  commentaire: string;
}

// ── Badge statut AT ────────────────────────────────────────────────────────────

export function BadgeStatutAT({ statut }: { statut: StatutAT }) {
  const cfg: Record<StatutAT, { label: string; cls: string }> = {
    [StatutAT.BROUILLON]: { label: 'Brouillon', cls: 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] border-[var(--border)]' },
    [StatutAT.SOUMISE]:   { label: 'À valider',  cls: 'bg-navy-50 text-[color:var(--badge-navy-text)] border-navy-200' },
    [StatutAT.VALIDEE]:   { label: 'Validée',    cls: 'bg-teal-500/10 text-[color:var(--badge-teal-text)] border-teal-400/30' },
    [StatutAT.APPROUVEE]: { label: 'Approuvée',  cls: 'bg-violet-500/10 text-[color:var(--badge-purple-text)] border-violet-400/30' },
    [StatutAT.ACTIVE]:    { label: 'Active',     cls: 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200' },
    [StatutAT.SUSPENDUE]: { label: 'Suspendue',  cls: 'bg-safety-50 text-[color:var(--badge-safety-text)] border-safety-200' },
    [StatutAT.CLOTUREE]:  { label: 'Clôturée',   cls: 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] border-[var(--border)]' },
  };
  const c = cfg[statut];
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border', c.cls)}>
      {c.label}
    </span>
  );
}

// ── Badge risque ──────────────────────────────────────────────────────────────

export function BadgeRisque({ niveau }: { niveau: NiveauRisque }) {
  const cfg: Record<NiveauRisque, { label: string; cls: string }> = {
    MODERE:   { label: 'Modéré',   cls: 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200' },
    ELEVE:    { label: 'Élevé',    cls: 'bg-amber-50 text-[color:var(--badge-amber-text)] border-amber-200' },
    CRITIQUE: { label: 'Critique', cls: 'bg-danger-50 text-[color:var(--badge-danger-text)] border-danger-200' },
  };
  const c = cfg[niveau];
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border', c.cls)}>
      {c.label}
    </span>
  );
}

// ── Badge statut permis ───────────────────────────────────────────────────────

export function BadgePermis({ permis }: { permis: PermisView }) {
  const cfg: Record<StatutPermis, { cls: string; label: string }> = {
    [StatutPermis.EN_ATTENTE]: { cls: 'bg-amber-50 text-[color:var(--badge-amber-text)] border-amber-200',   label: 'À valider' },
    [StatutPermis.VALIDE]:     { cls: 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200', label: 'Validé'    },
    [StatutPermis.REJETE]:     { cls: 'bg-danger-50 text-[color:var(--badge-danger-text)] border-danger-200',    label: 'Rejeté'    },
    [StatutPermis.SUSPENDU]:   { cls: 'bg-safety-50 text-[color:var(--badge-safety-text)] border-safety-200',    label: 'Suspendu'  },
    [StatutPermis.CLOS]:       { cls: 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] border-[var(--border)]', label: 'Clos'      },
  };
  const c = cfg[permis.statut];
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border', c.cls)}>
      <span>{ICONES_PERMIS[permis.type_permis]}</span>
      <span>{LABELS_PERMIS[permis.type_permis]}</span>
      <span className="opacity-60">·</span>
      <span>{c.label}</span>
    </span>
  );
}

// ── Mini PermisChip (compact) ─────────────────────────────────────────────────

export function PermisChip({
  permis, onClick, clickable,
}: {
  permis: PermisView; onClick?: () => void; clickable?: boolean;
}) {
  const statusDot: Record<StatutPermis, string> = {
    [StatutPermis.EN_ATTENTE]: 'bg-amber-500',
    [StatutPermis.VALIDE]:     'bg-success-500',
    [StatutPermis.REJETE]:     'bg-danger-500',
    [StatutPermis.SUSPENDU]:   'bg-safety-500',
    [StatutPermis.CLOS]:       'bg-surface-600',
  };
  return (
    <div className={clsx(
      'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm w-full',
      permis.statut === StatutPermis.EN_ATTENTE ? 'bg-amber-50 border-amber-200'    :
      permis.statut === StatutPermis.VALIDE     ? 'bg-success-50 border-success-200'  :
      permis.statut === StatutPermis.SUSPENDU   ? 'bg-safety-50 border-safety-200':
      permis.statut === StatutPermis.REJETE     ? 'bg-danger-50 border-danger-200'      :
      'bg-[var(--bg-hover)] border-[var(--border)]',
    )}>
      <button
        type="button"
        disabled={!clickable}
        onClick={onClick}
        className={clsx(
          'flex items-center gap-2 flex-1 text-left transition-all duration-150 min-w-0',
          clickable ? 'cursor-pointer' : 'cursor-default',
        )}
      >
        <span className="text-base leading-none">{ICONES_PERMIS[permis.type_permis]}</span>
        <span className="font-medium text-[color:var(--text-primary)] flex-1 truncate">{LABELS_PERMIS[permis.type_permis]}</span>
        <span className={clsx('w-2 h-2 rounded-full flex-shrink-0', statusDot[permis.statut])} />
        {clickable && (
          <ChevronRight size={14} className="text-[color:var(--badge-navy-text)] flex-shrink-0" />
        )}
      </button>
      {/* Lien QR terrain */}
      <Link
        to={`/permis/${permis.qr_code_token}`}
        title="Voir la page terrain QR"
        onClick={e => e.stopPropagation()}
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[color:var(--text-muted)] hover:text-[color:var(--badge-navy-text)] hover:bg-[var(--bg-hover)] transition-all border border-transparent hover:border-[var(--border)]"
      >
        <QrCode size={14} />
      </Link>
    </div>
  );
}

// ── Toggle Vue ────────────────────────────────────────────────────────────────

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
          vue === 'kanban' ? 'bg-[#0077aa] text-white shadow-sm' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)]',
        )}
      >
        <LayoutDashboard size={15} />
      </button>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface Props {
  embedded?: boolean;
  ats: ATView[];
  loading: boolean;
  error: string | null;
  actions: PTWActions;
}

export function DashboardAnimateur({ embedded = false, ats, loading, error, actions }: Props) {
  const { profile } = useAuth();
  const [onglet,    setOnglet]    = useState<Onglet>('valider');
  const [vue,       setVue]       = useState<Vue>('liste');
  const [recherche, setRecherche] = useState('');

  const kpis = useMemo(() => ({
    atValider:     ats.filter(a => a.statut === StatutAT.SOUMISE).length,
    permisValider: ats.flatMap(a => a.permis).filter(p => p.statut === StatutPermis.EN_ATTENTE).length,
    atActives:     ats.filter(a => a.statut === StatutAT.ACTIVE).length,
    suspensions:   ats.filter(a => a.statut === StatutAT.SUSPENDUE).length,
  }), [ats]);

  const atFiltrees = useMemo(() => {
    const q = recherche.toLowerCase();
    return ats.filter(at =>
      !q ||
      at.numero_at.toLowerCase().includes(q) ||
      at.titre.toLowerCase().includes(q) ||
      at.entreprise_intervenante.toLowerCase().includes(q) ||
      at.zone.toLowerCase().includes(q),
    );
  }, [recherche, ats]);

  const atAffichees = useMemo(() => {
    if (vue === 'kanban') return atFiltrees; // kanban affiche tout
    switch (onglet) {
      case 'valider':    return atFiltrees.filter(a => a.statut === StatutAT.SOUMISE);
      case 'actives':    return atFiltrees.filter(a => a.statut === StatutAT.ACTIVE);
      case 'suspendues': return atFiltrees.filter(a => a.statut === StatutAT.SUSPENDUE);
      case 'toutes':     return atFiltrees;
    }
  }, [onglet, vue, atFiltrees]);

  const onglets: { id: Onglet; label: string; count: number; color?: string }[] = [
    { id: 'valider',    label: 'À valider',  count: ats.filter(a => a.statut === StatutAT.SOUMISE).length,   color: 'blue' },
    { id: 'actives',    label: 'Actives',    count: ats.filter(a => a.statut === StatutAT.ACTIVE).length,    color: 'green' },
    { id: 'suspendues', label: 'Suspendues', count: ats.filter(a => a.statut === StatutAT.SUSPENDUE).length, color: 'orange' },
    { id: 'toutes',     label: 'Toutes',     count: ats.length },
  ];

  return (
    <div className={embedded ? '' : 'min-h-screen bg-[#020817]'}>

      {/* ── Topbar — masqué si embedded ── */}
      {!embedded && (
        <header className="bg-[#0077aa] shadow-lg sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-base leading-none">Dashboard Animateur</h1>
                <p className="text-white/50 text-xs mt-0.5">Sécurité industrielle · PTW</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-1.5">
              <User size={14} className="text-white/70" />
              <span className="text-white text-sm font-medium">{profile ? `${profile.prenom} ${profile.nom}` : ''}</span>
              <span className="bg-emerald-400/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-medium">Animateur</span>
            </div>
          </div>
        </header>
      )}

      <main className={clsx(
        'mx-auto space-y-5',
        embedded ? 'px-6 py-6' : 'px-4 py-6',
        vue === 'kanban' ? 'max-w-full' : 'max-w-5xl',
      )}>

        {/* ── Erreur de chargement ── */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-danger-200 bg-danger-50 text-sm text-[color:var(--badge-danger-text)]">
            <AlertTriangle size={15} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── KPIs ── */}
        <KpiGrid cols={4}>
          <KpiCard icon={ClipboardList} label="AT à valider"     color="navy"    value={kpis.atValider}    sub="en attente animateur" loading={loading} />
          <KpiCard icon={CheckCircle2}  label="Permis en attente" color="amber"   value={kpis.permisValider} sub="validation requise"   loading={loading} />
          <KpiCard icon={Activity}      label="AT actives"        color="success" value={kpis.atActives}    sub="travaux en cours"      loading={loading} />
          <KpiCard icon={AlertTriangle} label="Suspensions"       color="safety"  value={kpis.suspensions}  sub="AT arrêtées"           loading={loading} />
        </KpiGrid>

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
                    o.color === 'blue'   ? 'bg-navy-100 text-[color:var(--badge-navy-text)]'      :
                    o.color === 'green'  ? 'bg-success-100 text-[color:var(--badge-success-text)]'    :
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
            role="ANIMATEUR"
            actions={actions}
          />
        ) : (
          <div className="space-y-3">
            {atAffichees.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={Zap}
                  variant={recherche ? 'search' : 'default'}
                  title={recherche ? 'Aucun résultat' : 'Aucune autorisation de travail'}
                  description={recherche ? `Aucun résultat pour "${recherche}".` : 'Rien à afficher dans cet onglet.'}
                  size="sm"
                />
              </div>
            ) : (
              atAffichees.map(at => {
                if (at.statut === StatutAT.SOUMISE)   return <ATValidationCard key={at.id} at={at} actions={actions} />;
                if (at.statut === StatutAT.ACTIVE)    return <ATActiveCard     key={at.id} at={at} actions={actions} />;
                if (at.statut === StatutAT.SUSPENDUE) return <ATSuspenduCard   key={at.id} at={at} actions={actions} />;
                return (
                  <div key={at.id} className="card p-4 flex items-center gap-4">
                    <Clock size={16} className="text-[color:var(--text-secondary)] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[color:var(--text-primary)] truncate text-sm">{at.titre}</p>
                      <p className="text-xs text-[color:var(--text-muted)]">{at.numero_at}</p>
                    </div>
                    <BadgeStatutAT statut={at.statut} />
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
