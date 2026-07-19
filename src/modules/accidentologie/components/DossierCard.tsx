import { Clock, MapPin, User, Link2, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DossierAccident } from '../types';
import {
  LABELS_TYPE, ICONES_TYPE, LABELS_STATUT,
  COULEURS_TYPE, delaiLegal,
} from '../types';

// ── Badge type événement ──────────────────────────────────────────────────────

function BadgeType({ type }: { type: DossierAccident['type_evenement'] }) {
  const c = COULEURS_TYPE[type];
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold', c.badge_bg, c.badge_text)}>
      <span>{ICONES_TYPE[type]}</span>
      {LABELS_TYPE[type]}
    </span>
  );
}

// ── Badge statut ──────────────────────────────────────────────────────────────

const STATUT_STYLES: Record<DossierAccident['statut'], string> = {
  SIGNALE:          'bg-[var(--bg-hover)] text-[color:var(--text-secondary)]',
  DECLARE:          'bg-safety-100 text-[color:var(--badge-safety-text)]',
  EN_INVESTIGATION: 'bg-navy-100 text-[color:var(--badge-navy-text)]',
  PLAN_ACTIONS:     'bg-violet-500/10 text-[color:var(--badge-purple-text)]',
  CLOTURE:          'bg-success-100 text-[color:var(--badge-success-text)]',
};

// Variante utilisée sur le bandeau bleu fixe (#0077aa) des en-têtes de page —
// ce bandeau reste toujours sombre quel que soit le thème, donc le badge garde
// un style blanc translucide fixe plutôt que les tokens de thème ci-dessus
// (qui deviennent illisibles en mode clair sur un fond resté sombre).
const STATUT_STYLES_HEADER: Record<DossierAccident['statut'], string> = {
  SIGNALE:          'bg-white/15 text-white',
  DECLARE:          'bg-white/15 text-white',
  EN_INVESTIGATION: 'bg-white/15 text-white',
  PLAN_ACTIONS:     'bg-white/15 text-white',
  CLOTURE:          'bg-white/15 text-white',
};

export function BadgeStatut({
  statut, variant = 'card',
}: {
  statut: DossierAccident['statut'];
  /** 'card' (défaut) sur les fonds thémés · 'header' sur le bandeau bleu fixe */
  variant?: 'card' | 'header';
}) {
  const styles = variant === 'header' ? STATUT_STYLES_HEADER : STATUT_STYLES;
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', styles[statut])}>
      {statut === 'CLOTURE' && <CheckCircle2 size={11} className="mr-1" />}
      {LABELS_STATUT[statut]}
    </span>
  );
}

// ── Alerte délai légal ────────────────────────────────────────────────────────

function AlerteDelai({ dossier }: { dossier: DossierAccident }) {
  const delai = delaiLegal(dossier.type_evenement);
  if (!delai || dossier.declaration_cpam) return null;
  if (dossier.statut === 'CLOTURE') return null;

  const now = new Date();
  const event = new Date(dossier.date_evenement);
  const heuresEcoulees = (now.getTime() - event.getTime()) / (1000 * 3600);
  const heuresRestantes = delai - heuresEcoulees;

  if (heuresRestantes > delai * 0.5) return null; // pas encore urgent

  const enRetard = heuresRestantes <= 0;

  return (
    <div className={clsx(
      'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
      enRetard ? 'bg-danger-100 text-[color:var(--badge-danger-text)]' : 'bg-amber-100 text-[color:var(--badge-amber-text)]',
    )}>
      <AlertTriangle size={11} />
      {enRetard
        ? `Déclaration CPAM en retard (délai ${delai}h dépassé)`
        : `Déclaration CPAM requise sous ${Math.max(0, Math.round(heuresRestantes))}h`
      }
    </div>
  );
}

// ── Barre de progression actions ─────────────────────────────────────────────

function BarreActions({ actions }: { actions: DossierAccident['actions'] }) {
  if (actions.length === 0) return null;
  const realisees = actions.filter(a => a.statut === 'REALISEE').length;
  const enRetard  = actions.filter(a => a.statut === 'EN_RETARD').length;
  const pct = Math.round((realisees / actions.length) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all', enRetard > 0 ? 'bg-orange-400' : 'bg-green-400')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[color:var(--text-secondary)] flex-shrink-0">{realisees}/{actions.length} actions</span>
    </div>
  );
}

// ── Carte principale ──────────────────────────────────────────────────────────

interface DossierCardProps {
  dossier: DossierAccident;
  onClick: (dossier: DossierAccident) => void;
}

export function DossierCard({ dossier, onClick }: DossierCardProps) {
  const c = COULEURS_TYPE[dossier.type_evenement];
  const dateEvt = format(new Date(dossier.date_evenement), 'dd MMM yyyy HH:mm', { locale: fr });
  const victime = dossier.victimes[0];

  return (
    <button
      type="button"
      onClick={() => onClick(dossier)}
      className={clsx(
        'w-full text-left card-hover overflow-hidden group',
        c.border,
      )}
    >
      {/* Bande colorée type */}
      <div className={clsx('h-1 w-full', {
        'bg-red-400':    dossier.type_evenement === 'FATAL',
        'bg-orange-400': dossier.type_evenement === 'GRAVE',
        'bg-yellow-400': dossier.type_evenement === 'BENIN',
        'bg-green-400':  dossier.type_evenement === 'PRESQU_ACCIDENT',
        'bg-blue-400':   dossier.type_evenement === 'SITUATION_DANGEREUSE',
        'bg-violet-400': dossier.type_evenement === 'OBSERVATION',
      })} />

      <div className="p-5">
        {/* En-tête */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-mono text-[color:var(--text-muted)]">{dossier.numero}</span>
              <BadgeType type={dossier.type_evenement} />
              <BadgeStatut statut={dossier.statut} />
            </div>
            <h3 className="font-semibold text-[color:var(--text-primary)] text-sm leading-snug group-hover:text-[color:var(--badge-navy-text)] transition-colors line-clamp-2">
              {dossier.titre}
            </h3>
          </div>
          <ChevronRight size={16} className="text-[color:var(--text-secondary)] group-hover:text-[color:var(--badge-navy-text)] transition-colors flex-shrink-0 mt-1" />
        </div>

        {/* Alerte délai */}
        <AlerteDelai dossier={dossier} />

        {/* Métadonnées */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-xs text-[color:var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="flex-shrink-0 text-[color:var(--text-muted)]" />
            <span className="truncate">{dateEvt}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={11} className="flex-shrink-0 text-[color:var(--text-muted)]" />
            <span className="truncate">{dossier.zone_code}</span>
          </div>
          {victime && (
            <div className="flex items-center gap-1.5 col-span-2">
              <User size={11} className="flex-shrink-0 text-[color:var(--text-muted)]" />
              <span className="truncate">
                {victime.prenom} {victime.nom} — {victime.poste}
                {victime.jours_arret > 0 && (
                  <span className="text-orange-400 font-medium"> · {victime.jours_arret}j arrêt</span>
                )}
              </span>
            </div>
          )}
          {dossier.at_liee_numero && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Link2 size={11} className="flex-shrink-0 text-[color:var(--badge-navy-text)]" />
              <span className="text-[color:var(--badge-navy-text)] truncate">AT liée : {dossier.at_liee_numero}</span>
            </div>
          )}
        </div>

        {/* Barre actions */}
        {dossier.actions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <BarreActions actions={dossier.actions} />
          </div>
        )}

        {/* Investigateur */}
        {dossier.investigateur && dossier.statut !== 'CLOTURE' && (
          <div className="mt-2 text-xs text-[color:var(--text-muted)]">
            Investigation : {dossier.investigateur}
          </div>
        )}
        {dossier.statut === 'CLOTURE' && dossier.date_cloture && (
          <div className="mt-2 text-xs text-green-600 font-medium">
            Clôturé le {format(new Date(dossier.date_cloture), 'dd/MM/yyyy', { locale: fr })} — {dossier.validateur_cloture}
          </div>
        )}
      </div>
    </button>
  );
}
