import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Search, LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown,
  Download, Printer, Settings2, ChevronLeft, ChevronRight as ChevronRightIcon, BarChart2,
} from 'lucide-react';
import type { RisqueIndustriel, PhaseRisque, StatutRisque, NiveauCriticite } from '../types';
import {
  LABELS_PHASE, LABELS_STATUT_RISQUE, LABELS_NIVEAU, ORDRE_NIVEAU,
} from '../types';
import type { CelluleSelection } from './MatriceRisques';
import { BadgeNiveauRisque } from './BadgeNiveauRisque';
import { RisqueCard } from './RisqueCard';

const VUE_KEY = 'hse-risques-vue';
const PAGE_SIZE = 20;

type Colonne = 'numero' | 'danger' | 'score' | 'niveau' | 'statut' | 'date_identification';
type Direction = 'asc' | 'desc';

interface ColonneOptionnelle { id: 'phase' | 'zone' | 'responsable'; label: string; }
const COLONNES_OPTIONNELLES: ColonneOptionnelle[] = [
  { id: 'phase',       label: 'Phase' },
  { id: 'zone',        label: 'Zone' },
  { id: 'responsable', label: 'Responsable' },
];

function scoreActuel(r: RisqueIndustriel): number {
  return r.score_residuel ?? r.score_initial;
}
function niveauActuel(r: RisqueIndustriel): NiveauCriticite {
  return r.niveau_residuel ?? r.niveau_initial;
}

interface Props {
  risques: RisqueIndustriel[];
  onSelect: (risque: RisqueIndustriel) => void;
  celluleFiltre?: CelluleSelection | null;
  onResetCellule?: () => void;
}

export function RegistreRisques({ risques, onSelect, celluleFiltre, onResetCellule }: Props) {
  const [recherche, setRecherche] = useState('');
  const [filtrePhase, setFiltrePhase] = useState<PhaseRisque | 'TOUS'>('TOUS');
  const [filtreStatut, setFiltreStatut] = useState<StatutRisque | 'TOUS'>('TOUS');
  const [filtreNiveau, setFiltreNiveau] = useState<NiveauCriticite | 'TOUS'>('TOUS');
  const [filtreZone, setFiltreZone] = useState<string>('TOUTES');
  const [tri, setTri] = useState<{ colonne: Colonne; direction: Direction } | null>(null);
  const [vue, setVue] = useState<'carte' | 'liste'>(
    () => (typeof window !== 'undefined' && window.localStorage.getItem(VUE_KEY) === 'liste') ? 'liste' : 'carte',
  );
  const [colonnesVisibles, setColonnesVisibles] = useState<Record<string, boolean>>({ phase: true, zone: true, responsable: false });
  const [colonnesOuvert, setColonnesOuvert] = useState(false);
  const [page, setPage] = useState(1);

  function changerVue(next: 'carte' | 'liste') {
    setVue(next);
    window.localStorage.setItem(VUE_KEY, next);
  }

  const zones = useMemo(() => {
    const set = new Set<string>();
    risques.forEach(r => { if (r.zone_code) set.add(r.zone_code); });
    return Array.from(set).sort();
  }, [risques]);

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return risques.filter(r => {
      const matchQ = !q ||
        r.numero.toLowerCase().includes(q) ||
        r.danger.toLowerCase().includes(q) ||
        r.activite.toLowerCase().includes(q) ||
        r.evenement_redoute.toLowerCase().includes(q);
      const matchPhase = filtrePhase === 'TOUS' || r.phase === filtrePhase;
      const matchStatut = filtreStatut === 'TOUS' || r.statut === filtreStatut;
      const matchNiveau = filtreNiveau === 'TOUS' || niveauActuel(r) === filtreNiveau;
      const matchZone = filtreZone === 'TOUTES' || r.zone_code === filtreZone;
      const matchCellule = !celluleFiltre || (
        (r.frequence_residuelle ?? r.frequence_initiale) === celluleFiltre.frequence &&
        (r.gravite_residuelle ?? r.gravite_initiale) === celluleFiltre.gravite
      );
      return matchQ && matchPhase && matchStatut && matchNiveau && matchZone && matchCellule;
    });
  }, [risques, recherche, filtrePhase, filtreStatut, filtreNiveau, filtreZone, celluleFiltre]);

  const tries = useMemo(() => {
    const arr = [...filtres];
    if (!tri) {
      // Tri par défaut : risques Critiques non clôturés en tête, puis par score décroissant
      arr.sort((a, b) => {
        const critA = niveauActuel(a) === 'CRITIQUE' && a.statut !== 'CLOTURE' ? 0 : 1;
        const critB = niveauActuel(b) === 'CRITIQUE' && b.statut !== 'CLOTURE' ? 0 : 1;
        if (critA !== critB) return critA - critB;
        return scoreActuel(b) - scoreActuel(a);
      });
      return arr;
    }
    const { colonne, direction } = tri;
    const mult = direction === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (colonne) {
        case 'numero':   return a.numero.localeCompare(b.numero) * mult;
        case 'danger':   return a.danger.localeCompare(b.danger) * mult;
        case 'score':    return (scoreActuel(a) - scoreActuel(b)) * mult;
        case 'niveau':   return (ORDRE_NIVEAU.indexOf(niveauActuel(a)) - ORDRE_NIVEAU.indexOf(niveauActuel(b))) * mult;
        case 'statut':   return a.statut.localeCompare(b.statut) * mult;
        case 'date_identification':
          return (new Date(a.date_identification).getTime() - new Date(b.date_identification).getTime()) * mult;
        default: return 0;
      }
    });
    return arr;
  }, [filtres, tri]);

  useEffect(() => { setPage(1); }, [recherche, filtrePhase, filtreStatut, filtreNiveau, filtreZone, celluleFiltre]);

  const totalPages = Math.max(1, Math.ceil(tries.length / PAGE_SIZE));
  const pagines = tries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleTri(colonne: Colonne) {
    setTri(prev => {
      if (!prev || prev.colonne !== colonne) return { colonne, direction: 'desc' };
      if (prev.direction === 'desc') return { colonne, direction: 'asc' };
      return null;
    });
  }

  function exporterCSV() {
    const entetes = [
      'Numéro', 'Phase', 'Zone', 'Activité', 'Danger', 'Situation dangereuse', 'Événement redouté',
      'Conséquence potentielle', 'F initiale', 'G initiale', 'Score initial', 'Niveau initial',
      'F résiduelle', 'G résiduelle', 'Score résiduel', 'Niveau résiduel', 'Statut', 'Responsable',
      'Date identification',
    ];
    const lignes = tries.map(r => [
      r.numero, LABELS_PHASE[r.phase], r.zone_code ?? '', r.activite, r.danger, r.situation_dangereuse,
      r.evenement_redoute, r.consequence_potentielle, r.frequence_initiale, r.gravite_initiale,
      r.score_initial, LABELS_NIVEAU[r.niveau_initial], r.frequence_residuelle ?? '', r.gravite_residuelle ?? '',
      r.score_residuel ?? '', r.niveau_residuel ? LABELS_NIVEAU[r.niveau_residuel] : '',
      LABELS_STATUT_RISQUE[r.statut], r.responsable_nom ?? '',
      format(new Date(r.date_identification), 'dd/MM/yyyy'),
    ]);
    const csv = [entetes, ...lignes]
      .map(ligne => ligne.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registre-risques-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Barre filtres / actions */}
      <div className="no-print flex flex-col gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-strong)] rounded-xl text-sm text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
            placeholder="Rechercher par numéro, danger, activité, événement redouté…"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select value={filtrePhase} onChange={e => setFiltrePhase(e.target.value as PhaseRisque | 'TOUS')} className="form-select text-xs px-2.5 py-1.5 rounded-lg">
            <option value="TOUS">Toutes les phases</option>
            <option value="INSTALLATION">{LABELS_PHASE.INSTALLATION}</option>
            <option value="OPERATION">{LABELS_PHASE.OPERATION}</option>
          </select>

          <select value={filtreZone} onChange={e => setFiltreZone(e.target.value)} className="form-select text-xs px-2.5 py-1.5 rounded-lg">
            <option value="TOUTES">Toutes les zones</option>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>

          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value as StatutRisque | 'TOUS')} className="form-select text-xs px-2.5 py-1.5 rounded-lg">
            <option value="TOUS">Tous les statuts</option>
            {(Object.keys(LABELS_STATUT_RISQUE) as StatutRisque[]).map(s => <option key={s} value={s}>{LABELS_STATUT_RISQUE[s]}</option>)}
          </select>

          <select value={filtreNiveau} onChange={e => setFiltreNiveau(e.target.value as NiveauCriticite | 'TOUS')} className="form-select text-xs px-2.5 py-1.5 rounded-lg">
            <option value="TOUS">Tous les niveaux</option>
            {ORDRE_NIVEAU.map(n => <option key={n} value={n}>{LABELS_NIVEAU[n]}</option>)}
          </select>

          {celluleFiltre && (
            <button
              type="button"
              onClick={onResetCellule}
              className="text-xs font-semibold text-[color:var(--badge-navy-text)] hover:underline px-1"
            >
              Filtre matrice F{celluleFiltre.frequence}×G{celluleFiltre.gravite} ✕
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setColonnesOuvert(o => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border)]"
              >
                <Settings2 size={13} /> Colonnes
              </button>
              {colonnesOuvert && (
                <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border shadow-lg p-2 space-y-1" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-strong)' }}>
                  {COLONNES_OPTIONNELLES.map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-xs text-[color:var(--text-secondary)] px-1.5 py-1 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={colonnesVisibles[c.id] ?? false}
                        onChange={e => setColonnesVisibles(prev => ({ ...prev, [c.id]: e.target.checked }))}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button type="button" onClick={exporterCSV} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border)]" title="Export CSV">
              <Download size={13} /> CSV
            </button>
            <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border)]" title="Export PDF">
              <Printer size={13} /> PDF
            </button>

            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--bg-hover)]">
              <button type="button" onClick={() => changerVue('carte')} title="Affichage en cartes"
                className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                  vue === 'carte' ? 'bg-[var(--bg-elevated)] text-[color:var(--text-primary)] shadow-sm' : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]')}>
                <LayoutGrid size={13} />Cartes
              </button>
              <button type="button" onClick={() => changerVue('liste')} title="Affichage en liste"
                className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                  vue === 'liste' ? 'bg-[var(--bg-elevated)] text-[color:var(--text-primary)] shadow-sm' : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]')}>
                <List size={13} />Liste
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[color:var(--text-muted)]">
          {tries.length} risque{tries.length > 1 ? 's' : ''} {tries.length !== risques.length && `(sur ${risques.length})`}
        </p>
      </div>

      {/* Résultats */}
      {tries.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 bg-[var(--bg-hover)] rounded-xl flex items-center justify-center mx-auto mb-3">
            <BarChart2 size={20} className="text-[color:var(--text-muted)]" />
          </div>
          <p className="text-[color:var(--text-secondary)] font-medium">Aucun risque</p>
          <p className="text-[color:var(--text-muted)] text-sm mt-1">Aucun résultat pour ces filtres.</p>
        </div>
      ) : vue === 'carte' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pagines.map(r => <RisqueCard key={r.id} risque={r} onClick={onSelect} />)}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-hover)]">
                <tr>
                  <ThTriable label="Risque" colonne="numero" tri={tri} onClick={toggleTri} />
                  {colonnesVisibles.phase && <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Phase</th>}
                  {colonnesVisibles.zone && <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Zone</th>}
                  <ThTriable label="Score" colonne="score" tri={tri} onClick={toggleTri} />
                  <ThTriable label="Niveau" colonne="niveau" tri={tri} onClick={toggleTri} />
                  {colonnesVisibles.responsable && <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">Responsable</th>}
                  <ThTriable label="Statut" colonne="statut" tri={tri} onClick={toggleTri} />
                  <ThTriable label="Identifié le" colonne="date_identification" tri={tri} onClick={toggleTri} />
                  <th className="px-4 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--border)]">
                {pagines.map(r => (
                  <tr key={r.id} onClick={() => onSelect(r)} className="cursor-pointer hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="text-xs font-mono text-[color:var(--text-muted)]">{r.numero}</div>
                      <div className="font-medium text-[color:var(--text-primary)] text-sm truncate max-w-xs">{r.danger}</div>
                    </td>
                    {colonnesVisibles.phase && (
                      <td className="px-4 py-2.5 text-[color:var(--text-secondary)] whitespace-nowrap">{LABELS_PHASE[r.phase]}</td>
                    )}
                    {colonnesVisibles.zone && (
                      <td className="px-4 py-2.5 text-[color:var(--text-secondary)] whitespace-nowrap">{r.zone_code ?? '—'}</td>
                    )}
                    <td className="px-4 py-2.5 font-semibold text-[color:var(--text-primary)]">{scoreActuel(r)}</td>
                    <td className="px-4 py-2.5"><BadgeNiveauRisque niveau={niveauActuel(r)} taille="sm" /></td>
                    {colonnesVisibles.responsable && (
                      <td className="px-4 py-2.5 text-[color:var(--text-secondary)] whitespace-nowrap">{r.responsable_nom ?? '—'}</td>
                    )}
                    <td className="px-4 py-2.5 text-[color:var(--text-secondary)] whitespace-nowrap">{LABELS_STATUT_RISQUE[r.statut]}</td>
                    <td className="px-4 py-2.5 text-[color:var(--text-secondary)] whitespace-nowrap">{format(new Date(r.date_identification), 'dd MMM yyyy', { locale: fr })}</td>
                    <td className="px-4 py-2.5"><ChevronRightIcon size={15} className="text-[color:var(--text-muted)]" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {tries.length > PAGE_SIZE && (
        <div className="no-print flex items-center justify-between pt-1">
          <p className="text-xs text-[color:var(--text-muted)]">Page {page} / {totalPages}</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft size={13} /> Précédent
            </button>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed">
              Suivant <ChevronRightIcon size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ThTriable({ label, colonne, tri, onClick }: {
  label: string; colonne: Colonne; tri: { colonne: Colonne; direction: Direction } | null; onClick: (c: Colonne) => void;
}) {
  return (
    <th className="text-left px-4 py-2.5 text-[color:var(--text-muted)] font-semibold text-xs">
      <button type="button" onClick={() => onClick(colonne)} className="flex items-center gap-1 hover:text-[color:var(--text-secondary)]">
        {label}
        {!tri || tri.colonne !== colonne ? <ArrowUpDown size={11} className="opacity-40" /> : tri.direction === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      </button>
    </th>
  );
}
