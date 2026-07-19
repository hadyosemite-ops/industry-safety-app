import { useRef, useState, useMemo } from 'react';
import {
  X, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  User, Wrench, Shield, MessageSquare, AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PermisDemo, ATDemo, LABELS_PERMIS, ICONES_PERMIS } from './demo.data';
import { useModalA11y } from '@/hooks/useModalA11y';

function fmtDate(iso?: string): string {
  if (!iso) return '';
  try { return format(new Date(iso), "dd MMM yyyy 'à' HH:mm", { locale: fr }); }
  catch { return iso; }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  permis: PermisDemo;
  at: ATDemo;
  onClose: () => void;
  onValider: (commentaire: string, checklist_reponses: PermisDemo['checklist_reponses']) => void;
  onRejeter: (motif: string) => void;
}

// ── Réponse chip (lecture seule) ──────────────────────────────────────────────

function ReponseChip({ reponse }: { reponse: 'OUI' | 'NON' | 'N_A' }) {
  const cfg = {
    OUI: { cls: 'bg-success-100 text-[color:var(--badge-success-text)] border-success-200', label: 'OUI' },
    NON: { cls: 'bg-danger-100 text-[color:var(--badge-danger-text)] border-danger-200',    label: 'NON' },
    N_A: { cls: 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] border-[var(--border)]', label: 'N/A' },
  };
  const c = cfg[reponse];
  return (
    <span className={clsx('inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border tracking-wide', c.cls)}>
      {c.label}
    </span>
  );
}

// ── Section accordéon ─────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  badge,
  children,
  defaultOpen = true,
}: {
  icon: React.ElementType;
  title: string;
  badge?: string | number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)] transition-colors text-left"
      >
        <Icon size={15} className="text-[color:var(--text-secondary)] flex-shrink-0" />
        <span className="font-semibold text-[color:var(--text-primary)] text-sm flex-1">{title}</span>
        {badge !== undefined && (
          <span className="bg-[var(--bg-hover)] border border-[var(--border)] text-[color:var(--text-secondary)] text-xs px-2 py-0.5 rounded-full font-medium">
            {badge}
          </span>
        )}
        {open ? <ChevronUp size={15} className="text-[color:var(--text-muted)]" /> : <ChevronDown size={15} className="text-[color:var(--text-muted)]" />}
      </button>
      {open && <div className="px-4 py-4">{children}</div>}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function PermisValidationModal({ permis, at, onClose, onValider, onRejeter }: Props) {
  const [mode, setMode] = useState<'lecture' | 'approuver' | 'rejeter'>('lecture');
  const [commentaire, setCommentaire] = useState('');
  const [motif, setMotif] = useState('');
  const [erreur, setErreur] = useState('');
  const [checklist, setChecklist] = useState(permis.checklist_reponses);
  const modalRef = useRef<HTMLDivElement>(null);
  useModalA11y(modalRef, onClose);

  const enAttente = permis.statut === 'EN_ATTENTE';

  function handlePointChange(questionId: string, reponse: 'OUI' | 'NON' | 'N_A') {
    if (!enAttente) return;
    setChecklist(prev => prev.map(item => item.question_id === questionId ? { ...item, reponse } : item));
  }

  const categoriesChecklist = useMemo(() => {
    const map = new Map<string, typeof checklist>();
    for (const item of checklist) {
      if (!map.has(item.categorie)) map.set(item.categorie, []);
      map.get(item.categorie)!.push(item);
    }
    return map;
  }, [checklist]);

  const anomalies = checklist.filter(
    r => r.reponse === 'NON' && r.obligatoire,
  );

  const LABELS_CATEGORIE: Record<string, string> = {
    ZONE:           'Zone & Balisage',
    SECURITE:       'Sécurité générale',
    EPI:            'Équipements de protection',
    ISOLATION:      'Consignation / Isolation',
    HABILITATION:   'Habilitations',
    ATMOSPHERIQUE:  'Atmosphère',
    ORGANISATION:   'Organisation',
    URGENCE:        'Urgence / Secours',
    COMMUNICATION:  'Communication',
    DOCUMENTATION:  'Documentation',
    EQUIPEMENT:     'Équipements & Matériels',
    METEO:          'Conditions météo',
  };

  function handleValider() {
    if (mode !== 'approuver') { setMode('approuver'); return; }
    onValider(commentaire, checklist);
  }

  function handleRejeter() {
    if (mode !== 'rejeter') { setMode('rejeter'); setErreur(''); return; }
    if (!motif.trim()) { setErreur('Le motif de rejet est obligatoire.'); return; }
    onRejeter(motif);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="modal-overlay"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="permis-validation-modal-title"
        className="relative bg-[var(--bg-card)] backdrop-blur-[16px] border border-[var(--border-strong)] w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] rounded-t-2xl overflow-hidden focus:outline-none"
      >

        {/* Header */}
        <div className="bg-[#0077aa] px-5 py-4 flex items-start gap-3 flex-shrink-0">
          <div className="text-2xl leading-none mt-0.5">{ICONES_PERMIS[permis.type_permis]}</div>
          <div className="flex-1 min-w-0">
            <h2 id="permis-validation-modal-title" className="text-white font-bold text-base">{LABELS_PERMIS[permis.type_permis]}</h2>
            <p className="text-white/60 text-xs mt-0.5 truncate">
              {at.numero_at} · {at.zone}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-white/60 hover:text-white transition-colors flex-shrink-0 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Décision déjà prise — consultation seule */}
        {permis.statut === 'VALIDE' && (
          <div className="bg-success-50 border-b border-success-100 px-5 py-3 flex items-start gap-2.5">
            <CheckCircle2 size={16} className="text-success-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[color:var(--badge-success-text)] text-sm font-semibold">
                Permis validé{permis.valide_par ? ` par ${permis.valide_par}` : ''}{permis.valide_le ? ` le ${fmtDate(permis.valide_le)}` : ''}
              </p>
              {permis.commentaire_validation && (
                <p className="text-[color:var(--text-secondary)] text-xs mt-0.5">{permis.commentaire_validation}</p>
              )}
            </div>
          </div>
        )}
        {permis.statut === 'REJETE' && (
          <div className="bg-danger-50 border-b border-danger-100 px-5 py-3 flex items-start gap-2.5">
            <XCircle size={16} className="text-danger-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[color:var(--badge-danger-text)] text-sm font-semibold">
                Permis rejeté{permis.rejete_le ? ` le ${fmtDate(permis.rejete_le)}` : ''}
              </p>
              {permis.motif_rejet && (
                <p className="text-[color:var(--text-secondary)] text-xs mt-0.5">Motif : {permis.motif_rejet}</p>
              )}
            </div>
          </div>
        )}

        {/* Alerte anomalies */}
        {anomalies.length > 0 && (
          <div className="bg-danger-50 border-b border-danger-100 px-5 py-3 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-danger-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[color:var(--badge-danger-text)] text-sm font-semibold">
                {anomalies.length} point{anomalies.length > 1 ? 's' : ''} critique{anomalies.length > 1 ? 's' : ''} NON validé{anomalies.length > 1 ? 's' : ''}
              </p>
              <p className="text-danger-400 text-xs mt-0.5">
                {anomalies.map(a => a.question_libelle).join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* Contenu défilable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Checklist par catégorie */}
          <Section icon={ClipboardListIcon} title="Checklist terrain" badge={`${checklist.length} points`}>
            <div className="space-y-4">
              {enAttente && (
                <p className="text-xs text-[color:var(--text-muted)] -mt-1 mb-1 italic">
                  Cliquez sur un point pour corriger la réponse si nécessaire pendant la validation terrain.
                </p>
              )}
              {Array.from(categoriesChecklist.entries()).map(([categorie, items]) => (
                <div key={categorie}>
                  <p className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wider mb-2">
                    {LABELS_CATEGORIE[categorie] ?? categorie}
                  </p>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.question_id} className={clsx(
                        'flex items-center justify-between gap-3 px-3 py-2 rounded-lg',
                        item.reponse === 'NON' && item.obligatoire
                          ? 'bg-danger-50 border border-danger-100'
                          : 'bg-[var(--bg-hover)] border border-transparent',
                      )}>
                        <span className={clsx(
                          'text-sm flex-1',
                          item.reponse === 'NON' && item.obligatoire ? 'text-[color:var(--badge-danger-text)] font-medium' : 'text-[color:var(--text-primary)]',
                        )}>
                          {item.obligatoire && <span className="text-danger-400 mr-1">*</span>}
                          {item.question_libelle}
                        </span>
                        {enAttente ? (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {(['OUI', 'NON', 'N_A'] as const).map(rep => (
                              <button
                                key={rep}
                                type="button"
                                onClick={() => handlePointChange(item.question_id, rep)}
                                className={clsx(
                                  'px-2.5 py-1 text-xs font-bold rounded-md border transition-all',
                                  item.reponse === rep && rep === 'OUI' && 'bg-success-500 border-success-500 text-white',
                                  item.reponse === rep && rep === 'NON' && 'bg-danger-500 border-danger-500 text-white',
                                  item.reponse === rep && rep === 'N_A' && 'bg-surface-600 border-surface-600 text-white',
                                  item.reponse !== rep && 'bg-[var(--bg-hover)] border-[var(--border)] text-[color:var(--text-muted)] hover:border-[var(--border-strong)]',
                                )}
                              >
                                {rep === 'N_A' ? 'N/A' : rep}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <ReponseChip reponse={item.reponse} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* EPI */}
          <Section icon={Shield} title="EPI requis" badge={permis.epi_requis.length} defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              {permis.epi_requis.map(epi => (
                <span key={epi} className="bg-navy-50 text-[color:var(--badge-navy-text)] border border-navy-100 text-xs px-2.5 py-1 rounded-lg font-medium">
                  {epi}
                </span>
              ))}
            </div>
          </Section>

          {/* Mesures */}
          <Section icon={Wrench} title="Mesures de prévention" badge={permis.mesures_prevention.length} defaultOpen={false}>
            <ul className="space-y-1.5">
              {permis.mesures_prevention.map(m => (
                <li key={m} className="flex items-start gap-2 text-sm text-[color:var(--text-primary)]">
                  <span className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full flex-shrink-0 mt-1.5" />
                  {m}
                </li>
              ))}
            </ul>
          </Section>

          {/* Intervenants */}
          <Section icon={User} title="Intervenants" badge={permis.intervenants.length} defaultOpen={false}>
            <div className="space-y-2">
              {permis.intervenants.map(iv => (
                <div key={iv.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--bg-hover)] border border-[var(--border)]">
                  <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[color:var(--badge-navy-text)] text-xs font-bold">
                      {iv.nom_complet.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[color:var(--text-primary)]">{iv.nom_complet}</p>
                    <p className="text-xs text-[color:var(--text-secondary)]">{iv.entreprise}</p>
                  </div>
                  {iv.habilitations.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-end">
                      {iv.habilitations.map(h => (
                        <span key={h} className="bg-violet-500/10 text-[color:var(--badge-purple-text)] text-xs px-2 py-0.5 rounded-md border border-violet-500/30">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* Zone action : commentaire approuver */}
          {mode === 'approuver' && (
            <div className="border border-success-200 rounded-xl overflow-hidden">
              <div className="bg-success-50 px-4 py-2.5 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-success-500" />
                <span className="text-[color:var(--badge-success-text)] font-semibold text-sm">Validation du permis</span>
              </div>
              <div className="px-4 py-3">
                <label className="block text-sm font-medium text-[color:var(--text-primary)] mb-1.5">
                  Commentaire de validation <span className="text-[color:var(--text-muted)] font-normal">(optionnel)</span>
                </label>
                <textarea
                  className="w-full border border-[var(--border-strong)] bg-[var(--bg-input)] rounded-lg px-3 py-2 text-sm text-[color:var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-success-200 focus:border-success-400"
                  rows={3}
                  placeholder="RAS. Conformité terrain vérifiée…"
                  value={commentaire}
                  onChange={e => setCommentaire(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Zone action : motif rejet */}
          {mode === 'rejeter' && (
            <div className="border border-danger-200 rounded-xl overflow-hidden">
              <div className="bg-danger-50 px-4 py-2.5 flex items-center gap-2">
                <XCircle size={15} className="text-danger-500" />
                <span className="text-[color:var(--badge-danger-text)] font-semibold text-sm">Motif de rejet</span>
              </div>
              <div className="px-4 py-3">
                <label className="block text-sm font-medium text-[color:var(--text-primary)] mb-1.5">
                  Motif <span className="text-danger-400">*</span>
                </label>
                <textarea
                  className={clsx(
                    'w-full border rounded-lg px-3 py-2 text-sm text-[color:var(--text-primary)] bg-[var(--bg-input)] resize-none focus:outline-none focus:ring-2',
                    erreur
                      ? 'border-danger-400 focus:ring-danger-200 focus:border-danger-400'
                      : 'border-[var(--border-strong)] focus:ring-danger-200 focus:border-danger-400',
                  )}
                  rows={3}
                  placeholder="Décrivez précisément les non-conformités observées…"
                  value={motif}
                  onChange={e => { setMotif(e.target.value); setErreur(''); }}
                />
                {erreur && <p className="text-danger-400 text-xs mt-1">{erreur}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-[var(--border)] px-5 py-4 bg-[var(--bg-hover)] flex flex-wrap items-center gap-2.5 flex-shrink-0">
          {mode === 'lecture' ? (
            enAttente ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-ghost order-3 sm:order-1 w-full sm:w-auto sm:px-5"
                >
                  Fermer
                </button>
                <div className="hidden sm:block sm:flex-1 order-2" />
                <button
                  type="button"
                  onClick={handleRejeter}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-danger-200 bg-danger-50 text-[color:var(--badge-danger-text)] text-sm font-semibold hover:bg-danger-100 transition-colors flex-1 sm:flex-none order-1 sm:order-3"
                >
                  <XCircle size={15} />
                  Rejeter
                </button>
                <button
                  type="button"
                  onClick={handleValider}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-success-600 text-[#02101f] text-sm font-semibold hover:bg-success-500 transition-colors shadow-sm flex-1 sm:flex-none order-1 sm:order-4"
                >
                  <CheckCircle2 size={15} />
                  Valider terrain
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost flex-1 sm:flex-none sm:px-5"
              >
                Fermer
              </button>
            )
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setMode('lecture'); setErreur(''); }}
                className="btn-ghost"
              >
                ← Retour
              </button>
              <div className="flex-1" />
              {mode === 'approuver' ? (
                <button
                  type="button"
                  onClick={handleValider}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-success-600 text-[#02101f] text-sm font-semibold hover:bg-success-500 transition-colors shadow-sm"
                >
                  <CheckCircle2 size={15} />
                  Confirmer la validation
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRejeter}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-danger-600 text-white text-sm font-semibold hover:bg-danger-500 transition-colors shadow-sm"
                >
                  <XCircle size={15} />
                  Confirmer le rejet
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Icône helper (pour lucide) ────────────────────────────────────────────────
function ClipboardListIcon({ size, className }: { size: number; className?: string }) {
  return <MessageSquare size={size} className={className} />;
}
