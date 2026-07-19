import { Building2, MapPin, Calendar, Users, AlertTriangle, Shield } from 'lucide-react';
import { FormField } from '@/components/ui/FormField';
import { TagInput } from '@/components/ui/TagInput';
import { NiveauRisque } from '../../types';
import type { WizardFormData } from './ATCreationWizard';
import { clsx } from 'clsx';

// ─── Données de référence (à remplacer par appels Supabase) ──────────────────

const ZONES_DEMO = [
  { id: 'z1', code_zone: 'ATL-A', nom: 'Atelier A — Soudure', niveau_risque_defaut: NiveauRisque.ELEVE },
  { id: 'z2', code_zone: 'ATL-B', nom: 'Atelier B — Usinage', niveau_risque_defaut: NiveauRisque.MODERE },
  { id: 'z3', code_zone: 'EXT-1', nom: 'Zone Extérieure — Parking Camions', niveau_risque_defaut: NiveauRisque.MODERE },
  { id: 'z4', code_zone: 'PROD-1', nom: 'Salle Production Principale', niveau_risque_defaut: NiveauRisque.CRITIQUE },
  { id: 'z5', code_zone: 'CHAUD', nom: 'Chaufferie / Local Technique', niveau_risque_defaut: NiveauRisque.CRITIQUE },
  { id: 'z6', code_zone: 'TOITURE', nom: 'Toiture — Accès Technique', niveau_risque_defaut: NiveauRisque.ELEVE },
];

const ANIMATEURS_DEMO = [
  { id: 'a1', nom: 'Martin', prenom: 'Sophie' },
  { id: 'a2', nom: 'Dubois', prenom: 'Karim' },
  { id: 'a3', nom: 'Bernard', prenom: 'Leila' },
];

const SUGGESTIONS_DANGERS = [
  'Risque de brûlure', 'Risque électrique', 'Risque de chute de hauteur',
  'Atmosphère explosive (ATEX)', 'Asphyxie / anoxie', 'Projection de particules',
  'Écrasement / coincement', 'Bruit excessif', 'Vibrations', 'Produits chimiques CMR',
  'Risque d\'incendie', 'Effondrement / instabilité', 'Chaleur extrême',
];

const SUGGESTIONS_EPI = [
  'Casque de sécurité', 'Lunettes de protection', 'Écran facial',
  'Gants anti-coupure', 'Gants de soudeur', 'Gants diélectriques',
  'Chaussures de sécurité S3', 'Combinaison ignifugée', 'Harnais antichute',
  'Masque FFP2', 'Masque FFP3', 'Appareil de protection respiratoire',
  'Bouchons d\'oreilles', 'Gilet haute visibilité', 'Tablier de soudeur',
  'Détecteur de gaz personnel',
];

const SUGGESTIONS_MESURES = [
  'Balisage périmètre de sécurité', 'Consignation LOTO', 'Ventilation forcée',
  'Surveillance permanente', 'Analyse atmosphérique', 'Permis feu actif',
  'Évacuation zone adjacente', 'Communication radio établie', 'Plan de secours affiché',
  'Trousse de premiers secours disponible', 'Extincteur positionné',
];

// ─── Composant niveau de risque ───────────────────────────────────────────────

function RisquePicker({ value, onChange }: { value: NiveauRisque; onChange: (v: NiveauRisque) => void }) {
  const options: { value: NiveauRisque; label: string; color: string; bg: string; desc: string }[] = [
    { value: NiveauRisque.MODERE,   label: 'Modéré',   color: 'text-[color:var(--badge-success-text)]',  bg: 'bg-success-50 border-success-200',   desc: 'Travaux courants avec mesures standard' },
    { value: NiveauRisque.ELEVE,    label: 'Élevé',    color: 'text-[color:var(--badge-amber-text)]',  bg: 'bg-amber-50 border-amber-200',   desc: 'Risques significatifs, vigilance accrue' },
    { value: NiveauRisque.CRITIQUE, label: 'Critique', color: 'text-[color:var(--badge-danger-text)]',    bg: 'bg-danger-50 border-danger-200',       desc: 'Dangers graves, permis spéciaux requis' },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {options.map(opt => (
        <button key={opt.value} type="button"
          onClick={() => onChange(opt.value)}
          className={clsx(
            'flex flex-col items-center p-3 border-2 rounded-xl transition-all duration-150 text-center',
            value === opt.value
              ? `${opt.bg} ${opt.color} border-current shadow-sm`
              : 'bg-[var(--bg-hover)] border-[var(--border)] text-[color:var(--text-secondary)] hover:border-[var(--border)]'
          )}>
          <span className="text-sm font-bold">{opt.label}</span>
          <span className="text-xs mt-1 leading-tight opacity-80">{opt.desc}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface Props {
  data: WizardFormData;
  erreurs: Record<string, string>;
  onChange: (patch: Partial<WizardFormData>) => void;
}

export function StepInformationsGenerales({ data, erreurs, onChange }: Props) {
  const zoneSelectionnee = ZONES_DEMO.find(z => z.id === data.zone_id);

  function patchRisques(patch: Partial<typeof data.evaluation_risques>) {
    onChange({ evaluation_risques: { ...data.evaluation_risques, ...patch } });
  }

  return (
    <div className="space-y-8">
      {/* En-tête section — sur le fond sombre fixe du wizard, jamais thémé */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Building2 size={20} className="text-[#4de6ff]" />
          Informations générales
        </h2>
        <p className="text-sm text-white/60 mt-1">
          Décrivez les travaux et définissez le cadre général de l'autorisation.
        </p>
      </div>

      {/* ── Section 1 : Description des travaux ── */}
      <div className="card p-6 space-y-5">
        <p className="section-title">Description des travaux</p>

        <FormField label="Titre de l'AT" required error={erreurs.titre}>
          <input
            type="text"
            className={clsx('form-input', erreurs.titre && 'form-input-error')}
            placeholder="Ex : Maintenance préventive échangeurs A3 — Ligne Prod 2"
            value={data.titre}
            onChange={e => onChange({ titre: e.target.value })}
            maxLength={120}
          />
        </FormField>

        <FormField label="Description détaillée des travaux" required error={erreurs.description_travaux}
          hint="Décrivez précisément ce qui va être fait, les équipements concernés et les méthodes employées.">
          <textarea
            className={clsx('form-textarea h-24', erreurs.description_travaux && 'form-input-error')}
            placeholder="Description complète des opérations prévues, équipements concernés, méthodes de travail…"
            value={data.description_travaux}
            onChange={e => onChange({ description_travaux: e.target.value })}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Entreprise intervenante" required error={erreurs.entreprise_intervenante}>
            <input
              type="text"
              className={clsx('form-input', erreurs.entreprise_intervenante && 'form-input-error')}
              placeholder="Nom de l'entreprise ou service interne"
              value={data.entreprise_intervenante}
              onChange={e => onChange({ entreprise_intervenante: e.target.value })}
            />
          </FormField>

          <FormField label="Chef de chantier" required error={erreurs.chef_chantier}>
            <input
              type="text"
              className={clsx('form-input', erreurs.chef_chantier && 'form-input-error')}
              placeholder="Nom et prénom"
              value={data.chef_chantier}
              onChange={e => onChange({ chef_chantier: e.target.value })}
            />
          </FormField>
        </div>

        <FormField label="Nombre d'intervenants prévus" required>
          <div className="flex items-center gap-3">
            <input
              type="number" min={1} max={50}
              className="form-input w-28"
              value={data.nombre_intervenants_prevu}
              onChange={e => onChange({ nombre_intervenants_prevu: Math.max(1, parseInt(e.target.value) || 1) })}
            />
            <div className="flex items-center gap-1.5 text-sm text-[color:var(--text-secondary)]">
              <Users size={14} />
              intervenants sur le terrain
            </div>
          </div>
        </FormField>
      </div>

      {/* ── Section 2 : Zone & Planning ── */}
      <div className="card p-6 space-y-5">
        <p className="section-title flex items-center gap-1.5">
          <MapPin size={13} /> Zone & Planning
        </p>

        <FormField label="Zone de travail" required error={erreurs.zone_id}>
          <select
            className={clsx('form-select', erreurs.zone_id && 'form-input-error')}
            value={data.zone_id}
            onChange={e => {
              const z = ZONES_DEMO.find(z => z.id === e.target.value);
              onChange({
                zone_id: e.target.value,
                evaluation_risques: {
                  ...data.evaluation_risques,
                  niveau_risque_global: z?.niveau_risque_defaut ?? NiveauRisque.MODERE,
                },
              });
            }}
          >
            <option value="">— Sélectionner une zone —</option>
            {ZONES_DEMO.map(z => (
              <option key={z.id} value={z.id}>
                [{z.code_zone}] {z.nom}
              </option>
            ))}
          </select>
          {zoneSelectionnee && (
            <div className={clsx(
              'mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
              zoneSelectionnee.niveau_risque_defaut === NiveauRisque.CRITIQUE && 'bg-danger-50 text-[color:var(--badge-danger-text)]',
              zoneSelectionnee.niveau_risque_defaut === NiveauRisque.ELEVE    && 'bg-amber-50 text-[color:var(--badge-amber-text)]',
              zoneSelectionnee.niveau_risque_defaut === NiveauRisque.MODERE   && 'bg-success-50 text-[color:var(--badge-success-text)]',
            )}>
              <AlertTriangle size={11} />
              Risque par défaut de cette zone : {zoneSelectionnee.niveau_risque_defaut}
            </div>
          )}
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Date et heure de début" required error={erreurs.date_debut_prevue}>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none" />
              <input
                type="datetime-local"
                className={clsx('form-input pl-9', erreurs.date_debut_prevue && 'form-input-error')}
                value={data.date_debut_prevue}
                min={new Date().toISOString().slice(0, 16)}
                onChange={e => onChange({ date_debut_prevue: e.target.value })}
              />
            </div>
          </FormField>

          <FormField label="Date et heure de fin prévue" required error={erreurs.date_fin_prevue}>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none" />
              <input
                type="datetime-local"
                className={clsx('form-input pl-9', erreurs.date_fin_prevue && 'form-input-error')}
                value={data.date_fin_prevue}
                min={data.date_debut_prevue || new Date().toISOString().slice(0, 16)}
                onChange={e => onChange({ date_fin_prevue: e.target.value })}
              />
            </div>
          </FormField>
        </div>

        <FormField label="Animateur de Sécurité assigné"
          hint="L'animateur sera notifié pour valider les permis terrain.">
          <select
            className="form-select"
            value={data.animateur_id}
            onChange={e => onChange({ animateur_id: e.target.value })}
          >
            <option value="">— À assigner ultérieurement —</option>
            {ANIMATEURS_DEMO.map(a => (
              <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>
            ))}
          </select>
        </FormField>
      </div>

      {/* ── Section 3 : Évaluation des risques globale ── */}
      <div className="card p-6 space-y-5">
        <p className="section-title flex items-center gap-1.5">
          <Shield size={13} /> Évaluation des risques globale
        </p>

        <FormField label="Niveau de risque global de l'opération" required>
          <RisquePicker
            value={data.evaluation_risques.niveau_risque_global}
            onChange={v => patchRisques({ niveau_risque_global: v })}
          />
        </FormField>

        <FormField label="Risques identifiés" required error={erreurs.dangers}
          hint="Appuyez sur Entrée ou virgule pour ajouter. Sélectionnez dans les suggestions.">
          <TagInput
            value={data.evaluation_risques.dangers_identifies}
            onChange={v => patchRisques({ dangers_identifies: v })}
            placeholder="Ex : Risque électrique, chute de hauteur…"
            suggestions={SUGGESTIONS_DANGERS}
          />
        </FormField>

        <FormField label="Mesures de prévention globales"
          hint="Mesures qui s'appliquent à l'ensemble de l'opération (en plus des mesures par permis).">
          <TagInput
            value={data.evaluation_risques.mesures_prevention_globales}
            onChange={v => patchRisques({ mesures_prevention_globales: v })}
            placeholder="Ex : Balisage, consignation, surveillance…"
            suggestions={SUGGESTIONS_MESURES}
          />
        </FormField>

        <FormField label="EPI obligatoires pour l'ensemble de l'AT" required error={erreurs.epi}
          hint="EPI minimum requis pour accéder à la zone de travail.">
          <TagInput
            value={data.evaluation_risques.epi_obligatoires}
            onChange={v => patchRisques({ epi_obligatoires: v })}
            placeholder="Ex : Casque, chaussures S3, gilet HV…"
            suggestions={SUGGESTIONS_EPI}
          />
        </FormField>

        <FormField label="Plan d'urgence / Consignes en cas d'accident"
          hint="Décrivez les premières actions à effectuer en cas d'incident.">
          <textarea
            className="form-textarea h-20"
            placeholder="Ex : Appeler le 15 / Poste de secours en salle 42 / Point de rassemblement Parking Nord…"
            value={data.evaluation_risques.plan_urgence ?? ''}
            onChange={e => patchRisques({ plan_urgence: e.target.value })}
          />
        </FormField>
      </div>
    </div>
  );
}
