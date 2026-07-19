import { useState } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { clsx } from 'clsx';
import { TagInput } from '@/components/ui/TagInput';
import { FormField } from '@/components/ui/FormField';
import type { PermisFormData } from './ATCreationWizard';

const SUGGESTIONS_EPI = [
  'Casque de sécurité', 'Lunettes de protection', 'Écran facial',
  'Gants anti-coupure', 'Gants de soudeur', 'Gants diélectriques',
  'Chaussures S3', 'Combinaison ignifugée', 'Harnais antichute',
  'Masque FFP2', 'Masque FFP3', 'Appareil respiratoire',
  'Bouchons d\'oreilles', 'Gilet haute visibilité',
];

const SUGGESTIONS_MESURES = [
  'Balisage périmètre', 'Consignation LOTO', 'Ventilation forcée',
  'Surveillance permanente', 'Analyse atmosphérique', 'Extincteur à portée',
  'Communication radio', 'Plan de secours affiché',
];

const HABILITATIONS_SUGGESTIONS = [
  'H0', 'H0V', 'B1', 'B1V', 'B2', 'BR', 'BC', 'BP',
  'CACES R482', 'CACES R484', 'CACES R486',
  'Travail en hauteur', 'Espace confiné', 'Amiante SS4',
  'ATEX', 'ADR', 'Sauveteur Secouriste du Travail (SST)',
];

// ─── Onglets ──────────────────────────────────────────────────────────────────

type Onglet = 'checklist' | 'mesures' | 'intervenants';

interface Props {
  permis: PermisFormData;
  erreurs: Record<string, string>;
  index: number;
  onChange: (patch: Partial<PermisFormData>) => void;
}

export function PermisFormCard({ permis, erreurs, index, onChange }: Props) {
  const [onglet, setOnglet] = useState<Onglet>('checklist');
  const [nouvelInterv, setNouvelInterv] = useState({ nom_complet: '', entreprise: '', habilitations: [] as string[] });
  const [showAjoutInterv, setShowAjoutInterv] = useState(false);

  const errPermis = erreurs[`permis_${index}`];
  const errInterv = erreurs[`interv_${index}`];

  // ── Checklist ─────────────────────────────────────────────────────────────
  function setReponse(questionId: string, reponse: 'OUI' | 'NON' | 'N_A') {
    onChange({
      checklist_reponses: permis.checklist_reponses.map(r =>
        r.question_id === questionId ? { ...r, reponse } : r
      ),
    });
  }

  // ── Intervenants ─────────────────────────────────────────────────────────
  function ajouterIntervenant() {
    if (!nouvelInterv.nom_complet.trim()) return;
    onChange({
      intervenants: [...permis.intervenants, { ...nouvelInterv }],
    });
    setNouvelInterv({ nom_complet: '', entreprise: '', habilitations: [] });
    setShowAjoutInterv(false);
  }

  function supprimerIntervenant(idx: number) {
    onChange({ intervenants: permis.intervenants.filter((_, index) => index !== idx) });
  }

  // Compteurs pour les onglets
  const nbOui  = permis.checklist_reponses.filter(r => r.reponse === 'OUI').length;
  const nbNon  = permis.checklist_reponses.filter(r => r.reponse === 'NON' && r.obligatoire).length;
  const nbInterv = permis.intervenants.length;

  return (
    <div className="p-4">
      {/* Onglets */}
      <div className="tabs-container mb-5">
        {([
          { id: 'checklist' as Onglet,   label: `Checklist`, badge: nbNon > 0 ? `${nbNon} ⚠` : `${nbOui}/${permis.checklist_reponses.length}`, badgeColor: nbNon > 0 ? 'bg-red-500' : 'bg-safety-500' },
          { id: 'mesures' as Onglet,     label: 'EPI & Mesures', badge: (permis.epi_requis.length + permis.mesures_prevention.length).toString(), badgeColor: 'bg-surface-600' },
          { id: 'intervenants' as Onglet, label: 'Intervenants', badge: nbInterv.toString(), badgeColor: nbInterv === 0 ? 'bg-red-500' : 'bg-navy-600' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setOnglet(tab.id)}
            className={clsx(
              'flex-1 justify-center',
              onglet === tab.id ? 'tab-pill-active' : 'tab-pill-inactive'
            )}
          >
            {tab.label}
            <span className={clsx('text-xs px-1.5 py-0.5 rounded-full text-white font-bold', tab.badgeColor)}>
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* ── Contenu Checklist ── */}
      {onglet === 'checklist' && (
        <div className="space-y-2">
          {errPermis && (
            <p className="text-xs text-red-600 mb-3 flex items-center gap-1">
              ⚠ {errPermis}
            </p>
          )}
          {permis.checklist_reponses.map(item => (
            <div
              key={item.question_id}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-lg border transition-all',
                item.reponse === 'OUI' && 'bg-success-50 border-success-200',
                item.reponse === 'N_A' && 'bg-[var(--bg-hover)] border-[var(--border)] opacity-60',
                item.reponse === 'NON' && item.obligatoire && 'bg-danger-50 border-danger-200',
                item.reponse === 'NON' && !item.obligatoire && 'bg-[var(--bg-hover)] border-[var(--border)]',
              )}
            >
              {/* Libellé */}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-[color:var(--text-primary)] leading-tight">
                  {item.question_libelle}
                </span>
                {item.obligatoire && (
                  <span className="ml-2 text-xs text-red-500 font-semibold">*</span>
                )}
              </div>

              {/* Boutons réponse */}
              <div className="flex gap-1 flex-shrink-0">
                {(['OUI', 'NON', 'N_A'] as const).map(rep => (
                  <button
                    key={rep}
                    type="button"
                    onClick={() => setReponse(item.question_id, rep)}
                    className={clsx(
                      'px-2.5 py-1 text-xs font-bold rounded-md border transition-all',
                      item.reponse === rep && rep === 'OUI' && 'bg-success-500 border-success-500 text-white',
                      item.reponse === rep && rep === 'NON' && 'bg-danger-500 border-danger-500 text-white',
                      item.reponse === rep && rep === 'N_A' && 'bg-surface-600 border-surface-600 text-white',
                      item.reponse !== rep && 'bg-[var(--bg-hover)] border-[var(--border)] text-[color:var(--text-muted)] hover:border-[var(--border)]',
                    )}
                  >
                    {rep === 'N_A' ? 'N/A' : rep}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <p className="text-xs text-[color:var(--text-muted)] mt-2">
            * Items obligatoires — doivent être validés à OUI ou N/A par l'Animateur de Sécurité.
          </p>
        </div>
      )}

      {/* ── Contenu EPI & Mesures ── */}
      {onglet === 'mesures' && (
        <div className="space-y-5">
          <FormField label="EPI spécifiques à ce permis"
            hint="En plus des EPI globaux de l'AT.">
            <TagInput
              value={permis.epi_requis}
              onChange={v => onChange({ epi_requis: v })}
              placeholder="Ajouter un EPI…"
              suggestions={SUGGESTIONS_EPI}
            />
          </FormField>

          <FormField label="Mesures de prévention spécifiques">
            <TagInput
              value={permis.mesures_prevention}
              onChange={v => onChange({ mesures_prevention: v })}
              placeholder="Ajouter une mesure…"
              suggestions={SUGGESTIONS_MESURES}
            />
          </FormField>

          <FormField label="Équipements concernés" hint="Équipements, machines ou installations sur lesquels portent les travaux.">
            <TagInput
              value={permis.equipements_concernes}
              onChange={v => onChange({ equipements_concernes: v })}
              placeholder="Ex : Échangeur E-201, Pompe P-03…"
            />
          </FormField>
        </div>
      )}

      {/* ── Contenu Intervenants ── */}
      {onglet === 'intervenants' && (
        <div className="space-y-4">
          {errInterv && (
            <p className="text-xs text-red-600 flex items-center gap-1">⚠ {errInterv}</p>
          )}

          {/* Liste des intervenants */}
          {permis.intervenants.length > 0 && (
            <div className="space-y-2">
              {permis.intervenants.map((interv, idx) => (
                <div key={idx}
                  className="flex items-center gap-3 p-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-navy-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {interv.nom_complet.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[color:var(--text-primary)]">{interv.nom_complet}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {interv.entreprise && (
                        <span className="text-xs text-[color:var(--text-secondary)]">{interv.entreprise}</span>
                      )}
                      {interv.habilitations && interv.habilitations.length > 0 && (
                        <div className="flex gap-1">
                          {interv.habilitations.slice(0, 3).map(h => (
                            <span key={h} className="text-xs bg-navy-100 text-[color:var(--badge-navy-text)] px-1.5 py-0.5 rounded font-medium">
                              {h}
                            </span>
                          ))}
                          {interv.habilitations.length > 3 && (
                            <span className="text-xs text-[color:var(--text-muted)]">+{interv.habilitations.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => supprimerIntervenant(idx)}
                    className="p-1.5 text-[color:var(--text-muted)] hover:text-red-500 hover:bg-danger-500/10 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire ajout intervenant */}
          {showAjoutInterv ? (
            <div className="p-4 bg-navy-50 border border-navy-200 rounded-xl space-y-3 animate-fade-in-up">
              <p className="text-sm font-semibold text-[color:var(--badge-navy-text)] flex items-center gap-2">
                <UserPlus size={14} /> Nouvel intervenant
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Nom et prénom" required>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex : Jean Dupont"
                    value={nouvelInterv.nom_complet}
                    onChange={e => setNouvelInterv(p => ({ ...p, nom_complet: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && ajouterIntervenant()}
                  />
                </FormField>
                <FormField label="Entreprise">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Sous-traitant ou service"
                    value={nouvelInterv.entreprise}
                    onChange={e => setNouvelInterv(p => ({ ...p, entreprise: e.target.value }))}
                  />
                </FormField>
              </div>
              <FormField label="Habilitations" hint="Appuyez sur Entrée pour ajouter.">
                <TagInput
                  value={nouvelInterv.habilitations}
                  onChange={v => setNouvelInterv(p => ({ ...p, habilitations: v }))}
                  placeholder="Ex : B1, CACES R482…"
                  suggestions={HABILITATIONS_SUGGESTIONS}
                />
              </FormField>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAjoutInterv(false)} className="btn-secondary text-xs py-1.5">
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={ajouterIntervenant}
                  disabled={!nouvelInterv.nom_complet.trim()}
                  className="btn-primary text-xs py-1.5"
                >
                  <Plus size={13} /> Ajouter
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAjoutInterv(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[var(--border)]
                         rounded-xl text-sm text-[color:var(--text-secondary)] hover:border-navy-400 hover:text-[color:var(--badge-navy-text)]
                         transition-all duration-150"
            >
              <UserPlus size={16} />
              Ajouter un intervenant
            </button>
          )}
        </div>
      )}
    </div>
  );
}
