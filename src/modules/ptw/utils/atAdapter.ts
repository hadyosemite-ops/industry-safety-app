// ─────────────────────────────────────────────────────────────────────────────
// atAdapter — Convertit les lignes brutes renvoyées par `atService.getAT()`
// (avec ses jointures Supabase : zone, demandeur, permis, intervenants_permis,
// audits_at, suspensions_at…) vers le modèle de vue à plat `ATView` consommé
// par les composants du dashboard.
//
// `atService`/`permisService` typent leurs retours `as unknown as <TypeDomaine>`
// sans refléter précisément la forme des jointures (ex: `intervenants_permis`
// côté requête vs `intervenants` côté type `Permis`). On définit donc ici des
// types "Row" qui décrivent fidèlement ce que renvoient les chaînes `select()`
// des services (lues dans `services/atService.ts`), plutôt que de se fier aux
// types domaine qui supposent une forme déjà normalisée.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  StatutAT, StatutPermis, TypePermis, NiveauRisque, TypeEcart,
  TypeAudit, ResultatAudit, ChecklistReponse,
} from '../types';
import type { ATView, PermisView, SuspensionView, AuditView, IntervenantView } from '../types/dashboardView';

// ── Formes brutes issues des select() Supabase ─────────────────────────────────

interface UtilisateurRowLite {
  id: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
}

interface ZoneRowLite {
  id: string;
  nom: string;
  code_zone: string;
  niveau_risque_defaut?: NiveauRisque;
}

export interface IntervenantRow {
  id: string;
  permis_id: string;
  user_id?: string | null;
  nom_complet: string;
  entreprise?: string | null;
  habilitations?: string[] | null;
  check_in_at?: string | null;
  check_out_at?: string | null;
}

export interface PermisRow {
  id: string;
  at_id: string;
  type_permis: TypePermis;
  statut: StatutPermis;
  checklist_reponses: ChecklistReponse[];
  mesures_prevention: string[];
  epi_requis: string[];
  equipements_concernes?: string[];
  valide_par?: string | null;
  valide_le?: string | null;
  commentaire_validation?: string | null;
  rejete_par?: string | null;
  rejete_le?: string | null;
  motif_rejet?: string | null;
  qr_code_token: string;
  created_at: string;
  updated_at: string;
  // Nom de champ réel renvoyé par le select `permis(*, intervenants_permis(*))`
  intervenants_permis?: IntervenantRow[];
}

export interface AuditRow {
  id: string;
  at_id: string;
  auditeur_id: string;
  type_audit: TypeAudit;
  date_audit: string;
  checklist_audit: unknown[];
  ecarts_constates?: string | null;
  points_positifs?: string | null;
  resultat: ResultatAudit;
  recommandations?: string | null;
  auditeur?: UtilisateurRowLite;
}

export interface SuspensionRow {
  id: string;
  at_id: string;
  animateur_id: string;
  motif_suspension: string;
  type_ecart: TypeEcart;
  description_ecart: string;
  mesures_correctives: string;
  delai_correction?: string | null;
  date_suspension: string;
  date_levee?: string | null;
  levee_par?: string | null;
  commentaire_levee?: string | null;
  audit_levee_id?: string | null;
  animateur?: UtilisateurRowLite;
}

/** Forme renvoyée par `atService.getAT(id)` — cf. select() dans atService.ts */
export interface ATRow {
  id: string;
  numero_at: string;
  site_id: string;
  zone_id: string;
  demandeur_id: string;
  animateur_id?: string | null;
  approbateur_id?: string | null;
  titre: string;
  description_travaux: string;
  entreprise_intervenante: string;
  chef_chantier: string;
  nombre_intervenants_prevu: number;
  date_debut_prevue: string;
  date_fin_prevue: string;
  date_debut_effective?: string | null;
  date_fin_effective?: string | null;
  evaluation_risques: {
    dangers_identifies: string[];
    mesures_prevention_globales: string[];
    epi_obligatoires: string[];
    niveau_risque_global: NiveauRisque;
    plan_urgence?: string;
  };
  statut: StatutAT;
  statut_precedent?: StatutAT | null;
  created_at: string;
  updated_at: string;
  zone?: ZoneRowLite;
  demandeur?: UtilisateurRowLite;
  animateur?: UtilisateurRowLite | null;
  approbateur?: UtilisateurRowLite | null;
  permis?: PermisRow[];
  audits_at?: AuditRow[];
  suspensions_at?: SuspensionRow[];
}

// ── Conversion ───────────────────────────────────────────────────────────────

function toIntervenantView(row: IntervenantRow): IntervenantView {
  return {
    id: row.id,
    nom_complet: row.nom_complet,
    entreprise: row.entreprise ?? '',
    habilitations: row.habilitations ?? [],
    check_in_at: row.check_in_at ?? null,
    check_out_at: row.check_out_at ?? null,
  };
}

export function toPermisView(row: PermisRow): PermisView {
  return {
    id: row.id,
    type_permis: row.type_permis,
    statut: row.statut,
    checklist_reponses: (row.checklist_reponses ?? []).map(r => ({
      question_id: r.question_id,
      question_libelle: r.question_libelle,
      reponse: r.reponse,
      obligatoire: r.obligatoire,
      categorie: (r as unknown as { categorie?: string }).categorie ?? 'AUTRE',
    })),
    epi_requis: row.epi_requis ?? [],
    mesures_prevention: row.mesures_prevention ?? [],
    equipements_concernes: row.equipements_concernes ?? [],
    intervenants: (row.intervenants_permis ?? []).map(toIntervenantView),
    valide_par: row.valide_par ?? undefined,
    valide_le: row.valide_le ?? undefined,
    commentaire_validation: row.commentaire_validation ?? undefined,
    rejete_le: row.rejete_le ?? undefined,
    motif_rejet: row.motif_rejet ?? undefined,
    qr_code_token: row.qr_code_token,
  };
}

function toAuditView(row: AuditRow): AuditView {
  return {
    id: row.id,
    type_audit: row.type_audit,
    date_audit: row.date_audit,
    resultat: row.resultat,
    auditeur_nom: row.auditeur ? `${row.auditeur.prenom} ${row.auditeur.nom}` : '—',
  };
}

function toSuspensionView(row: SuspensionRow): SuspensionView {
  return {
    id: row.id,
    motif_suspension: row.motif_suspension,
    type_ecart: row.type_ecart,
    description_ecart: row.description_ecart,
    mesures_correctives: row.mesures_correctives,
    date_suspension: row.date_suspension,
    date_levee: row.date_levee ?? null,
    animateur_nom: row.animateur ? `${row.animateur.prenom} ${row.animateur.nom}` : '—',
  };
}

export function toATView(row: ATRow): ATView {
  return {
    id: row.id,
    numero_at: row.numero_at,
    titre: row.titre,
    description_travaux: row.description_travaux,
    statut: row.statut,
    zone: row.zone?.nom ?? '—',
    code_zone: row.zone?.code_zone ?? '—',
    zone_id: row.zone_id,
    entreprise_intervenante: row.entreprise_intervenante,
    chef_chantier: row.chef_chantier,
    nombre_intervenants_prevu: row.nombre_intervenants_prevu,
    date_debut_prevue: row.date_debut_prevue,
    date_fin_prevue: row.date_fin_prevue,
    niveau_risque: row.evaluation_risques?.niveau_risque_global,
    dangers_identifies: row.evaluation_risques?.dangers_identifies ?? [],
    epi_obligatoires: row.evaluation_risques?.epi_obligatoires ?? [],
    demandeur_nom: row.demandeur ? `${row.demandeur.prenom} ${row.demandeur.nom}` : '—',
    permis: (row.permis ?? []).map(toPermisView),
    suspensions: (row.suspensions_at ?? []).map(toSuspensionView),
    audits: (row.audits_at ?? []).map(toAuditView),
  };
}
