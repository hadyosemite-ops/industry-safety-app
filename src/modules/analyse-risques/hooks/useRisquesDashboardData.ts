// ─────────────────────────────────────────────────────────────────────────────
// useRisquesDashboardData — Charge le registre des risques (avec cotations et
// actions déjà jointes en une seule requête) et expose un refetch pour
// resynchroniser après une action métier (création, réévaluation, plan d'action).
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import * as risqueService from '../services/risqueService';
import type { FiltresRisques } from '../services/risqueService';
import type { RisqueIndustriel } from '../types';

export interface UseRisquesDashboardDataResult {
  risques: RisqueIndustriel[];
  setRisques: React.Dispatch<React.SetStateAction<RisqueIndustriel[]>>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRisquesDashboardData(filtres?: FiltresRisques): UseRisquesDashboardDataResult {
  const [risques, setRisques] = useState<RisqueIndustriel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refetch = useCallback(async () => {
    const myRequestId = ++requestId.current;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await risqueService.listerRisques(filtres);
    if (myRequestId !== requestId.current) return; // requête obsolète

    if (fetchError || !data) {
      setError(fetchError?.message ?? 'Impossible de charger le registre des risques.');
      setRisques([]);
    } else {
      setRisques(data);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtres?.phase, filtres?.statut, filtres?.niveau, filtres?.zone_id]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { risques, setRisques, loading, error, refetch };
}
