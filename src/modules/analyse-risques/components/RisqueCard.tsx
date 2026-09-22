import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronRight, MapPin, User, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { RisqueIndustriel } from '../types';
import { LABELS_PHASE, ICONES_PHASE, LABELS_STATUT_RISQUE } from '../types';
import { BadgeNiveauRisque } from './BadgeNiveauRisque';

const STATUT_STYLES: Record<RisqueIndustriel['statut'], string> = {
  OUVERT:            'bg-[var(--bg-hover)] text-[color:var(--text-secondary)]',
  EN_COURS:          'bg-navy-100 text-[color:var(--badge-navy-text)]',
  SOUS_SURVEILLANCE: 'bg-violet-500/10 text-[color:var(--badge-purple-text)]',
  CLOTURE:           'bg-success-100 text-[color:var(--badge-success-text)]',
};

function TendanceScore({ risque }: { risque: RisqueIndustriel }) {
  if (risque.score_residuel == null) return null;
  const delta = risque.score_residuel - risque.score_initial;
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-[color:var(--text-muted)]">
        <Minus size={11} /> stable
      </span>
    );
  }
  const baisse = delta < 0;
  return (
    <span className={clsx('inline-flex items-center gap-0.5 text-[11px] font-medium', baisse ? 'text-green-500' : 'text-red-500')}>
      {baisse ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
      {risque.score_initial} → {risque.score_residuel}
    </span>
  );
}

interface Props {
  risque: RisqueIndustriel;
  onClick: (risque: RisqueIndustriel) => void;
}

export function RisqueCard({ risque, onClick }: Props) {
  const niveauActuel = risque.niveau_residuel ?? risque.niveau_initial;
  const actions = risque.actions ?? [];
  const realisees = actions.filter(a => a.statut === 'REALISEE' || a.statut === 'VERIFIEE').length;

  return (
    <button
      type="button"
      onClick={() => onClick(risque)}
      className="w-full text-left card-hover overflow-hidden group"
    >
      <div className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-mono text-[color:var(--text-muted)]">{risque.numero}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--bg-hover)] text-[color:var(--text-secondary)]">
                {ICONES_PHASE[risque.phase]} {LABELS_PHASE[risque.phase]}
              </span>
              <BadgeNiveauRisque niveau={niveauActuel} taille="sm" />
            </div>
            <h3 className="font-semibold text-[color:var(--text-primary)] text-sm leading-snug group-hover:text-[color:var(--badge-navy-text)] transition-colors line-clamp-2">
              {risque.danger}
            </h3>
            <p className="text-xs text-[color:var(--text-muted)] mt-0.5 line-clamp-1">{risque.evenement_redoute || risque.consequence_potentielle}</p>
          </div>
          <ChevronRight size={16} className="text-[color:var(--text-secondary)] group-hover:text-[color:var(--badge-navy-text)] transition-colors flex-shrink-0 mt-1" />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-[color:var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <MapPin size={11} className="flex-shrink-0 text-[color:var(--text-muted)]" />
            <span className="truncate">{risque.zone_code ?? risque.activite}</span>
          </div>
          {risque.responsable_nom && (
            <div className="flex items-center gap-1.5">
              <User size={11} className="flex-shrink-0 text-[color:var(--text-muted)]" />
              <span className="truncate">{risque.responsable_nom}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
          <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', STATUT_STYLES[risque.statut])}>
            {LABELS_STATUT_RISQUE[risque.statut]}
          </span>
          <TendanceScore risque={risque} />
        </div>

        {actions.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-green-400 transition-all" style={{ width: `${Math.round((realisees / actions.length) * 100)}%` }} />
            </div>
            <span className="text-xs text-[color:var(--text-secondary)] flex-shrink-0">{realisees}/{actions.length} actions</span>
          </div>
        )}

        <p className="text-[10px] text-[color:var(--text-muted)] mt-2">
          Identifié le {format(new Date(risque.date_identification), 'dd MMM yyyy', { locale: fr })}
        </p>
      </div>
    </button>
  );
}
