// ─────────────────────────────────────────────────────────────────────────────
// Module Prestataires — Fiche détail
// Infos société · Documents · Intervenants · Évaluations
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, Briefcase,
  FileText, Users, Star, CheckCircle2, Clock, XCircle, FileWarning,
  ShieldAlert, ChevronDown, ChevronUp, AlertTriangle,
  TrendingUp, TrendingDown, Calendar, Hash, ClipboardList,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Prestataire, StatutPrestataire, EvaluationPrestataire } from '../types';
import {
  LABELS_CATEGORIE, LABELS_DOCUMENT, LABELS_HABILITATION,
  scoreLabel,
} from '../types';
import { FormulaireEvaluation } from './FormulaireEvaluation';

// ── Props ─────────────────────────────────────────────────────────────────────

interface FichePrestatairePros {
  prestataire: Prestataire;
  onBack: () => void;
}

// ── Types d'onglets internes ──────────────────────────────────────────────────

type TabFiche = 'resume' | 'documents' | 'intervenants' | 'evaluations';

// ── Config statuts ────────────────────────────────────────────────────────────

const STATUT_STYLE: Record<StatutPrestataire, { label: string; cls: string; dot: string; bg: string }> = {
  AGREE:         { label: 'Agréé',          cls: 'text-[color:var(--badge-success-text)]', dot: 'bg-emerald-500', bg: 'bg-success-50 border-success-200' },
  EN_EVALUATION: { label: 'En évaluation',  cls: 'text-[color:var(--badge-navy-text)]',    dot: 'bg-blue-500',    bg: 'bg-navy-100 border-navy-200'       },
  EXPIRE:        { label: 'Expiré',         cls: 'text-[color:var(--badge-danger-text)]',  dot: 'bg-red-500',     bg: 'bg-danger-50 border-danger-200'   },
  SUSPENDU:      { label: 'Suspendu',       cls: 'text-[color:var(--badge-safety-text)]',  dot: 'bg-orange-500',  bg: 'bg-safety-50 border-safety-200'   },
  BLACKLISTE:    { label: 'Blacklisté',     cls: 'text-[color:var(--text-secondary)]',   dot: 'bg-gray-500',    bg: 'bg-[var(--bg-hover)] border-[var(--border)]' },
};

const DOC_STYLE = {
  VALIDE:         { icon: CheckCircle2, cls: 'text-[color:var(--badge-success-text)]', bg: 'bg-success-50',  label: 'Valide'          },
  EXPIRE_BIENTOT: { icon: Clock,        cls: 'text-[color:var(--badge-safety-text)]',  bg: 'bg-safety-50',   label: 'Expire bientôt'  },
  EXPIRE:         { icon: XCircle,      cls: 'text-[color:var(--badge-danger-text)]',  bg: 'bg-danger-50',   label: 'Expiré'          },
  MANQUANT:       { icon: FileWarning,  cls: 'text-[color:var(--text-muted)]',   bg: 'bg-[var(--bg-hover)]', label: 'Manquant'        },
};

const HAB_STYLE = {
  VALIDE:         { cls: 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] border-[var(--border)]', label: 'Valide'          },
  EXPIRE_BIENTOT: { cls: 'bg-safety-50 text-[color:var(--badge-safety-text)] border-safety-200',     label: 'Expire bientôt'  },
  EXPIRE:         { cls: 'bg-danger-50 text-[color:var(--badge-danger-text)] border-danger-200',     label: 'Expiré'          },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR');
}

function daysLeft(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

// ── Score Gauge SVG ───────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const { label, color } = scoreLabel(score);
  // Demi-cercle: r=54, cx=cy=64, sw=14 → circ = π × r ≈ 169.6
  const R       = 54;
  const SW      = 14;
  const CX      = 64;
  const CY      = 72;
  const CIRC    = Math.PI * R;          // ~169.6 (demi-cercle)
  const filled  = (score / 100) * CIRC;
  const empty   = CIRC - filled;

  // Mapping couleur score → stroke SVG
  const strokeColor =
    score >= 85 ? '#059669' :
    score >= 70 ? '#16a34a' :
    score >= 55 ? '#d97706' :
    '#dc2626';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 128 80" className="w-32 h-20" xmlns="http://www.w3.org/2000/svg">
        {/* Fond piste */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={SW}
          strokeLinecap="butt"
        />
        {/* Arc coloré */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={SW}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${empty + SW}`}
        />
        {/* Valeur */}
        <text x={CX} y={CY - 6} textAnchor="middle" className="text-2xl font-bold" fill="#e8f4fd"
          style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'inherit' }}>
          {score}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="#7bacc8"
          style={{ fontSize: '10px', fontFamily: 'inherit' }}>
          /100
        </text>
      </svg>
      <span className={clsx('text-xs font-semibold', color)}>{label}</span>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-widest text-[color:var(--text-muted)] mb-3 mt-1">
      {children}
    </h3>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <Icon size={14} className="text-[color:var(--text-muted)] flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[color:var(--text-muted)] uppercase font-semibold tracking-wide">{label}</p>
        <p className="text-sm text-[color:var(--text-primary)] font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Onglet Résumé ─────────────────────────────────────────────────────────────

function TabResume({ p }: { p: Prestataire }) {
  const { label, cls, dot, bg } = STATUT_STYLE[p.statut];
  const agrem_exp_days = daysLeft(p.date_expiration_agrement);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonne gauche : infos société */}
      <div className="lg:col-span-2 space-y-5">
        {/* Card infos générales */}
        <div className="card p-5">
          <SectionTitle>Informations société</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y divide-[color:var(--border)] sm:divide-y-0">
            <InfoRow icon={Hash}      label="Code"           value={p.code} />
            <InfoRow icon={Building2} label="SIRET"          value={p.siret} />
            <InfoRow icon={Briefcase} label="Secteur"        value={p.secteur_activite} />
            <InfoRow icon={MapPin}    label="Adresse"        value={`${p.adresse}, ${p.code_postal} ${p.ville}`} />
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <p className="text-[11px] text-[color:var(--text-muted)] uppercase font-semibold tracking-wide mb-2">Catégories d'intervention</p>
            <div className="flex flex-wrap gap-1.5">
              {p.categories.map(c => (
                <span key={c} className="text-xs bg-navy-50 text-[color:var(--badge-navy-text)] px-2.5 py-1 rounded-lg font-medium border border-navy-200">
                  {LABELS_CATEGORIE[c]}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Card contact principal */}
        <div className="card p-5">
          <SectionTitle>Contact principal</SectionTitle>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-navy-50 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-[color:var(--badge-navy-text)]">
                {p.contact_principal.nom.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-[color:var(--text-primary)]">{p.contact_principal.nom}</p>
              <p className="text-sm text-[color:var(--text-secondary)]">{p.contact_principal.poste}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 mt-3 divide-y divide-[color:var(--border)] sm:divide-y-0">
            <InfoRow icon={Phone} label="Téléphone" value={p.contact_principal.tel} />
            <InfoRow icon={Mail}  label="Email"     value={p.contact_principal.email} />
          </div>
        </div>

        {/* Notes */}
        {p.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-[color:var(--badge-amber-text)] uppercase tracking-wide mb-1">Notes internes</p>
            <p className="text-sm text-amber-800">{p.notes}</p>
          </div>
        )}
      </div>

      {/* Colonne droite : statut + score + agrément */}
      <div className="space-y-4">
        {/* Statut agrément */}
        <div className="card p-5 text-center">
          <SectionTitle>Statut</SectionTitle>
          <span className={clsx('inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold', bg, cls)}>
            <span className={clsx('w-2 h-2 rounded-full', dot)} />
            {label}
          </span>
          <div className="mt-4 pt-4 border-t border-[var(--border)] text-left space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[color:var(--text-secondary)]">Agréé le</span>
              <span className="font-semibold text-[color:var(--text-primary)]">{fmt(p.date_agrement)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[color:var(--text-secondary)]">Expire le</span>
              <span className={clsx('font-semibold', agrem_exp_days < 0 ? 'text-[color:var(--badge-danger-text)]' : agrem_exp_days < 60 ? 'text-[color:var(--badge-safety-text)]' : 'text-[color:var(--text-primary)]')}>
                {fmt(p.date_expiration_agrement)}
              </span>
            </div>
            {agrem_exp_days >= 0 && agrem_exp_days < 90 && (
              <p className="text-xs text-[color:var(--badge-safety-text)] font-medium">
                ⚠ Dans {agrem_exp_days} jours
              </p>
            )}
          </div>
        </div>

        {/* Score global */}
        {p.score_global !== undefined && (
          <div className="card p-5 flex flex-col items-center">
            <SectionTitle>Score HSE</SectionTitle>
            <ScoreGauge score={p.score_global} />
          </div>
        )}

        {/* Chiffres rapides */}
        <div className="card p-5 space-y-3">
          <SectionTitle>Cette année</SectionTitle>
          {[
            { icon: Users,         label: 'Intervenants',    value: p.intervenants.length },
            { icon: CheckCircle2,  label: 'AT actives',      value: p.nb_at_actives },
            { icon: AlertTriangle, label: 'Incidents YTD',   value: p.nb_incidents_ytd },
            { icon: ShieldAlert,   label: 'Audits YTD',      value: p.nb_audits_ytd },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
                <Icon size={13} className="text-[color:var(--text-muted)]" />
                {label}
              </span>
              <span className="font-bold text-[color:var(--text-primary)] text-sm">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Onglet Documents ──────────────────────────────────────────────────────────

function TabDocsFiche({ p }: { p: Prestataire }) {
  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-hover)]">
          <h3 className="text-sm font-semibold text-[color:var(--text-primary)] flex items-center gap-2">
            <FileText size={14} className="text-[color:var(--text-muted)]" />
            Documents réglementaires
          </h3>
          <span className="text-xs text-[color:var(--text-muted)]">{p.documents.length} document{p.documents.length > 1 ? 's' : ''}</span>
        </div>
        <div className="divide-y divide-[color:var(--border)]">
          {p.documents.map(doc => {
            const s     = DOC_STYLE[doc.statut];
            const Icon  = s.icon;
            const dl    = daysLeft(doc.date_expiration);
            return (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', s.bg)}>
                  <Icon size={14} className={s.cls} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-[color:var(--text-primary)]">{doc.libelle}</p>
                    {doc.obligatoire && (
                      <span className="text-[10px] bg-danger-50 text-[color:var(--badge-danger-text)] border border-danger-200 px-1.5 py-0.5 rounded-full font-semibold">Obligatoire</span>
                    )}
                  </div>
                  <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{LABELS_DOCUMENT[doc.type]}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-mono text-[color:var(--text-secondary)]">
                    Émis: {fmt(doc.date_emission)}
                  </p>
                  <p className="text-xs font-mono text-[color:var(--text-secondary)]">
                    Exp: {fmt(doc.date_expiration)}
                  </p>
                  <p className={clsx('text-xs font-semibold mt-0.5', s.cls)}>
                    {dl < 0 ? `Expiré depuis ${-dl}j` : dl < 60 ? `Dans ${dl}j` : s.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Intervenant expandable ────────────────────────────────────────────────────

function CarteIntervenant({ i }: { i: Prestataire['intervenants'][0] }) {
  const [open, setOpen] = useState(false);
  const habAlerte = i.habilitations.filter(h => h.statut !== 'VALIDE').length;

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-[var(--bg-hover)] transition-colors"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-navy-50 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-[color:var(--badge-navy-text)]">
            {i.nom_complet.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[color:var(--text-primary)]">{i.nom_complet}</p>
          <p className="text-xs text-[color:var(--text-secondary)]">{i.poste}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {habAlerte > 0 && (
            <span className="text-xs font-semibold text-[color:var(--badge-danger-text)] bg-danger-50 border border-danger-200 px-2 py-0.5 rounded-full">
              {habAlerte} hab. ⚠
            </span>
          )}
          <span className={clsx(
            'text-xs font-semibold px-2 py-0.5 rounded-full border',
            i.badge_actif
              ? 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200'
              : 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] border-[var(--border)]',
          )}>
            {i.badge_actif ? 'Badge actif' : 'Inactif'}
          </span>
          {open ? <ChevronUp size={14} className="text-[color:var(--text-muted)]" /> : <ChevronDown size={14} className="text-[color:var(--text-muted)]" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-4 pt-1 border-t border-[var(--border)]">
          {i.date_entree_site && (
            <p className="text-xs text-[color:var(--text-muted)] mb-3 flex items-center gap-1.5">
              <Calendar size={11} />
              Entrée site le {fmt(i.date_entree_site)}
            </p>
          )}
          <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--text-muted)] mb-2">Habilitations</p>
          <div className="space-y-2">
            {i.habilitations.map(h => {
              const hs = HAB_STYLE[h.statut];
              const dl = daysLeft(h.date_expiration);
              return (
                <div key={h.type} className={clsx('flex items-center justify-between rounded-lg px-3 py-2 border', hs.cls)}>
                  <div>
                    <p className="text-xs font-semibold">{LABELS_HABILITATION[h.type]}</p>
                    {h.organisme && <p className="text-[11px] opacity-70">{h.organisme}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-mono opacity-80">{fmt(h.date_expiration)}</p>
                    <p className="text-[10px] font-semibold">
                      {dl < 0 ? `Expiré ${-dl}j` : dl < 30 ? `⚠ ${dl}j` : hs.label}
                    </p>
                  </div>
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

function TabIntervenantsFiche({ p }: { p: Prestataire }) {
  return (
    <div className="space-y-3">
      {p.intervenants.length === 0 ? (
        <div className="card p-10 text-center">
          <Users size={28} className="text-[color:var(--text-secondary)] mx-auto mb-2" />
          <p className="text-sm text-[color:var(--text-muted)]">Aucun intervenant enregistré</p>
        </div>
      ) : (
        p.intervenants.map(i => <CarteIntervenant key={i.id} i={i} />)
      )}
    </div>
  );
}

// ── Onglet Évaluations ────────────────────────────────────────────────────────

function TabEvalsFiche({ p }: { p: Prestataire }) {
  if (p.evaluations.length === 0) {
    return (
      <div className="card p-10 text-center">
        <Star size={28} className="text-[color:var(--text-secondary)] mx-auto mb-2" />
        <p className="text-sm text-[color:var(--text-muted)]">Aucune évaluation enregistrée</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {p.evaluations.map(e => {
        const { color, bg } = scoreLabel(e.score_global);
        const reco = e.recommandation;
        return (
          <div key={e.id} className="card p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-[color:var(--text-muted)] font-medium">
                  {fmt(e.date)} · {e.evaluateur}
                </p>
                <p className="text-xs text-[color:var(--text-muted)] mt-0.5">
                  {e.nb_incidents_periode} incident(s) · {e.nb_at_periode} AT sur la période
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
                  reco === 'SURVEILLER' ? 'bg-safety-50 text-[color:var(--badge-safety-text)] border-safety-200' :
                  'bg-danger-50 text-[color:var(--badge-danger-text)] border-danger-200',
                )}>
                  {reco === 'RENOUVELER' ? '✓ Renouveler' : reco === 'SURVEILLER' ? '⚠ Surveiller' : '✗ Suspendre'}
                </span>
              </div>
            </div>

            {/* Barre score sécurité */}
            <div className="mb-4">
              {[
                { label: 'Score sécurité HSE', score: e.score_securite, color: '#00d4ff' },
              ].map(({ label, score, color: c }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[color:var(--text-muted)] uppercase font-bold tracking-wide">{label}</span>
                    <span className="text-xs font-bold text-[color:var(--text-secondary)]">{score}/100</span>
                  </div>
                  <div className="h-2.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: c }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Commentaires */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {e.points_positifs && (
                <div className="bg-success-50 rounded-xl p-3 flex gap-2">
                  <TrendingUp size={13} className="text-success-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-[color:var(--badge-success-text)] uppercase tracking-wide mb-1">Points positifs</p>
                    <p className="text-xs text-[color:var(--badge-success-text)]">{e.points_positifs}</p>
                  </div>
                </div>
              )}
              {e.points_amelioration && (
                <div className="bg-safety-50 rounded-xl p-3 flex gap-2">
                  <TrendingDown size={13} className="text-safety-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-[color:var(--badge-safety-text)] uppercase tracking-wide mb-1">Axes d'amélioration</p>
                    <p className="text-xs text-[color:var(--badge-safety-text)]">{e.points_amelioration}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function FichePrestataire({ prestataire: p, onBack }: FichePrestatairePros) {
  const [tab,          setTab]          = useState<TabFiche>('resume');
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [newEvals,     setNewEvals]     = useState<EvaluationPrestataire[]>([]);

  // Fusion évaluations demo + nouvelles
  const allEvals = [...newEvals, ...p.evaluations];
  const enriched = { ...p, evaluations: allEvals };

  function handleSaveEval(_prest: Prestataire, eval_: EvaluationPrestataire) {
    setNewEvals(prev => [eval_, ...prev]);
    setTab('evaluations');
  }

  const { label, cls, dot, bg } = STATUT_STYLE[p.statut];

  const TABS: { id: TabFiche; label: string; icon: typeof Building2; badge?: number }[] = [
    { id: 'resume',       label: 'Résumé',         icon: Building2  },
    { id: 'documents',    label: 'Documents',       icon: FileText,  badge: p.documents.filter(d => d.statut !== 'VALIDE').length || undefined },
    { id: 'intervenants', label: 'Intervenants',    icon: Users,     badge: p.intervenants.flatMap(i => i.habilitations).filter(h => h.statut !== 'VALIDE').length || undefined },
    { id: 'evaluations',  label: 'Évaluations',     icon: Star,      badge: p.evaluations.length || undefined },
  ];

  return (
    <div className="min-h-screen">
      {showEvalForm && (
        <FormulaireEvaluation
          prestataire={p}
          onClose={() => setShowEvalForm(false)}
          onSave={handleSaveEval}
        />
      )}
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 border-b border-[var(--border)]"
        style={{ background: 'rgba(5,14,31,0.92)', backdropFilter: 'blur(12px)', boxShadow: '0 2px 20px rgba(0,0,0,0.35)' }}
      >
        {/* Barre principale */}
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
          {/* Retour */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Prestataires</span>
          </button>

          <span className="text-white/20 text-lg font-thin">/</span>

          {/* Identité */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <Building2 size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">{p.nom}</p>
              <p className="text-white/50 text-xs font-mono">{p.code} · {p.siret}</p>
            </div>
          </div>

          {/* Badge statut */}
          <span className={clsx('hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold', bg, cls)}>
            <span className={clsx('w-1.5 h-1.5 rounded-full', dot)} />
            {label}
          </span>

          {/* CTA Évaluer */}
          <button
            type="button"
            onClick={() => setShowEvalForm(true)}
            style={{ background: 'linear-gradient(135deg, #00d4ff, #0077aa)' }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-[#02101f] rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-sm flex-shrink-0"
          >
            <ClipboardList size={14} />
            Évaluer
          </button>
        </div>

        {/* Onglets */}
        <div className="max-w-6xl mx-auto px-6 flex items-center gap-1 border-t border-white/10 pb-0">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-150 border-b-2 -mb-px',
                  tab === t.id
                    ? 'border-white text-white'
                    : 'border-transparent text-white/50 hover:text-white/80 hover:border-white/30',
                )}
              >
                <Icon size={13} />
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span className={clsx(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                    tab === t.id ? 'bg-white/20 text-white' : 'bg-safety-500 text-white',
                  )}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {tab === 'resume'       && <TabResume           p={enriched} />}
        {tab === 'documents'    && <TabDocsFiche         p={enriched} />}
        {tab === 'intervenants' && <TabIntervenantsFiche p={enriched} />}
        {tab === 'evaluations'  && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowEvalForm(true)}
                style={{ background: 'linear-gradient(135deg, #00d4ff, #0077aa)' }}
                className="flex items-center gap-2 px-4 py-2.5 text-[#02101f] rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-sm"
              >
                <ClipboardList size={14} />
                Nouvelle évaluation
              </button>
            </div>
            <TabEvalsFiche p={enriched} />
          </div>
        )}
      </main>
    </div>
  );
}
