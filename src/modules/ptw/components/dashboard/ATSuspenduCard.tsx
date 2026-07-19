import { useState } from 'react';
import {
  AlertTriangle, Building2, MapPin,
  Clock, CheckCircle2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ATView } from '../../types/dashboardView';
import { BadgeRisque } from './DashboardAnimateur';
import { PermisChip } from './DashboardAnimateur';
import { AuditModal, AuditFormData } from './AuditModal';
import type { PTWActions } from '../../hooks/usePTWActions';

// ── Libellés types écart ──────────────────────────────────────────────────────

const LABELS_ECART: Record<string, string> = {
  EPI_MANQUANT:             '🦺 EPI manquant / non conforme',
  ZONE_NON_SECURISEE:       '⚠️ Zone non sécurisée',
  INTERVENANT_NON_HABILITE: '🚫 Intervenant non habilité',
  DEFAUT_ISOLATION:         '🔒 Défaut de consignation',
  ECART_PROCEDURE:          '📋 Non-respect de procédure',
  RISQUE_TIERS:             '👥 Risque pour tiers',
  CONDITION_METEO:          '🌦️ Condition météo',
  AUTRE:                    '📌 Autre',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  at: ATView;
  actions: PTWActions;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function ATSuspenduCard({ at, actions }: Props) {
  const [detailsOuverts, setDetailsOuverts] = useState(false);
  const [auditModalOuvert, setAuditModalOuvert] = useState(false);

  // suspension ouverte (non levée)
  const suspension = at.suspensions.find(s => !s.date_levee) ?? at.suspensions[0];

  const dateSuspension = suspension ? (() => {
    try { return format(new Date(suspension.date_suspension), "dd MMM yyyy 'à' HH:mm", { locale: fr }); }
    catch { return suspension.date_suspension; }
  })() : '—';

  async function handleAuditLevee(data: AuditFormData) {
    if (!suspension) return;
    const ok = await actions.leverSuspensionAvecAudit(at.id, suspension.id, data);
    if (ok) setAuditModalOuvert(false);
  }

  if (!suspension) return null;

  return (
    <>
      <div className="card border-safety-200 overflow-hidden">

        {/* Bandeau suspension */}
        <div className="bg-orange-500 px-5 py-2.5 flex items-center gap-2">
          <AlertTriangle size={15} className="text-white flex-shrink-0 animate-pulse" />
          <span className="text-white text-sm font-semibold">AT SUSPENDUE</span>
          <span className="text-orange-100 text-xs ml-1">· Tous les travaux sont arrêtés</span>
        </div>

        {/* ── Header ── */}
        <div className="px-5 pt-4 pb-3 border-b border-safety-100">
          <div className="flex items-start gap-3">
            <div className="w-1 self-stretch rounded-full flex-shrink-0 bg-orange-400" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-mono text-[color:var(--text-muted)] bg-[var(--bg-hover)] border border-[var(--border)] px-2 py-0.5 rounded-md">
                  {at.numero_at}
                </span>
                <BadgeRisque niveau={at.niveau_risque} />
              </div>
              <h3 className="font-bold text-[color:var(--text-primary)] text-sm leading-snug">{at.titre}</h3>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)]">
              <Building2 size={12} className="text-[color:var(--text-muted)] flex-shrink-0" />
              <span className="truncate">{at.entreprise_intervenante}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)]">
              <MapPin size={12} className="text-[color:var(--text-muted)] flex-shrink-0" />
              <span className="truncate">[{at.code_zone}] {at.zone}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)]">
              <Clock size={12} className="text-orange-500 flex-shrink-0" />
              <span className="text-[color:var(--badge-safety-text)] font-medium">Suspendue le {dateSuspension}</span>
            </div>
          </div>
        </div>

        {/* ── Motif suspension ── */}
        <div className="px-5 py-4 bg-safety-50 border-b border-safety-100">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 bg-safety-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle size={15} className="text-safety-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-[color:var(--badge-safety-text)] uppercase tracking-wider mb-1">
                {LABELS_ECART[suspension.type_ecart] ?? suspension.type_ecart}
              </p>
              <p className="text-sm text-[color:var(--text-primary)] font-medium leading-snug">
                {suspension.motif_suspension}
              </p>
              {suspension.description_ecart !== suspension.motif_suspension && (
                <p className="text-xs text-[color:var(--text-secondary)] mt-1 leading-relaxed">
                  {suspension.description_ecart}
                </p>
              )}
            </div>
          </div>

          {/* Mesures correctives */}
          <button
            type="button"
            onClick={() => setDetailsOuverts(v => !v)}
            className="mt-3 w-full flex items-center gap-1.5 text-xs font-medium text-[color:var(--badge-safety-text)] hover:text-safety-300"
          >
            {detailsOuverts ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Mesures correctives requises
          </button>
          {detailsOuverts && (
            <div className="mt-2 bg-[var(--bg-hover)] border border-safety-200 rounded-xl p-3">
              <p className="text-sm text-[color:var(--text-primary)]">{suspension.mesures_correctives}</p>
              <p className="text-xs text-[color:var(--text-muted)] mt-2">
                Suspendu par <strong className="text-[color:var(--text-secondary)]">{suspension.animateur_nom}</strong>
              </p>
            </div>
          )}
        </div>

        {/* ── Permis suspendus ── */}
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <p className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wider mb-2">
            Permis suspendus
          </p>
          <div className="space-y-1.5">
            {at.permis.map(permis => (
              <PermisChip key={permis.id} permis={permis} clickable={false} />
            ))}
          </div>
        </div>

        {/* ── Action levée ── */}
        <div className="px-5 py-4">
          <div className="bg-navy-50 border border-navy-100 rounded-xl p-3.5 mb-3">
            <p className="text-sm text-[color:var(--badge-navy-text)] font-medium">Pour lever la suspension :</p>
            <p className="text-xs text-[color:var(--badge-navy-text)] mt-1">
              Les mesures correctives doivent être réalisées, puis valider via un audit de type
              <strong> Levée de suspension</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAuditModalOuvert(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0077aa] text-white text-sm font-semibold hover:bg-[#0077aa]/90 transition-colors shadow-sm"
          >
            <CheckCircle2 size={15} />
            Réaliser l'audit de levée de suspension
          </button>
        </div>
      </div>

      {/* Modal audit levée */}
      {auditModalOuvert && (
        <AuditModal at={at} onClose={() => setAuditModalOuvert(false)} onConfirmer={handleAuditLevee} />
      )}
    </>
  );
}
