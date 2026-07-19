import { useReducer, useCallback } from 'react';
import { FileText, ClipboardList, CheckSquare, Shield, ArrowLeft } from 'lucide-react';
import { StepIndicator, type Step } from '@/components/ui/StepIndicator';
import { StepInformationsGenerales } from './StepInformationsGenerales';
import { StepPermis } from './StepPermis';
import { StepRevue } from './StepRevue';
import {
  TypePermis, NiveauRisque, RoleUtilisateur,
  type CreateATPayload, type CreatePermisPayload, type EvaluationRisques,
} from '../../types';
import * as atService from '../../services/atService';
import * as permisService from '../../services/permisService';
import { useAuth } from '@/contexts/AuthContext';
import { pickRole, toRoleUtilisateurs } from '../../utils/roles';

// ─── Types du wizard ──────────────────────────────────────────────────────────

export interface PermisFormData {
  _id: string;             // ID temporaire côté client
  type_permis: TypePermis;
  checklist_reponses: { question_id: string; question_libelle: string; reponse: 'OUI' | 'NON' | 'N_A'; obligatoire: boolean }[];
  mesures_prevention: string[];
  epi_requis: string[];
  equipements_concernes: string[];
  intervenants: { nom_complet: string; entreprise?: string; habilitations?: string[] }[];
}

export interface WizardFormData {
  // Étape 1
  site_id:                    string;
  zone_id:                    string;
  titre:                      string;
  description_travaux:        string;
  entreprise_intervenante:    string;
  chef_chantier:              string;
  nombre_intervenants_prevu:  number;
  date_debut_prevue:          string;
  date_fin_prevue:            string;
  evaluation_risques:         EvaluationRisques;
  animateur_id:               string;
  // Étape 2
  permis:                     PermisFormData[];
}

interface WizardState {
  etape:       1 | 2 | 3;
  formData:    WizardFormData;
  erreurs:     Record<string, string>;
  soumis:      boolean;
  enCours:     boolean;
  atCreee?:    { id: string; numero_at: string };
}

type WizardAction =
  | { type: 'SET_ETAPE'; payload: 1 | 2 | 3 }
  | { type: 'UPDATE_FORM'; payload: Partial<WizardFormData> }
  | { type: 'SET_ERREURS'; payload: Record<string, string> }
  | { type: 'SET_EN_COURS'; payload: boolean }
  | { type: 'SET_SOUMIS'; payload: { id: string; numero_at: string } };

const FORM_INITIAL: WizardFormData = {
  site_id: '',
  zone_id: '',
  titre: '',
  description_travaux: '',
  entreprise_intervenante: '',
  chef_chantier: '',
  nombre_intervenants_prevu: 1,
  date_debut_prevue: '',
  date_fin_prevue: '',
  evaluation_risques: {
    dangers_identifies: [],
    mesures_prevention_globales: [],
    epi_obligatoires: [],
    niveau_risque_global: NiveauRisque.MODERE,
    plan_urgence: '',
  },
  animateur_id: '',
  permis: [],
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_ETAPE':
      return { ...state, etape: action.payload, erreurs: {} };
    case 'UPDATE_FORM':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'SET_ERREURS':
      return { ...state, erreurs: action.payload };
    case 'SET_EN_COURS':
      return { ...state, enCours: action.payload };
    case 'SET_SOUMIS':
      return { ...state, soumis: true, atCreee: action.payload };
    default:
      return state;
  }
}

// ─── Étapes ───────────────────────────────────────────────────────────────────

const ETAPES: Step[] = [
  { id: 1, label: 'Informations générales', description: 'Zone, dates, risques globaux', icon: <FileText size={16} /> },
  { id: 2, label: 'Permis de travail',      description: 'Ajouter et configurer les permis', icon: <ClipboardList size={16} /> },
  { id: 3, label: 'Revue & Soumission',     description: 'Vérification et envoi', icon: <CheckSquare size={16} /> },
];

// ─── Validation ───────────────────────────────────────────────────────────────

function validerEtape1(data: WizardFormData): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!data.titre.trim())                      errs.titre = 'Le titre est obligatoire.';
  if (!data.description_travaux.trim())        errs.description_travaux = 'Décrivez les travaux.';
  if (!data.entreprise_intervenante.trim())    errs.entreprise_intervenante = 'Entreprise obligatoire.';
  if (!data.chef_chantier.trim())              errs.chef_chantier = 'Chef de chantier obligatoire.';
  if (!data.zone_id)                           errs.zone_id = 'Sélectionnez une zone.';
  if (!data.date_debut_prevue)                 errs.date_debut_prevue = 'Date de début obligatoire.';
  if (!data.date_fin_prevue)                   errs.date_fin_prevue = 'Date de fin obligatoire.';
  if (data.date_debut_prevue && data.date_fin_prevue &&
      data.date_fin_prevue <= data.date_debut_prevue)
    errs.date_fin_prevue = 'La date de fin doit être après la date de début.';
  if (data.evaluation_risques.dangers_identifies.length === 0)
    errs.dangers = 'Identifiez au moins un danger.';
  if (data.evaluation_risques.epi_obligatoires.length === 0)
    errs.epi = 'Listez les EPI obligatoires.';
  return errs;
}

function validerEtape2(data: WizardFormData): Record<string, string> {
  const errs: Record<string, string> = {};
  if (data.permis.length === 0)
    errs.permis = 'Ajoutez au moins un permis de travail.';
  data.permis.forEach((p, idx) => {
    const obligNonRepondues = p.checklist_reponses.filter(
      r => r.obligatoire && r.reponse !== 'OUI' && r.reponse !== 'N_A'
    );
    if (obligNonRepondues.length > 0)
      errs[`permis_${idx}`] = `Permis ${idx + 1} : ${obligNonRepondues.length} point(s) obligatoire(s) non conformes.`;
    if (p.intervenants.length === 0)
      errs[`interv_${idx}`] = `Permis ${idx + 1} : ajoutez au moins un intervenant.`;
  });
  return errs;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ATCreationWizard() {
  const { user, profile } = useAuth();
  const [state, dispatch] = useReducer(reducer, {
    etape: 1,
    formData: FORM_INITIAL,
    erreurs: {},
    soumis: false,
    enCours: false,
  });

  const { etape, formData, erreurs, soumis, enCours, atCreee } = state;

  const updateForm = useCallback((patch: Partial<WizardFormData>) => {
    dispatch({ type: 'UPDATE_FORM', payload: patch });
  }, []);

  function allerEtape(cible: 1 | 2 | 3) {
    // Valider l'étape actuelle avant d'avancer
    if (cible > etape) {
      let errs: Record<string, string> = {};
      if (etape === 1) errs = validerEtape1(formData);
      if (etape === 2) errs = validerEtape2(formData);
      if (Object.keys(errs).length > 0) {
        dispatch({ type: 'SET_ERREURS', payload: errs });
        return;
      }
    }
    dispatch({ type: 'SET_ETAPE', payload: cible });
  }

  async function soumettre() {
    const errs = validerEtape2(formData);
    if (Object.keys(errs).length > 0) {
      dispatch({ type: 'SET_ERREURS', payload: errs });
      dispatch({ type: 'SET_ETAPE', payload: 2 });
      return;
    }

    if (!user?.id || !profile?.site_id) {
      dispatch({ type: 'SET_ERREURS', payload: { global: 'Session utilisateur invalide — reconnectez-vous.' } });
      return;
    }

    const roles = toRoleUtilisateurs(profile.roles);
    const role = pickRole(roles, [RoleUtilisateur.DEMANDEUR, RoleUtilisateur.HSE_MANAGER, RoleUtilisateur.ADMIN]);
    if (!role) {
      dispatch({ type: 'SET_ERREURS', payload: { global: "Vous n'avez pas le rôle requis pour créer une Autorisation de Travail." } });
      return;
    }

    dispatch({ type: 'SET_EN_COURS', payload: true });
    try {
      const payload: CreateATPayload = {
        site_id:                  profile.site_id,
        zone_id:                  formData.zone_id,
        titre:                    formData.titre,
        description_travaux:      formData.description_travaux,
        entreprise_intervenante:  formData.entreprise_intervenante,
        chef_chantier:            formData.chef_chantier,
        nombre_intervenants_prevu: formData.nombre_intervenants_prevu,
        date_debut_prevue:        formData.date_debut_prevue,
        date_fin_prevue:          formData.date_fin_prevue,
        evaluation_risques:       formData.evaluation_risques,
        animateur_id:             formData.animateur_id || undefined,
      };

      const { data: at, error: atError } = await atService.creerAT(payload, user.id);
      if (atError || !at) {
        dispatch({ type: 'SET_ERREURS', payload: { global: atError?.message ?? "Erreur lors de la création de l'AT." } });
        return;
      }

      for (const p of formData.permis) {
        const permisPayload: CreatePermisPayload = {
          at_id: at.id,
          type_permis: p.type_permis,
          checklist_reponses: p.checklist_reponses,
          mesures_prevention: p.mesures_prevention,
          epi_requis: p.epi_requis,
          equipements_concernes: p.equipements_concernes,
          intervenants: p.intervenants.map(i => ({
            nom_complet: i.nom_complet,
            entreprise: i.entreprise,
            habilitations: i.habilitations,
          })),
        };
        const { error: permisError } = await permisService.creerPermis(permisPayload, user.id, role);
        if (permisError) {
          dispatch({ type: 'SET_ERREURS', payload: { global: `AT créée (${at.numero_at}) mais erreur sur un permis : ${permisError.message}` } });
          return;
        }
      }

      const { error: soumettreError } = await atService.soumettre(at.id, user.id, role);
      if (soumettreError) {
        dispatch({ type: 'SET_ERREURS', payload: { global: `AT et permis créés (${at.numero_at}) mais la soumission a échoué : ${soumettreError.message}` } });
        return;
      }

      dispatch({ type: 'SET_SOUMIS', payload: { id: at.id, numero_at: at.numero_at } });
    } catch (err) {
      dispatch({ type: 'SET_ERREURS', payload: { global: 'Erreur lors de la soumission. Réessayez.' } });
    } finally {
      dispatch({ type: 'SET_EN_COURS', payload: false });
    }
  }

  // ── Succès ─────────────────────────────────────────────────────────────────
  if (soumis && atCreee) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center p-6">
        <div className="card shadow-panel p-10 max-w-md w-full text-center animate-fade-in-up">
          <div className="w-16 h-16 bg-safety-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckSquare size={32} className="text-safety-500" />
          </div>
          <h2 className="text-xl font-bold text-[color:var(--text-primary)] mb-2">Autorisation soumise !</h2>
          <p className="text-[color:var(--text-secondary)] mb-1">Votre demande a été transmise à l'Animateur de Sécurité.</p>
          <div className="inline-flex items-center gap-2 bg-navy-600 text-white px-4 py-2 rounded-lg font-bold text-lg mt-4">
            <Shield size={18} />
            {atCreee.numero_at}
          </div>
          <p className="text-xs text-[color:var(--text-muted)] mt-4">
            Vous recevrez une notification dès que les permis seront validés.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary mt-6 w-full justify-center"
          >
            Créer une nouvelle AT
          </button>
        </div>
      </div>
    );
  }

  // ── Layout principal ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020817] flex flex-col">
      {/* Topbar */}
      <header className="bg-[#050e1f] border-b border-white/[0.08] text-white px-6 py-4 flex items-center gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #0077aa)', boxShadow: '0 0 16px rgba(0,212,255,0.3)' }}
          >
            <Shield size={16} className="text-[#02101f]" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-base tracking-tight">HSE 365</span>
        </div>
        <div className="h-5 w-px bg-white/20 mx-2" />
        <span className="text-white/70 text-sm">Nouvelle Autorisation de Travail</span>

        {/* Barre de progression */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex gap-1.5">
            {[1, 2, 3].map(n => (
              <div key={n} className={`h-1.5 w-10 rounded-full transition-all duration-300 ${
                n <= etape ? 'bg-white' : 'bg-white/30'
              }`} />
            ))}
          </div>
          <span className="text-xs text-white/60 ml-2">{etape}/3</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar gauche */}
        <aside
          className="w-64 flex-shrink-0 border-r border-white/[0.08] p-5 flex flex-col gap-6"
          style={{ background: 'linear-gradient(180deg, #050e1f 0%, #020817 100%)' }}
        >
          <StepIndicator
            steps={ETAPES}
            currentStep={etape}
            onStepClick={n => n < etape && allerEtape(n as 1 | 2 | 3)}
          />

          {/* Aide contextuelle */}
          <div className="mt-auto bg-white/10 rounded-xl p-4 text-white/80 text-xs leading-relaxed">
            {etape === 1 && (
              <>
                <p className="font-semibold text-white mb-1">💡 Étape 1 — AT</p>
                Renseignez les informations générales : la zone de travail, les dates prévues et l'évaluation globale des risques.
              </>
            )}
            {etape === 2 && (
              <>
                <p className="font-semibold text-white mb-1">💡 Étape 2 — Permis</p>
                Ajoutez un permis par type de danger. Chaque permis a sa propre checklist. Tous doivent être validés par l'Animateur avant le GO terrain.
              </>
            )}
            {etape === 3 && (
              <>
                <p className="font-semibold text-white mb-1">💡 Étape 3 — Revue</p>
                Vérifiez toutes les informations avant soumission. Une fois soumise, l'AT sera transmise à l'Animateur de Sécurité.
              </>
            )}
          </div>
        </aside>

        {/* Corps principal */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 lg:p-8">
            {/* Erreur globale */}
            {erreurs.global && (
              <div className="mb-5 p-4 bg-danger-50 border border-danger-200 rounded-xl text-[color:var(--badge-danger-text)] text-sm flex items-center gap-2">
                <span>⚠️</span> {erreurs.global}
              </div>
            )}

            {/* Étapes */}
            {etape === 1 && (
              <div className="animate-fade-in-up">
                <StepInformationsGenerales
                  data={formData}
                  erreurs={erreurs}
                  onChange={updateForm}
                />
              </div>
            )}
            {etape === 2 && (
              <div className="animate-fade-in-up">
                <StepPermis
                  permis={formData.permis}
                  erreurs={erreurs}
                  onChange={permis => updateForm({ permis })}
                />
              </div>
            )}
            {etape === 3 && (
              <div className="animate-fade-in-up">
                <StepRevue
                  data={formData}
                  enCours={enCours}
                  onSoumettre={soumettre}
                />
              </div>
            )}

            {/* Navigation bas de page */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border)]">
              <button
                onClick={() => etape > 1 ? allerEtape((etape - 1) as 1 | 2 | 3) : undefined}
                disabled={etape === 1}
                className="btn-secondary"
              >
                <ArrowLeft size={16} />
                Précédent
              </button>

              <div className="flex items-center gap-3">
                {Object.keys(erreurs).filter(k => k !== 'global').length > 0 && (
                  <span className="text-sm text-red-600 font-medium">
                    {Object.keys(erreurs).filter(k => k !== 'global').length} erreur(s) à corriger
                  </span>
                )}

                {etape < 3 ? (
                  <button
                    onClick={() => allerEtape((etape + 1) as 2 | 3)}
                    className="btn-primary"
                  >
                    Étape suivante
                    <span className="ml-1">→</span>
                  </button>
                ) : (
                  <button
                    onClick={soumettre}
                    disabled={enCours}
                    className="btn-primary"
                  >
                    {enCours ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Soumission en cours…
                      </>
                    ) : (
                      <>
                        <Shield size={16} />
                        Soumettre l'AT
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
