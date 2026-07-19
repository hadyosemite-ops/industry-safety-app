import { useState, type ReactNode } from 'react';
import {
  AlertTriangle, ChevronRight, ChevronLeft, X, Check,
  MapPin, Clock, User, Plus, Trash2, FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { DossierAccident, TypeEvenement, Victime, Temoin } from '../types';
import { LABELS_TYPE, ICONES_TYPE, COULEURS_TYPE } from '../types';
import { format } from 'date-fns';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastProvider';

// ── Helpers ───────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Étape 1 — Type + gravité ──────────────────────────────────────────────────

interface Step1Data {
  type_evenement: TypeEvenement | '';
}

function Step1TypeGravite({
  data, onChange,
}: {
  data: Step1Data;
  onChange: (d: Step1Data) => void;
}) {
  const types: TypeEvenement[] = [
    'FATAL', 'GRAVE', 'BENIN', 'PRESQU_ACCIDENT', 'SITUATION_DANGEREUSE', 'OBSERVATION',
  ];

  const descriptions: Record<TypeEvenement, string> = {
    FATAL:               'Décès consécutif à un accident du travail. Déclaration IT sous 24h.',
    GRAVE:               'Accident avec arrêt de travail ≥ 1 jour. Déclaration CPAM sous 48h.',
    BENIN:               'Accident avec soins, sans arrêt de travail.',
    PRESQU_ACCIDENT:     "Événement sans blessure mais qui aurait pu en causer.",
    SITUATION_DANGEREUSE:'Conditions terrain dégradées présentant un risque immédiat.',
    OBSERVATION:         "Remontée terrain sans danger immédiat identifié.",
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-[color:var(--text-secondary)] mb-4">
        Sélectionnez le type d'événement à déclarer. Cette classification détermine les délais légaux et le niveau d'investigation requis.
      </p>
      {types.map(type => {
        const c = COULEURS_TYPE[type];
        const selected = data.type_evenement === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange({ type_evenement: type })}
            className={clsx(
              'w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-150',
              selected ? `${c.bg} ${c.border}` : 'bg-[var(--bg-hover)] border-[var(--border)] hover:border-[var(--border)]',
            )}
          >
            <div className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5',
              selected ? c.badge_bg : 'bg-[var(--bg-hover)]',
            )}>
              {ICONES_TYPE[type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={clsx('font-semibold text-sm', selected ? c.text : 'text-[color:var(--text-primary)]')}>
                  {LABELS_TYPE[type]}
                </span>
                {(type === 'FATAL' || type === 'GRAVE') && (
                  <span className={clsx(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    type === 'FATAL' ? 'bg-danger-100 text-[color:var(--badge-danger-text)]' : 'bg-safety-100 text-[color:var(--badge-safety-text)]',
                  )}>
                    {type === 'FATAL' ? 'Déclaration IT 24h' : 'Déclaration CPAM 48h'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[color:var(--text-muted)] mt-0.5">{descriptions[type]}</p>
            </div>
            <div className={clsx(
              'w-5 h-5 rounded-full border-2 flex-shrink-0 mt-2.5 flex items-center justify-center',
              selected ? `${c.border} ${c.badge_bg}` : 'border-[var(--border)]',
            )}>
              {selected && <Check size={12} className={c.text} />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Étape 2 — Description + lieu + date ──────────────────────────────────────

interface Step2Data {
  titre: string;
  date_evenement: string;
  lieu: string;
  zone_code: string;
  description: string;
  victimes: Omit<Victime, 'id'>[];
}

const ZONES = [
  'Zone A - Production',
  'Zone B - Packaging',
  'Zone C - Énergie',
  'Zone D - Chimie',
  'Zone E - Logistique',
  'Zone F - Administration',
];

function Step2Description({
  data, onChange,
}: {
  data: Step2Data;
  onChange: (d: Step2Data) => void;
}) {
  function addVictime() {
    onChange({
      ...data,
      victimes: [...data.victimes, {
        nom: '', prenom: '', poste: '', entreprise: 'Interne',
        anciennete_mois: 0, nature_blessure: '', siege_lesion: '', jours_arret: 0,
      }],
    });
  }

  const [victimeAConfirmer, setVictimeAConfirmer] = useState<number | null>(null);

  function removeVictime(i: number) {
    onChange({ ...data, victimes: data.victimes.filter((_, idx) => idx !== i) });
    setVictimeAConfirmer(null);
  }

  function updateVictime(i: number, patch: Partial<Omit<Victime, 'id'>>) {
    onChange({
      ...data,
      victimes: data.victimes.map((v, idx) => idx === i ? { ...v, ...patch } : v),
    });
  }

  return (
    <div className="space-y-5">
      {/* Titre */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1.5">Titre de l'événement *</label>
        <input
          type="text"
          value={data.titre}
          onChange={e => onChange({ ...data, titre: e.target.value })}
          placeholder="Ex. Chute de hauteur — Passerelle maintenance chaudière C-02"
          className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
        />
      </div>

      {/* Date + lieu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1.5">
            <Clock size={13} className="inline mr-1" />Date et heure *
          </label>
          <input
            type="datetime-local"
            value={data.date_evenement}
            onChange={e => onChange({ ...data, date_evenement: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1.5">
            <MapPin size={13} className="inline mr-1" />Zone *
          </label>
          <select
            value={data.zone_code}
            onChange={e => onChange({ ...data, zone_code: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
          >
            <option value="">Sélectionner…</option>
            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>

      {/* Lieu précis */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1.5">Lieu précis</label>
        <input
          type="text"
          value={data.lieu}
          onChange={e => onChange({ ...data, lieu: e.target.value })}
          placeholder="Ex. Atelier Énergie — Niveau +4m, Passerelle principale"
          className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1.5">Description des faits *</label>
        <textarea
          value={data.description}
          onChange={e => onChange({ ...data, description: e.target.value })}
          rows={4}
          placeholder="Décrivez chronologiquement les faits : contexte, déroulement, conséquences immédiates…"
          className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)] resize-none"
        />
      </div>

      {/* Victimes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-[color:var(--text-secondary)]">
            <User size={13} className="inline mr-1" />Personne(s) blessée(s)
          </label>
          <button type="button" onClick={addVictime}
            className="flex items-center gap-1 text-xs text-[color:var(--badge-navy-text)] font-medium hover:underline">
            <Plus size={13} />Ajouter
          </button>
        </div>

        {data.victimes.length === 0 && (
          <p className="text-xs text-[color:var(--text-muted)] italic">Aucune victime — laisser vide pour presqu'accidents/observations.</p>
        )}

        {data.victimes.map((v, i) => (
          <div key={i} className="bg-[var(--bg-hover)] rounded-xl p-4 mb-3 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[color:var(--text-secondary)]">Victime {i + 1}</span>
              <button type="button" onClick={() => setVictimeAConfirmer(i)} aria-label={`Supprimer la victime ${i + 1}`}>
                <Trash2 size={14} className="text-red-400 hover:text-red-300" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input type="text" placeholder="Prénom" value={v.prenom}
                onChange={e => updateVictime(i, { prenom: e.target.value })}
                className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(0,212,255,0.35)]" />
              <input type="text" placeholder="Nom" value={v.nom}
                onChange={e => updateVictime(i, { nom: e.target.value })}
                className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(0,212,255,0.35)]" />
              <input type="text" placeholder="Poste occupé" value={v.poste}
                onChange={e => updateVictime(i, { poste: e.target.value })}
                className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(0,212,255,0.35)] col-span-2" />
              <input type="text" placeholder="Nature blessure" value={v.nature_blessure}
                onChange={e => updateVictime(i, { nature_blessure: e.target.value })}
                className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(0,212,255,0.35)]" />
              <div className="flex items-center gap-2">
                <input type="number" min={0} placeholder="Jours arrêt" value={v.jours_arret || ''}
                  onChange={e => updateVictime(i, { jours_arret: parseInt(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(0,212,255,0.35)]" />
                <span className="text-xs text-[color:var(--text-muted)] whitespace-nowrap">j. arrêt</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {victimeAConfirmer !== null && (
        <ConfirmDialog
          title="Supprimer cette victime ?"
          message="Les informations saisies pour cette personne seront perdues."
          confirmLabel="Supprimer"
          onConfirm={() => removeVictime(victimeAConfirmer)}
          onCancel={() => setVictimeAConfirmer(null)}
        />
      )}
    </div>
  );
}

// ── Étape 3 — Témoins + déclarant ────────────────────────────────────────────

interface Step3Data {
  declarant_nom: string;
  declarant_poste: string;
  temoins: Omit<Temoin, 'id'>[];
  at_liee_numero: string;
}

function Step3TemoinsDeclarant({
  data, onChange,
}: {
  data: Step3Data;
  onChange: (d: Step3Data) => void;
}) {
  function addTemoin() {
    onChange({ ...data, temoins: [...data.temoins, { nom: '', prenom: '', poste: '', declaration: '' }] });
  }

  const [temoinAConfirmer, setTemoinAConfirmer] = useState<number | null>(null);

  function removeTemoin(i: number) {
    onChange({ ...data, temoins: data.temoins.filter((_, idx) => idx !== i) });
    setTemoinAConfirmer(null);
  }

  function updateTemoin(i: number, patch: Partial<Omit<Temoin, 'id'>>) {
    onChange({ ...data, temoins: data.temoins.map((t, idx) => idx === i ? { ...t, ...patch } : t) });
  }

  return (
    <div className="space-y-5">
      {/* Déclarant */}
      <div className="bg-navy-50 border border-navy-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-[color:var(--badge-navy-text)] mb-3">Déclarant (personne qui fait le signalement)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" placeholder="Nom prénom *" value={data.declarant_nom}
            onChange={e => onChange({ ...data, declarant_nom: e.target.value })}
            className="px-3 py-2 bg-[var(--bg-input)] border border-navy-200 text-[var(--text-primary)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(0,212,255,0.35)] col-span-2" />
          <input type="text" placeholder="Poste occupé *" value={data.declarant_poste}
            onChange={e => onChange({ ...data, declarant_poste: e.target.value })}
            className="px-3 py-2 bg-[var(--bg-input)] border border-navy-200 text-[var(--text-primary)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(0,212,255,0.35)] col-span-2" />
        </div>
      </div>

      {/* Lien AT PTW */}
      <div>
        <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1.5">AT PTW liée (si l'événement est survenu pendant une AT)</label>
        <input type="text" placeholder="Ex. AT-2026-IND-0038" value={data.at_liee_numero}
          onChange={e => onChange({ ...data, at_liee_numero: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]" />
        <p className="text-xs text-[color:var(--text-muted)] mt-1">Si renseignée, une suspension automatique sera proposée sur cette AT.</p>
      </div>

      {/* Témoins */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-[color:var(--text-secondary)]">Témoins</label>
          <button type="button" onClick={addTemoin}
            className="flex items-center gap-1 text-xs text-[color:var(--badge-navy-text)] font-medium hover:underline">
            <Plus size={13} />Ajouter
          </button>
        </div>

        {data.temoins.length === 0 && (
          <p className="text-xs text-[color:var(--text-muted)] italic">Aucun témoin renseigné.</p>
        )}

        {data.temoins.map((t, i) => (
          <div key={i} className="bg-[var(--bg-hover)] rounded-xl p-4 mb-3 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[color:var(--text-secondary)]">Témoin {i + 1}</span>
              <button type="button" onClick={() => setTemoinAConfirmer(i)} aria-label={`Supprimer le témoin ${i + 1}`}>
                <Trash2 size={14} className="text-red-400 hover:text-red-300" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input type="text" placeholder="Prénom Nom" value={`${t.prenom} ${t.nom}`.trim()}
                onChange={e => { const parts = e.target.value.split(' '); updateTemoin(i, { prenom: parts[0] || '', nom: parts.slice(1).join(' ') }); }}
                className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(0,212,255,0.35)]" />
              <input type="text" placeholder="Poste" value={t.poste}
                onChange={e => updateTemoin(i, { poste: e.target.value })}
                className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(0,212,255,0.35)]" />
              <textarea placeholder="Déclaration du témoin…" value={t.declaration || ''}
                onChange={e => updateTemoin(i, { declaration: e.target.value })}
                rows={2}
                className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(0,212,255,0.35)] col-span-2 resize-none" />
            </div>
          </div>
        ))}
      </div>

      {temoinAConfirmer !== null && (
        <ConfirmDialog
          title="Supprimer ce témoin ?"
          message="Les informations saisies pour ce témoin seront perdues."
          confirmLabel="Supprimer"
          onConfirm={() => removeTemoin(temoinAConfirmer)}
          onCancel={() => setTemoinAConfirmer(null)}
        />
      )}
    </div>
  );
}

// ── Étape 4 — Récapitulatif ───────────────────────────────────────────────────

function Step4Recap({
  step1, step2, step3,
}: {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
}) {
  if (!step1.type_evenement) return null;
  const c = COULEURS_TYPE[step1.type_evenement];

  return (
    <div className="space-y-4">
      <div className={clsx('rounded-xl p-4 border', c.bg, c.border)}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{ICONES_TYPE[step1.type_evenement]}</span>
          <div>
            <p className={clsx('font-bold text-sm', c.text)}>{LABELS_TYPE[step1.type_evenement]}</p>
            <p className="text-xs text-[color:var(--text-secondary)]">{step2.titre || '(sans titre)'}</p>
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl divide-y divide-[color:var(--border)]">
        <RecapRow icon={<Clock size={13} />} label="Date" value={step2.date_evenement ? format(new Date(step2.date_evenement), 'dd/MM/yyyy HH:mm') : '—'} />
        <RecapRow icon={<MapPin size={13} />} label="Zone" value={step2.zone_code || '—'} />
        <RecapRow icon={<MapPin size={13} />} label="Lieu précis" value={step2.lieu || '—'} />
        <RecapRow icon={<User size={13} />} label="Déclarant" value={`${step3.declarant_nom} — ${step3.declarant_poste}`} />
        <RecapRow icon={<FileText size={13} />} label="Victimes" value={step2.victimes.length > 0 ? step2.victimes.map(v => `${v.prenom} ${v.nom}`).join(', ') : 'Aucune'} />
        <RecapRow icon={<FileText size={13} />} label="Témoins" value={step3.temoins.length > 0 ? `${step3.temoins.length} témoin(s)` : 'Aucun'} />
        {step3.at_liee_numero && (
          <RecapRow icon={<FileText size={13} />} label="AT liée" value={step3.at_liee_numero} />
        )}
      </div>

      {step2.description && (
        <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
          <p className="text-xs font-semibold text-[color:var(--text-secondary)] mb-1">Description des faits</p>
          <p className="text-sm text-[color:var(--text-primary)] leading-relaxed">{step2.description}</p>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <AlertTriangle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          En validant, ce dossier sera créé avec le statut <strong>Signalé</strong>.
          L'Animateur HSE sera notifié pour ouvrir l'investigation.
        </p>
      </div>
    </div>
  );
}

function RecapRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-[color:var(--text-muted)] mt-0.5">{icon}</span>
      <span className="text-xs text-[color:var(--text-muted)] w-24 flex-shrink-0">{label}</span>
      <span className="text-xs text-[color:var(--text-primary)] font-medium flex-1">{value}</span>
    </div>
  );
}

// ── Wizard principal ──────────────────────────────────────────────────────────

const ETAPES = [
  { label: "Type d'événement", num: 1 },
  { label: 'Description',     num: 2 },
  { label: 'Témoins',         num: 3 },
  { label: 'Récapitulatif',   num: 4 },
];

interface DeclarationWizardProps {
  onCancel:    () => void;
  onSoumettre: (dossier: DossierAccident) => void;
}

export function DeclarationWizard({ onCancel, onSoumettre }: DeclarationWizardProps) {
  const toast = useToast();
  const [etape, setEtape] = useState(1);

  const [step1, setStep1] = useState<Step1Data>({ type_evenement: '' });
  const [step2, setStep2] = useState<Step2Data>({
    titre: '', date_evenement: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    lieu: '', zone_code: '', description: '', victimes: [],
  });
  const [step3, setStep3] = useState<Step3Data>({
    declarant_nom: '', declarant_poste: '', temoins: [], at_liee_numero: '',
  });

  const peutAvancer =
    etape === 1 ? !!step1.type_evenement :
    etape === 2 ? !!(step2.titre && step2.date_evenement && step2.zone_code && step2.description) :
    etape === 3 ? !!(step3.declarant_nom && step3.declarant_poste) :
    true;

  function soumettre() {
    if (!step1.type_evenement) return;

    const now = new Date().toISOString();
    const annee = new Date().getFullYear();
    const num = Math.floor(Math.random() * 900) + 100;

    const dossier: DossierAccident = {
      id: genId(),
      numero: `ACC-${annee}-${String(num).padStart(4, '0')}`,
      type_evenement: step1.type_evenement,
      statut: 'SIGNALE',
      titre: step2.titre,
      date_evenement: new Date(step2.date_evenement).toISOString(),
      date_declaration: now,
      lieu: step2.lieu,
      zone_code: step2.zone_code,
      description: step2.description,
      declarant_nom: step3.declarant_nom,
      declarant_poste: step3.declarant_poste,
      victimes: step2.victimes.map(v => ({ ...v, id: genId() })),
      temoins: step3.temoins.map(t => ({ ...t, id: genId() })),
      at_liee_numero: step3.at_liee_numero || undefined,
      arbre_causes: [],
      actions: [],
      declaration_cpam: false,
      declaration_it: false,
    };
    onSoumettre(dossier);
    toast.success(`Événement ${dossier.numero} déclaré avec succès.`);
  }

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <header className="bg-[#0077aa] shadow-lg sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button type="button" onClick={onCancel}
            className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0">
            <X size={18} className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-base leading-none">Déclarer un événement</h1>
            <p className="text-white/50 text-xs mt-0.5">Étape {etape}/4 — {ETAPES[etape - 1].label}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8">
          {ETAPES.map((e, i) => (
            <div key={e.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                  etape > e.num  ? 'bg-[#00b8e0] border-[#00b8e0] text-[#02101f]' :
                  etape === e.num ? 'bg-white border-[#00d4ff] text-[#0077aa]' :
                  'bg-[var(--bg-hover)] border-[var(--border)] text-[color:var(--text-muted)]',
                )}>
                  {etape > e.num ? <Check size={14} /> : e.num}
                </div>
                <span className={clsx(
                  'text-xs mt-1 text-center hidden sm:block',
                  etape === e.num ? 'text-[color:var(--badge-navy-text)] font-semibold' : 'text-[color:var(--text-muted)]',
                )}>
                  {e.label}
                </span>
              </div>
              {i < ETAPES.length - 1 && (
                <div className={clsx('flex-1 h-0.5 mx-2 mb-4', etape > e.num ? 'bg-[#0077aa]' : 'bg-[var(--bg-hover)]')} />
              )}
            </div>
          ))}
        </div>

        {/* Contenu étape */}
        <div className="card p-6">
          {etape === 1 && <Step1TypeGravite data={step1} onChange={setStep1} />}
          {etape === 2 && <Step2Description data={step2} onChange={setStep2} />}
          {etape === 3 && <Step3TemoinsDeclarant data={step3} onChange={setStep3} />}
          {etape === 4 && <Step4Recap step1={step1} step2={step2} step3={step3} />}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6 pb-20">
          <button
            type="button"
            onClick={() => etape > 1 ? setEtape(e => e - 1) : onCancel()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <ChevronLeft size={16} />
            {etape > 1 ? 'Précédent' : 'Annuler'}
          </button>

          {etape < 4 ? (
            <button
              type="button"
              onClick={() => setEtape(e => e + 1)}
              disabled={!peutAvancer}
              className={clsx(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                peutAvancer
                  ? 'bg-[#0077aa] text-white hover:bg-[#005f88] shadow-sm'
                  : 'bg-[var(--bg-hover)] text-[color:var(--text-muted)] cursor-not-allowed',
              )}
            >
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={soumettre}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <AlertTriangle size={16} />
              Déclarer l'événement
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
