import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import type { RisqueIndustriel } from '../types';
import { calculerNiveau, COULEURS_NIVEAU, MOTIFS_NIVEAU, LABELS_NIVEAU } from '../types';

interface CelluleMatrice {
  frequence: number;
  gravite: number;
  score: number;
  risques: RisqueIndustriel[];
}

export interface CelluleSelection { frequence: number; gravite: number; }

interface Props {
  risques: RisqueIndustriel[];
  celluleActive?: CelluleSelection | null;
  onSelectCellule: (cellule: CelluleSelection | null) => void;
}

/** Position d'un risque sur la matrice : cotation résiduelle si connue, sinon initiale */
function positionRisque(r: RisqueIndustriel): { f: number; g: number } {
  if (r.frequence_residuelle != null && r.gravite_residuelle != null) {
    return { f: r.frequence_residuelle, g: r.gravite_residuelle };
  }
  return { f: r.frequence_initiale, g: r.gravite_initiale };
}

export function MatriceRisques({ risques, celluleActive, onSelectCellule }: Props) {
  const [survole, setSurvole] = useState<CelluleSelection | null>(null);

  const grille = useMemo<CelluleMatrice[][]>(() => {
    const parCellule = new Map<string, RisqueIndustriel[]>();
    for (const r of risques) {
      const { f, g } = positionRisque(r);
      const key = `${f}-${g}`;
      if (!parCellule.has(key)) parCellule.set(key, []);
      parCellule.get(key)!.push(r);
    }
    // Lignes = gravité décroissante (5 en haut) · Colonnes = fréquence croissante (1 à gauche)
    const lignes: CelluleMatrice[][] = [];
    for (let g = 5; g >= 1; g--) {
      const ligne: CelluleMatrice[] = [];
      for (let f = 1; f <= 5; f++) {
        ligne.push({
          frequence: f,
          gravite: g,
          score: f * g,
          risques: parCellule.get(`${f}-${g}`) ?? [],
        });
      }
      lignes.push(ligne);
    }
    return lignes;
  }, [risques]);

  function estActive(c: CelluleMatrice) {
    return celluleActive?.frequence === c.frequence && celluleActive?.gravite === c.gravite;
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-[color:var(--text-primary)]">Matrice des risques — Fréquence × Gravité</p>
          <p className="text-xs text-[color:var(--text-muted)]">Cliquez sur une cellule pour filtrer le registre</p>
        </div>
        {celluleActive && (
          <button
            type="button"
            onClick={() => onSelectCellule(null)}
            className="text-xs font-semibold text-[color:var(--badge-navy-text)] hover:underline flex-shrink-0"
          >
            Réinitialiser le filtre
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {/* Axe Y — Gravité */}
        <div className="flex flex-col justify-between py-1">
          <span className="text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wide [writing-mode:vertical-rl] rotate-180 mb-1">
            Gravité
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-5 gap-1.5">
            {grille.map(ligne => ligne.map(cellule => {
              const niveau = calculerNiveau(cellule.score)!;
              const c = COULEURS_NIVEAU[niveau];
              const active = estActive(cellule);
              const isSurvolee = survole?.frequence === cellule.frequence && survole?.gravite === cellule.gravite;

              return (
                <div key={`${cellule.frequence}-${cellule.gravite}`} className="relative">
                  <button
                    type="button"
                    onClick={() => onSelectCellule(active ? null : { frequence: cellule.frequence, gravite: cellule.gravite })}
                    onMouseEnter={() => setSurvole({ frequence: cellule.frequence, gravite: cellule.gravite })}
                    onMouseLeave={() => setSurvole(null)}
                    className={clsx(
                      'w-full aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-150 relative overflow-hidden',
                      active ? 'ring-2 ring-offset-1 ring-[var(--text-primary)] scale-[1.04]' : 'hover:scale-[1.03]',
                    )}
                    style={{ background: c.solide }}
                    aria-label={`Fréquence ${cellule.frequence}, Gravité ${cellule.gravite} — score ${cellule.score}, niveau ${LABELS_NIVEAU[niveau]}, ${cellule.risques.length} risque(s)`}
                  >
                    {/* Motif de fond (accessibilité daltonisme — jamais la couleur seule) */}
                    <span className="absolute inset-0 flex items-center justify-center text-white/25 text-2xl font-bold select-none pointer-events-none">
                      {MOTIFS_NIVEAU[niveau]}
                    </span>
                    <span className="relative text-white font-bold text-sm leading-none">{cellule.score}</span>
                    {cellule.risques.length > 0 && (
                      <span className="relative mt-0.5 text-[10px] font-semibold text-white/90 bg-black/20 rounded-full px-1.5 leading-tight">
                        {cellule.risques.length}
                      </span>
                    )}
                  </button>

                  {/* Tooltip détail au survol */}
                  {isSurvolee && cellule.risques.length > 0 && (
                    <div
                      className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-1.5 w-56 rounded-xl border shadow-lg p-2.5 space-y-1"
                      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-strong)' }}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--text-muted)] mb-1">
                        {cellule.risques.length} risque{cellule.risques.length > 1 ? 's' : ''} · score {cellule.score}
                      </p>
                      {cellule.risques.slice(0, 4).map(r => (
                        <p key={r.id} className="text-xs text-[color:var(--text-secondary)] truncate">
                          <span className="font-mono text-[color:var(--text-muted)]">{r.numero}</span> — {r.danger}
                        </p>
                      ))}
                      {cellule.risques.length > 4 && (
                        <p className="text-[10px] text-[color:var(--text-muted)]">+ {cellule.risques.length - 4} autre(s)…</p>
                      )}
                    </div>
                  )}
                </div>
              );
            }))}
          </div>

          {/* Axe X — Fréquence */}
          <div className="grid grid-cols-5 gap-1.5 mt-2">
            {[1, 2, 3, 4, 5].map(f => (
              <span key={f} className="text-center text-[10px] font-bold text-[color:var(--text-muted)]">{f}</span>
            ))}
          </div>
          <p className="text-center text-[10px] font-bold text-[color:var(--text-muted)] uppercase tracking-wide mt-1">Fréquence</p>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center flex-wrap gap-3 mt-4 pt-4 border-t border-[var(--border)]">
        {(['FAIBLE', 'MODERE', 'ELEVE', 'CRITIQUE'] as const).map(niveau => (
          <span key={niveau} className="flex items-center gap-1.5 text-xs text-[color:var(--text-secondary)]">
            <span
              className="w-3.5 h-3.5 rounded flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
              style={{ background: COULEURS_NIVEAU[niveau].solide }}
            >
              {MOTIFS_NIVEAU[niveau]}
            </span>
            {LABELS_NIVEAU[niveau]}
          </span>
        ))}
      </div>
    </div>
  );
}
