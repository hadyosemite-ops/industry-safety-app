import { useCallback, useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, Clock, LayoutGrid, Table2 } from 'lucide-react';
import type { ActionRisque, StatutActionRisque } from '../types';
import {
  LABELS_STATUT_ACTION, ORDRE_STATUT_ACTION, LABELS_TYPE_MESURE,
  actionEstEnRetard, actionEcheanceProche,
} from '../types';
import * as actionService from '../services/actionService';

const VUE_KEY = 'hse-actions-vue';

const COLONNE_STYLE: Record<StatutActionRisque, { header: string; drop: string }> = {
  PLANIFIEE: { header: 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)] border-[var(--border)]', drop: 'ring-2 ring-[var(--border-strong)]' },
  EN_COURS:  { header: 'bg-navy-50 text-[color:var(--badge-navy-text)] border-navy-200', drop: 'ring-2 ring-navy-400' },
  REALISEE:  { header: 'bg-amber-50 text-[color:var(--badge-amber-text)] border-amber-200', drop: 'ring-2 ring-amber-400' },
  VERIFIEE:  { header: 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200', drop: 'ring-2 ring-success-400' },
};

function CarteAction({ action, dragging, onDragStart, onDragEnd, onClick }: {
  action: ActionRisque;
  dragging: boolean;
  onDragStart: (a: ActionRisque) => void;
  onDragEnd: () => void;
  onClick?: () => void;
}) {
  const enRetard = actionEstEnRetard(action);
  const bientot = actionEcheanceProche(action);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(action)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={clsx(
        'rounded-xl border p-3 cursor-grab active:cursor-grabbing bg-[var(--bg-elevated)] transition-opacity',
        dragging && 'opacity-40',
        enRetard ? 'border-danger-300' : bientot ? 'border-amber-300' : 'border-[var(--border)]',
      )}
    >
      {action.risque_numero && (
        <p className="text-[10px] font-mono text-[color:var(--text-muted)] mb-1">{action.risque_numero}</p>
      )}
      <p className="text-xs font-medium text-[color:var(--text-primary)] line-clamp-2">{action.description}</p>
      <div className="flex items-center gap-1.5 flex-wrap mt-2">
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-hover)] text-[color:var(--text-secondary)]">
          {LABELS_TYPE_MESURE[action.type_mesure]}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-1.5 text-[10px]" style={{ color: enRetard ? '#ef4444' : bientot ? '#f59e0b' : 'var(--text-muted)' }}>
        {(enRetard || bientot) ? <AlertTriangle size={10} /> : <Clock size={10} />}
        {format(new Date(action.date_echeance), 'dd MMM yyyy', { locale: fr })}
        {enRetard && ' — en retard'}
        {!enRetard && bientot && ' — bientôt'}
      </div>
    </div>
  );
}

interface Props {
  actions: ActionRisque[];
  onActionsChange: (actions: ActionRisque[]) => void;
  onSelectRisque?: (risqueId: string) => void;
}

export function PlanActionKanban({ actions, onActionsChange, onSelectRisque }: Props) {
  const [data, setData] = useState<ActionRisque[]>(actions);
  const [dragged, setDragged] = useState<ActionRisque | null>(null);
  const [dropCible, setDropCible] = useState<StatutActionRisque | null>(null);
  const [vue, setVue] = useState<'kanban' | 'tableau'>(
    () => (typeof window !== 'undefined' && window.localStorage.getItem(VUE_KEY) === 'tableau') ? 'tableau' : 'kanban',
  );

  useEffect(() => { setData(actions); }, [actions]);

  function changerVue(next: 'kanban' | 'tableau') {
    setVue(next);
    window.localStorage.setItem(VUE_KEY, next);
  }

  const parStatut = useMemo(() => {
    const map = new Map<StatutActionRisque, ActionRisque[]>();
    for (const s of ORDRE_STATUT_ACTION) map.set(s, []);
    for (const a of data) map.get(a.statut)?.push(a);
    return map;
  }, [data]);

  const handleDragStart = useCallback((a: ActionRisque) => setDragged(a), []);
  const handleDragEnd = useCallback(() => { setDragged(null); setDropCible(null); }, []);

  async function changerStatut(id: string, statut: StatutActionRisque) {
    setData(prev => prev.map(a => a.id === id ? { ...a, statut } : a));
    const { data: updated } = await actionService.changerStatutAction(id, statut);
    if (updated) {
      setData(prev => {
        const next = prev.map(a => a.id === id ? { ...a, ...updated, risque_numero: a.risque_numero, risque_danger: a.risque_danger, risque_phase: a.risque_phase } : a);
        onActionsChange(next);
        return next;
      });
    }
  }

  function handleDrop(statut: StatutActionRisque) {
    if (dragged && dragged.statut !== statut) void changerStatut(dragged.id, statut);
    handleDragEnd();
  }

  const nbEnRetard = data.filter(actionEstEnRetard).length;
  const nbBientot = data.filter(a => actionEcheanceProche(a)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-xs">
          {nbEnRetard > 0 && (
            <span className="flex items-center gap-1 font-semibold text-[color:var(--badge-danger-text)]">
              <AlertTriangle size={12} /> {nbEnRetard} en retard
            </span>
          )}
          {nbBientot > 0 && (
            <span className="flex items-center gap-1 font-semibold text-amber-600">
              <Clock size={12} /> {nbBientot} sous 7 jours
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--bg-hover)]">
          <button type="button" onClick={() => changerVue('kanban')}
            className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
              vue === 'kanban' ? 'bg-[var(--bg-elevated)] text-[color:var(--text-primary)] shadow-sm' : 'text-[color:var(--text-muted)]')}>
            <LayoutGrid size={13} /> Kanban
          </button>
          <button type="button" onClick={() => changerVue('tableau')}
            className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
              vue === 'tableau' ? 'bg-[var(--bg-elevated)] text-[color:var(--text-primary)] shadow-sm' : 'text-[color:var(--text-muted)]')}>
            <Table2 size={13} /> Tableau
          </button>
        </div>
      </div>

      {vue === 'kanban' ? (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {ORDRE_STATUT_ACTION.map(statut => {
              const style = COLONNE_STYLE[statut];
              const liste = parStatut.get(statut) ?? [];
              return (
                <div key={statut} className="flex flex-col w-64 flex-shrink-0">
                  <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-xl border mb-2 text-sm font-semibold', style.header)}>
                    <span className="flex-1">{LABELS_STATUT_ACTION[statut]}</span>
                    <span className="text-xs bg-white/15 px-1.5 py-0.5 rounded-full font-bold">{liste.length}</span>
                  </div>
                  <div
                    onDragOver={e => { e.preventDefault(); setDropCible(statut); }}
                    onDragLeave={() => setDropCible(null)}
                    onDrop={e => { e.preventDefault(); handleDrop(statut); }}
                    className={clsx(
                      'flex-1 min-h-[140px] rounded-xl p-2 space-y-2 bg-[var(--bg-hover)] transition-all',
                      dropCible === statut && style.drop,
                    )}
                  >
                    {liste.map(a => (
                      <CarteAction
                        key={a.id}
                        action={a}
                        dragging={dragged?.id === a.id}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onClick={() => onSelectRisque?.(a.risque_id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-hover)]">
                <tr>
                  <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Risque</th>
                  <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Action</th>
                  <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Type de mesure</th>
                  <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Échéance</th>
                  <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {data.map(a => {
                  const enRetard = actionEstEnRetard(a);
                  const bientot = actionEcheanceProche(a);
                  return (
                    <tr key={a.id} className={clsx('hover:bg-[var(--bg-hover)] transition-colors', onSelectRisque && 'cursor-pointer')} onClick={() => onSelectRisque?.(a.risque_id)}>
                      <td className="px-4 py-2.5 text-xs font-mono text-[color:var(--text-muted)] whitespace-nowrap">{a.risque_numero ?? '—'}</td>
                      <td className="px-4 py-2.5 text-[color:var(--text-primary)] max-w-xs truncate">{a.description}</td>
                      <td className="px-4 py-2.5 text-[color:var(--text-secondary)] whitespace-nowrap">{LABELS_TYPE_MESURE[a.type_mesure]}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: enRetard ? '#ef4444' : bientot ? '#f59e0b' : 'var(--text-secondary)' }}>
                        {format(new Date(a.date_echeance), 'dd MMM yyyy', { locale: fr })}
                        {enRetard && ' ⚠︎'}
                      </td>
                      <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                        <select
                          value={a.statut}
                          onChange={e => void changerStatut(a.id, e.target.value as StatutActionRisque)}
                          className="form-select text-xs px-2 py-1 rounded-lg"
                        >
                          {ORDRE_STATUT_ACTION.map(s => <option key={s} value={s}>{LABELS_STATUT_ACTION[s]}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
