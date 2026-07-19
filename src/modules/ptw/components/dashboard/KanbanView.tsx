import { useRef, useState, useCallback, useMemo } from 'react';
import { clsx } from 'clsx';
import {
  CheckCircle2, XCircle, X, MapPin, Building2, Calendar,
  User, AlertTriangle, Shield, Clock, FileText, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ATDemo, PermisDemo, StatutATDemo, ICONES_PERMIS, LABELS_PERMIS } from './demo.data';
import { KanbanCard } from './KanbanCard';
import { SuspensionModal, SuspensionFormData } from './SuspensionModal';
import { AuditModal, AuditFormData } from './AuditModal';
import { PermisValidationModal } from './PermisValidationModal';
import { useModalA11y } from '@/hooks/useModalA11y';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RoleKanban = 'ANIMATEUR' | 'RESP_ZONE' | 'OBSERVATEUR';

interface Props {
  ats: ATDemo[];
  role: RoleKanban;
  onTransition: (atId: string, newStatut: StatutATDemo, data?: unknown) => void;
}

// ── Définition des colonnes ───────────────────────────────────────────────────

interface ColonneDef {
  statut:    StatutATDemo;
  label:     string;
  emoji:     string;
  headerCls: string;       // classe couleur header
  dropOkCls: string;       // highlight quand drop valide
  dropNoCls: string;       // highlight quand drop invalide
}

const COLONNES: ColonneDef[] = [
  {
    statut:    'SOUMISE',
    label:     'Soumise',
    emoji:     '📋',
    headerCls: 'bg-navy-50 text-[color:var(--badge-navy-text)] border-navy-200',
    dropOkCls: 'ring-2 ring-navy-400 bg-navy-50/40',
    dropNoCls: 'ring-2 ring-danger-300 bg-danger-50/30',
  },
  {
    statut:    'VALIDEE',
    label:     'Validée',
    emoji:     '✅',
    headerCls: 'bg-teal-500/10 text-[color:var(--badge-teal-text)] border-teal-500/30',
    dropOkCls: 'ring-2 ring-teal-400 bg-teal-500/10',
    dropNoCls: 'ring-2 ring-danger-300 bg-danger-50/30',
  },
  {
    statut:    'APPROUVEE',
    label:     'Approuvée',
    emoji:     '👍',
    headerCls: 'bg-violet-500/10 text-[color:var(--badge-purple-text)] border-violet-500/30',
    dropOkCls: 'ring-2 ring-violet-400 bg-violet-500/10',
    dropNoCls: 'ring-2 ring-danger-300 bg-danger-50/30',
  },
  {
    statut:    'ACTIVE',
    label:     'Active',
    emoji:     '⚡',
    headerCls: 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200',
    dropOkCls: 'ring-2 ring-success-400 bg-success-50/40',
    dropNoCls: 'ring-2 ring-danger-300 bg-danger-50/30',
  },
  {
    statut:    'SUSPENDUE',
    label:     'Suspendue',
    emoji:     '⏸️',
    headerCls: 'bg-safety-50 text-[color:var(--badge-safety-text)] border-safety-200',
    dropOkCls: 'ring-2 ring-safety-400 bg-safety-50/40',
    dropNoCls: 'ring-2 ring-danger-300 bg-danger-50/30',
  },
  {
    statut:    'CLOTUREE',
    label:     'Clôturée',
    emoji:     '🔒',
    headerCls: 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] border-[var(--border)]',
    dropOkCls: 'ring-2 ring-[var(--border-strong)] bg-[var(--bg-hover)]',
    dropNoCls: 'ring-2 ring-danger-300 bg-danger-50/30',
  },
];

// ── Règles métier de transition ───────────────────────────────────────────────

// Retourne true si la transition from→to est autorisée pour ce rôle
function estTransitionAutorisee(
  from:    StatutATDemo,
  to:      StatutATDemo,
  role:    RoleKanban,
  at:      ATDemo,
): { ok: boolean; motif?: string } {
  if (from === to) return { ok: false };

  if (role === 'OBSERVATEUR') {
    return { ok: false, motif: 'Vue générale en lecture seule — aucune action possible ici.' };
  }

  if (role === 'ANIMATEUR') {
    // Animateur : SOUMISE → VALIDEE (condition : 100% permis validés)
    if (from === 'SOUMISE' && to === 'VALIDEE') {
      const allValide = at.permis.every(p => p.statut === 'VALIDE');
      if (!allValide) return { ok: false, motif: 'Tous les permis doivent être validés avant de passer en Validée.' };
      return { ok: true };
    }
    // ACTIVE → SUSPENDUE
    if (from === 'ACTIVE' && to === 'SUSPENDUE') return { ok: true };
    // SUSPENDUE → ACTIVE (levée suspension)
    if (from === 'SUSPENDUE' && to === 'ACTIVE') return { ok: true };

    return { ok: false, motif: 'Action non autorisée pour l\'Animateur de Sécurité.' };
  }

  if (role === 'RESP_ZONE') {
    // VALIDEE → APPROUVEE
    if (from === 'VALIDEE' && to === 'APPROUVEE') return { ok: true };
    // VALIDEE → SOUMISE (refus → renvoie en correction)
    if (from === 'VALIDEE' && to === 'SOUMISE') return { ok: true };
    // APPROUVEE → ACTIVE
    if (from === 'APPROUVEE' && to === 'ACTIVE') return { ok: true };
    // ACTIVE → SUSPENDUE
    if (from === 'ACTIVE' && to === 'SUSPENDUE') return { ok: true };
    // ACTIVE → CLOTUREE (condition : tous permis CLOS)
    if (from === 'ACTIVE' && to === 'CLOTUREE') {
      const allClos = at.permis.every(p => p.statut === 'CLOS');
      if (!allClos) return { ok: false, motif: 'Tous les permis doivent être clôturés avant de clôturer l\'AT.' };
      return { ok: true };
    }

    return { ok: false, motif: 'Action non autorisée pour le Responsable de Zone.' };
  }

  return { ok: false };
}

// Transitions qui nécessitent une modal avant d'être confirmées
function necessiteModal(from: StatutATDemo, to: StatutATDemo, role: RoleKanban): 'suspension' | 'audit' | 'approbation' | 'refus' | null {
  if (to === 'SUSPENDUE') return 'suspension';
  if (from === 'SUSPENDUE' && to === 'ACTIVE') return 'audit';
  if (from === 'VALIDEE' && to === 'APPROUVEE' && role === 'RESP_ZONE') return 'approbation';
  if (from === 'VALIDEE' && to === 'SOUMISE' && role === 'RESP_ZONE') return 'refus';
  return null;
}

// ── Toast notification inline ─────────────────────────────────────────────────

interface Toast {
  id: number;
  type: 'error' | 'success';
  message: string;
}

// ── Composant colonne ─────────────────────────────────────────────────────────

function KanbanColonne({
  col,
  ats,
  draggedAt,
  dropTarget,
  dropValid,
  role,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardClick,
}: {
  col:         ColonneDef;
  ats:         ATDemo[];
  draggedAt:   ATDemo | null;
  dropTarget:  StatutATDemo | null;
  dropValid:   boolean | null;
  role:        RoleKanban;
  onDragStart: (at: ATDemo) => void;
  onDragEnd:   () => void;
  onDragOver:  (statut: StatutATDemo, at: ATDemo) => void;
  onDragLeave: () => void;
  onDrop:      (targetStatut: StatutATDemo) => void;
  onCardClick: (at: ATDemo) => void;
}) {
  const isTarget = dropTarget === col.statut;

  // Peut-on drag les cartes de cette colonne pour ce rôle ?
  const canDragFrom = useCallback((at: ATDemo): boolean => {
    if (role === 'OBSERVATEUR') return false;
    if (role === 'ANIMATEUR') {
      return at.statut === 'SOUMISE' || at.statut === 'ACTIVE' || at.statut === 'SUSPENDUE';
    }
    if (role === 'RESP_ZONE') {
      return at.statut === 'VALIDEE' || at.statut === 'APPROUVEE' || at.statut === 'ACTIVE';
    }
    return false;
  }, [role]);

  return (
    <div className="flex flex-col w-56 flex-shrink-0">
      {/* Header colonne */}
      <div className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-xl border mb-2 text-sm font-semibold',
        col.headerCls,
      )}>
        <span>{col.emoji}</span>
        <span className="flex-1">{col.label}</span>
        <span className="text-xs bg-white/15 px-1.5 py-0.5 rounded-full font-bold">
          {ats.length}
        </span>
      </div>

      {/* Zone de drop */}
      <div
        onDragOver={e => {
          e.preventDefault();
          if (draggedAt) onDragOver(col.statut, draggedAt);
        }}
        onDragLeave={onDragLeave}
        onDrop={e => {
          e.preventDefault();
          onDrop(col.statut);
        }}
        className={clsx(
          'flex-1 min-h-[120px] rounded-xl p-2 space-y-2 transition-all duration-150',
          isTarget && dropValid === true  ? col.dropOkCls  : '',
          isTarget && dropValid === false ? col.dropNoCls  : '',
          !isTarget ? 'bg-[var(--bg-hover)]' : '',
        )}
      >
        {ats.map(at => (
          <KanbanCard
            key={at.id}
            at={at}
            isDragging={draggedAt?.id === at.id}
            canDrag={canDragFrom(at)}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onCardClick}
          />
        ))}

        {/* Placeholder drop */}
        {isTarget && draggedAt && (
          <div className={clsx(
            'border-2 border-dashed rounded-xl h-12 flex items-center justify-center text-xs font-medium transition-all',
            dropValid === true
              ? 'border-success-400 text-[color:var(--badge-success-text)]'
              : 'border-danger-300 text-[color:var(--badge-danger-text)]',
          )}>
            {dropValid === true ? '✓ Déposer ici' : '✗ Non autorisé'}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal confirmation simple (approbation / refus / activation) ──────────────

function ConfirmModal({
  type,
  at,
  onConfirm,
  onCancel,
}: {
  type: 'approbation' | 'refus' | 'activation';
  at: ATDemo;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}) {
  const [comment, setComment] = useState('');
  const [erreur,  setErreur]  = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(modalRef, onCancel);

  const cfg = {
    approbation: {
      title:       'Approuver l\'AT',
      desc:        `Vous approuvez ${at.numero_at}. Les travaux pourront démarrer après activation.`,
      btnLabel:    'Confirmer l\'approbation',
      btnCls:      'bg-success-600 hover:bg-success-700 text-white',
      placeholder: 'Commentaire d\'approbation (optionnel)…',
      required:    false,
      icon:        <CheckCircle2 size={18} className="text-success-500" />,
    },
    refus: {
      title:       'Refuser l\'AT',
      desc:        `L'AT ${at.numero_at} sera renvoyée en correction (statut SOUMISE).`,
      btnLabel:    'Confirmer le refus',
      btnCls:      'bg-danger-600 hover:bg-danger-700 text-white',
      placeholder: 'Motif du refus (obligatoire)…',
      required:    true,
      icon:        <XCircle size={18} className="text-danger-500" />,
    },
    activation: {
      title:       'Activer l\'AT',
      desc:        `L'AT ${at.numero_at} sera activée. Les intervenants peuvent démarrer les travaux.`,
      btnLabel:    'Confirmer l\'activation',
      btnCls:      'bg-[#0077aa] hover:bg-[#0077aa]/90 text-white',
      placeholder: 'Commentaire (optionnel)…',
      required:    false,
      icon:        <CheckCircle2 size={18} className="text-[#4de6ff]" />,
    },
  }[type];

  function handleConfirm() {
    if (cfg.required && !comment.trim()) {
      setErreur('Ce champ est obligatoire.');
      return;
    }
    onConfirm(comment);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="modal-overlay" onClick={onCancel} />
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto focus:outline-none"
      >
        <div className="flex items-center gap-3">
          {cfg.icon}
          <h2 id="confirm-modal-title" className="font-bold text-[color:var(--text-primary)] text-base">{cfg.title}</h2>
        </div>
        <p className="text-sm text-[color:var(--text-secondary)]">{cfg.desc}</p>
        <div>
          <textarea
            className={clsx(
              'w-full border rounded-xl px-3 py-2.5 text-sm bg-[var(--bg-input)] text-[color:var(--text-primary)] resize-none focus:outline-none focus:ring-2',
              erreur ? 'border-danger-400 focus:ring-danger-200' : 'border-[var(--border-strong)] focus:ring-navy-200',
            )}
            rows={3}
            placeholder={cfg.placeholder}
            value={comment}
            onChange={e => { setComment(e.target.value); setErreur(''); }}
          />
          {erreur && <p className="text-danger-400 text-xs mt-1">{erreur}</p>}
        </div>
        <div className="flex justify-end gap-2.5">
          <button type="button" onClick={onCancel} className="btn-ghost">Annuler</button>
          <button
            type="button"
            onClick={handleConfirm}
            className={clsx('flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-colors', cfg.btnCls)}
          >
            {cfg.btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal détail AT ───────────────────────────────────────────────────────────

// Badge affiché sur le bandeau bleu fixe (#0077aa) de la modale — ce bandeau
// reste toujours sombre quel que soit le thème, donc le badge utilise un style
// fixe (blanc translucide + pastille colorée) plutôt que des tokens de thème,
// sans quoi le texte devient illisible en mode clair (cf. StepIndicator).
const STATUT_STYLE: Record<StatutATDemo, { label: string; cls: string; dot: string }> = {
  SOUMISE:   { label: 'Soumise',   cls: 'bg-white/15 text-white border-white/25', dot: 'bg-blue-300'   },
  VALIDEE:   { label: 'Validée',   cls: 'bg-white/15 text-white border-white/25', dot: 'bg-teal-300'   },
  APPROUVEE: { label: 'Approuvée', cls: 'bg-white/15 text-white border-white/25', dot: 'bg-violet-300' },
  ACTIVE:    { label: 'Active',    cls: 'bg-white/15 text-white border-white/25', dot: 'bg-green-300'  },
  SUSPENDUE: { label: 'Suspendue', cls: 'bg-white/15 text-white border-white/25', dot: 'bg-orange-300' },
  CLOTUREE:  { label: 'Clôturée', cls: 'bg-white/15 text-white border-white/25', dot: 'bg-slate-300'   },
};

const RISQUE_STYLE: Record<string, { cls: string; icon: string }> = {
  CRITIQUE: { cls: 'bg-danger-50 text-[color:var(--badge-danger-text)] border-danger-200',    icon: '🔴' },
  ELEVE:    { cls: 'bg-amber-50 text-[color:var(--badge-amber-text)] border-amber-200', icon: '🟠' },
  MODERE:   { cls: 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200', icon: '🟢' },
};

const PERMIS_STATUT_STYLE: Record<string, { cls: string; dot: string; label: string }> = {
  VALIDE:     { cls: 'text-[color:var(--badge-success-text)] bg-success-50 border-success-200',   dot: 'bg-success-500',  label: 'Validé'     },
  EN_ATTENTE: { cls: 'text-[color:var(--badge-navy-text)] bg-navy-50 border-navy-200',      dot: 'bg-navy-400',   label: 'En attente' },
  REJETE:     { cls: 'text-[color:var(--badge-danger-text)] bg-danger-50 border-danger-200',         dot: 'bg-danger-400',    label: 'Rejeté'     },
  SUSPENDU:   { cls: 'text-[color:var(--badge-safety-text)] bg-safety-50 border-safety-200',dot: 'bg-safety-400', label: 'Suspendu'   },
  CLOS:       { cls: 'text-[color:var(--text-secondary)] bg-[var(--bg-hover)] border-[var(--border)]',     dot: 'bg-surface-600',   label: 'Clos'       },
};

function fmtDate(iso: string) {
  try { return format(new Date(iso), 'dd MMM yyyy', { locale: fr }); }
  catch { return '—'; }
}

export function ATDetailModal({
  at, onClose, role, onUpdatePermis,
}: {
  at: ATDemo;
  onClose: () => void;
  /** Si 'ANIMATEUR' et fourni avec onUpdatePermis, les permis en attente deviennent validables ici. */
  role?: RoleKanban;
  onUpdatePermis?: (permisId: string, patch: Partial<PermisDemo>) => void;
}) {
  const statut = STATUT_STYLE[at.statut];
  const risque = RISQUE_STYLE[at.niveau_risque] ?? RISQUE_STYLE.MODERE;
  const validesCount = at.permis.filter(p => p.statut === 'VALIDE').length;
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(modalRef, onClose);

  const peutValider = role === 'ANIMATEUR' && !!onUpdatePermis;
  const [permisModalOuvert, setPermisModalOuvert] = useState<PermisDemo | null>(null);

  function handleValider(commentaire: string, checklist_reponses: PermisDemo['checklist_reponses']) {
    if (!permisModalOuvert || !onUpdatePermis) return;
    onUpdatePermis(permisModalOuvert.id, {
      statut: 'VALIDE', checklist_reponses, valide_par: 'Sophie Martin', valide_le: new Date().toISOString(),
      commentaire_validation: commentaire || undefined,
    });
    setPermisModalOuvert(null);
  }

  function handleRejeter(motif: string) {
    if (!permisModalOuvert || !onUpdatePermis) return;
    onUpdatePermis(permisModalOuvert.id, { statut: 'REJETE', rejete_le: new Date().toISOString(), motif_rejet: motif });
    setPermisModalOuvert(null);
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="modal-overlay" onClick={onClose} />

      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="at-detail-modal-title"
        className="relative bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden focus:outline-none"
      >

        {/* ── Header ── */}
        <div className="bg-[#0077aa] px-6 py-4 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white/50 text-xs font-mono">{at.numero_at}</p>
              <p id="at-detail-modal-title" className="text-white font-bold text-base leading-snug">{at.titre}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={clsx(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold',
              statut.cls,
            )}>
              <span className={clsx('w-1.5 h-1.5 rounded-full', statut.dot)} />
              {statut.label}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* ── Corps scrollable ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">

            {/* Infos principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[var(--bg-hover)] rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wide">Informations</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
                    <MapPin size={13} className="text-[color:var(--text-muted)] flex-shrink-0" />
                    <span className="font-medium">{at.zone} <span className="text-[color:var(--text-muted)]">({at.code_zone})</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
                    <Building2 size={13} className="text-[color:var(--text-muted)] flex-shrink-0" />
                    <span>{at.entreprise_intervenante}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
                    <User size={13} className="text-[color:var(--text-muted)] flex-shrink-0" />
                    <span>{at.demandeur_nom}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
                    <AlertTriangle size={13} className="text-[color:var(--text-muted)] flex-shrink-0" />
                    <span className={clsx(
                      'px-2 py-0.5 rounded-md text-xs font-semibold border',
                      risque.cls,
                    )}>
                      {risque.icon} {at.niveau_risque}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--bg-hover)] rounded-xl p-4 space-y-3">
                <p className="text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wide">Période</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
                    <Calendar size={13} className="text-[color:var(--text-muted)] flex-shrink-0" />
                    <span>Début : <span className="font-semibold">{fmtDate(at.date_debut_prevue)}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
                    <Calendar size={13} className="text-[color:var(--text-muted)] flex-shrink-0" />
                    <span>Fin : <span className="font-semibold">{fmtDate(at.date_fin_prevue)}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
                    <Clock size={13} className="text-[color:var(--text-muted)] flex-shrink-0" />
                    <span>Chef chantier : <span className="font-semibold">{at.chef_chantier}</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {at.description_travaux && (
              <div className="bg-navy-50/50 border border-navy-200 rounded-xl p-4">
                <p className="text-[10px] font-bold text-[color:var(--badge-navy-text)] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <FileText size={10} />
                  Description des travaux
                </p>
                <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed">{at.description_travaux}</p>
              </div>
            )}

            {/* Permis */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wide">
                  Permis associés
                </p>
                <span className="text-xs font-bold text-[color:var(--text-secondary)]">
                  {validesCount}/{at.permis.length} validé{validesCount > 1 ? 's' : ''}
                </span>
              </div>

              {at.permis.length === 0 ? (
                <p className="text-sm text-[color:var(--text-muted)] italic">Aucun permis associé</p>
              ) : (
                <div className="space-y-2">
                  {at.permis.map(permis => {
                    const ps = PERMIS_STATUT_STYLE[permis.statut] ?? PERMIS_STATUT_STYLE.EN_ATTENTE;
                    const validable = peutValider && permis.statut === 'EN_ATTENTE';
                    const Wrapper: 'button' | 'div' = validable ? 'button' : 'div';
                    return (
                      <Wrapper
                        key={permis.id}
                        type={validable ? 'button' : undefined}
                        onClick={validable ? () => setPermisModalOuvert(permis) : undefined}
                        className={clsx(
                          'w-full flex items-center gap-3 bg-[var(--bg-hover)] rounded-xl border border-[var(--border)] px-4 py-3 shadow-sm text-left',
                          validable && 'hover:border-[var(--border-strong)] hover:bg-[rgba(0,212,255,0.06)] transition-colors cursor-pointer',
                        )}
                      >
                        <span className="text-base flex-shrink-0">
                          {ICONES_PERMIS[permis.type_permis]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[color:var(--text-primary)]">{LABELS_PERMIS[permis.type_permis]}</p>
                          {permis.valide_par && (
                            <p className="text-xs text-[color:var(--text-muted)]">
                              Validé par : {permis.valide_par}
                            </p>
                          )}
                          {validable && (
                            <p className="text-xs text-[color:var(--badge-navy-text)] font-medium mt-0.5">
                              Cliquer pour valider ce permis
                            </p>
                          )}
                        </div>
                        <span className={clsx(
                          'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0',
                          ps.cls,
                        )}>
                          <span className={clsx('w-1.5 h-1.5 rounded-full', ps.dot)} />
                          {ps.label}
                        </span>
                        {(permis.commentaire_validation || validable) && (
                          <ChevronRight size={13} className="text-[color:var(--text-muted)] flex-shrink-0" />
                        )}
                      </Wrapper>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-hover)] flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#0077aa] text-white rounded-xl text-sm font-semibold hover:bg-[#0077aa]/90 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>

    {permisModalOuvert && (
      <PermisValidationModal
        permis={permisModalOuvert}
        at={at}
        onClose={() => setPermisModalOuvert(null)}
        onValider={handleValider}
        onRejeter={handleRejeter}
      />
    )}
    </>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function KanbanView({ ats, role, onTransition }: Props) {
  const [atData,      setAtData]      = useState<ATDemo[]>(ats);
  const [draggedAt,   setDraggedAt]   = useState<ATDemo | null>(null);
  const [dropTarget,  setDropTarget]  = useState<StatutATDemo | null>(null);
  const [dropValid,   setDropValid]   = useState<boolean | null>(null);
  const [toasts,      setToasts]      = useState<Toast[]>([]);
  const [selectedATId, setSelectedATId] = useState<string | null>(null);
  // Dérivé de atData (pas une copie figée) pour refléter immédiatement une
  // validation de permis faite depuis la modale de détail.
  const selectedAT = selectedATId ? atData.find(a => a.id === selectedATId) ?? null : null;

  // Modal en attente
  type PendingAction = {
    at: ATDemo;
    to: StatutATDemo;
    modalType: 'suspension' | 'audit' | 'approbation' | 'refus' | 'activation';
  };
  const [pending, setPending] = useState<PendingAction | null>(null);

  // ── Toast helpers ──
  let toastId = 0;
  function addToast(type: Toast['type'], message: string) {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }

  // Regroupement par statut mémoïsé — évite de refiltrer la liste complète des
  // AT à chaque re-render (ouverture de modale, toast, sélection d'une carte…).
  const atsParStatut = useMemo(() => {
    const map = new Map<StatutATDemo, ATDemo[]>();
    for (const col of COLONNES) map.set(col.statut, []);
    for (const at of atData) {
      map.get(at.statut)?.push(at);
    }
    return map;
  }, [atData]);

  // ── DnD handlers ──
  const handleDragStart = useCallback((at: ATDemo) => {
    setDraggedAt(at);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedAt(null);
    setDropTarget(null);
    setDropValid(null);
  }, []);

  const handleDragOver = useCallback((statut: StatutATDemo, at: ATDemo) => {
    setDropTarget(statut);
    const check = estTransitionAutorisee(at.statut, statut, role, at);
    setDropValid(check.ok);
  }, [role]);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
    setDropValid(null);
  }, []);

  function applyTransition(atId: string, newStatut: StatutATDemo, data?: unknown) {
    setAtData(prev => prev.map(a => a.id === atId ? { ...a, statut: newStatut } : a));
    onTransition(atId, newStatut, data);
    addToast('success', `AT déplacée → ${COLONNES.find(c => c.statut === newStatut)?.label}`);
  }

  const handleDrop = useCallback((targetStatut: StatutATDemo) => {
    if (!draggedAt) return;
    const check = estTransitionAutorisee(draggedAt.statut, targetStatut, role, draggedAt);

    if (!check.ok) {
      addToast('error', check.motif ?? 'Transition non autorisée.');
      handleDragEnd();
      return;
    }

    const modalType = necessiteModal(draggedAt.statut, targetStatut, role);

    if (modalType === 'approbation') {
      setPending({ at: draggedAt, to: targetStatut, modalType: 'approbation' });
    } else if (modalType === 'refus') {
      setPending({ at: draggedAt, to: targetStatut, modalType: 'refus' });
    } else if (modalType === 'suspension') {
      setPending({ at: draggedAt, to: targetStatut, modalType: 'suspension' });
    } else if (modalType === 'audit') {
      setPending({ at: draggedAt, to: targetStatut, modalType: 'audit' });
    } else {
      // Transition directe sans modal
      applyTransition(draggedAt.id, targetStatut);
    }

    handleDragEnd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggedAt, role, handleDragEnd]);

  const handleCardClick = useCallback((at: ATDemo) => {
    setSelectedATId(at.id);
  }, []);

  function handleUpdatePermis(atId: string, permisId: string, patch: Partial<PermisDemo>) {
    setAtData(prev => prev.map(a =>
      a.id === atId
        ? { ...a, permis: a.permis.map(p => p.id === permisId ? { ...p, ...patch } : p) }
        : a,
    ));
  }

  function handleModalConfirm(data: unknown) {
    if (!pending) return;
    applyTransition(pending.at.id, pending.to, data);
    setPending(null);
  }

  function handleModalCancel() {
    setPending(null);
  }

  return (
    <div className="relative">
      {/* Board scrollable */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max px-1 py-1">
          {COLONNES.map(col => (
            <KanbanColonne
              key={col.statut}
              col={col}
              ats={atsParStatut.get(col.statut) ?? []}
              draggedAt={draggedAt}
              dropTarget={dropTarget}
              dropValid={dropValid}
              role={role}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-16 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium border animate-fade-in-up',
              t.type === 'success'
                ? 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200'
                : 'bg-danger-50 text-[color:var(--badge-danger-text)] border-danger-200',
            )}
          >
            {t.type === 'success' ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            {t.message}
          </div>
        ))}
      </div>

      {/* Détail AT */}
      {selectedAT && (
        <ATDetailModal
          at={selectedAT}
          onClose={() => setSelectedATId(null)}
          role={role}
          onUpdatePermis={(permisId, patch) => handleUpdatePermis(selectedAT.id, permisId, patch)}
        />
      )}

      {/* Modals */}
      {pending?.modalType === 'suspension' && (
        <SuspensionModal
          at={pending.at}
          onClose={handleModalCancel}
          onConfirmer={(data: SuspensionFormData) => handleModalConfirm(data)}
        />
      )}
      {pending?.modalType === 'audit' && (
        <AuditModal
          at={pending.at}
          onClose={handleModalCancel}
          onConfirmer={(data: AuditFormData) => handleModalConfirm(data)}
        />
      )}
      {(pending?.modalType === 'approbation' ||
        pending?.modalType === 'refus' ||
        pending?.modalType === 'activation') && (
        <ConfirmModal
          type={pending.modalType}
          at={pending.at}
          onConfirm={(comment: string) => handleModalConfirm(comment)}
          onCancel={handleModalCancel}
        />
      )}
    </div>
  );
}
