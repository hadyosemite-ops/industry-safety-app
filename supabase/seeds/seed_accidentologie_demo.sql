-- ============================================================
-- Seed de démonstration — Module Accidentologie
-- À exécuter UNE FOIS dans le SQL Editor Supabase, après la migration
-- 007_accidentologie.sql. Utilise automatiquement le premier site (et sa
-- première zone / premier utilisateur) trouvés en base — si tu as plusieurs
-- sites, adapte la clause `ORDER BY` du SELECT INTO v_site ci-dessous pour
-- cibler le bon.
-- Ré-exécuter ce script crée de nouveaux dossiers en doublon (pas
-- d'idempotence) — à lancer une seule fois.
-- ============================================================

DO $$
DECLARE
  v_site     UUID;
  v_zone     UUID;
  v_user     UUID;
  v_dossier1 UUID;
  v_dossier2 UUID;
  v_dossier3 UUID;
  v_action1  UUID;
BEGIN
  SELECT id INTO v_site FROM sites ORDER BY created_at LIMIT 1;
  SELECT id INTO v_zone FROM zones WHERE site_id = v_site ORDER BY nom LIMIT 1;
  SELECT id INTO v_user FROM utilisateurs WHERE site_id = v_site ORDER BY created_at LIMIT 1;

  IF v_site IS NULL THEN
    RAISE EXCEPTION 'Aucun site trouvé — crée au moins un site avant de lancer ce seed.';
  END IF;

  -- Renseigne l'effectif / les heures travaillées du site si absents
  -- (nécessaires au calcul TF/TG/IF).
  UPDATE sites
  SET effectif = COALESCE(effectif, 145),
      heures_travaillees_mensuelles = COALESCE(heures_travaillees_mensuelles, 21000)
  WHERE id = v_site;

  -- ── Dossier 1 : accident avec arrêt (GRAVE), clôturé, plan d'actions ─────
  INSERT INTO dossiers_accidents (
    site_id, type_evenement, statut, titre, date_evenement, zone_id, lieu, description,
    date_investigation, investigateur_id, date_cloture, validateur_cloture_id, lecons_retenues,
    declarant_nom, declarant_poste, declaration_cpam, declaration_it
  ) VALUES (
    v_site, 'GRAVE', 'CLOTURE', 'Chute de hauteur — passerelle maintenance',
    NOW() - INTERVAL '45 days', v_zone, 'Atelier Énergie — Niveau +4m',
    'Un opérateur a glissé sur une passerelle métallique humide lors d''une opération de maintenance, entraînant une chute de 1,5 m.',
    NOW() - INTERVAL '43 days', v_user, NOW() - INTERVAL '10 days', v_user,
    'Renforcer le contrôle des surfaces avant intervention et généraliser les EPI antichute sur cette zone.',
    'Jean Dupont', 'Chef d''équipe maintenance', TRUE, FALSE
  ) RETURNING id INTO v_dossier1;

  INSERT INTO accidents_victimes (dossier_id, nom, prenom, poste, entreprise, anciennete_mois, nature_blessure, siege_lesion, jours_arret)
  VALUES (v_dossier1, 'Martin', 'Luc', 'Technicien maintenance', 'Interne', 36, 'Entorse', 'Cheville droite', 12);

  INSERT INTO accidents_temoins (dossier_id, nom, prenom, poste, declaration)
  VALUES (v_dossier1, 'Bernard', 'Sophie', 'Opératrice ligne 2',
    'J''ai vu Luc glisser au moment où il posait le pied sur la passerelle, la surface était mouillée.');

  INSERT INTO accidents_actions (dossier_id, description, categorie, responsable_id, date_echeance, date_realisation, statut, priorite)
  VALUES (v_dossier1, 'Installer un revêtement antidérapant sur la passerelle', 'TECHNIQUE', v_user,
    (NOW() - INTERVAL '20 days')::date, (NOW() - INTERVAL '15 days')::date, 'REALISEE', 'HAUTE')
  RETURNING id INTO v_action1;

  INSERT INTO accidents_actions (dossier_id, description, categorie, responsable_id, date_echeance, statut, priorite)
  VALUES (v_dossier1, 'Rappel consignes port EPI antichute en réunion sécurité', 'FORMATION', v_user,
    (NOW() + INTERVAL '5 days')::date, 'EN_COURS', 'NORMALE');

  INSERT INTO accidents_causes (dossier_id, type, description, parent_ids, action_corrective_id)
  VALUES (v_dossier1, 'FAIT_IMMEDIAT', 'Glissade sur passerelle humide', '{}', v_action1);

  -- ── Dossier 2 : accident sans arrêt (BENIN), en investigation ───────────
  INSERT INTO dossiers_accidents (
    site_id, type_evenement, statut, titre, date_evenement, zone_id, lieu, description,
    date_investigation, investigateur_id, declarant_nom, declarant_poste
  ) VALUES (
    v_site, 'BENIN', 'EN_INVESTIGATION', 'Coupure main lors du conditionnement',
    NOW() - INTERVAL '8 days', v_zone, 'Ligne de conditionnement B',
    'Coupure superficielle à la main lors de la manipulation d''un carton avec un cutter.',
    NOW() - INTERVAL '6 days', v_user, 'Claire Petit', 'Opératrice conditionnement'
  ) RETURNING id INTO v_dossier2;

  INSERT INTO accidents_victimes (dossier_id, nom, prenom, poste, entreprise, anciennete_mois, nature_blessure, siege_lesion, jours_arret)
  VALUES (v_dossier2, 'Petit', 'Claire', 'Opératrice conditionnement', 'Interne', 8, 'Coupure superficielle', 'Main gauche', 0);

  -- ── Dossier 3 : presqu'accident, déclaré ────────────────────────────────
  INSERT INTO dossiers_accidents (site_id, type_evenement, statut, titre, date_evenement, zone_id, lieu, description, declarant_nom, declarant_poste)
  VALUES (
    v_site, 'PRESQU_ACCIDENT', 'DECLARE', 'Chute d''un outil depuis une nacelle',
    NOW() - INTERVAL '3 days', v_zone, 'Atelier Chimie',
    'Une clé à molette est tombée d''une nacelle élévatrice, à proximité d''un opérateur au sol, sans le toucher.',
    'Ahmed Ben Ali', 'Cariste'
  ) RETURNING id INTO v_dossier3;

  -- ── Dossier 4 : situation dangereuse, signalée ──────────────────────────
  INSERT INTO dossiers_accidents (site_id, type_evenement, statut, titre, date_evenement, zone_id, lieu, description, declarant_nom, declarant_poste)
  VALUES (
    v_site, 'SITUATION_DANGEREUSE', 'SIGNALE', 'Câble électrique dénudé repéré',
    NOW() - INTERVAL '1 day', v_zone, 'Local technique',
    'Un câble d''alimentation présentant une gaine endommagée a été repéré près du tableau électrique principal.',
    'Sophie Bernard', 'Opératrice ligne 2'
  );

  -- ── Dossier 5 : observation sécurité, signalée ──────────────────────────
  INSERT INTO dossiers_accidents (site_id, type_evenement, statut, titre, date_evenement, zone_id, lieu, description, declarant_nom, declarant_poste)
  VALUES (
    v_site, 'OBSERVATION', 'SIGNALE', 'Extincteur non accessible',
    NOW() - INTERVAL '2 days', v_zone, 'Zone logistique',
    'Un extincteur est actuellement obstrué par des palettes stockées devant.',
    'Marc Robert', 'Magasinier'
  );

  RAISE NOTICE 'Données de démonstration Accidentologie insérées avec succès pour le site %.', v_site;
END $$;
