import { useState } from 'react';
import {
  Building2, Calendar, MapPin, Users, Shield, AlertTriangle,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  UserCheck, ClipboardCheck, MessageSquare,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ATDemo, PermisDemo, LABELS_PERMIS, ICONES_PERMIS } from './demo.data';
import { BadgeRisque } from './DashboardAnimateur';

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  at: ATDemo;
  onApprouver: (atId: string, commentaire: string) => void;
  onRefuser:   (atId: string, motif: string) => void;
}

// ── Sous-composant : Carte permis validé ──────────────────────────────────────

function PermisValideRow({ permis }: { permis: PermisDemo }) {
  const [open, setOpen] = useState(false);

  const nbOui = permis.checklist_reponses.filter(r => r.reponse === 'OUI').length;
  const nbTotal = permis.checklist_reponses.length;

  return (
    <div className="border border-success-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-success-50 hover:bg-success-100 transition-colors text-left"
      >
        <span className="text-lg leading-none">{ICONES_PERMIS[permis.type_permis]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[color:var(--text-primary)]">{LABELS_PERMIS[permis.type_permis]}</p>
          <p className="text-xs text-[color:var(--text-secondary)] mt-0.5 truncate">
            Validé par <strong className="text-[color:var(--text-primary)]">{permis.valide_par}</strong>
            {permis.valide_le && (
              <> · {format(new Date(permis.valide_le), "dd MMM 'à' HH:mm", { locale: fr })}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-[color:var(--badge-success-text)] bg-success-100 border border-success-200 px-2 py-0.5 rounded-full font-semibold">
            {nbOui}/{nbTotal} ✓
          </span>
          <CheckCircle2 size={15} className="text-success-500" />
          {open ? <ChevronUp size={14} className="text-[color:var(--text-muted)]" /> : <ChevronDown size={14} className="text-[color:var(--text-muted)]" />}
        </div>
      </button>

      {open && (
        <div className="px-4 py-3 space-y-3 bg-[var(--bg-hover)]">
          {/* Commentaire animateur */}
          {permis.commentaire_validation && (
            <div className="flex items-start gap-2 bg-navy-50 border border-navy-100 rounded-lg p-2.5">
              <MessageSquare size={13} className="text-[color:var(--badge-navy-text)] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[color:var(--badge-navy-text)] italic">« {permis.commentaire_validation} »</p>
            </div>
          )}

          {/* Checklist résumé */}
          <div>
            <p className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wider mb-1.5">Points de contrôle</p>
            <div className="space-y-1">
              {permis.checklist_reponses.map(item => (
                <div key={item.question_id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[color:var(--text-secondary)] flex-1">{item.question_libelle}</span>
                  <span className={clsx(
                    'px-1.5 py-0.5 rounded text-xs font-bold',
                    item.reponse === 'OUI' ? 'bg-success-100 text-[color:var(--badge-success-text)]' :
                    item.reponse === 'NON' ? 'bg-danger-100 text-[color:var(--badge-danger-text)]' :
                    'bg-[var(--bg-hover)] text-[color:var(--text-secondary)]',
                  )}>
                    {item.reponse === 'N_A' ? 'N/A' : item.reponse}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Intervenants */}
          <div>
            <p className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wider mb-1.5">
              Intervenants ({permis.intervenants.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {permis.intervenants.map(iv => (
                <span key={iv.id} className="inline-flex items-center gap-1 text-xs bg-[var(--bg-hover)] border border-[var(--border)] text-[color:var(--text-primary)] px-2 py-1 rounded-lg">
                  <UserCheck size={11} className="text-[color:var(--text-muted)]" />
                  {iv.nom_complet}
                  {iv.habilitations.length > 0 && (
                    <span className="text-[color:var(--text-muted)]">· {iv.habilitations.join(', ')}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function ATApprovalCard({ at, onApprouver, onRefuser }: Props) {
  const [action, setAction]       = useState<'idle' | 'approuver' | 'refuser'>('idle');
  const [commentaire, setCommentaire] = useState('');
  const [motif, setMotif]         = useState('');
  const [errMotif, setErrMotif]   = useState('');
  const [dangerOpen, setDangerOpen] = useState(false);

  const totalIntervenants = at.permis.reduce(
    (acc, p) => acc + new Set(p.intervenants.map(i => i.id)).size, 0,
  );

  const dateDebut = (() => {
    try { return format(new Date(at.date_debut_prevue), 'dd MMM yyyy', { locale: fr }); }
    catch { return at.date_debut_prevue; }
  })();
  const dateFin = (() => {
    try { return format(new Date(at.date_fin_prevue), 'dd MMM yyyy', { locale: fr }); }
    catch { return at.date_fin_prevue; }
  })();

  function handleConfirmerApprobation() {
    onApprouver(at.id, commentaire);
  }

  function handleConfirmerRefus() {
    if (!motif.trim()) { setErrMotif('Le motif de refus est obligatoire.'); return; }
    onRefuser(at.id, motif);
  }

  return (
    <div className={clsx(
      'card overflow-hidden transition-all duration-200',
      action === 'approuver' ? 'border-success-200 shadow-success-50' :
      action === 'refuser'   ? 'border-danger-200 shadow-danger-50' :
      'hover:shadow-md',
    )}>

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-[var(--border)]">
        <div className="flex items-start gap-3">
          {/* Barre risque */}
          <div className={clsx(
            'w-1 self-stretch rounded-full flex-shrink-0',
            at.niveau_risque === 'CRITIQUE' ? 'bg-red-400' :
            at.niveau_risque === 'ELEVE'    ? 'bg-amber-400' : 'bg-green-400',
          )} />

          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-xs font-mono text-[color:var(--text-muted)] bg-[var(--bg-hover)] border border-[var(--border)] px-2 py-0.5 rounded-md">
                {at.numero_at}
              </span>
              <BadgeRisque niveau={at.niveau_risque} />
              <span className="inline-flex items-center gap-1 text-xs bg-teal-500/10 text-[color:var(--badge-teal-text)] border border-teal-400/30 px-2 py-0.5 rounded-full font-semibold">
                <ClipboardCheck size={10} />
                Prête à approuver
              </span>
            </div>

            {/* Titre */}
            <h3 className="font-bold text-[color:var(--text-primary)] leading-snug">{at.titre}</h3>

            {/* Description */}
            <p className="text-sm text-[color:var(--text-secondary)] mt-1 leading-relaxed line-clamp-2">
              {at.description_travaux}
            </p>
          </div>
        </div>

        {/* Méta grid */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)]">
            <Building2 size={12} className="text-[color:var(--text-muted)] flex-shrink-0" />
            <span className="truncate font-medium text-[color:var(--text-primary)]">{at.entreprise_intervenante}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)]">
            <MapPin size={12} className="text-[color:var(--text-muted)] flex-shrink-0" />
            <span className="truncate">[{at.code_zone}] {at.zone}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)]">
            <Users size={12} className="text-[color:var(--text-muted)] flex-shrink-0" />
            <span>{totalIntervenants} intervenant{totalIntervenants > 1 ? 's' : ''} déclarés</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)]">
            <Calendar size={12} className="text-[color:var(--text-muted)] flex-shrink-0" />
            <span>{dateDebut} → {dateFin}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)]">
            <UserCheck size={12} className="text-[color:var(--text-muted)] flex-shrink-0" />
            <span>Chef : <span className="font-medium text-[color:var(--text-secondary)]">{at.chef_chantier}</span></span>
          </div>
        </div>
      </div>

      {/* ── Risques & EPI globaux ── */}
      <div className="px-5 py-3 bg-[var(--bg-hover)] border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setDangerOpen(v => !v)}
          className="w-full flex items-center gap-2 text-xs font-semibold text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
        >
          <Shield size={13} className="text-[color:var(--text-muted)]" />
          Risques identifiés & EPI obligatoires
          {dangerOpen ? <ChevronUp size={13} className="ml-auto" /> : <ChevronDown size={13} className="ml-auto" />}
        </button>

        {dangerOpen && (
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wider mb-1.5">
                Dangers identifiés
              </p>
              <div className="flex flex-wrap gap-1.5">
                {at.dangers_identifies.map(d => (
                  <span key={d} className="inline-flex items-center gap-1 text-xs bg-danger-50 text-[color:var(--badge-danger-text)] border border-danger-100 px-2 py-1 rounded-lg">
                    <AlertTriangle size={10} />
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wider mb-1.5">
                EPI obligatoires AT
              </p>
              <div className="flex flex-wrap gap-1.5">
                {at.epi_obligatoires.map(e => (
                  <span key={e} className="text-xs bg-navy-50 text-[color:var(--badge-navy-text)] border border-navy-100 px-2 py-1 rounded-lg">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Permis validés ── */}
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wider">
            Permis validés par l'Animateur
          </p>
          <span className="text-xs font-bold text-[color:var(--badge-success-text)] bg-success-50 border border-success-200 px-2 py-0.5 rounded-full">
            {at.permis.length}/{at.permis.length} ✓
          </span>
        </div>
        <div className="space-y-2">
          {at.permis.map(permis => (
            <PermisValideRow key={permis.id} permis={permis} />
          ))}
        </div>
      </div>

      {/* ── Zone d'action ── */}
      {action === 'idle' && (
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="flex-1 hidden sm:block">
            <p className="text-xs text-[color:var(--text-muted)]">
              Demandé par <strong className="text-[color:var(--text-secondary)]">{at.demandeur_nom}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAction('refuser')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-danger-200 bg-danger-50 text-[color:var(--badge-danger-text)] text-sm font-semibold hover:bg-danger-100 transition-colors"
          >
            <XCircle size={15} />
            Refuser
          </button>
          <button
            type="button"
            onClick={() => setAction('approuver')}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0077aa] text-white text-sm font-semibold hover:bg-[#0077aa]/90 transition-colors shadow-sm"
          >
            <CheckCircle2 size={15} />
            Approuver l'AT
          </button>
        </div>
      )}

      {/* ── Panel Approbation ── */}
      {action === 'approuver' && (
        <div className="px-5 py-4 bg-success-50 border-t border-success-100 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-success-500 flex-shrink-0" />
            <p className="text-sm font-bold text-[color:var(--badge-success-text)]">Approbation de l'AT</p>
          </div>
          <p className="text-xs text-[color:var(--badge-success-text)]">
            Vous allez approuver <strong>{at.numero_at}</strong>. Les intervenants pourront commencer les travaux après activation.
          </p>
          <div>
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5">
              Commentaire d'approbation <span className="text-[color:var(--text-muted)] font-normal">(optionnel)</span>
            </label>
            <textarea
              className="w-full border border-success-200 rounded-xl px-3 py-2.5 text-sm text-[color:var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-success-200 focus:border-success-400 bg-[var(--bg-input)]"
              rows={2}
              placeholder="Tout est conforme. GO terrain pour le 30/05 à 06h00…"
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setAction('idle')}
              className="btn-ghost text-sm"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirmerApprobation}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-success-600 text-[#02101f] text-sm font-semibold hover:bg-success-500 transition-colors shadow-sm"
            >
              <CheckCircle2 size={15} />
              Confirmer l'approbation
            </button>
          </div>
        </div>
      )}

      {/* ── Panel Refus ── */}
      {action === 'refuser' && (
        <div className="px-5 py-4 bg-danger-50 border-t border-danger-100 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle size={16} className="text-danger-500 flex-shrink-0" />
            <p className="text-sm font-bold text-[color:var(--badge-danger-text)]">Refus de l'AT</p>
          </div>
          <p className="text-xs text-[color:var(--badge-danger-text)]">
            Le refus renvoie l'AT en statut <strong>SOUMISE</strong>. L'Animateur devra corriger et re-soumettre.
          </p>
          <div>
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1.5">
              Motif du refus <span className="text-danger-400">*</span>
            </label>
            <textarea
              className={clsx(
                'w-full border rounded-xl px-3 py-2.5 text-sm text-[color:var(--text-primary)] resize-none focus:outline-none focus:ring-2 bg-[var(--bg-input)]',
                errMotif
                  ? 'border-danger-400 focus:ring-danger-200'
                  : 'border-danger-200 focus:ring-danger-200 focus:border-danger-400',
              )}
              rows={2}
              placeholder="Précisez les points à corriger avant approbation…"
              value={motif}
              onChange={e => { setMotif(e.target.value); setErrMotif(''); }}
            />
            {errMotif && <p className="text-danger-400 text-xs mt-1">{errMotif}</p>}
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => { setAction('idle'); setErrMotif(''); }}
              className="btn-ghost text-sm"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirmerRefus}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-danger-600 text-white text-sm font-semibold hover:bg-danger-500 transition-colors shadow-sm"
            >
              <XCircle size={15} />
              Confirmer le refus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
