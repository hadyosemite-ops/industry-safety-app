import { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { TypePermis } from '../../types';
import type { PermisFormData } from './ATCreationWizard';
import { PermisFormCard } from './PermisFormCard';

// ─── Catalogue des types de permis ───────────────────────────────────────────

const TYPES_PERMIS: {
  value: TypePermis;
  label: string;
  icon: string;
  description: string;
  couleur: string;
  risque: string;
}[] = [
  {
    value: TypePermis.TRAVAIL_CHAUD,
    label: 'Travail à Chaud',
    icon: '🔥',
    description: 'Soudage, meulage, découpe, torchage',
    couleur: 'border-danger-200 bg-danger-50 hover:border-danger-400',
    risque: 'CRITIQUE',
  },
  {
    value: TypePermis.ESPACE_CONFINE,
    label: 'Espace Confiné',
    icon: '🕳️',
    description: 'Cuves, silos, réservoirs, tunnels',
    couleur: 'border-danger-200 bg-danger-50 hover:border-danger-400',
    risque: 'CRITIQUE',
  },
  {
    value: TypePermis.ELECTRIQUE_LOTO,
    label: 'Électrique / LOTO',
    icon: '⚡',
    description: 'Consignation, travaux HTA/HTB/BT',
    couleur: 'border-danger-200 bg-danger-50 hover:border-danger-400',
    risque: 'CRITIQUE',
  },
  {
    value: TypePermis.TRAVAIL_HAUTEUR,
    label: 'Travail en Hauteur',
    icon: '🪜',
    description: 'Échafaudages, nacelles, toitures > 2m',
    couleur: 'border-amber-300 bg-amber-50 hover:border-amber-400',
    risque: 'ÉLEVÉ',
  },
  {
    value: TypePermis.ATEX_CHIMIQUE,
    label: 'ATEX / Chimique',
    icon: '☢️',
    description: 'Zones explosibles, CMR, amiante',
    couleur: 'border-danger-200 bg-danger-50 hover:border-danger-400',
    risque: 'CRITIQUE',
  },
  {
    value: TypePermis.EXCAVATION,
    label: 'Excavation',
    icon: '⛏️',
    description: 'Fouilles, tranchées, terrassement',
    couleur: 'border-amber-300 bg-amber-50 hover:border-amber-400',
    risque: 'ÉLEVÉ',
  },
  {
    value: TypePermis.TRAVAUX_PRESSION,
    label: 'Travaux Sous Pression',
    icon: '💨',
    description: 'Tuyauteries vapeur, air comprimé HP',
    couleur: 'border-amber-300 bg-amber-50 hover:border-amber-400',
    risque: 'ÉLEVÉ',
  },
  {
    value: TypePermis.TRAVAUX_GENERAUX,
    label: 'Travaux Généraux',
    icon: '🔧',
    description: 'Maintenance courante, nettoyage',
    couleur: 'border-success-200 bg-success-50 hover:border-success-400',
    risque: 'MODÉRÉ',
  },
];

// ─── Checklists pré-définies ──────────────────────────────────────────────────

export const CHECKLISTS_DEFAUT: Record<TypePermis, { question_id: string; question_libelle: string; obligatoire: boolean; categorie: string }[]> = {
  [TypePermis.TRAVAIL_CHAUD]: [
    { question_id: 'TC01', question_libelle: 'Zone délimitée et balisée', obligatoire: true, categorie: 'ZONE' },
    { question_id: 'TC02', question_libelle: 'Extincteur positionné à moins de 5m', obligatoire: true, categorie: 'SECURITE' },
    { question_id: 'TC03', question_libelle: 'Mesure atmosphérique réalisée (gaz, O2)', obligatoire: true, categorie: 'ATMOSPHERIQUE' },
    { question_id: 'TC04', question_libelle: 'Matières inflammables éloignées ou protégées', obligatoire: true, categorie: 'ZONE' },
    { question_id: 'TC05', question_libelle: 'Surveillant de chantier désigné', obligatoire: true, categorie: 'ORGANISATION' },
    { question_id: 'TC06', question_libelle: 'EPI : masque, gants, tablier de soudeur fournis', obligatoire: true, categorie: 'EPI' },
    { question_id: 'TC07', question_libelle: 'Communication avec salle de contrôle établie', obligatoire: false, categorie: 'COMMUNICATION' },
    { question_id: 'TC08', question_libelle: 'Alarme incendie testée', obligatoire: false, categorie: 'SECURITE' },
  ],
  [TypePermis.ESPACE_CONFINE]: [
    { question_id: 'EC01', question_libelle: 'Analyse atmosphérique réalisée (O2, gaz toxiques, explosifs)', obligatoire: true, categorie: 'ATMOSPHERIQUE' },
    { question_id: 'EC02', question_libelle: 'Ventilation forcée en place', obligatoire: true, categorie: 'SECURITE' },
    { question_id: 'EC03', question_libelle: 'Surveillant permanent désigné à l\'extérieur', obligatoire: true, categorie: 'ORGANISATION' },
    { question_id: 'EC04', question_libelle: 'Harnais et trépied de secours disponibles', obligatoire: true, categorie: 'EPI' },
    { question_id: 'EC05', question_libelle: 'Détecteur de gaz personnel fourni', obligatoire: true, categorie: 'EPI' },
    { question_id: 'EC06', question_libelle: 'Plan de sauvetage établi et communiqué', obligatoire: true, categorie: 'URGENCE' },
    { question_id: 'EC07', question_libelle: 'Isolations mécaniques et électriques confirmées', obligatoire: true, categorie: 'ISOLATION' },
    { question_id: 'EC08', question_libelle: 'Contact radio permanent établi', obligatoire: true, categorie: 'COMMUNICATION' },
  ],
  [TypePermis.ELECTRIQUE_LOTO]: [
    { question_id: 'EL01', question_libelle: 'Consignation électrique réalisée (LOTO)', obligatoire: true, categorie: 'ISOLATION' },
    { question_id: 'EL02', question_libelle: 'VAT (Vérification Absence Tension) effectuée', obligatoire: true, categorie: 'ISOLATION' },
    { question_id: 'EL03', question_libelle: 'Cadenas de consignation posés par chaque intervenant', obligatoire: true, categorie: 'ISOLATION' },
    { question_id: 'EL04', question_libelle: 'Habilitation électrique vérifiée', obligatoire: true, categorie: 'HABILITATION' },
    { question_id: 'EL05', question_libelle: 'EPI diélectriques fournis', obligatoire: true, categorie: 'EPI' },
    { question_id: 'EL06', question_libelle: 'Panneau de signalisation posé', obligatoire: true, categorie: 'ZONE' },
    { question_id: 'EL07', question_libelle: 'Schéma électrique disponible sur chantier', obligatoire: false, categorie: 'DOCUMENTATION' },
  ],
  [TypePermis.TRAVAIL_HAUTEUR]: [
    { question_id: 'TH01', question_libelle: 'Harnais de sécurité vérifié (date de contrôle valide)', obligatoire: true, categorie: 'EPI' },
    { question_id: 'TH02', question_libelle: 'Points d\'ancrage identifiés et validés', obligatoire: true, categorie: 'SECURITE' },
    { question_id: 'TH03', question_libelle: 'Zone en bas balisée et interdite d\'accès', obligatoire: true, categorie: 'ZONE' },
    { question_id: 'TH04', question_libelle: 'Échafaudage/nacelle vérifié et conforme', obligatoire: true, categorie: 'EQUIPEMENT' },
    { question_id: 'TH05', question_libelle: 'Conditions météo vérifiées (vent < 45 km/h)', obligatoire: true, categorie: 'METEO' },
    { question_id: 'TH06', question_libelle: 'Formation travaux en hauteur vérifiée', obligatoire: true, categorie: 'HABILITATION' },
    { question_id: 'TH07', question_libelle: 'Procédure de sauvetage définie', obligatoire: false, categorie: 'URGENCE' },
  ],
  [TypePermis.ATEX_CHIMIQUE]: [
    { question_id: 'AT01', question_libelle: 'Zone ATEX classifiée et identifiée', obligatoire: true, categorie: 'ZONE' },
    { question_id: 'AT02', question_libelle: 'Outillage antidéflagrant utilisé', obligatoire: true, categorie: 'EQUIPEMENT' },
    { question_id: 'AT03', question_libelle: 'Analyse atmosphérique (LEI < 25%)', obligatoire: true, categorie: 'ATMOSPHERIQUE' },
    { question_id: 'AT04', question_libelle: 'FDS (Fiche de Données Sécurité) disponible', obligatoire: true, categorie: 'DOCUMENTATION' },
    { question_id: 'AT05', question_libelle: 'EPI chimique approprié fourni', obligatoire: true, categorie: 'EPI' },
    { question_id: 'AT06', question_libelle: 'Douche de sécurité identifiée et testée', obligatoire: false, categorie: 'URGENCE' },
  ],
  [TypePermis.EXCAVATION]: [
    { question_id: 'EX01', question_libelle: 'Déclaration de travaux (DT/DICT) effectuée', obligatoire: true, categorie: 'REGLEMENTATION' },
    { question_id: 'EX02', question_libelle: 'Réseaux souterrains identifiés', obligatoire: true, categorie: 'SECURITE' },
    { question_id: 'EX03', question_libelle: 'Balisage et garde-corps en place', obligatoire: true, categorie: 'ZONE' },
    { question_id: 'EX04', question_libelle: 'Stabilité des parois vérifiée (blindage)', obligatoire: true, categorie: 'SECURITE' },
    { question_id: 'EX05', question_libelle: 'Moyen d\'évacuation disponible (échelle)', obligatoire: true, categorie: 'URGENCE' },
    { question_id: 'EX06', question_libelle: 'Présence d\'eau vérifiée (pompage si nécessaire)', obligatoire: false, categorie: 'SECURITE' },
  ],
  [TypePermis.TRAVAUX_PRESSION]: [
    { question_id: 'TP01', question_libelle: 'Circuit isolé et dépressurisé', obligatoire: true, categorie: 'ISOLATION' },
    { question_id: 'TP02', question_libelle: 'Purge et vidange confirmées', obligatoire: true, categorie: 'ISOLATION' },
    { question_id: 'TP03', question_libelle: 'EPI pression (visière, gants isolants) fournis', obligatoire: true, categorie: 'EPI' },
    { question_id: 'TP04', question_libelle: 'Documentation inspection en cours de validité', obligatoire: true, categorie: 'DOCUMENTATION' },
    { question_id: 'TP05', question_libelle: 'Zone dégagée du personnel non habilité', obligatoire: true, categorie: 'ZONE' },
  ],
  [TypePermis.TRAVAUX_GENERAUX]: [
    { question_id: 'TG01', question_libelle: 'Zone de travail délimitée', obligatoire: true, categorie: 'ZONE' },
    { question_id: 'TG02', question_libelle: 'EPI de base fournis (casque, chaussures, gilet)', obligatoire: true, categorie: 'EPI' },
    { question_id: 'TG03', question_libelle: 'Risques identifiés et mesures en place', obligatoire: true, categorie: 'SECURITE' },
    { question_id: 'TG04', question_libelle: 'Outillage vérifié et en bon état', obligatoire: false, categorie: 'EQUIPEMENT' },
    { question_id: 'TG05', question_libelle: 'Numéros d\'urgence affichés sur le chantier', obligatoire: true, categorie: 'URGENCE' },
  ],
};

function creerPermisVide(type: TypePermis): PermisFormData {
  const checklist = CHECKLISTS_DEFAUT[type] ?? [];
  return {
    _id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type_permis: type,
    checklist_reponses: checklist.map(item => ({
      question_id: item.question_id,
      question_libelle: item.question_libelle,
      reponse: 'NON' as const,
      obligatoire: item.obligatoire,
    })),
    mesures_prevention: [],
    epi_requis: [],
    equipements_concernes: [],
    intervenants: [],
  };
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface Props {
  permis: PermisFormData[];
  erreurs: Record<string, string>;
  onChange: (permis: PermisFormData[]) => void;
}

export function StepPermis({ permis, erreurs, onChange }: Props) {
  const [showSelector, setShowSelector] = useState(permis.length === 0);
  const [ouverts, setOuverts] = useState<Set<string>>(
    new Set(permis.map(p => p._id))
  );

  function ajouterPermis(type: TypePermis) {
    const nouveau = creerPermisVide(type);
    onChange([...permis, nouveau]);
    setOuverts(prev => new Set([...prev, nouveau._id]));
    setShowSelector(false);
  }

  function supprimerPermis(id: string) {
    onChange(permis.filter(p => p._id !== id));
    setOuverts(prev => { const s = new Set(prev); s.delete(id); return s; });
  }

  function updatePermis(id: string, patch: Partial<PermisFormData>) {
    onChange(permis.map(p => p._id === id ? { ...p, ...patch } : p));
  }

  function toggleOuvert(id: string) {
    setOuverts(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  const erreurGlobale = erreurs.permis;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Permis de travail</h2>
          <p className="text-sm text-white/60 mt-1">
            Ajoutez un permis par type de danger. L'Animateur de Sécurité validera chacun sur le terrain.
          </p>
        </div>
        {permis.length > 0 && (
          <button
            type="button"
            onClick={() => setShowSelector(s => !s)}
            className="btn-primary flex-shrink-0"
          >
            <Plus size={16} />
            Ajouter un permis
          </button>
        )}
      </div>

      {/* Erreur globale */}
      {erreurGlobale && (
        <div className="flex items-center gap-2 p-3 bg-danger-50 border border-danger-200 rounded-lg text-[color:var(--badge-danger-text)] text-sm">
          <AlertCircle size={15} />
          {erreurGlobale}
        </div>
      )}

      {/* Sélecteur de type de permis */}
      {showSelector && (
        <div className="card p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-[color:var(--text-primary)]">Choisissez le type de permis</p>
            {permis.length > 0 && (
              <button onClick={() => setShowSelector(false)} className="btn-ghost">
                <X size={14} /> Annuler
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TYPES_PERMIS.map(tp => (
              <button
                key={tp.value}
                type="button"
                onClick={() => ajouterPermis(tp.value)}
                className={clsx(
                  'group flex flex-col items-center gap-2 p-4 border-2 rounded-xl text-center',
                  'transition-all duration-150 cursor-pointer',
                  tp.couleur
                )}
              >
                <span className="text-2xl">{tp.icon}</span>
                <span className="text-xs font-bold text-[color:var(--text-primary)] leading-tight">{tp.label}</span>
                <span className="text-xs text-[color:var(--text-secondary)] leading-tight">{tp.description}</span>
                <span className={clsx(
                  'text-xs font-bold px-2 py-0.5 rounded-full',
                  tp.risque === 'CRITIQUE' && 'bg-danger-100 text-[color:var(--badge-danger-text)]',
                  tp.risque === 'ÉLEVÉ'    && 'bg-amber-100 text-[color:var(--badge-amber-text)]',
                  tp.risque === 'MODÉRÉ'   && 'bg-success-100 text-[color:var(--badge-success-text)]',
                )}>
                  {tp.risque}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* État vide */}
      {permis.length === 0 && !showSelector && (
        <div className="card p-12 flex flex-col items-center text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="font-bold text-[color:var(--text-primary)] mb-2">Aucun permis ajouté</h3>
          <p className="text-sm text-[color:var(--text-muted)] mb-6 max-w-xs">
            Chaque type de danger nécessite un permis spécifique avec sa propre checklist de sécurité.
          </p>
          <button type="button" onClick={() => setShowSelector(true)} className="btn-primary">
            <Plus size={16} />
            Ajouter le premier permis
          </button>
        </div>
      )}

      {/* Liste des permis */}
      <div className="space-y-4">
        {permis.map((p, idx) => {
          const typeInfo = TYPES_PERMIS.find(t => t.value === p.type_permis)!;
          const ouvert = ouverts.has(p._id);
          const errPermis = erreurs[`permis_${idx}`];
          const errInterv = erreurs[`interv_${idx}`];
          const aErreur = !!(errPermis || errInterv);

          const nbValides = p.checklist_reponses.filter(r => r.reponse === 'OUI').length;
          const nbTotal   = p.checklist_reponses.length;
          const nbInterv  = p.intervenants.length;

          return (
            <div
              key={p._id}
              className={clsx(
                'card overflow-hidden border-l-4 transition-all duration-200',
                aErreur ? 'border-l-red-400' : 'border-l-navy-600'
              )}
            >
              {/* En-tête de la carte permis */}
              <button
                type="button"
                onClick={() => toggleOuvert(p._id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-hover)] transition-colors text-left"
              >
                <span className="text-xl flex-shrink-0">{typeInfo.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[color:var(--text-primary)] text-sm">{typeInfo.label}</span>
                    <span className={clsx(
                      'text-xs font-bold px-2 py-0.5 rounded-full',
                      typeInfo.risque === 'CRITIQUE' && 'bg-danger-100 text-[color:var(--badge-danger-text)]',
                      typeInfo.risque === 'ÉLEVÉ'    && 'bg-amber-100 text-[color:var(--badge-amber-text)]',
                      typeInfo.risque === 'MODÉRÉ'   && 'bg-success-100 text-[color:var(--badge-success-text)]',
                    )}>
                      {typeInfo.risque}
                    </span>
                    {aErreur && <AlertCircle size={13} className="text-red-500 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    {/* Progression checklist */}
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-20 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-safety-500 rounded-full transition-all"
                          style={{ width: `${(nbValides / nbTotal) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-[color:var(--text-secondary)]">{nbValides}/{nbTotal} points</span>
                    </div>
                    {/* Intervenants */}
                    <span className={clsx(
                      'text-xs font-medium',
                      nbInterv === 0 ? 'text-red-500' : 'text-[color:var(--text-secondary)]'
                    )}>
                      {nbInterv === 0 ? '⚠ Aucun intervenant' : `${nbInterv} intervenant${nbInterv > 1 ? 's' : ''}`}
                    </span>
                    {nbValides === nbTotal && nbInterv > 0 && (
                      <span className="flex items-center gap-1 text-xs text-[color:var(--badge-safety-text)] font-semibold">
                        <CheckCircle2 size={12} /> Complet
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); supprimerPermis(p._id); }}
                    className="p-1.5 text-[color:var(--text-muted)] hover:text-red-500 hover:bg-danger-500/10 rounded-lg transition-colors"
                    title="Supprimer ce permis"
                  >
                    <X size={15} />
                  </button>
                  {ouvert ? <ChevronUp size={16} className="text-[color:var(--text-muted)]" /> : <ChevronDown size={16} className="text-[color:var(--text-muted)]" />}
                </div>
              </button>

              {/* Erreurs */}
              {aErreur && !ouvert && (
                <div className="px-4 pb-3 text-xs text-red-600 flex flex-col gap-1">
                  {errPermis && <span>• {errPermis}</span>}
                  {errInterv && <span>• {errInterv}</span>}
                </div>
              )}

              {/* Contenu dépliable */}
              {ouvert && (
                <div className="border-t border-[var(--border)] animate-fade-in-up">
                  <PermisFormCard
                    permis={p}
                    erreurs={erreurs}
                    index={idx}
                    onChange={patch => updatePermis(p._id, patch)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
