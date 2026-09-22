// ─────────────────────────────────────────────────────────────────────────────
// useAccidentologieDashboardData — Charge les dossiers accidentologie (avec
// victimes/témoins/causes/actions déjà jointes) ainsi que les KPI calculés
// (TF/TG/IF, actions soldées…) et expose un refetch pour resynchroniser après
// une déclaration, une investigation ou une clôture.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as dossierService from '../services/dossierService';
import type { FiltresDossiers, KpisAccidentologieCalcules } from '../services/dossierService';
import type { DossierAccident } from '../types';

export interface UseAccidentologieDashboardDataResult {
  dossiers: DossierAccident[];
  setDossiers: React.Dispatch<React.SetStateAction<DossierAccident[]>>;
  kpis: KpisAccidentologieCalcules | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const KPIS_VIDES: KpisAccidentologieCalcules = {
  tf: 0, tg: 0, if_: 0, nb_at_arret: 0, nb_at_sans_arret: 0, nb_presqu_accidents: 0,
  nb_situations: 0, nb_observations: 0, jours_perdus: 0, heures_travaillees: 0, effectif: 0,
  taux_actions_soldees: 0, taux_presqu_accidents: 0,
};

export function useAccidentologieDashboardData(filtres?: FiltresDossiers): UseAccidentologieDashboardDataResult {
  const { profile } = useAuth();
  const [dossiers, setDossiers] = useState<DossierAccident[]>([]);
  const [kpis, setKpis] = useState<KpisAccidentologieCalcules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refetch = useCallback(async () => {
    const myRequestId = ++requestId.current;
    setLoading(true);
    setError(null);

    const [dossiersResult, kpisResult] = await Promise.all([
      dossierService.listerDossiers(filtres),
      profile?.site_id ? dossierService.calculerKpisAccidentologie(profile.site_id) : Promise.resolve({ data: KPIS_VIDES }),
    ]);
    if (myRequestId !== requestId.current) return; // requête obsolète

    if (dossiersResult.error || !dossiersResult.data) {
      setError(dossiersResult.error?.message ?? 'Impossible de charger les dossiers accidentologie.');
      setDossiers([]);
    } else {
      setDossiers(dossiersResult.data);
    }
    setKpis(kpisResult.data ?? KPIS_VIDES);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtres?.statut, filtres?.type_evenement, filtres?.zone_id, profile?.site_id]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { dossiers, setDossiers, kpis, loading, error, refetch };
}
