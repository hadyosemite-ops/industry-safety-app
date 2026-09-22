import { useState } from 'react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ArrowLeft, MapPin, User, Calendar, ShieldCheck, AlertTriangle,
  Clock, Plus, CheckCircle2, Paperclip, Loader2,
} from 'lucide-react';
import type { RisqueIndustriel, ActionRisque, TypeMesureHierarchie, PreuveCloture } from '../types';
import {
  LABELS_PHASE, ICONES_PHASE, LABELS_STATUT_RISQUE, LABELS_TYPE_MESURE, ORDRE_TYPE_MESURE,
  LABELS_STATUT_ACTION, ORDRE_STATUT_ACTION, LABELS_DECISION_RESIDUELLE,
  calculerNiveau, evaluerDecisionResiduelle, actionEstEnRetard, actionEcheanceProche,
} from '../types';
import { BadgeNiveauRisque } from './BadgeNiveauRisque';
import * as risqueService from '../services/risqueService';
import * as actionService from '../services/actionService';

// ── Timeline verticale des cotations (avant / après) ─────────────────────────

function TimelineCotations({ risque }: { risque: RisqueIndustriel }) {
  const cotations = risque.cotations ?? [];
  if (cotations.length === 0) return null;

  return (
    <div className="card p-5">
      <p className="text-sm font-semibold text-[color:var(--text-primary)] mb-4">Historique des cotations</p>
      <div className="space-y-0">
        {cotations.map((c, i) => (
          <div key={c.id} className="flex gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
              <span className="w-2.5 h-2.5 rounded-full mt-1.5" style={{ background: c.niveau === 'CRITIQUE' ? '#ef4444' : c.niveau === 'ELEVE' ? '#f97316' : c.niveau === 'MODERE' ? '#eab308' : '#22c55e' }} />
              {i < cotations.length - 1 && <span className="w-px flex-1 bg-[var(--border)] my-1" />}
            </div>
            <div className={clsx('pb-5 min-w-0 flex-1', i === cotations.length - 1 && 'pb-0')}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[color:var(--text-primary)]">
                  {c.type === 'INITIALE' ? 'Cotation initiale' : c.type === 'RESIDUELLE' ? 'Cotation résiduelle' : 'Cotation intermédiaire'}
                </span>
                <BadgeNiveauRisque niveau={c.niveau} taille="sm" />
                <span className="text-xs text-[color:var(--text-muted)]">F{c.frequence} × G{c.gravite} = {c.score}</span>
              </div>
              <p className="text-[11px] text-[color:var(--text-muted)] mt-0.5">
                {format(new Date(c.date), 'dd MMM yyyy', { locale: fr })}
                {c.auteur_nom && ` — ${c.auteur_nom}`}
              </p>
              {c.commentaire && <p className="text-xs text-[color:var(--text-secondary)] mt-1">{c.commentaire}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Plan d'action — tableau classique, propre à ce risque ────────────────────

function CellulePreuve({ action, onCloture }: { action: ActionRisque; onCloture: () => void }) {
  const [fichierEnCours, setFichierEnCours] = useState(false);

  async function handleFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFichierEnCours(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const preuve: PreuveCloture = { url: String(reader.result), nom: file.name, type: file.type };
      await actionService.cloturerActionAvecPreuve(action.id, [...action.preuve_cloture, preuve]);
      onCloture();
      setFichierEnCours(false);
    };
    reader.readAsDataURL(file);
  }

  const aDesPreuves = action.preuve_cloture.length > 0;

  return (
    <label
      className={clsx(
        'inline-flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-colors',
        aDesPreuves ? 'text-[color:var(--badge-navy-text)] bg-[rgba(0,212,255,0.08)]' : 'text-[color:var(--text-muted)] hover:bg-[var(--bg-hover)]',
      )}
      title={aDesPreuves ? `${action.preuve_cloture.length} pièce(s) jointe(s)` : 'Joindre une preuve de clôture'}
    >
      {fichierEnCours ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
      <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFichier} disabled={fichierEnCours} />
    </label>
  );
}

function TableauActions({ actions, onChangerStatut, onCloture }: {
  actions: ActionRisque[];
  onChangerStatut: (id: string, statut: ActionRisque['statut']) => void;
  onCloture: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-hover)]">
            <tr>
              <th className="text-left px-3 py-2 text-[color:var(--text-muted)] font-semibold text-xs">Action</th>
              <th className="text-left px-3 py-2 text-[color:var(--text-muted)] font-semibold text-xs">Type</th>
              <th className="text-left px-3 py-2 text-[color:var(--text-muted)] font-semibold text-xs">Pilote</th>
              <th className="text-left px-3 py-2 text-[color:var(--text-muted)] font-semibold text-xs">Échéance</th>
              <th className="text-left px-3 py-2 text-[color:var(--text-muted)] font-semibold text-xs">Statut</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {actions.map(action => {
              const enRetard = actionEstEnRetard(action);
              const bientot = actionEcheanceProche(action);
              return (
                <tr key={action.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="px-3 py-2.5 max-w-[220px]">
                    <p className="text-[color:var(--text-primary)] font-medium truncate" title={action.description}>{action.description}</p>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[var(--bg-hover)] text-[color:var(--text-secondary)]">
                      {LABELS_TYPE_MESURE[action.type_mesure]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[color:var(--text-secondary)] whitespace-nowrap">
                    {action.responsable_nom ?? <span className="text-[color:var(--text-muted)]">—</span>}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1"
                      style={{ color: enRetard ? '#ef4444' : bientot ? '#f59e0b' : 'var(--text-secondary)' }}
                    >
                      {(enRetard || bientot) ? <AlertTriangle size={11} /> : <Clock size={11} />}
                      {format(new Date(action.date_echeance), 'dd MMM yyyy', { locale: fr })}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={action.statut}
                      onChange={e => onChangerStatut(action.id, e.target.value as ActionRisque['statut'])}
                      className="form-select w-auto text-[11px] px-2 py-1 rounded-lg"
                    >
                      {ORDRE_STATUT_ACTION.map(s => <option key={s} value={s}>{LABELS_STATUT_ACTION[s]}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2.5">
                    {action.statut !== 'VERIFIEE' && <CellulePreuve action={action} onCloture={onCloture} />}
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

function NouvelleAction({ risqueId, onCree }: { risqueId: string; onCree: (a: ActionRisque) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [description, setDescription] = useState('');
  const [typeMesure, setTypeMesure] = useState<TypeMesureHierarchie>('CONTROLE_TECHNIQUE');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  async function handleSubmit() {
    if (!description.trim()) { setErreur('La description est obligatoire.'); return; }
    setEnvoi(true);
    const { data, error } = await actionService.creerAction({ risque_id: risqueId, description: description.trim(), type_mesure: typeMesure });
    setEnvoi(false);
    if (error || !data) { setErreur(error?.message ?? 'Erreur lors de la création.'); return; }
    onCree(data);
    setDescription('');
    setOuvert(false);
  }

  if (!ouvert) {
    return (
      <button type="button" onClick={() => setOuvert(true)} className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--badge-navy-text)] hover:underline">
        <Plus size={13} /> Ajouter une action corrective
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border-strong)] p-3.5 space-y-2.5">
      <textarea
        className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm bg-[var(--bg-input)] text-[color:var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
        rows={2}
        placeholder="Description de l'action corrective…"
        value={description}
        onChange={e => { setDescription(e.target.value); setErreur(''); }}
      />
      <div className="flex items-center gap-2">
        <select value={typeMesure} onChange={e => setTypeMesure(e.target.value as TypeMesureHierarchie)} className="form-select text-xs px-2.5 py-1.5 rounded-lg flex-1">
          {ORDRE_TYPE_MESURE.map(t => <option key={t} value={t}>{LABELS_TYPE_MESURE[t]}</option>)}
        </select>
        <button type="button" onClick={() => setOuvert(false)} className="btn-ghost text-xs px-3 py-1.5">Annuler</button>
        <button type="button" onClick={() => void handleSubmit()} disabled={envoi} className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50">
          {envoi ? 'Création…' : 'Créer'}
        </button>
      </div>
      {erreur && <p className="text-danger-400 text-xs">{erreur}</p>}
      <p className="text-[10px] text-[color:var(--text-muted)]">
        L'échéance est calculée automatiquement selon le niveau de criticité du risque.
      </p>
    </div>
  );
}

// ── Panneau de réévaluation (risque résiduel) ─────────────────────────────────

function PanneauReevaluation({ risque, onReevalue }: { risque: RisqueIndustriel; onReevalue: (r: RisqueIndustriel) => void }) {
  const [frequence, setFrequence] = useState(risque.frequence_residuelle ?? risque.frequence_initiale);
  const [gravite, setGravite] = useState(risque.gravite_residuelle ?? risque.gravite_initiale);
  const [justification, setJustification] = useState(risque.justification_alarp ?? '');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const scoreSimule = frequence * gravite;
  const niveauSimule = calculerNiveau(scoreSimule)!;
  const decision = evaluerDecisionResiduelle(scoreSimule, justification);

  async function handleSubmit() {
    setErreur('');
    if (decision === 'EN_ATTENTE_JUSTIFICATION') {
      setErreur('Une justification ALARP est requise pour un score résiduel modéré (5-9).');
      return;
    }
    setEnvoi(true);
    const { data, error } = await risqueService.reevaluerRisque(risque.id, {
      frequence_residuelle: frequence,
      gravite_residuelle: gravite,
      justification_alarp: justification.trim() || undefined,
    });
    setEnvoi(false);
    if (error || !data) { setErreur(error?.message ?? 'Erreur lors de la réévaluation.'); return; }
    onReevalue(data);
  }

  return (
    <div className="card p-5 space-y-3.5">
      <div>
        <p className="text-sm font-semibold text-[color:var(--text-primary)]">Réévaluation du risque résiduel</p>
        <p className="text-xs text-[color:var(--text-muted)]">Après vérification de clôture des actions correctives</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wide">Fréquence résiduelle</label>
          <select value={frequence} onChange={e => setFrequence(Number(e.target.value))} className="form-select w-full mt-1 text-sm px-2.5 py-1.5 rounded-lg">
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wide">Gravité résiduelle</label>
          <select value={gravite} onChange={e => setGravite(Number(e.target.value))} className="form-select w-full mt-1 text-sm px-2.5 py-1.5 rounded-lg">
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[color:var(--text-secondary)]">Score simulé : <strong>{scoreSimule}</strong></span>
        <BadgeNiveauRisque niveau={niveauSimule} taille="sm" />
        <span className={clsx(
          'text-[11px] font-semibold px-2 py-0.5 rounded-full',
          decision === 'ACCEPTE' && 'bg-success-100 text-[color:var(--badge-success-text)]',
          decision === 'ACCEPTE_ALARP' && 'bg-navy-100 text-[color:var(--badge-navy-text)]',
          decision === 'EN_ATTENTE_JUSTIFICATION' && 'bg-amber-100 text-[color:var(--badge-amber-text)]',
          decision === 'ACTION_OBLIGATOIRE' && 'bg-danger-100 text-[color:var(--badge-danger-text)]',
        )}>
          {decision && LABELS_DECISION_RESIDUELLE[decision]}
        </span>
      </div>

      {(scoreSimule >= 5 && scoreSimule <= 9) && (
        <div>
          <label className="text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wide">Justification ALARP</label>
          <textarea
            className="w-full mt-1 border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm bg-[var(--bg-input)] text-[color:var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
            rows={2}
            placeholder="Pourquoi ce niveau de risque résiduel est jugé aussi bas que raisonnablement praticable…"
            value={justification}
            onChange={e => setJustification(e.target.value)}
          />
        </div>
      )}

      {scoreSimule >= 10 && (
        <div className="flex items-start gap-2 bg-danger-50/40 border border-danger-200 rounded-xl px-3 py-2.5">
          <AlertTriangle size={14} className="text-danger-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[color:var(--badge-danger-text)]">
            Score résiduel {LABELS_DECISION_RESIDUELLE.ACTION_OBLIGATOIRE.toLowerCase()} — le risque restera Ouvert/En cours ; ajoutez une nouvelle action corrective ci-dessus.
          </p>
        </div>
      )}

      {erreur && <p className="text-danger-400 text-xs">{erreur}</p>}

      <button type="button" onClick={() => void handleSubmit()} disabled={envoi} className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
        {envoi ? 'Enregistrement…' : 'Enregistrer la réévaluation'}
      </button>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface Props {
  risque: RisqueIndustriel;
  onBack: () => void;
  onUpdate: (risque: RisqueIndustriel) => void;
}

export function RisqueDetail({ risque: risqueProp, onBack, onUpdate }: Props) {
  const [risque, setRisque] = useState(risqueProp);

  function appliquerMaj(updated: RisqueIndustriel) {
    setRisque(prev => ({ ...updated, actions: updated.actions ?? prev.actions, cotations: updated.cotations ?? prev.cotations }));
    onUpdate(updated);
  }

  async function refetchActions() {
    const { data } = await actionService.listerActions(risque.id);
    if (data) setRisque(prev => ({ ...prev, actions: data }));
  }

  async function handleChangerStatutAction(id: string, statut: ActionRisque['statut']) {
    await actionService.changerStatutAction(id, statut);
    await refetchActions();
  }

  const niveauActuel = risque.niveau_residuel ?? risque.niveau_initial;
  const actions = risque.actions ?? [];

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 bg-[#0077aa] shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <button type="button" onClick={onBack} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0">
            <ArrowLeft size={16} className="text-white" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-white/60 text-xs font-mono">{risque.numero}</p>
            <p className="text-white font-bold text-base leading-snug truncate">{risque.danger}</p>
          </div>
          <BadgeNiveauRisque niveau={niveauActuel} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Print letterhead */}
        <div className="hidden print:block pb-4 mb-1 border-b-2 border-[#0077aa]">
          <p className="text-xs font-mono text-slate-500">{risque.numero}</p>
          <h1 className="text-xl font-bold text-slate-900">{risque.danger}</h1>
        </div>

        {/* Infos générales */}
        <div className="card p-5">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-hover)] text-[color:var(--text-secondary)]">
              {ICONES_PHASE[risque.phase]} {LABELS_PHASE[risque.phase]}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--bg-hover)] text-[color:var(--text-secondary)]">
              {LABELS_STATUT_RISQUE[risque.statut]}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-[color:var(--text-secondary)]"><MapPin size={12} className="text-[color:var(--text-muted)]" /> {risque.zone_code ?? risque.activite}</p>
              {risque.responsable_nom && <p className="flex items-center gap-1.5 text-[color:var(--text-secondary)]"><User size={12} className="text-[color:var(--text-muted)]" /> {risque.responsable_nom}</p>}
              <p className="flex items-center gap-1.5 text-[color:var(--text-secondary)]"><Calendar size={12} className="text-[color:var(--text-muted)]" /> Identifié le {format(new Date(risque.date_identification), 'dd MMMM yyyy', { locale: fr })}</p>
            </div>
            <div className="space-y-1.5 text-[color:var(--text-secondary)]">
              <p><span className="font-semibold text-[color:var(--text-primary)]">Situation dangereuse : </span>{risque.situation_dangereuse}</p>
              <p><span className="font-semibold text-[color:var(--text-primary)]">Événement redouté : </span>{risque.evenement_redoute}</p>
              <p><span className="font-semibold text-[color:var(--text-primary)]">Conséquence potentielle : </span>{risque.consequence_potentielle}</p>
            </div>
          </div>

          {risque.moyens_protection.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <p className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <ShieldCheck size={12} /> Moyens de protection existants
              </p>
              <div className="flex flex-wrap gap-1.5">
                {risque.moyens_protection.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-[var(--bg-hover)] text-[color:var(--text-secondary)]">
                    {m.description} <span className="text-[10px] text-[color:var(--text-muted)]">· {LABELS_TYPE_MESURE[m.hierarchie]}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <TimelineCotations risque={risque} />

        {/* Plan d'action */}
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[color:var(--text-primary)]">Plan d'action</p>
            <span className="text-xs text-[color:var(--text-muted)]">
              {actions.filter(a => a.statut === 'VERIFIEE').length}/{actions.length} vérifiée{actions.length > 1 ? 's' : ''}
            </span>
          </div>
          {actions.length > 0 ? (
            <TableauActions
              actions={actions}
              onChangerStatut={handleChangerStatutAction}
              onCloture={() => void refetchActions()}
            />
          ) : (
            <p className="text-xs text-[color:var(--text-muted)] italic">Aucune action pour ce risque.</p>
          )}
          <NouvelleAction risqueId={risque.id} onCree={() => void refetchActions()} />
        </div>

        {/* Réévaluation — accessible dès qu'au moins une action a été traitée */}
        {actions.some(a => a.statut === 'REALISEE' || a.statut === 'VERIFIEE') || risque.score_residuel != null ? (
          <PanneauReevaluation risque={risque} onReevalue={appliquerMaj} />
        ) : (
          <div className="card p-5 flex items-start gap-2.5">
            <CheckCircle2 size={15} className="text-[color:var(--text-muted)] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[color:var(--text-muted)]">
              La réévaluation du risque résiduel sera disponible une fois qu'au moins une action corrective aura été réalisée.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
