import { memo } from 'react';
import { clsx } from 'clsx';
import { MapPin, Building2, Calendar, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ATDemo, ICONES_PERMIS } from './demo.data';

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  at: ATDemo;
  isDragging: boolean;
  onDragStart: (at: ATDemo) => void;
  onDragEnd: () => void;
  canDrag: boolean; // false si rôle ne peut rien faire sur cette AT
  onClick: (at: ATDemo) => void;
}

// ── Couleurs risque ───────────────────────────────────────────────────────────

const RISQUE_TOP: Record<string, string> = {
  CRITIQUE: 'bg-red-400',
  ELEVE:    'bg-amber-400',
  MODERE:   'bg-green-400',
};

const RISQUE_LABEL: Record<string, string> = {
  CRITIQUE: 'text-[color:var(--badge-danger-text)] bg-danger-50 border-danger-200',
  ELEVE:    'text-[color:var(--badge-amber-text)] bg-amber-50 border-amber-100',
  MODERE:   'text-[color:var(--badge-success-text)] bg-success-50 border-success-200',
};

// ── Composant ─────────────────────────────────────────────────────────────────

export const KanbanCard = memo(function KanbanCard({ at, isDragging, onDragStart, onDragEnd, canDrag, onClick }: Props) {
  const validesCount  = at.permis.filter(p => p.statut === 'VALIDE').length;
  const totalPermis   = at.permis.length;

  const dateDebut = (() => {
    try { return format(new Date(at.date_debut_prevue), 'dd MMM', { locale: fr }); }
    catch { return '—'; }
  })();
  const dateFin = (() => {
    try { return format(new Date(at.date_fin_prevue), 'dd MMM', { locale: fr }); }
    catch { return '—'; }
  })();

  return (
    <div
      draggable={canDrag}
      onDragStart={e => {
        if (!canDrag) return;
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(at);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onClick(at)}
      className={clsx(
        'card overflow-hidden select-none transition-all duration-150',
        'cursor-pointer',
        canDrag     ? 'active:cursor-grabbing' : '',
        isDragging  ? 'opacity-40 scale-95 shadow-none' : 'hover:shadow-card-hover hover:-translate-y-0.5 hover:border-navy-200',
      )}
    >
      {/* Barre risque top */}
      <div className={clsx('h-0.5', RISQUE_TOP[at.niveau_risque])} />

      <div className="p-3 space-y-2.5">

        {/* Header : numéro + grip */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-[color:var(--text-muted)] flex-1 truncate">{at.numero_at}</span>
          {canDrag && <GripVertical size={13} className="text-[color:var(--text-secondary)] flex-shrink-0" />}
        </div>

        {/* Titre */}
        <p className="text-sm font-bold text-[color:var(--text-primary)] leading-snug line-clamp-2">
          {at.titre}
        </p>

        {/* Zone + risque */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs text-[color:var(--text-secondary)] bg-[var(--bg-hover)] border border-[var(--border)] px-2 py-0.5 rounded-md">
            <MapPin size={10} className="text-[color:var(--text-muted)]" />
            {at.code_zone}
          </span>
          <span className={clsx(
            'text-xs px-2 py-0.5 rounded-md border font-semibold',
            RISQUE_LABEL[at.niveau_risque],
          )}>
            {at.niveau_risque === 'CRITIQUE' ? '⚠ Critique' :
             at.niveau_risque === 'ELEVE'    ? 'Élevé' : 'Modéré'}
          </span>
        </div>

        {/* Entreprise */}
        <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)]">
          <Building2 size={11} className="text-[color:var(--text-muted)] flex-shrink-0" />
          <span className="truncate">{at.entreprise_intervenante}</span>
        </div>

        {/* Permis progress dots */}
        {totalPermis > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {at.permis.map(p => (
                <span
                  key={p.id}
                  title={`${ICONES_PERMIS[p.type_permis]} ${p.statut}`}
                  className={clsx(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    p.statut === 'VALIDE'     ? 'bg-green-500' :
                    p.statut === 'EN_ATTENTE' ? 'bg-blue-400' :
                    p.statut === 'REJETE'     ? 'bg-red-400' :
                    p.statut === 'SUSPENDU'   ? 'bg-orange-400' :
                    'bg-[var(--text-muted)]',
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-[color:var(--text-muted)]">
              {validesCount}/{totalPermis} permis
            </span>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-[color:var(--text-muted)] border-t border-[var(--border)] pt-2">
          <Calendar size={11} className="flex-shrink-0" />
          <span>{dateDebut} → {dateFin}</span>
        </div>
      </div>
    </div>
  );
});
