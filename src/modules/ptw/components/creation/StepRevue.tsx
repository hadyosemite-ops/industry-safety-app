import { Shield, MapPin, Calendar, Building2, Users, ClipboardList, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx } from 'clsx';
import { NiveauRisque, TypePermis } from '../../types';
import type { WizardFormData } from './ATCreationWizard';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dt: string): string {
  if (!dt) return '—';
  try {
    return format(new Date(dt), "dd MMMM yyyy à HH'h'mm", { locale: fr });
  } catch {
    return dt;
  }
}

const LABELS_RISQUE: Record<NiveauRisque, { label: string; class: string }> = {
  [NiveauRisque.MODERE]:   { label: 'Modéré',   class: 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200' },
  [NiveauRisque.ELEVE]:    { label: 'Élevé',    class: 'bg-amber-50 text-[color:var(--badge-amber-text)] border-amber-200' },
  [NiveauRisque.CRITIQUE]: { label: 'Critique', class: 'bg-danger-50 text-[color:var(--badge-danger-text)] border-danger-200' },
};

const ICONES_PERMIS: Record<TypePermis, string> = {
  [TypePermis.TRAVAIL_CHAUD]:    '🔥',
  [TypePermis.ESPACE_CONFINE]:   '🕳️',
  [TypePermis.ELECTRIQUE_LOTO]:  '⚡',
  [TypePermis.TRAVAIL_HAUTEUR]:  '🪜',
  [TypePermis.ATEX_CHIMIQUE]:    '☢️',
  [TypePermis.EXCAVATION]:       '⛏️',
  [TypePermis.TRAVAUX_PRESSION]: '💨',
  [TypePermis.TRAVAUX_GENERAUX]: '🔧',
};

const LABELS_PERMIS: Record<TypePermis, string> = {
  [TypePermis.TRAVAIL_CHAUD]:    'Travail à Chaud',
  [TypePermis.ESPACE_CONFINE]:   'Espace Confiné',
  [TypePermis.ELECTRIQUE_LOTO]:  'Électrique / LOTO',
  [TypePermis.TRAVAIL_HAUTEUR]:  'Travail en Hauteur',
  [TypePermis.ATEX_CHIMIQUE]:    'ATEX / Chimique',
  [TypePermis.EXCAVATION]:       'Excavation',
  [TypePermis.TRAVAUX_PRESSION]: 'Sous Pression',
  [TypePermis.TRAVAUX_GENERAUX]: 'Travaux Généraux',
};

// ─── Composant principal ──────────────────────────────────────────────────────

interface Props {
  data: WizardFormData;
  enCours: boolean;
  onSoumettre: () => void;
}

export function StepRevue({ data, enCours, onSoumettre }: Props) {
  const risque = LABELS_RISQUE[data.evaluation_risques.niveau_risque_global];

  // Score de complétude
  const totalPermisOk = data.permis.filter(p => {
    const tousOui = p.checklist_reponses.filter(r => r.obligatoire).every(r => r.reponse === 'OUI' || r.reponse === 'N_A');
    return tousOui && p.intervenants.length > 0;
  }).length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-navy-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Shield size={22} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Revue & Soumission</h2>
          <p className="text-sm text-white/60 mt-1">
            Vérifiez l'ensemble des informations avant de soumettre l'autorisation de travail.
          </p>
        </div>
      </div>

      {/* Score de complétude */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[color:var(--text-primary)]">Complétude du dossier</span>
          <span className="text-sm font-bold text-[color:var(--badge-navy-text)]">{totalPermisOk}/{data.permis.length} permis complets</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={clsx('p-3 rounded-lg border text-center', 'bg-success-50 border-success-200')}>
            <CheckCircle2 size={18} className="mx-auto text-success-600 mb-1" />
            <p className="text-xs font-semibold text-[color:var(--badge-success-text)]">Informations générales</p>
            <p className="text-xs text-[color:var(--badge-success-text)] mt-0.5">Complet</p>
          </div>
          <div className={clsx(
            'p-3 rounded-lg border text-center',
            data.permis.length > 0 ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'
          )}>
            {data.permis.length > 0
              ? <CheckCircle2 size={18} className="mx-auto text-success-600 mb-1" />
              : <AlertTriangle size={18} className="mx-auto text-danger-500 mb-1" />
            }
            <p className={clsx('text-xs font-semibold', data.permis.length > 0 ? 'text-[color:var(--badge-success-text)]' : 'text-[color:var(--badge-danger-text)]')}>
              Permis ({data.permis.length})
            </p>
            <p className={clsx('text-xs mt-0.5', data.permis.length > 0 ? 'text-[color:var(--badge-success-text)]' : 'text-[color:var(--badge-danger-text)]')}>
              {data.permis.length > 0 ? `${totalPermisOk} complet(s)` : 'Aucun permis'}
            </p>
          </div>
          <div className="p-3 rounded-lg border bg-amber-50 border-amber-200 text-center">
            <Clock size={18} className="mx-auto text-amber-600 mb-1" />
            <p className="text-xs font-semibold text-[color:var(--badge-amber-text)]">Après soumission</p>
            <p className="text-xs text-[color:var(--badge-amber-text)] mt-0.5">Validation Animateur</p>
          </div>
        </div>
      </div>

      {/* ── Section 1 : Récapitulatif AT ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 bg-navy-600 text-white flex items-center gap-2">
          <Building2 size={16} />
          <span className="font-bold text-sm">Autorisation de Travail</span>
          <span className={clsx(
            'ml-auto text-xs font-bold px-2 py-0.5 rounded-full border',
            risque.class
          )}>
            Risque {risque.label}
          </span>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-[color:var(--text-muted)] uppercase tracking-wide font-semibold mb-1">Titre</p>
            <p className="text-base font-bold text-[color:var(--text-primary)]">{data.titre || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-[color:var(--text-muted)] uppercase tracking-wide font-semibold mb-1">Description des travaux</p>
            <p className="text-sm text-[color:var(--text-primary)] leading-relaxed">{data.description_travaux || '—'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
            <div className="flex items-start gap-2">
              <Building2 size={14} className="text-[color:var(--text-muted)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[color:var(--text-muted)] font-semibold">Entreprise</p>
                <p className="text-sm font-medium text-[color:var(--text-primary)]">{data.entreprise_intervenante || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users size={14} className="text-[color:var(--text-muted)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[color:var(--text-muted)] font-semibold">Chef de chantier</p>
                <p className="text-sm font-medium text-[color:var(--text-primary)]">{data.chef_chantier || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-[color:var(--text-muted)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[color:var(--text-muted)] font-semibold">Zone</p>
                <p className="text-sm font-medium text-[color:var(--text-primary)]">{data.zone_id || '—'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users size={14} className="text-[color:var(--text-muted)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[color:var(--text-muted)] font-semibold">Intervenants prévus</p>
                <p className="text-sm font-medium text-[color:var(--text-primary)]">{data.nombre_intervenants_prevu} personne(s)</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2 border-t border-[var(--border)]">
            <Calendar size={14} className="text-[color:var(--text-muted)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[color:var(--text-muted)] font-semibold">Période des travaux</p>
              <p className="text-sm text-[color:var(--text-primary)]">
                Du <strong>{formatDate(data.date_debut_prevue)}</strong>
                {' '}au <strong>{formatDate(data.date_fin_prevue)}</strong>
              </p>
            </div>
          </div>

          {/* Risques globaux */}
          {data.evaluation_risques.dangers_identifies.length > 0 && (
            <div className="pt-2 border-t border-[var(--border)]">
              <p className="text-xs text-[color:var(--text-muted)] uppercase tracking-wide font-semibold mb-2">Dangers identifiés</p>
              <div className="flex flex-wrap gap-1.5">
                {data.evaluation_risques.dangers_identifies.map(d => (
                  <span key={d} className="badge badge-danger">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.evaluation_risques.epi_obligatoires.length > 0 && (
            <div>
              <p className="text-xs text-[color:var(--text-muted)] uppercase tracking-wide font-semibold mb-2">EPI obligatoires</p>
              <div className="flex flex-wrap gap-1.5">
                {data.evaluation_risques.epi_obligatoires.map(e => (
                  <span key={e} className="badge badge-navy">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Section 2 : Récapitulatif Permis ── */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 bg-surface-600 text-white flex items-center gap-2">
          <ClipboardList size={16} />
          <span className="font-bold text-sm">Permis de travail</span>
          <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {data.permis.length} permis
          </span>
        </div>

        {data.permis.length === 0 ? (
          <div className="p-6 text-center text-[color:var(--text-muted)] text-sm">
            <AlertTriangle size={20} className="mx-auto mb-2 text-amber-400" />
            Aucun permis ajouté — retournez à l'étape 2.
          </div>
        ) : (
          <div className="divide-y divide-[color:var(--border)]">
            {data.permis.map((p, idx) => {
              const nbValides = p.checklist_reponses.filter(r => r.reponse === 'OUI' || r.reponse === 'N_A').length;
              const nbOblNok = p.checklist_reponses.filter(r => r.obligatoire && r.reponse === 'NON').length;
              const complet  = nbOblNok === 0 && p.intervenants.length > 0;

              return (
                <div key={p._id} className="p-4 flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{ICONES_PERMIS[p.type_permis]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-[color:var(--text-primary)]">
                        Permis {idx + 1} — {LABELS_PERMIS[p.type_permis]}
                      </span>
                      {complet
                        ? <span className="text-xs text-[color:var(--badge-success-text)] font-semibold flex items-center gap-1"><CheckCircle2 size={11} /> Complet</span>
                        : <span className="text-xs text-[color:var(--badge-danger-text)] font-semibold flex items-center gap-1"><AlertTriangle size={11} /> Incomplet</span>
                      }
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs text-[color:var(--text-secondary)]">
                      {/* Checklist */}
                      <div>
                        <span className="font-semibold text-[color:var(--text-secondary)]">Checklist</span>
                        <p className={clsx(nbOblNok > 0 ? 'text-[color:var(--badge-danger-text)]' : 'text-[color:var(--badge-success-text)]')}>
                          {nbOblNok > 0
                            ? `${nbOblNok} points non conformes`
                            : `${nbValides}/${p.checklist_reponses.length} validés`}
                        </p>
                      </div>
                      {/* EPI */}
                      <div>
                        <span className="font-semibold text-[color:var(--text-secondary)]">EPI spécifiques</span>
                        <p>{p.epi_requis.length > 0 ? p.epi_requis.slice(0, 2).join(', ') + (p.epi_requis.length > 2 ? '…' : '') : 'Aucun ajouté'}</p>
                      </div>
                      {/* Intervenants */}
                      <div>
                        <span className="font-semibold text-[color:var(--text-secondary)]">Intervenants</span>
                        <p className={clsx(p.intervenants.length === 0 ? 'text-[color:var(--badge-danger-text)]' : '')}>
                          {p.intervenants.length === 0
                            ? 'Aucun intervenant ⚠'
                            : p.intervenants.map(i => i.nom_complet.split(' ')[0]).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Workflow après soumission ── */}
      <div className="bg-navy-600/5 border border-navy-600/20 rounded-xl p-5">
        <p className="text-sm font-bold text-[#4de6ff] mb-3">📋 Processus après soumission</p>
        <ol className="space-y-2">
          {[
            'Notification envoyée à l\'Animateur de Sécurité',
            'L\'Animateur valide chaque permis sur le terrain (vérification EPI, isolations)',
            'Une fois tous les permis validés → AT soumise au Responsable de Zone',
            'Le Responsable de Zone donne l\'approbation finale (GO)',
            'Les intervenants peuvent démarrer les travaux',
          ].map((step, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-white/60">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-navy-600 text-white text-xs flex items-center justify-center font-bold mt-0.5">
                {idx + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Bouton de soumission principal */}
      <button
        onClick={onSoumettre}
        disabled={enCours || data.permis.length === 0}
        className={clsx(
          'w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-200',
          data.permis.length > 0
            ? 'bg-navy-600 hover:bg-navy-700 text-white shadow-lg hover:shadow-xl disabled:opacity-60'
            : 'bg-[var(--bg-hover)] text-[color:var(--text-muted)] cursor-not-allowed'
        )}
      >
        {enCours ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Soumission en cours…
          </>
        ) : (
          <>
            <Shield size={20} />
            Soumettre l'Autorisation de Travail
          </>
        )}
      </button>

      {data.permis.length === 0 && (
        <p className="text-center text-sm text-[color:var(--badge-danger-text)]">
          ⚠ Ajoutez au moins un permis à l'étape 2 avant de soumettre.
        </p>
      )}
    </div>
  );
}
