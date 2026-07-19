import { useState } from 'react';
import {
  Building2, Calendar, MapPin, Users, ChevronRight,
  CheckCircle2, Clock, AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ATDemo, PermisDemo } from './demo.data';
import { BadgeRisque } from './DashboardAnimateur';
import { PermisChip } from './DashboardAnimateur';
import { PermisValidationModal } from './PermisValidationModal';

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  at: ATDemo;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function ATValidationCard({ at }: Props) {
  const [permisModalOuvert, setPermisModalOuvert] = useState<PermisDemo | null>(null);
  const [permisData, setPermisData] = useState<PermisDemo[]>(at.permis);

  const totalPermis   = permisData.length;
  const validesCount  = permisData.filter(p => p.statut === 'VALIDE').length;
  const enAttenteCount = permisData.filter(p => p.statut === 'EN_ATTENTE').length;
  const rejeteCount   = permisData.filter(p => p.statut === 'REJETE').length;
  const progress      = totalPermis > 0 ? (validesCount / totalPermis) * 100 : 0;

  const dateDebut = (() => {
    try { return format(new Date(at.date_debut_prevue), 'dd MMM yyyy', { locale: fr }); }
    catch { return at.date_debut_prevue; }
  })();

  function handleValider(commentaire: string, checklist_reponses: PermisDemo['checklist_reponses']) {
    if (!permisModalOuvert) return;
    setPermisData(prev => prev.map(p =>
      p.id === permisModalOuvert.id
        ? { ...p, statut: 'VALIDE' as const, checklist_reponses, valide_par: 'Sophie Martin', valide_le: new Date().toISOString(), commentaire_validation: commentaire || undefined }
        : p,
    ));
    setPermisModalOuvert(null);
  }

  function handleRejeter(motif: string) {
    if (!permisModalOuvert) return;
    setPermisData(prev => prev.map(p =>
      p.id === permisModalOuvert.id
        ? { ...p, statut: 'REJETE' as const, rejete_le: new Date().toISOString(), motif_rejet: motif }
        : p,
    ));
    setPermisModalOuvert(null);
  }

  const allValidated = validesCount === totalPermis && totalPermis > 0;

  return (
    <>
      <div className={clsx(
        'card overflow-hidden transition-all duration-200 hover:shadow-md',
        allValidated ? 'border-success-200' : '',
      )}>

        {/* ── Header ── */}
        <div className="px-5 pt-4 pb-3 border-b border-[var(--border)]">
          <div className="flex items-start gap-3">
            {/* Indicateur risque critique */}
            <div className={clsx(
              'w-1 self-stretch rounded-full flex-shrink-0',
              at.niveau_risque === 'CRITIQUE' ? 'bg-red-400' :
              at.niveau_risque === 'ELEVE'    ? 'bg-amber-400' : 'bg-green-400',
            )} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-mono text-[color:var(--text-muted)] bg-[var(--bg-hover)] border border-[var(--border)] px-2 py-0.5 rounded-md">
                  {at.numero_at}
                </span>
                <BadgeRisque niveau={at.niveau_risque} />
                {allValidated && (
                  <span className="inline-flex items-center gap-1 text-xs bg-success-50 text-[color:var(--badge-success-text)] border border-success-200 px-2 py-0.5 rounded-full font-semibold">
                    <CheckCircle2 size={11} />
                    Prêt à approuver
                  </span>
                )}
              </div>

              <h3 className="font-bold text-[color:var(--text-primary)] text-sm leading-snug">
                {at.titre}
              </h3>
            </div>
          </div>

          {/* Méta */}
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
              <Calendar size={12} className="text-[color:var(--text-muted)] flex-shrink-0" />
              <span>Début : {dateDebut}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)]">
              <Users size={12} className="text-[color:var(--text-muted)] flex-shrink-0" />
              <span>{at.nombre_intervenants_prevu} intervenant{at.nombre_intervenants_prevu > 1 ? 's' : ''} prévus</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)]">
              <span className="text-[color:var(--text-muted)]">Chef :</span>
              <span className="truncate font-medium text-[color:var(--text-secondary)]">{at.chef_chantier}</span>
            </div>
          </div>
        </div>

        {/* ── Barre progression permis ── */}
        <div className="px-5 py-3 bg-[var(--bg-hover)] border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[color:var(--text-secondary)]">
              Validation des permis
            </span>
            <div className="flex items-center gap-2">
              {enAttenteCount > 0 && (
                <span className="text-xs text-[color:var(--badge-navy-text)] font-medium flex items-center gap-1">
                  <Clock size={11} />
                  {enAttenteCount} en attente
                </span>
              )}
              {rejeteCount > 0 && (
                <span className="text-xs text-danger-400 font-medium flex items-center gap-1">
                  <AlertCircle size={11} />
                  {rejeteCount} rejeté{rejeteCount > 1 ? 's' : ''}
                </span>
              )}
              <span className="text-xs font-bold text-[color:var(--text-primary)]">
                {validesCount}/{totalPermis}
              </span>
            </div>
          </div>
          <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-500',
                progress === 100 ? 'bg-green-500' : progress > 50 ? 'bg-amber-400' : 'bg-blue-500',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── Liste permis ── */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wider mb-2.5">
            Permis associés — cliquer pour valider ou consulter
          </p>
          <div className="space-y-2">
            {permisData.map(permis => (
              <PermisChip
                key={permis.id}
                permis={permis}
                clickable
                onClick={() => setPermisModalOuvert(permis)}
              />
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        {allValidated && (
          <div className="px-5 pb-4">
            <div className="bg-success-50 border border-success-200 rounded-xl p-3 flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-success-500 flex-shrink-0" />
              <p className="text-[color:var(--badge-success-text)] text-sm font-medium flex-1">
                Tous les permis sont validés. L'AT peut être approuvée par le Responsable de Zone.
              </p>
              <ChevronRight size={15} className="text-success-500 flex-shrink-0" />
            </div>
          </div>
        )}
      </div>

      {/* Modal validation permis */}
      {permisModalOuvert && (
        <PermisValidationModal
          permis={permisModalOuvert}
          at={at}
          onClose={() => setPermisModalOuvert(null)}
          onValider={handleValider}
          onRejeter={handleRejeter}
        />
      )}
    </>
  );
}
