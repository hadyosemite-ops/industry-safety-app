// ─────────────────────────────────────────────────────────────────────────────
// Module Prestataires — Dashboard principal
// 4 onglets : Vue générale · Documents · Intervenants · Évaluations
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo, type ElementType } from 'react';
import {
  Building2, Plus, Search, CheckCircle2,
  Clock, Users, FileText, Star, ChevronRight,
  ShieldAlert, XCircle, FileWarning, BadgeCheck,
  TrendingUp, TrendingDown, ClipboardList,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ModuleHeader } from '@/components/ui/ModuleHeader';
import { PRESTATAIRES_DEMO } from '../data/demo.data';
import type { Prestataire, StatutPrestataire } from '../types';
import { LABELS_STATUT, LABELS_CATEGORIE, LABELS_HABILITATION, calculerKpis, scoreLabel } from '../types';
import { FichePrestataire } from './FichePrestataire';
import { FormulaireEvaluation } from './FormulaireEvaluation';

// ── Types locaux ──────────────────────────────────────────────────────────────

type Onglet = 'generale' | 'documents' | 'intervenants' | 'evaluations';

// ── Config statuts ────────────────────────────────────────────────────────────

const STATUT_STYLE: Record<StatutPrestataire, { label: string; cls: string; dot: string }> = {
  AGREE:         { label: 'Agréé',          cls: 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200', dot: 'bg-emerald-500' },
  EN_EVALUATION: { label: 'En évaluation',  cls: 'bg-navy-100 text-[color:var(--badge-navy-text)] border-navy-200',          dot: 'bg-blue-500'    },
  EXPIRE:        { label: 'Expiré',         cls: 'bg-danger-50 text-[color:var(--badge-danger-text)] border-danger-200',    dot: 'bg-red-500'     },
  SUSPENDU:      { label: 'Suspendu',       cls: 'bg-safety-50 text-[color:var(--badge-safety-text)] border-safety-200',     dot: 'bg-orange-500'  },
  BLACKLISTE:    { label: 'Blacklisté',     cls: 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] border-[var(--border)]', dot: 'bg-gray-500'    },
};

const DOC_STATUT_STYLE = {
  VALIDE:         { cls: 'text-emerald-600', icon: CheckCircle2  },
  EXPIRE_BIENTOT: { cls: 'text-orange-500',  icon: Clock         },
  EXPIRE:         { cls: 'text-red-600',     icon: XCircle       },
  MANQUANT:       { cls: 'text-[color:var(--text-muted)]',   icon: FileWarning   },
};

// ── Badge statut ──────────────────────────────────────────────────────────────

function BadgeStatut({ statut }: { statut: StatutPrestataire }) {
  const s = STATUT_STYLE[statut];
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', s.cls)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, iconColor, urgent }: {
  icon: ElementType; label: string; value: number | string;
  sub?: string; iconColor: string; urgent?: boolean;
}) {
  return (
    <div className={clsx(
      'card p-4 flex items-start gap-3 transition-all duration-200 shadow-sm hover:shadow-md',
      urgent ? 'border-amber-500/40' : '',
    )}>
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconColor)}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-[color:var(--text-primary)] leading-none">{value}</p>
        <p className="text-sm font-medium text-[color:var(--text-secondary)] mt-1">{label}</p>
        {sub && <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
      {urgent && Number(value) > 0 && (
        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse flex-shrink-0 mt-1.5" />
      )}
    </div>
  );
}

// ── Score gauge mini ──────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const { label, color, bg } = scoreLabel(score);
  return (
    <div className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-lg', bg)}>
      <Star size={11} className={color} />
      <span className={clsx('text-xs font-bold', color)}>{score}</span>
      <span className={clsx('text-xs hidden sm:inline', color)}>{label}</span>
    </div>
  );
}

// ── Carte prestataire ─────────────────────────────────────────────────────────

function CartePrestataire({ p, onSelect }: { p: Prestataire; onSelect: () => void }) {
  const docsAlerte = p.documents.filter(d => d.statut === 'EXPIRE' || d.statut === 'EXPIRE_BIENTOT').length;
  const habAlerte  = p.intervenants.flatMap(i => i.habilitations).filter(h => h.statut === 'EXPIRE' || h.statut === 'EXPIRE_BIENTOT').length;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full card p-4 hover:shadow-md hover:border-navy-200 transition-all duration-200 text-left group"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Gauche */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-[color:var(--badge-navy-text)]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-[color:var(--text-primary)] text-sm truncate">{p.nom}</p>
              <span className="text-[10px] text-[color:var(--text-muted)] font-mono">{p.code}</span>
            </div>
            <p className="text-xs text-[color:var(--text-secondary)] mt-0.5">{p.secteur_activite} · {p.ville}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {p.categories.slice(0, 2).map(c => (
                <span key={c} className="text-[10px] bg-[var(--bg-hover)] text-[color:var(--text-secondary)] px-2 py-0.5 rounded-full font-medium">
                  {LABELS_CATEGORIE[c]}
                </span>
              ))}
              {p.categories.length > 2 && (
                <span className="text-[10px] bg-[var(--bg-hover)] text-[color:var(--text-secondary)] px-2 py-0.5 rounded-full">
                  +{p.categories.length - 2}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Droite */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <BadgeStatut statut={p.statut} />
          {p.score_global !== undefined && <ScoreBadge score={p.score_global} />}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
        <span className="flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)]">
          <Users size={12} />
          {p.intervenants.length} intervenant{p.intervenants.length > 1 ? 's' : ''}
        </span>
        {p.nb_at_actives > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 size={12} />
            {p.nb_at_actives} AT active{p.nb_at_actives > 1 ? 's' : ''}
          </span>
        )}
        {docsAlerte > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-orange-600 font-medium">
            <FileWarning size={12} />
            {docsAlerte} doc{docsAlerte > 1 ? 's' : ''} à renouveler
          </span>
        )}
        {habAlerte > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
            <ShieldAlert size={12} />
            {habAlerte} hab. expirée{habAlerte > 1 ? 's' : ''}
          </span>
        )}
        <ChevronRight size={14} className="text-[color:var(--text-secondary)] ml-auto group-hover:text-[color:var(--badge-navy-text)] transition-colors" />
      </div>
    </button>
  );
}

// ── Classement prestataires ───────────────────────────────────────────────────

function Classement({ prestataires, onSelect }: { prestataires: Prestataire[]; onSelect: (p: Prestataire) => void }) {
  const classés = useMemo(() =>
    [...prestataires]
      .filter(p => p.score_global !== undefined)
      .sort((a, b) => (b.score_global ?? 0) - (a.score_global ?? 0)),
    [prestataires],
  );

  if (classés.length === 0) return null;

  const MEDALS = [
    { bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-[color:var(--badge-amber-text)]',  ring: 'ring-amber-300',  emoji: '🥇' },
    { bg: 'bg-[var(--bg-hover)]', border: 'border-[var(--border)]', text: 'text-[color:var(--text-secondary)]', ring: 'ring-[rgba(0,212,255,0.35)]', emoji: '🥈' },
    { bg: 'bg-safety-50',  border: 'border-safety-200', text: 'text-[color:var(--badge-safety-text)]', ring: 'ring-safety-400', emoji: '🥉' },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between bg-gradient-to-r from-[rgba(0,212,255,0.03)] to-transparent">
        <h3 className="text-sm font-bold text-[color:var(--text-primary)] flex items-center gap-2">
          <Star size={14} className="text-amber-500" />
          Classement HSE
        </h3>
        <span className="text-[11px] text-[color:var(--text-muted)]">{classés.length} prestataire{classés.length > 1 ? 's' : ''} évalués</span>
      </div>

      <div className="divide-y divide-[color:var(--border)]">
        {classés.map((p, idx) => {
          const score   = p.score_global!;
          const { color, bg } = scoreLabel(score);
          const medal   = MEDALS[idx];
          const isTop3  = idx < 3;

          // Barre proportionnelle au score max
          const maxScore = classés[0].score_global!;
          const barWidth = Math.round((score / maxScore) * 100);

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p)}
              className={clsx(
                'w-full flex items-center gap-4 px-5 py-3.5 text-left transition-all duration-150 hover:bg-[var(--bg-hover)] group',
                isTop3 && idx === 0 && 'bg-amber-50/40',
              )}
            >
              {/* Rang */}
              <div className={clsx(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all',
                isTop3
                  ? clsx('border-2', medal.bg, medal.border, medal.text)
                  : 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] text-xs font-bold',
              )}>
                {isTop3 ? medal.emoji : idx + 1}
              </div>

              {/* Nom + barre */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className={clsx(
                    'text-sm font-semibold truncate',
                    idx === 0 ? 'text-[color:var(--text-primary)]' : 'text-[color:var(--text-secondary)]',
                  )}>
                    {p.nom}
                  </p>
                  <span className="text-[10px] text-[color:var(--text-muted)] font-mono flex-shrink-0">{p.code}</span>
                </div>
                {/* Barre de score */}
                <div className="h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all duration-500',
                      score >= 85 ? 'bg-emerald-500' :
                      score >= 70 ? 'bg-green-500'   :
                      score >= 55 ? 'bg-yellow-500'  :
                      'bg-red-500',
                    )}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>

              {/* Score + statut */}
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <BadgeStatut statut={p.statut} />
                <div className={clsx('px-2.5 py-1 rounded-lg min-w-[52px] text-center', bg)}>
                  <span className={clsx('text-sm font-black', color)}>{score}</span>
                  <span className={clsx('text-[10px] ml-0.5', color)}>/100</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Onglet Vue générale ───────────────────────────────────────────────────────

function TabGenerale({ prestataires, onSelect }: { prestataires: Prestataire[]; onSelect: (p: Prestataire) => void }) {
  const kpis = useMemo(() => calculerKpis(PRESTATAIRES_DEMO), []);
  const [recherche,  setRecherche]  = useState('');
  const [filtreStatut, setFiltreStatut] = useState<StatutPrestataire | 'tous'>('tous');

  const filtrés = useMemo(() => {
    const q = recherche.toLowerCase();
    return prestataires.filter(p =>
      (filtreStatut === 'tous' || p.statut === filtreStatut) &&
      (!q || p.nom.toLowerCase().includes(q) || p.ville.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)),
    );
  }, [prestataires, recherche, filtreStatut]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Building2}    iconColor="bg-[rgba(0,212,255,0.10)] text-[color:var(--badge-navy-text)]" label="Prestataires"  value={kpis.total}                 sub="référencés sur site" />
        <KpiCard icon={BadgeCheck}   iconColor="bg-success-50 text-[color:var(--badge-success-text)]"  label="Agréés"        value={kpis.agrees}                sub="documents valides" />
        <KpiCard icon={FileWarning}  iconColor="bg-safety-50 text-[color:var(--badge-safety-text)]"    label="Docs en alerte" value={kpis.docs_alerte}          sub="à renouveler" urgent />
        <KpiCard icon={ShieldAlert}  iconColor="bg-danger-50 text-[color:var(--badge-danger-text)]"    label="Hab. expirées"  value={kpis.hab_alerte}           sub="intervenants bloqués" urgent />
      </div>

      {/* Classement */}
      <Classement prestataires={prestataires} onSelect={onSelect} />

      {/* Filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom, ville, code…"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-1 shadow-sm overflow-x-auto">
          {(['tous', 'AGREE', 'EN_EVALUATION', 'EXPIRE', 'SUSPENDU'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFiltreStatut(s)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap',
                filtreStatut === s ? 'bg-navy-500 text-[#02101f] shadow-sm' : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-hover)]',
              )}
            >
              {s === 'tous' ? 'Tous' : LABELS_STATUT[s]}
              <span className={clsx(
                'text-[10px] font-bold px-1 py-0.5 rounded-full',
                filtreStatut === s ? 'bg-white/20 text-white' : 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)]',
              )}>
                {s === 'tous' ? PRESTATAIRES_DEMO.length : PRESTATAIRES_DEMO.filter(p => p.statut === s).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtrés.length === 0 ? (
          <div className="col-span-2 card p-12 text-center">
            <Building2 size={32} className="text-[color:var(--text-secondary)] mx-auto mb-3" />
            <p className="text-[color:var(--text-secondary)] font-medium">Aucun prestataire trouvé</p>
          </div>
        ) : (
          filtrés.map(p => <CartePrestataire key={p.id} p={p} onSelect={() => onSelect(p)} />)
        )}
      </div>
    </div>
  );
}

// ── Onglet Documents ──────────────────────────────────────────────────────────

function TabDocuments() {
  const rows = useMemo(() =>
    PRESTATAIRES_DEMO.flatMap(p =>
      p.documents
        .filter(d => d.statut !== 'VALIDE')
        .map(d => ({ ...d, prestataire: p.nom, prest_id: p.id, prest_statut: p.statut }))
    ).sort((a, b) => a.date_expiration.localeCompare(b.date_expiration)),
    [],
  );

  const documentCounts = useMemo(() => {
    const tousDocuments = PRESTATAIRES_DEMO.flatMap(p => p.documents);
    return {
      valides:       tousDocuments.filter(d => d.statut === 'VALIDE').length,
      expireBientot: tousDocuments.filter(d => d.statut === 'EXPIRE_BIENTOT').length,
      expires:       tousDocuments.filter(d => d.statut === 'EXPIRE').length,
    };
  }, []);

  return (
    <div className="space-y-5">
      {/* Résumé */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard icon={CheckCircle2} iconColor="bg-success-50 text-[color:var(--badge-success-text)]" label="Documents valides"       value={documentCounts.valides}  sub="à jour" />
        <KpiCard icon={Clock}        iconColor="bg-safety-50 text-[color:var(--badge-safety-text)]"   label="Expirant sous 60 jours"  value={documentCounts.expireBientot} sub="à renouveler" urgent />
        <KpiCard icon={XCircle}      iconColor="bg-danger-50 text-[color:var(--badge-danger-text)]"   label="Expirés"                 value={documentCounts.expires}        sub="accès bloqué" urgent />
      </div>

      {/* Tableau alertes */}
      {rows.length === 0 ? (
        <div className="bg-success-50 border border-success-200 rounded-2xl p-6 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-success-600 flex-shrink-0" />
          <p className="text-sm text-[color:var(--badge-success-text)] font-medium">Tous les documents sont valides.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">Documents en alerte</h3>
            <span className="text-xs font-bold bg-safety-100 text-[color:var(--badge-safety-text)] px-2 py-0.5 rounded-full">{rows.length}</span>
          </div>
          <div className="divide-y divide-[color:var(--border)]">
            {rows.map(row => {
              const s = DOC_STATUT_STYLE[row.statut];
              const Icon = s.icon;
              const daysLeft = Math.ceil((new Date(row.date_expiration).getTime() - Date.now()) / 86400000);
              return (
                <div key={row.id} className="flex items-center gap-4 px-5 py-3.5">
                  <Icon size={16} className={clsx('flex-shrink-0', s.cls)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[color:var(--text-primary)]">{row.libelle}</p>
                    <p className="text-xs text-[color:var(--text-secondary)]">{row.prestataire}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-mono text-[color:var(--text-secondary)]">
                      {new Date(row.date_expiration).toLocaleDateString('fr-FR')}
                    </p>
                    <p className={clsx('text-xs font-semibold', s.cls)}>
                      {daysLeft < 0 ? `Expiré depuis ${-daysLeft}j` : `Dans ${daysLeft}j`}
                    </p>
                  </div>
                  {row.obligatoire && (
                    <span className="text-[10px] bg-danger-50 text-[color:var(--badge-danger-text)] border border-danger-200 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                      Obligatoire
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Onglet Intervenants ───────────────────────────────────────────────────────

function TabIntervenants() {
  const [recherche, setRecherche] = useState('');

  const rows = useMemo(() =>
    PRESTATAIRES_DEMO.flatMap(p =>
      p.intervenants.map(i => ({
        ...i,
        prestataire: p.nom,
        prest_statut: p.statut,
        hab_alerte: i.habilitations.filter(h => h.statut !== 'VALIDE').length,
      }))
    ).filter(r =>
      !recherche ||
      r.nom_complet.toLowerCase().includes(recherche.toLowerCase()) ||
      r.prestataire.toLowerCase().includes(recherche.toLowerCase()),
    ),
    [recherche],
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard icon={Users}       iconColor="bg-[rgba(0,212,255,0.10)] text-[color:var(--badge-navy-text)]" label="Intervenants total" value={PRESTATAIRES_DEMO.flatMap(p => p.intervenants).length} sub="tous prestataires" />
        <KpiCard icon={BadgeCheck}  iconColor="bg-success-50 text-[color:var(--badge-success-text)]" label="Badges actifs"      value={PRESTATAIRES_DEMO.flatMap(p => p.intervenants).filter(i => i.badge_actif).length} sub="accès site autorisé" />
        <KpiCard icon={ShieldAlert} iconColor="bg-danger-50 text-[color:var(--badge-danger-text)]"   label="Habilitations ⚠"   value={PRESTATAIRES_DEMO.flatMap(p => p.intervenants.flatMap(i => i.habilitations)).filter(h => h.statut !== 'VALIDE').length} sub="à renouveler" urgent />
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none" />
        <input
          type="text"
          placeholder="Rechercher un intervenant ou prestataire…"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-[color:var(--border)]">
          {rows.map(row => (
            <div key={row.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[color:var(--text-secondary)]">
                  {row.nom_complet.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[color:var(--text-primary)]">{row.nom_complet}</p>
                <p className="text-xs text-[color:var(--text-secondary)]">{row.poste} · {row.prestataire}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {row.hab_alerte > 0 && (
                  <span className="text-xs font-semibold text-[color:var(--badge-danger-text)] bg-danger-50 border border-danger-200 px-2 py-0.5 rounded-full">
                    {row.hab_alerte} hab. ⚠
                  </span>
                )}
                <span className={clsx(
                  'text-xs font-semibold px-2 py-0.5 rounded-full border',
                  row.badge_actif ? 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200' : 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] border-[var(--border)]',
                )}>
                  {row.badge_actif ? 'Badge actif' : 'Inactif'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 max-w-48 hidden lg:flex">
                {row.habilitations.slice(0, 3).map(h => (
                  <span
                    key={h.type}
                    className={clsx(
                      'text-[10px] px-1.5 py-0.5 rounded font-medium',
                      h.statut === 'VALIDE'         ? 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)]' :
                      h.statut === 'EXPIRE_BIENTOT' ? 'bg-safety-50 text-[color:var(--badge-safety-text)]' :
                      'bg-danger-50 text-[color:var(--badge-danger-text)]',
                    )}
                  >
                    {LABELS_HABILITATION[h.type].split(' ').slice(-1)[0]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Onglet Évaluations ────────────────────────────────────────────────────────

function TabEvaluations() {
  const evals = useMemo(() =>
    PRESTATAIRES_DEMO
      .filter(p => p.evaluations.length > 0)
      .flatMap(p => p.evaluations.map(e => ({ ...e, prestataire: p.nom, prest_id: p.id })))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );

  const scoresMoyen = useMemo(() => {
    const all = PRESTATAIRES_DEMO.filter(p => p.score_global !== undefined).map(p => p.score_global!);
    return all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0;
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard icon={Star}         iconColor="bg-violet-500/10 text-[color:var(--badge-purple-text)]"  label="Score moyen HSE"  value={`${scoresMoyen}/100`} sub="tous prestataires" />
        <KpiCard icon={TrendingUp}   iconColor="bg-success-50 text-[color:var(--badge-success-text)]" label="À renouveler"    value={evals.filter(e => e.recommandation === 'RENOUVELER').length} sub="recommandation" />
        <KpiCard icon={TrendingDown} iconColor="bg-danger-50 text-[color:var(--badge-danger-text)]"   label="À surveiller/suspendre" value={evals.filter(e => e.recommandation !== 'RENOUVELER').length} sub="action requise" urgent />
      </div>

      <div className="space-y-3">
        {evals.map(e => {
          const { color, bg } = scoreLabel(e.score_global);
          const reco = e.recommandation;
          return (
            <div key={e.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-semibold text-[color:var(--text-primary)] text-sm">{e.prestataire}</p>
                  <p className="text-xs text-[color:var(--text-secondary)] mt-0.5">
                    Évaluation du {new Date(e.date).toLocaleDateString('fr-FR')} · par {e.evaluateur}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={clsx('px-3 py-1.5 rounded-xl', bg)}>
                    <span className={clsx('text-lg font-bold', color)}>{e.score_global}</span>
                    <span className={clsx('text-xs ml-1', color)}>/100</span>
                  </div>
                  <span className={clsx(
                    'text-xs font-bold px-2.5 py-1 rounded-full border',
                    reco === 'RENOUVELER' ? 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200' :
                    reco === 'SURVEILLER' ? 'bg-safety-50 text-[color:var(--badge-safety-text)] border-safety-200'   :
                    'bg-danger-50 text-[color:var(--badge-danger-text)] border-danger-200',
                  )}>
                    {reco === 'RENOUVELER' ? '✓ Renouveler' : reco === 'SURVEILLER' ? '⚠ Surveiller' : '✗ Suspendre'}
                  </span>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-[10px] text-[color:var(--text-muted)] uppercase font-bold tracking-wide mb-1">Score sécurité HSE</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                    <div className="h-full bg-navy-500 rounded-full" style={{ width: `${e.score_securite}%` }} />
                  </div>
                  <span className="text-xs font-bold text-[color:var(--text-secondary)] w-12">{e.score_securite}/100</span>
                </div>
              </div>
              {e.points_amelioration && (
                <p className="text-xs text-[color:var(--text-secondary)] italic border-t border-[var(--border)] pt-2 mt-2">
                  "{e.points_amelioration}"
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function DashboardPrestataires() {
  const [onglet, setOnglet]               = useState<Onglet>('generale');
  const [ficheOuverte, setFicheOuverte]   = useState<Prestataire | null>(null);
  const [showEvalForm,  setShowEvalForm]  = useState(false);

  const kpis = useMemo(() => calculerKpis(PRESTATAIRES_DEMO), []);

  function handleSaveEval(_prest: Prestataire, _eval: unknown) {
    setOnglet('evaluations');
  }

  if (ficheOuverte) {
    return <FichePrestataire prestataire={ficheOuverte} onBack={() => setFicheOuverte(null)} />;
  }

  return (
    <div className="min-h-screen">
      {showEvalForm && (
        <FormulaireEvaluation
          onClose={() => setShowEvalForm(false)}
          onSave={handleSaveEval}
        />
      )}
      <ModuleHeader
        icon={Building2}
        title="Prestataires"
        subtitle="Agrément · Documents · Intervenants · Évaluations HSE"
        actions={[
          { label: 'Évaluer',             icon: ClipboardList, onClick: () => setShowEvalForm(true) },
          { label: 'Nouveau prestataire', icon: Plus,          onClick: () => {} },
        ]}
        tabs={[
          { id: 'generale',      label: 'Vue générale',  icon: <Building2 size={14} /> },
          { id: 'documents',     label: 'Documents',     icon: <FileText size={14} />,  badge: kpis.docs_alerte  },
          { id: 'intervenants',  label: 'Intervenants',  icon: <Users size={14} />,     badge: kpis.hab_alerte   },
          { id: 'evaluations',   label: 'Évaluations',   icon: <Star size={14} />       },
        ]}
        activeTab={onglet}
        onTabChange={id => setOnglet(id as Onglet)}
      />

      <main className="max-w-6xl mx-auto px-6 py-6">
        {onglet === 'generale'     && <TabGenerale     prestataires={PRESTATAIRES_DEMO} onSelect={setFicheOuverte} />}
        {onglet === 'documents'    && <TabDocuments    />}
        {onglet === 'intervenants' && <TabIntervenants />}
        {onglet === 'evaluations'  && <TabEvaluations  />}
      </main>
    </div>
  );
}
