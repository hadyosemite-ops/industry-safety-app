// ─────────────────────────────────────────────────────────────────────────────
// Module Prestataires — Formulaire d'évaluation HSE
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, type FormEvent } from 'react';
import {
  X, Star, ShieldCheck, AlertTriangle, CheckCircle2, ChevronDown,
  FileText, TrendingUp, TrendingDown, Save,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Prestataire, EvaluationPrestataire } from '../types';
import { PRESTATAIRES_DEMO } from '../data/demo.data';
import { scoreLabel } from '../types';
import { useModalA11y } from '@/hooks/useModalA11y';

// ── Props ─────────────────────────────────────────────────────────────────────

interface FormulaireEvaluationProps {
  /** Pré-sélectionner un prestataire (depuis la fiche) */
  prestataire?: Prestataire;
  onClose: () => void;
  onSave: (prestataire: Prestataire, evaluation: EvaluationPrestataire) => void;
}

// ── Critères d'évaluation sécurité ───────────────────────────────────────────

interface Critere {
  id: string;
  label: string;
  description: string;
  poids: number;       // % du score total
}

const CRITERES: Critere[] = [
  { id: 'epi',         label: 'Port des EPI',             description: 'Respect systématique des équipements de protection individuelle',  poids: 20 },
  { id: 'procedures',  label: 'Respect des procédures',   description: 'Application des permis de travail, consignations, plans de préventio', poids: 25 },
  { id: 'habilitations', label: 'Habilitations à jour',  description: 'Validité de toutes les habilitations des intervenants présents',      poids: 20 },
  { id: 'signalisation', label: 'Balisage & signalisation', description: 'Périmètre de sécurité, signalisation des zones de travail',        poids: 15 },
  { id: 'urgence',     label: 'Maîtrise des urgences',    description: 'Connaissance des procédures d\'urgence et des équipements de secours', poids: 20 },
];

// ── Slider de note ────────────────────────────────────────────────────────────

function SliderNote({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const color =
    value >= 85 ? 'bg-emerald-500' :
    value >= 70 ? 'bg-green-500'   :
    value >= 55 ? 'bg-yellow-500'  :
    'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-[#00d4ff]"
      />
      <div className={clsx('min-w-[52px] text-center px-2 py-1 rounded-lg text-white text-sm font-bold', color)}>
        {value}
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function FormulaireEvaluation({ prestataire, onClose, onSave }: FormulaireEvaluationProps) {
  // Sélection du prestataire
  const [prestId, setPrestId] = useState<string>(prestataire?.id ?? '');

  // Notes par critère (0-100 chacun)
  const [notes, setNotes] = useState<Record<string, number>>(
    Object.fromEntries(CRITERES.map(c => [c.id, 75])),
  );

  // Champs texte
  const [evaluateur,        setEvaluateur]        = useState('');
  const [nbIncidents,       setNbIncidents]        = useState(0);
  const [nbAt,              setNbAt]               = useState(0);
  const [pointsPositifs,    setPointsPositifs]     = useState('');
  const [pointsAmelioration, setPointsAmelioration] = useState('');
  const [recommandation,    setRecommandation]     = useState<'RENOUVELER' | 'SURVEILLER' | 'SUSPENDRE'>('RENOUVELER');

  // Erreurs de validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(modalRef, onClose);

  // Score calculé (moyenne pondérée des critères)
  const scoreCalcule = Math.round(
    CRITERES.reduce((sum, c) => sum + notes[c.id] * (c.poids / 100), 0),
  );

  const { label: scoreLabel_, color: scoreColor } = scoreLabel(scoreCalcule);

  // Recommandation automatique selon score
  const recoAuto: 'RENOUVELER' | 'SURVEILLER' | 'SUSPENDRE' =
    scoreCalcule >= 70 ? 'RENOUVELER' :
    scoreCalcule >= 50 ? 'SURVEILLER' :
    'SUSPENDRE';

  // Validation
  function validate() {
    const errs: Record<string, string> = {};
    if (!prestId)    errs.prestId    = 'Sélectionner un prestataire';
    if (!evaluateur.trim()) errs.evaluateur = 'Nom de l\'évaluateur requis';
    if (!pointsPositifs.trim()) errs.positifs = 'Requis';
    if (!pointsAmelioration.trim()) errs.amelioration = 'Requis';
    return errs;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const prest = PRESTATAIRES_DEMO.find(p => p.id === prestId)!;
    const newEval: EvaluationPrestataire = {
      id:                   `eval-${Date.now()}`,
      date:                 new Date().toISOString().slice(0, 10),
      evaluateur:           evaluateur.trim(),
      score_securite:       scoreCalcule,
      score_global:         scoreCalcule,
      nb_incidents_periode: nbIncidents,
      nb_at_periode:        nbAt,
      points_positifs:      pointsPositifs.trim(),
      points_amelioration:  pointsAmelioration.trim(),
      recommandation,
    };

    setSubmitted(true);
    setTimeout(() => {
      onSave(prest, newEval);
      onClose();
    }, 800);
  }

  const prestSelected = PRESTATAIRES_DEMO.find(p => p.id === prestId);

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div role="status" aria-live="polite" className="bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-4 max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-success-500" />
          </div>
          <p className="text-lg font-bold text-[color:var(--text-primary)]">Évaluation enregistrée</p>
          <p className="text-sm text-[color:var(--text-secondary)] text-center">
            Score sécurité : <span className={clsx('font-bold', scoreColor)}>{scoreCalcule}/100 — {scoreLabel_}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="eval-modal-title"
        className="bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] focus:outline-none"
      >

        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center">
              <Star size={16} className="text-[color:var(--badge-navy-text)]" />
            </div>
            <div>
              <p id="eval-modal-title" className="font-bold text-[color:var(--text-primary)]">Évaluation HSE</p>
              <p className="text-xs text-[color:var(--text-muted)]">Notation sécurité du prestataire</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
            <X size={18} className="text-[color:var(--text-secondary)]" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-6">

            {/* Sélection prestataire */}
            <div>
              <label className="block text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wide mb-2">
                Prestataire évalué *
              </label>
              {prestataire ? (
                <div className="flex items-center gap-3 bg-navy-50 border border-navy-200 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={14} className="text-[color:var(--badge-navy-text)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[color:var(--text-primary)] text-sm">{prestataire.nom}</p>
                    <p className="text-xs text-[color:var(--text-secondary)]">{prestataire.code} · {prestataire.secteur_activite}</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={prestId}
                    onChange={e => setPrestId(e.target.value)}
                    className={clsx(
                      'w-full appearance-none bg-[var(--bg-input)] border rounded-xl px-4 py-3 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)] cursor-pointer',
                      errors.prestId ? 'border-red-400' : 'border-[var(--border-strong)]',
                    )}
                  >
                    <option value="" className="bg-[#0a1628] text-[color:var(--text-primary)]">-- Choisir un prestataire --</option>
                    {PRESTATAIRES_DEMO.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#0a1628] text-[color:var(--text-primary)]">{p.nom} ({p.code})</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none" />
                  {errors.prestId && <p className="form-error">{errors.prestId}</p>}
                </div>
              )}
            </div>

            {/* Évaluateur */}
            <div>
              <label className="block text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wide mb-2">
                Évaluateur (nom) *
              </label>
              <input
                type="text"
                value={evaluateur}
                onChange={e => setEvaluateur(e.target.value)}
                placeholder="Ex: Hassan Benali"
                className={clsx('form-input', errors.evaluateur && 'form-input-error')}
              />
              {errors.evaluateur && <p className="form-error">{errors.evaluateur}</p>}
            </div>

            {/* Critères de notation */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wide">
                  Critères de sécurité
                </label>
                {/* Score en direct */}
                <div className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl',
                  scoreCalcule >= 85 ? 'bg-success-100' :
                  scoreCalcule >= 70 ? 'bg-success-50'   :
                  scoreCalcule >= 55 ? 'bg-amber-50'  :
                  'bg-danger-50',
                )}>
                  <span className={clsx('text-lg font-black', scoreColor)}>{scoreCalcule}</span>
                  <span className={clsx('text-xs', scoreColor)}>/100 · {scoreLabel_}</span>
                </div>
              </div>

              <div className="space-y-4 bg-[var(--bg-hover)] rounded-2xl p-4">
                {CRITERES.map(c => (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--text-primary)]">{c.label}</p>
                        <p className="text-xs text-[color:var(--text-muted)]">{c.description} <span className="font-bold">(×{c.poids}%)</span></p>
                      </div>
                    </div>
                    <SliderNote value={notes[c.id]} onChange={v => setNotes(n => ({ ...n, [c.id]: v }))} />
                  </div>
                ))}
              </div>
            </div>

            {/* Incidents / AT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wide mb-2">
                  Incidents sur la période
                </label>
                <input
                  type="number"
                  min={0}
                  value={nbIncidents}
                  onChange={e => setNbIncidents(Number(e.target.value))}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wide mb-2">
                  AT (accidents du travail)
                </label>
                <input
                  type="number"
                  min={0}
                  value={nbAt}
                  onChange={e => setNbAt(Number(e.target.value))}
                  className="form-input"
                />
              </div>
            </div>

            {/* Points positifs */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wide mb-2">
                <TrendingUp size={12} className="text-emerald-500" />
                Points positifs *
              </label>
              <textarea
                rows={2}
                value={pointsPositifs}
                onChange={e => setPointsPositifs(e.target.value)}
                placeholder="Ex: Respect rigoureux des consignes LOTO, intervenants bien habilités…"
                className={clsx('form-textarea', errors.positifs && 'form-input-error')}
              />
              {errors.positifs && <p className="form-error">{errors.positifs}</p>}
            </div>

            {/* Axes d'amélioration */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wide mb-2">
                <TrendingDown size={12} className="text-orange-500" />
                Axes d'amélioration *
              </label>
              <textarea
                rows={2}
                value={pointsAmelioration}
                onChange={e => setPointsAmelioration(e.target.value)}
                placeholder="Ex: Balisage de la zone de travail insuffisant. Formation ATEX à planifier…"
                className={clsx('form-textarea', errors.amelioration && 'form-input-error')}
              />
              {errors.amelioration && <p className="form-error">{errors.amelioration}</p>}
            </div>

            {/* Recommandation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[color:var(--text-muted)] uppercase tracking-wide">
                  Recommandation finale
                </label>
                <span className="text-[11px] text-[color:var(--text-muted)]">
                  Suggestion auto : <span className={clsx(
                    'font-bold',
                    recoAuto === 'RENOUVELER' ? 'text-emerald-600' :
                    recoAuto === 'SURVEILLER' ? 'text-orange-600' :
                    'text-red-600',
                  )}>{recoAuto}</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['RENOUVELER', 'SURVEILLER', 'SUSPENDRE'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRecommandation(r)}
                    className={clsx(
                      'py-2.5 rounded-xl text-xs font-bold border-2 transition-all duration-150',
                      recommandation === r
                        ? r === 'RENOUVELER' ? 'bg-emerald-500 text-white border-emerald-500' :
                          r === 'SURVEILLER' ? 'bg-orange-500 text-white border-orange-500' :
                          'bg-red-500 text-white border-red-500'
                        : 'bg-[var(--bg-hover)] border-[var(--border)] text-[color:var(--text-secondary)] hover:border-[var(--border)]',
                    )}
                  >
                    {r === 'RENOUVELER' ? '✓ Renouveler' :
                     r === 'SURVEILLER' ? '⚠ Surveiller' :
                     '✗ Suspendre'}
                  </button>
                ))}
              </div>
            </div>

            {/* Résumé si prestataire sélectionné */}
            {prestSelected && (
              <div className="bg-navy-50 rounded-xl p-4 border border-navy-200">
                <p className="text-xs font-bold text-[color:var(--badge-navy-text)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <FileText size={11} />
                  Récapitulatif évaluation
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs text-[color:var(--text-secondary)]">
                  <span>Prestataire :</span><span className="font-semibold text-[color:var(--text-primary)]">{prestSelected.nom}</span>
                  <span>Évaluateur :</span><span className="font-semibold text-[color:var(--text-primary)]">{evaluateur || '—'}</span>
                  <span>Score sécurité :</span>
                  <span className={clsx('font-bold', scoreColor)}>{scoreCalcule}/100 — {scoreLabel_}</span>
                  <span>Recommandation :</span>
                  <span className={clsx(
                    'font-bold',
                    recommandation === 'RENOUVELER' ? 'text-emerald-600' :
                    recommandation === 'SURVEILLER' ? 'text-orange-600' :
                    'text-red-600',
                  )}>{recommandation}</span>
                </div>
              </div>
            )}

          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between gap-3 flex-shrink-0 bg-[var(--bg-hover)]">
          <div className="flex items-center gap-2">
            {nbIncidents > 0 && (
              <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                <AlertTriangle size={12} />
                {nbIncidents} incident(s) signalé(s)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[color:var(--text-primary)] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form=""
              onClick={handleSubmit as unknown as React.MouseEventHandler}
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0077aa)' }}
              className="flex items-center gap-2 px-5 py-2.5 text-[#02101f] rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-sm"
            >
              <Save size={14} />
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
