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
    };
  };
}
