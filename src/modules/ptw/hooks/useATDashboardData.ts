// ─────────────────────────────────────────────────────────────────────────────
// useATDashboardData — Charge les AT du site (via atService) et les adapte en
// ATView pour les composants du dashboard PTW.
//
// `atService.listerATs()` ne renvoie qu'un résumé des permis (id, type,
// statut, qr token) — insuffisant pour les cartes détail (checklist,
// intervenants…). On récupère donc la liste des id via `listerATs()` puis on
// charge chaque AT en détail via `atService.getAT()` (déjà utilisé partout
// ailleurs dans l'appli pour la vue détail). C'est un N+1 assumé : les
// services existants ne doivent pas être réécrits, et le nombre d'AT par site
// reste modeste dans ce contexte HSE.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import * as atService from '../services/atService';
import { toATView } from '../utils/atAdapter';
import type { ATRow } from '../utils/atAdapter';
import type { ATView } from '../types/dashboardView';
import type { StatutAT } from '../types';

export interface UseATDashboardDataResult {
  ats: ATView[];
  setAts: React.Dispatch<React.SetStateAction<ATView[]>>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useATDashboardData(filtres?: { statut?: StatutAT }): UseATDashboardDataResult {
  const [ats, setAts] = useState<ATView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Évite de committer le résultat d'une requête obsolète si `refetch` est
  // appelé de nouveau avant que la précédente n'ait fini.
  const requestId = useRef(0);

  const refetch = useCallback(async () => {
    const myRequestId = ++requestId.current;
    setLoading(true);
    setError(null);

    const { data: list, error: listError } = await atService.listerATs(filtres);
    if (listError || !list) {
      if (myRequestId === requestId.current) {
        setError(listError?.message ?? 'Impossible de charger les autorisations de travail.');
        setAts([]);
        setLoading(false);
      }
      return;
    }

    const details = await Promise.all(list.map(at => atService.getAT(at.id)));
    if (myRequestId !== requestId.current) return; // requête obsolète

    const premiereErreur = details.find(d => d.error)?.error;
    const rows = details.map(d => d.data).filter((d): d is NonNullable<typeof d> => !!d);

    setAts(rows.map(row => toATView(row as unknown as ATRow)));
    if (premiereErreur && rows.length === 0) {
      setError(premiereErreur.message);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtres?.statut]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { ats, setAts, loading, error, refetch };
}
