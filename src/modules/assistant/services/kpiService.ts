// ─────────────────────────────────────────────────────────────────────────────
// kpiService — Calcule un résumé d'indicateurs (KPI) pour l'outil `get_kpis`
// de l'Assistant HSE. Réutilise `atService.listerATs()` (déjà scopé au site
// de l'utilisateur via les policies RLS Supabase) et tallie côté client —
// volontairement pas de nouvelle requête SQL dédiée pour ce v1.
// ─────────────────────────────────────────────────────────────────────────────

import * as atService from '@/modules/ptw/services/atService';
import { StatutAT, type ServiceResult } from '@/modules/ptw/types';

export interface KpiSummary {
  total: number;
  parStatut: Record<StatutAT, number>;
  suspendues: number;
  enRetard: number;
}

/** Statuts considérés comme "en cours" — une AT dans un autre statut ne peut pas être "en retard". */
const STATUTS_EN_COURS: StatutAT[] = [
  StatutAT.SOUMISE,
  StatutAT.VALIDEE,
  StatutAT.APPROUVEE,
  StatutAT.ACTIVE,
  StatutAT.SUSPENDUE,
];

export async function calculerKpis(): Promise<ServiceResult<KpiSummary>> {
  const { data, error } = await atService.listerATs();
  if (error || !data) {
    return { error: error ?? { code: 'FETCH_ERROR', message: 'Impossible de charger les autorisations de travail.' } };
  }

  const parStatut = Object.values(StatutAT).reduce((acc, statut) => {
    acc[statut] = 0;
    return acc;
  }, {} as Record<StatutAT, number>);

  const maintenant = Date.now();
  let suspendues = 0;
  let enRetard = 0;

  for (const at of data) {
    parStatut[at.statut] = (parStatut[at.statut] ?? 0) + 1;

    if (at.statut === StatutAT.SUSPENDUE) suspendues++;

    const finPrevue = at.date_fin_prevue ? new Date(at.date_fin_prevue).getTime() : NaN;
    if (!Number.isNaN(finPrevue) && finPrevue < maintenant && STATUTS_EN_COURS.includes(at.statut)) {
      enRetard++;
    }
  }

  return { data: { total: data.length, parStatut, suspendues, enRetard } };
}
