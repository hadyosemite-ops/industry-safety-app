// ============================================================
// Types Supabase générés — Base de données PTW
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      utilisateurs: {
        Row: {
          id: string;
          email: string;
          nom: string;
          prenom: string;
          roles: string[];
          site_id: string;
          habilitations: string[] | null;
          telephone: string | null;
          actif: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['utilisateurs']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['utilisateurs']['Insert']>;
      };
      sites: {
        Row: {
          id: string;
          nom: string;
          adresse: string;
          code_site: string;
          actif: boolean;
          effectif: number | null;
          heures_travaillees_mensuelles: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sites']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['sites']['Insert']>;
      };
      zones: {
        Row: {
          id: string;
          site_id: string;
          nom: string;
          code_zone: string;
          description: string | null;
          niveau_risque_defaut: string;
          responsable_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['zones']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['zones']['Insert']>;
      };
      autorisations_travail: {
        Row: {
          id: string;
          numero_at: string;
          site_id: string;
          zone_id: string;
          demandeur_id: string;
          animateur_id: string | null;
          approbateur_id: string | null;
          titre: string;
          description_travaux: string;
          entreprise_intervenante: string;
          chef_chantier: string;
          nombre_intervenants_prevu: number;
          date_debut_prevue: string;
          date_fin_prevue: string;
          date_debut_effective: string | null;
          date_fin_effective: string | null;
          evaluation_risques: Json;
          statut: string;
          statut_precedent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['autorisations_travail']['Row'], 'id' | 'numero_at' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['autorisations_travail']['Insert']>;
      };
      permis: {
        Row: {
          id: string;
          at_id: string;
          type_permis: string;
          statut: string;
          statut_avant_suspension: string | null;
          checklist_reponses: Json;
          mesures_prevention: string[];
          epi_requis: string[];
          equipements_concernes: string[] | null;
          intervenants: Json;
          valide_par: string | null;
          valide_le: string | null;
          commentaire_validation: string | null;
          rejete_par: string | null;
          rejete_le: string | null;
          motif_rejet: string | null;
          qr_code_token: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['permis']['Row'], 'id' | 'qr_code_token' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['permis']['Insert']>;
      };
      audits_at: {
        Row: {
          id: string;
          at_id: string;
          auditeur_id: string;
          type_audit: string;
          date_audit: string;
          checklist_audit: Json;
          ecarts_constates: string | null;
          points_positifs: string | null;
          photos: Json | null;
          resultat: string;
          recommandations: string | null;
          signature_base64: string | null;
          localisation_gps: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audits_at']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['audits_at']['Insert']>;
      };
      suspensions_at: {
        Row: {
          id: string;
          at_id: string;
          animateur_id: string;
          motif_suspension: string;
          type_ecart: string;
          description_ecart: string;
          photos_ecart: Json | null;
          mesures_correctives: string;
          delai_correction: string | null;
          audit_levee_id: string | null;
          levee_par: string | null;
          date_levee: string | null;
          commentaire_levee: string | null;
          date_suspension: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['suspensions_at']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['suspensions_at']['Insert']>;
      };
      historique_statuts_at: {
        Row: {
          id: string;
          at_id: string;
          statut_avant: string;
          statut_apres: string;
          acteur_id: string;
          motif: string | null;
          metadata: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          timestamp: string;
        };
        Insert: Omit<Database['public']['Tables']['historique_statuts_at']['Row'], 'id'>;
        Update: never; // Immuable
      };
      intervenants_permis: {
        Row: {
          id: string;
          permis_id: string;
          user_id: string | null;
          nom_complet: string;
          entreprise: string | null;
          habilitations: string[] | null;
          check_in_at: string | null;
          check_out_at: string | null;
          check_in_gps: Json | null;
        };
        Insert: Omit<Database['public']['Tables']['intervenants_permis']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['intervenants_permis']['Insert']>;
      };
      risques_industriels: {
        Row: {
          id: string;
          numero: string;
          site_id: string;
          zone_id: string | null;
          phase: string;
          activite: string;
          danger: string;
          situation_dangereuse: string;
          evenement_redoute: string | null;
          consequence_potentielle: string;
          frequence_initiale: number;
          gravite_initiale: number;
          score_initial: number;
          niveau_initial: string;
          moyens_protection: Json;
          frequence_residuelle: number | null;
          gravite_residuelle: number | null;
          score_residuel: number | null;
          niveau_residuel: string | null;
          justification_alarp: string | null;
          statut: string;
          responsable_id: string | null;
          date_identification: string;
          date_derniere_cotation: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['risques_industriels']['Row'],
          'id' | 'numero' | 'evenement_redoute' | 'score_initial' | 'niveau_initial' | 'score_residuel' | 'niveau_residuel' | 'date_derniere_cotation' | 'created_at' | 'updated_at'
        > & { numero?: string; evenement_redoute?: string | null };
        Update: Partial<Database['public']['Tables']['risques_industriels']['Insert']>;
      };
      cotations_risques: {
        Row: {
          id: string;
          risque_id: string;
          type: string;
          frequence: number;
          gravite: number;
          score: number;
          niveau: string;
          auteur_id: string | null;
          commentaire: string | null;
          date: string;
        };
        Insert: Omit<Database['public']['Tables']['cotations_risques']['Row'], 'id' | 'score' | 'niveau'>;
        Update: never; // Immuable
      };
      actions_risques: {
        Row: {
          id: string;
          risque_id: string;
          description: string;
          type_mesure: string;
          responsable_id: string | null;
          date_creation: string;
          date_echeance: string;
          statut: string;
          date_realisation: string | null;
          date_verification: string | null;
          verificateur_id: string | null;
          preuve_cloture: Json | null;
          commentaire: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['actions_risques']['Row'], 'id' | 'date_echeance' | 'created_at' | 'updated_at'> & { date_echeance?: string };
        Update: Partial<Database['public']['Tables']['actions_risques']['Insert']>;
      };
      dossiers_accidents: {
        Row: {
          id: string;
          site_id: string;
          numero: string;
          type_evenement: string;
          statut: string;
          titre: string;
          date_evenement: string;
          date_declaration: string;
          zone_id: string | null;
          lieu: string | null;
          description: string;
          date_investigation: string | null;
          investigateur_id: string | null;
          cinq_pourquoi: string[] | null;
          at_liee_id: string | null;
          date_cloture: string | null;
          validateur_cloture_id: string | null;
          lecons_retenues: string | null;
          declarant_nom: string;
          declarant_poste: string;
          declaration_cpam: boolean;
          declaration_it: boolean;
          date_cpam: string | null;
          date_it: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database['public']['Tables']['dossiers_accidents']['Row'],
          'id' | 'numero' | 'created_at' | 'updated_at'
        > & { numero?: string };
        Update: Partial<Database['public']['Tables']['dossiers_accidents']['Insert']>;
      };
      accidents_victimes: {
        Row: {
          id: string;
          dossier_id: string;
          nom: string;
          prenom: string;
          poste: string;
          entreprise: string;
          anciennete_mois: number;
          nature_blessure: string;
          siege_lesion: string;
          jours_arret: number;
        };
        Insert: Omit<Database['public']['Tables']['accidents_victimes']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['accidents_victimes']['Insert']>;
      };
      accidents_temoins: {
        Row: {
          id: string;
          dossier_id: string;
          nom: string;
          prenom: string;
          poste: string;
          declaration: string | null;
        };
        Insert: Omit<Database['public']['Tables']['accidents_temoins']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['accidents_temoins']['Insert']>;
      };
      accidents_actions: {
        Row: {
          id: string;
          dossier_id: string;
          description: string;
          categorie: string;
          responsable_id: string | null;
          date_echeance: string;
          date_realisation: string | null;
          statut: string;
          commentaire: string | null;
          priorite: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['accidents_actions']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['accidents_actions']['Insert']>;
      };
      accidents_causes: {
        Row: {
          id: string;
          dossier_id: string;
          type: string;
          description: string;
          parent_ids: string[];
          action_corrective_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['accidents_causes']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['accidents_causes']['Insert']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generer_numero_at: {
        Args: { site_code: string };
        Returns: string;
      };
    };
    Enums: {
      statut_at: 'BROUILLON' | 'SOUMISE' | 'VALIDEE' | 'APPROUVEE' | 'ACTIVE' | 'SUSPENDUE' | 'CLOTUREE';
      statut_permis: 'EN_ATTENTE' | 'VALIDE' | 'SUSPENDU' | 'CLOS' | 'REJETE';
      type_permis: 'TRAVAIL_CHAUD' | 'ESPACE_CONFINE' | 'ELECTRIQUE_LOTO' | 'TRAVAIL_HAUTEUR' | 'ATEX_CHIMIQUE' | 'EXCAVATION' | 'TRAVAUX_PRESSION' | 'TRAVAUX_GENERAUX';
      role_utilisateur: 'DEMANDEUR' | 'ANIMATEUR_SECURITE' | 'RESP_ZONE' | 'HSE_MANAGER' | 'EXECUTANT' | 'ADMIN';
      type_audit: 'PROGRAMME' | 'INOPINE' | 'LEVEE_SUSPENSION';
      resultat_audit: 'CONFORME' | 'NON_CONFORME' | 'CONFORME_RESERVES';
      type_ecart: 'EPI_MANQUANT' | 'ZONE_NON_SECURISEE' | 'INTERVENANT_NON_HABILITE' | 'CONDITION_METEO' | 'DEFAUT_ISOLATION' | 'ECART_PROCEDURE' | 'RISQUE_TIERS' | 'AUTRE';
      niveau_risque: 'MODERE' | 'ELEVE' | 'CRITIQUE';
      phase_risque: 'INSTALLATION' | 'OPERATION';
      niveau_criticite: 'FAIBLE' | 'MODERE' | 'ELEVE' | 'CRITIQUE';
      statut_risque: 'OUVERT' | 'EN_COURS' | 'SOUS_SURVEILLANCE' | 'CLOTURE';
      type_mesure_hierarchie: 'ELIMINATION' | 'SUBSTITUTION' | 'CONTROLE_TECHNIQUE' | 'CONTROLE_ADMINISTRATIF' | 'EPI';
      statut_action_risque: 'PLANIFIEE' | 'EN_COURS' | 'REALISEE' | 'VERIFIEE';
      type_cotation: 'INITIALE' | 'INTERMEDIAIRE' | 'RESIDUELLE';
      type_evenement_accident: 'FATAL' | 'GRAVE' | 'BENIN' | 'PRESQU_ACCIDENT' | 'SITUATION_DANGEREUSE' | 'OBSERVATION';
      statut_dossier_accident: 'SIGNALE' | 'DECLARE' | 'EN_INVESTIGATION' | 'PLAN_ACTIONS' | 'CLOTURE';
      statut_action_accident: 'A_FAIRE' | 'EN_COURS' | 'REALISEE' | 'EN_RETARD';
      type_cause_accident: 'FAIT_IMMEDIAT' | 'CAUSE_INTERMEDIAIRE' | 'CAUSE_PROFONDE';
      categorie_action_accident: 'TECHNIQUE' | 'ORGANISATIONNELLE' | 'HUMAINE' | 'FORMATION' | 'PROCEDURE' | 'EPI';
      priorite_action_accident: 'HAUTE' | 'NORMALE' | 'BASSE';
    };
  };
}
