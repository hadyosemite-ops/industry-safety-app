import { useState, type ReactNode, type ElementType } from 'react';
import {
  ArrowLeft, User, MapPin, Clock, Link2, ChevronDown, ChevronUp,
  CheckCircle2, Plus, Check, X, Calendar, Edit3,
  FileText, Users, Network, ClipboardList, Lightbulb,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type {
  DossierAccident, ActionCorrective, NoeudCause, TypeCause, CategorieAction, StatutAction,
} from '../types';
import {
  LABELS_TYPE, ICONES_TYPE, LABELS_STATUT, COULEURS_TYPE,
  LABELS_CATEGORIE_ACTION, LABELS_ACTION_STATUT,
} from '../types';
import { BadgeStatut } from './DossierCard';

// ── Helpers ────────────────────────────────────────────────────────────────────

function genId() { return Math.random().toString(36).slice(2, 10); }

// ── Section accordéon ─────────────────────────────────────────────────────────

function Section({
  title, icon: Icon, children, defaultOpen = true, badge,
}: {
  title: string; icon: ElementType; children: ReactNode;
  defaultOpen?: boolean; badge?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[var(--bg-hover)] transition-colors"
      >
        <Icon size={16} className="text-[color:var(--badge-navy-text)] flex-shrink-0" />
        <span className="font-semibold text-[color:var(--text-primary)] text-sm flex-1">{title}</span>
        {badge}
        {open ? <ChevronUp size={16} className="text-[color:var(--text-muted)]" /> : <ChevronDown size={16} className="text-[color:var(--text-muted)]" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

// ── Informations générales ────────────────────────────────────────────────────

function InfoGenerales({ dossier }: { dossier: DossierAccident }) {
  const c = COULEURS_TYPE[dossier.type_evenement];
  return (
    <Section title="Informations générales" icon={FileText}>
      <div className={clsx('rounded-xl p-4 border mb-4', c.bg, c.border)}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{ICONES_TYPE[dossier.type_evenement]}</span>
          <div>
            <p className={clsx('font-bold text-sm', c.text)}>{LABELS_TYPE[dossier.type_evenement]}</p>
            <p className="text-xs text-[color:var(--text-muted)]">{dossier.numero}</p>
          </div>
          <div className="ml-auto">
            <BadgeStatut statut={dossier.statut} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div className="flex items-start gap-2">
          <Clock size={13} className="text-[color:var(--text-muted)] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-[color:var(--text-muted)]">Date événement</p>
            <p className="font-medium text-[color:var(--text-primary)]">
              {format(new Date(dossier.date_evenement), 'dd MMM yyyy HH:mm', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin size={13} className="text-[color:var(--text-muted)] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-[color:var(--text-muted)]">Zone</p>
            <p className="font-medium text-[color:var(--text-primary)]">{dossier.zone_code}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 col-span-2">
          <MapPin size={13} className="text-[color:var(--text-muted)] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-[color:var(--text-muted)]">Lieu précis</p>
            <p className="font-medium text-[color:var(--text-primary)]">{dossier.lieu}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 col-span-2">
          <User size={13} className="text-[color:var(--text-muted)] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-[color:var(--text-muted)]">Déclarant</p>
            <p className="font-medium text-[color:var(--text-primary)]">{dossier.declarant_nom} — {dossier.declarant_poste}</p>
          </div>
        </div>
        {dossier.at_liee_numero && (
          <div className="flex items-start gap-2 col-span-2">
            <Link2 size={13} className="text-[color:var(--badge-navy-text)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-[color:var(--text-muted)]">AT PTW liée</p>
              <p className="font-medium text-[color:var(--badge-navy-text)]">{dossier.at_liee_numero}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
        <p className="text-xs font-semibold text-[color:var(--text-secondary)] mb-1">Description des faits</p>
        <p className="text-sm text-[color:var(--text-secondary)] leading-relaxed">{dossier.description}</p>
      </div>

      {/* Déclarations légales */}
      {(dossier.type_evenement === 'FATAL' || dossier.type_evenement === 'GRAVE') && (
        <div className="mt-4 flex gap-3">
          <div className={clsx(
            'flex-1 rounded-xl p-3 border text-center',
            dossier.declaration_cpam ? 'bg-success-50 border-success-200' : 'bg-safety-50 border-safety-200',
          )}>
            <p className="text-xs font-semibold mb-0.5">
              {dossier.declaration_cpam ? '✅' : '⚠️'} CPAM
            </p>
            <p className="text-xs text-[color:var(--text-secondary)]">
              {dossier.declaration_cpam ? `Déclarée le ${dossier.date_cpam}` : 'Non déclarée'}
            </p>
          </div>
          {dossier.type_evenement === 'FATAL' && (
            <div className={clsx(
              'flex-1 rounded-xl p-3 border text-center',
              dossier.declaration_it ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200',
            )}>
              <p className="text-xs font-semibold mb-0.5">
                {dossier.declaration_it ? '✅' : '🔴'} Inspection du Travail
              </p>
              <p className="text-xs text-[color:var(--text-secondary)]">
                {dossier.declaration_it ? `Déclarée le ${dossier.date_it}` : 'Non déclarée — sous 24h'}
              </p>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

// ── Victimes & Témoins ────────────────────────────────────────────────────────

function VictimesTemoins({ dossier }: { dossier: DossierAccident }) {
  const total = dossier.victimes.length + dossier.temoins.length;
  return (
    <Section title="Personnes impliquées" icon={Users} badge={
      <span className="bg-[var(--bg-hover)] text-[color:var(--text-secondary)] text-xs px-2 py-0.5 rounded-full">{total}</span>
    }>
      {dossier.victimes.length === 0 && dossier.temoins.length === 0 ? (
        <p className="text-sm text-[color:var(--text-muted)] italic">Aucune personne impliquée renseignée.</p>
      ) : null}

      {dossier.victimes.map((v, i) => (
        <div key={v.id} className="bg-danger-50 border border-danger-100 rounded-xl p-4 mb-3">
          <p className="text-xs font-bold text-[color:var(--badge-danger-text)] mb-2">🩹 Victime {i + 1}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <InfoLine label="Nom" value={`${v.prenom} ${v.nom}`} />
            <InfoLine label="Poste" value={v.poste} />
            <InfoLine label="Entreprise" value={v.entreprise} />
            <InfoLine label="Ancienneté" value={`${v.anciennete_mois} mois`} />
            <InfoLine label="Blessure" value={v.nature_blessure} />
            <InfoLine label="Siège lésion" value={v.siege_lesion} />
            <InfoLine
              label="Arrêt de travail"
              value={v.jours_arret > 0 ? `${v.jours_arret} jour(s)` : 'Sans arrêt'}
              highlight={v.jours_arret > 0}
            />
          </div>
        </div>
      ))}

      {dossier.temoins.map((t, i) => (
        <div key={t.id} className="bg-navy-50 border border-navy-100 rounded-xl p-4 mb-3">
          <p className="text-xs font-bold text-[color:var(--badge-navy-text)] mb-2">👁️ Témoin {i + 1} — {t.prenom} {t.nom} ({t.poste})</p>
          {t.declaration && (
            <p className="text-xs text-[color:var(--text-secondary)] italic">"{t.declaration}"</p>
          )}
        </div>
      ))}
    </Section>
  );
}

function InfoLine({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span className="text-[color:var(--text-muted)]">{label} : </span>
      <span className={clsx('font-medium', highlight ? 'text-orange-400' : 'text-[color:var(--text-primary)]')}>{value}</span>
    </div>
  );
}

// ── Arbre des causes — visualisation SVG ─────────────────────────────────────

// Dimensions du canvas
const NODE_W  = 158;
const NODE_H  = 62;
const ROW_H   = 84;
const PAD_Y   = 28;
const COL_GAP = 52;

// Positions X des 4 colonnes (profonde | interm. | immédiat | dommage)
const COL_X = [0, NODE_W + COL_GAP, (NODE_W + COL_GAP) * 2, (NODE_W + COL_GAP) * 3];

// Palette de couleurs par type
const COL_STYLE = {
  CAUSE_PROFONDE:       { fill: 'rgba(0,212,255,0.10)',   stroke: '#4de6ff', text: '#c9e3f5', label: '#4de6ff', line: '#22d3ee' },
  CAUSE_INTERMEDIAIRE:  { fill: 'rgba(255,179,0,0.10)',   stroke: '#ffcf4d', text: '#ffe0a3', label: '#ffcf4d', line: '#ffc233' },
  FAIT_IMMEDIAT:        { fill: 'rgba(255,140,66,0.10)',  stroke: '#ffab73', text: '#ffd0ad', label: '#ffab73', line: '#ff8c42' },
  DOMMAGE:              { fill: 'rgba(255,68,68,0.10)',   stroke: '#ff7373', text: '#ffabab', label: '#ff7373', line: '#ff7373' },
};

// Calcule le centre Y d'un nœud dans sa colonne
function nodeY(rowIndex: number, totalInCol: number, totalRows: number): number {
  // Centre verticalement la colonne si elle a moins de lignes que la plus grande
  const colH = totalInCol * ROW_H;
  const maxH = totalRows * ROW_H;
  const offsetY = (maxH - colH) / 2;
  return PAD_Y + offsetY + rowIndex * ROW_H + NODE_H / 2;
}

function ArbreDesCauses({
  nœuds, onChange,
}: {
  nœuds: NoeudCause[];
  onChange: (nodes: NoeudCause[]) => void;
}) {
  const [adding, setAdding] = useState<TypeCause | null>(null);
  const [newDesc, setNewDesc] = useState('');
  // IDs des parents sélectionnés pour le nouveau nœud
  const [newParents, setNewParents] = useState<string[]>([]);
  // Mode liaison : id du nœud en attente de connexion
  const [linking, setLinking] = useState<string | null>(null);

  // Grouper les nœuds par type (ordre visuel gauche → droite)
  const cols: Record<TypeCause, NoeudCause[]> = {
    CAUSE_PROFONDE:      nœuds.filter(n => n.type === 'CAUSE_PROFONDE'),
    CAUSE_INTERMEDIAIRE: nœuds.filter(n => n.type === 'CAUSE_INTERMEDIAIRE'),
    FAIT_IMMEDIAT:       nœuds.filter(n => n.type === 'FAIT_IMMEDIAT'),
  };

  const totalRows = Math.max(
    cols.CAUSE_PROFONDE.length,
    cols.CAUSE_INTERMEDIAIRE.length,
    cols.FAIT_IMMEDIAT.length,
    1,
  );

  // Map nodeId → position centrale {cx, cy}
  const posMap = new Map<string, { cx: number; cy: number }>();
  const typeOrder: TypeCause[] = ['CAUSE_PROFONDE', 'CAUSE_INTERMEDIAIRE', 'FAIT_IMMEDIAT'];
  typeOrder.forEach((type, colIdx) => {
    cols[type].forEach((node, rowIdx) => {
      const cx = COL_X[colIdx] + NODE_W / 2;
      const cy = nodeY(rowIdx, cols[type].length, totalRows);
      posMap.set(node.id, { cx, cy });
    });
  });

  // Dommage : unique, centré verticalement, colonne 3
  const dommageY = PAD_Y + (totalRows * ROW_H) / 2;
  const dommageCX = COL_X[3] + NODE_W / 2;

  // Connexions : parent_ids = causes de ce nœud (nœuds à gauche dans l'arbre)
  // Ligne : bord droit du parent (gauche) → bord gauche du nœud courant (droite)
  type Line = { x1: number; y1: number; x2: number; y2: number; color: string; linked?: boolean };
  const lines: Line[] = [];

  nœuds.forEach(node => {
    const tgtPos = posMap.get(node.id);   // position du nœud courant (droite)
    if (!tgtPos) return;
    node.parent_ids.forEach(pid => {
      const srcPos = posMap.get(pid);     // position du parent/cause (gauche)
      if (!srcPos) return;
      const parentNode = nœuds.find(n => n.id === pid);
      if (!parentNode) return;
      const style = COL_STYLE[parentNode.type];
      lines.push({
        x1: srcPos.cx + NODE_W / 2,   // bord droit du parent (col gauche)
        y1: srcPos.cy,
        x2: tgtPos.cx - NODE_W / 2,   // bord gauche du nœud courant (col droite)
        y2: tgtPos.cy,
        color: style.line,
        linked: true,
      });
    });
  });

  // Connexions faits immédiats → dommage
  cols.FAIT_IMMEDIAT.forEach(node => {
    const src = posMap.get(node.id);
    if (!src) return;
    lines.push({ x1: src.cx + NODE_W / 2, y1: src.cy, x2: dommageCX - NODE_W / 2, y2: dommageY, color: COL_STYLE.FAIT_IMMEDIAT.line });
  });

  const svgW = COL_X[3] + NODE_W;
  const svgH = PAD_Y * 2 + totalRows * ROW_H;

  function addNode() {
    if (!adding || !newDesc.trim()) return;
    const node: NoeudCause = { id: genId(), type: adding, description: newDesc.trim(), parent_ids: newParents };
    onChange([...nœuds, node]);
    setAdding(null);
    setNewDesc('');
    setNewParents([]);
  }

  function removeNode(id: string) {
    onChange(nœuds
      .filter(n => n.id !== id)
      .map(n => ({ ...n, parent_ids: n.parent_ids.filter(p => p !== id) })),
    );
  }

  // Mode liaison : clic sur un nœud cible pour ajouter/retirer la connexion
  function handleLinkTarget(targetId: string) {
    if (!linking) return;
    const sourceNode = nœuds.find(n => n.id === linking);
    if (!sourceNode) { setLinking(null); return; }
    // targetId doit être dans la colonne GAUCHE du sourceNode
    const validParentTypes: Record<TypeCause, TypeCause | null> = {
      FAIT_IMMEDIAT:       'CAUSE_INTERMEDIAIRE',
      CAUSE_INTERMEDIAIRE: 'CAUSE_PROFONDE',
      CAUSE_PROFONDE:      null,
    };
    const targetNode = nœuds.find(n => n.id === targetId);
    if (!targetNode || targetNode.type !== validParentTypes[sourceNode.type]) {
      setLinking(null);
      return;
    }
    const already = sourceNode.parent_ids.includes(targetId);
    onChange(nœuds.map(n =>
      n.id === linking
        ? { ...n, parent_ids: already ? n.parent_ids.filter(p => p !== targetId) : [...n.parent_ids, targetId] }
        : n,
    ));
    setLinking(null);
  }

  // Nœuds éligibles comme parents pour le type en cours d'ajout
  const eligibleParents: NoeudCause[] = adding === 'FAIT_IMMEDIAT'
    ? cols.CAUSE_INTERMEDIAIRE
    : adding === 'CAUSE_INTERMEDIAIRE'
      ? cols.CAUSE_PROFONDE
      : [];

  return (
    <div className="space-y-4">
      {/* Canvas SVG + nœuds HTML superposés */}
      <div
        className="relative overflow-x-auto rounded-xl bg-[var(--bg-hover)] border border-[var(--border)]"
        style={{ minHeight: svgH + 8 }}
      >
        {/* SVG lines */}
        <svg
          width={svgW}
          height={svgH}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ minWidth: svgW }}
        >
          {lines.map((l, i) => {
            const mx = (l.x1 + l.x2) / 2;
            return (
              <path
                key={i}
                d={`M ${l.x1} ${l.y1} C ${mx} ${l.y1}, ${mx} ${l.y2}, ${l.x2} ${l.y2}`}
                fill="none"
                stroke={l.color}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            );
          })}
          {/* Flèche finale vers dommage */}
          {cols.FAIT_IMMEDIAT.length > 0 && (
            <polygon
              points={`${dommageCX - NODE_W / 2},${dommageY} ${dommageCX - NODE_W / 2 - 6},${dommageY - 4} ${dommageCX - NODE_W / 2 - 6},${dommageY + 4}`}
              fill={COL_STYLE.FAIT_IMMEDIAT.line}
            />
          )}
        </svg>

        {/* Nœuds HTML positionnés */}
        <div style={{ width: svgW, height: svgH, position: 'relative' }}>

          {/* Colonnes causes */}
          {typeOrder.map((type, colIdx) => {
            const style = COL_STYLE[type];
            const nodes = cols[type];
            // Types qui peuvent être PARENT de ce type (colonne gauche)
            const parentTypeOf: Record<TypeCause, TypeCause | null> = {
              FAIT_IMMEDIAT:       'CAUSE_INTERMEDIAIRE',
              CAUSE_INTERMEDIAIRE: 'CAUSE_PROFONDE',
              CAUSE_PROFONDE:      null,
            };
            const isLinkTarget = linking !== null && (() => {
              const srcNode = nœuds.find(n => n.id === linking);
              return srcNode ? parentTypeOf[srcNode.type] === type : false;
            })();
            return (
              <div key={type}>
                {nodes.map((node, rowIdx) => {
                  const cy = nodeY(rowIdx, nodes.length, totalRows);
                  const x  = COL_X[colIdx];
                  const y  = cy - NODE_H / 2;
                  const isLinked   = linking ? nœuds.find(n => n.id === linking)?.parent_ids.includes(node.id) : false;
                  const isLinking  = linking === node.id;
                  // Peut-on lier CE nœud vers sa droite ? (seulement si pas FAIT_IMMEDIAT)
                  const canInitLink = type !== 'FAIT_IMMEDIAT';
                  return (
                    <div
                      key={node.id}
                      onClick={() => isLinkTarget ? handleLinkTarget(node.id) : undefined}
                      style={{
                        position: 'absolute',
                        left: x,
                        top: y,
                        width: NODE_W,
                        height: NODE_H,
                        background: isLinkTarget ? (isLinked ? style.stroke + '33' : 'rgba(0,230,118,0.08)') : style.fill,
                        border: isLinking
                          ? `2px dashed ${style.stroke}`
                          : isLinkTarget
                            ? `2px dashed ${isLinked ? '#ff4444' : '#00e676'}`
                            : `1.5px solid ${style.stroke}`,
                        borderRadius: 10,
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 4,
                        boxShadow: isLinkTarget ? '0 0 0 3px rgba(0,230,118,0.15)' : '0 1px 4px rgba(0,0,0,0.25)',
                        cursor: isLinkTarget ? 'pointer' : 'default',
                        transition: 'all 0.15s',
                      }}
                    >
                      <p style={{
                        fontSize: 11,
                        color: style.text,
                        lineHeight: 1.4,
                        fontWeight: 600,
                        flex: 1,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {node.description}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                        {/* Bouton liaison */}
                        {canInitLink && !linking && (
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setLinking(node.id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 1 }}
                            title="Lier à une cause"
                          >
                            <Link2 size={10} color={node.parent_ids.length > 0 ? style.stroke : '#4a7a9b'} />
                          </button>
                        )}
                        {/* Annuler liaison */}
                        {isLinking && (
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setLinking(null); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 1 }}
                            title="Annuler"
                          >
                            <X size={10} color="#ff7373" />
                          </button>
                        )}
                        {/* Supprimer */}
                        {!linking && (
                          <button
                            type="button"
                            onClick={() => removeNode(node.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 1 }}
                            title="Supprimer"
                          >
                            <X size={10} color="#7bacc8" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Nœud Dommage */}
          <div style={{
            position: 'absolute',
            left: COL_X[3],
            top: dommageY - NODE_H / 2,
            width: NODE_W,
            height: NODE_H,
            background: COL_STYLE.DOMMAGE.fill,
            border: `2px solid ${COL_STYLE.DOMMAGE.stroke}`,
            borderRadius: 10,
            padding: '6px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: COL_STYLE.DOMMAGE.text, lineHeight: 1.3 }}>
              DOMMAGE
            </p>
            <p style={{ fontSize: 10, color: '#ff9c9c', marginTop: 2 }}>
              Blessure / Perte
            </p>
          </div>

        </div>
      </div>

      {/* En-têtes colonnes + boutons ajouter */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(4, ${NODE_W}px)`, width: svgW }}>
        {[
          { type: 'CAUSE_PROFONDE'      as TypeCause, label: 'Causes profondes',      style: COL_STYLE.CAUSE_PROFONDE },
          { type: 'CAUSE_INTERMEDIAIRE' as TypeCause, label: 'Causes intermédiaires', style: COL_STYLE.CAUSE_INTERMEDIAIRE },
          { type: 'FAIT_IMMEDIAT'       as TypeCause, label: 'Faits immédiats',        style: COL_STYLE.FAIT_IMMEDIAT },
          { type: null,                               label: 'Dommage',                style: COL_STYLE.DOMMAGE },
        ].map((col, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.style.stroke }} />
              <span className="text-xs font-semibold truncate" style={{ color: col.style.label }}>{col.label}</span>
            </div>
            {col.type && (
              <button
                type="button"
                onClick={() => { setAdding(col.type as TypeCause); setNewDesc(''); }}
                className="flex items-center gap-1 text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)] transition-colors"
              >
                <Plus size={11} />Ajouter
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Mode liaison — instruction contextuelle */}
      {linking && (
        <div className="flex items-center gap-2 px-3 py-2 bg-success-50 border border-success-200 rounded-xl text-xs text-[color:var(--badge-success-text)] font-medium">
          <Link2 size={12} />
          Cliquez sur un nœud <span className="font-bold">
            {(() => { const src = nœuds.find(n => n.id === linking); return src?.type === 'CAUSE_INTERMEDIAIRE' ? 'Cause profonde' : 'Cause intermédiaire'; })()}
          </span> pour créer/retirer une liaison —
          <button type="button" onClick={() => setLinking(null)} className="underline hover:no-underline ml-1">Annuler</button>
        </div>
      )}

      {/* Formulaire ajout inline */}
      {adding && (
        <div className="bg-[var(--bg-hover)] border border-dashed border-[var(--border)] rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-[color:var(--text-secondary)]">
            Nouveau : {adding === 'CAUSE_PROFONDE' ? '🔵 Cause profonde' : adding === 'CAUSE_INTERMEDIAIRE' ? '🟡 Cause intermédiaire' : '🟠 Fait immédiat'}
          </p>
          <textarea
            autoFocus
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description…"
            rows={2}
            className="w-full text-sm bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-strong)] rounded-lg px-3 py-2 outline-none resize-none focus:ring-1 focus:ring-[rgba(0,212,255,0.35)]"
          />

          {/* Sélection des causes parentes (pour CI et FI) */}
          {eligibleParents.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[color:var(--text-secondary)] mb-1.5">
                Causé par ({adding === 'FAIT_IMMEDIAT' ? 'cause intermédiaire' : 'cause profonde'}) :
              </p>
              <div className="flex flex-wrap gap-1.5">
                {eligibleParents.map(p => {
                  const selected = newParents.includes(p.id);
                  const style = COL_STYLE[p.type];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNewParents(prev =>
                        selected ? prev.filter(id => id !== p.id) : [...prev, p.id]
                      )}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all"
                      style={{
                        background: selected ? style.fill : 'rgba(255,255,255,0.04)',
                        borderColor: selected ? style.stroke : 'rgba(255,255,255,0.15)',
                        color: selected ? style.text : '#7bacc8',
                        fontWeight: selected ? 700 : 400,
                      }}
                    >
                      {selected && <Check size={9} />}
                      {p.description.slice(0, 40)}{p.description.length > 40 ? '…' : ''}
                    </button>
                  );
                })}
              </div>
              {eligibleParents.length > 0 && newParents.length === 0 && (
                <p className="text-[10px] text-[color:var(--badge-amber-text)] mt-1">Aucune cause sélectionnée — le nœud sera flottant</p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={addNode}
              disabled={!newDesc.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#0077aa] text-white text-xs rounded-lg font-semibold disabled:opacity-50">
              <Check size={11} />Ajouter
            </button>
            <button type="button" onClick={() => { setAdding(null); setNewParents([]); }}
              className="px-3 py-1.5 text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 5 Pourquoi ────────────────────────────────────────────────────────────────

function CinqPourquoi({
  pourquois, onChange,
}: {
  pourquois: string[];
  onChange: (p: string[]) => void;
}) {
  function update(i: number, val: string) {
    const next = [...pourquois];
    next[i] = val;
    onChange(next);
  }

  const lignes = pourquois.length > 0 ? pourquois : Array(5).fill('');

  return (
    <div className="space-y-3">
      <p className="text-xs text-[color:var(--text-muted)]">Méthode simplifiée — adaptée aux accidents bénins et presqu'accidents.</p>
      {lignes.map((p, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-[#0077aa] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
            {i + 1}
          </div>
          <textarea
            value={p}
            onChange={e => update(i, e.target.value)}
            placeholder={`Pourquoi ${i + 1} ? → …`}
            rows={2}
            className="flex-1 px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[rgba(0,212,255,0.35)] resize-none"
          />
        </div>
      ))}
    </div>
  );
}

// ── Plan d'actions ─────────────────────────────────────────────────────────────

const STATUT_ACTION_COLORS: Record<StatutAction, string> = {
  A_FAIRE:   'bg-[var(--bg-hover)] text-[color:var(--text-secondary)]',
  EN_COURS:  'bg-navy-100 text-[color:var(--badge-navy-text)]',
  REALISEE:  'bg-success-100 text-[color:var(--badge-success-text)]',
  EN_RETARD: 'bg-danger-100 text-[color:var(--badge-danger-text)]',
};

const PRIORITE_COLORS = {
  HAUTE:   'bg-danger-100 text-[color:var(--badge-danger-text)]',
  NORMALE: 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)]',
  BASSE:   'bg-success-100 text-[color:var(--badge-success-text)]',
};

function PlanActions({
  actions, onChange,
}: {
  actions: ActionCorrective[];
  onChange: (a: ActionCorrective[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Partial<ActionCorrective>>({
    categorie: 'TECHNIQUE', priorite: 'NORMALE', statut: 'A_FAIRE',
  });

  function addAction() {
    if (!form.description || !form.responsable || !form.date_echeance) return;
    const action: ActionCorrective = {
      id: genId(),
      description: form.description!,
      categorie: form.categorie as CategorieAction,
      responsable: form.responsable!,
      date_echeance: form.date_echeance!,
      statut: form.statut as StatutAction,
      priorite: form.priorite as 'HAUTE' | 'NORMALE' | 'BASSE',
    };
    onChange([...actions, action]);
    setAdding(false);
    setForm({ categorie: 'TECHNIQUE', priorite: 'NORMALE', statut: 'A_FAIRE' });
  }

  function toggleStatut(id: string) {
    onChange(actions.map(a => {
      if (a.id !== id) return a;
      const next: StatutAction = a.statut === 'REALISEE' ? 'EN_COURS' : a.statut === 'EN_COURS' ? 'REALISEE' : a.statut === 'A_FAIRE' ? 'EN_COURS' : 'REALISEE';
      return { ...a, statut: next, date_realisation: next === 'REALISEE' ? format(new Date(), 'yyyy-MM-dd') : undefined };
    }));
  }

  function removeAction(id: string) {
    onChange(actions.filter(a => a.id !== id));
  }

  const realisees = actions.filter(a => a.statut === 'REALISEE').length;

  return (
    <div className="space-y-3">
      {/* Progression */}
      {actions.length > 0 && (
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all"
              style={{ width: `${actions.length ? (realisees / actions.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-[color:var(--text-secondary)]">{realisees}/{actions.length} réalisées</span>
        </div>
      )}

      {/* Liste actions */}
      {actions.map(action => (
        <div key={action.id} className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => toggleStatut(action.id)}
              className={clsx(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                action.statut === 'REALISEE'
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-[var(--border)] hover:border-green-400',
              )}
            >
              {action.statut === 'REALISEE' && <Check size={12} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={clsx('text-sm font-medium', action.statut === 'REALISEE' ? 'line-through text-[color:var(--text-muted)]' : 'text-[color:var(--text-primary)]')}>
                {action.description}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', STATUT_ACTION_COLORS[action.statut])}>
                  {LABELS_ACTION_STATUT[action.statut]}
                </span>
                <span className={clsx('text-xs px-2 py-0.5 rounded-full', PRIORITE_COLORS[action.priorite])}>
                  {action.priorite}
                </span>
                <span className="text-xs text-[color:var(--text-muted)]">{LABELS_CATEGORIE_ACTION[action.categorie]}</span>
                <span className="text-xs text-[color:var(--text-muted)] flex items-center gap-1">
                  <User size={10} />{action.responsable}
                </span>
                <span className="text-xs text-[color:var(--text-muted)] flex items-center gap-1">
                  <Calendar size={10} />{action.date_echeance}
                </span>
              </div>
              {action.date_realisation && (
                <p className="text-xs text-green-500 mt-1">Réalisée le {action.date_realisation}</p>
              )}
            </div>
            <button type="button" onClick={() => removeAction(action.id)}>
              <X size={14} className="text-[color:var(--text-secondary)] hover:text-red-400" />
            </button>
          </div>
        </div>
      ))}

      {/* Formulaire ajout */}
      {adding ? (
        <div className="bg-navy-50 border border-navy-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-[color:var(--badge-navy-text)]">Nouvelle action corrective</p>
          <textarea
            placeholder="Description de l'action *"
            value={form.description || ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[rgba(0,212,255,0.35)] resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value as CategorieAction }))}
              className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none">
              {(Object.keys(LABELS_CATEGORIE_ACTION) as CategorieAction[]).map(c => (
                <option key={c} value={c}>{LABELS_CATEGORIE_ACTION[c]}</option>
              ))}
            </select>
            <select value={form.priorite} onChange={e => setForm(f => ({ ...f, priorite: e.target.value as 'HAUTE' | 'NORMALE' | 'BASSE' }))}
              className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none">
              <option value="HAUTE">Haute priorité</option>
              <option value="NORMALE">Normale</option>
              <option value="BASSE">Basse</option>
            </select>
            <input type="text" placeholder="Responsable *" value={form.responsable || ''}
              onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
              className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none" />
            <input type="date" value={form.date_echeance || ''} placeholder="Échéance *"
              onChange={e => setForm(f => ({ ...f, date_echeance: e.target.value }))}
              className="px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-lg text-sm focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={addAction}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#0077aa] text-white text-xs rounded-lg font-semibold">
              <Check size={12} />Ajouter
            </button>
            <button type="button" onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs text-[color:var(--text-secondary)]">Annuler</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[var(--border)] rounded-xl text-sm text-[color:var(--text-muted)] hover:text-[color:var(--badge-navy-text)] hover:border-navy-300 transition-all">
          <Plus size={15} />Ajouter une action corrective
        </button>
      )}
    </div>
  );
}

// ── Leçons retenues ────────────────────────────────────────────────────────────

function LeconsRetenues({
  lecons, onChange,
}: {
  lecons: string;
  onChange: (l: string) => void;
}) {
  return (
    <div>
      <textarea
        value={lecons}
        onChange={e => onChange(e.target.value)}
        rows={3}
        placeholder="Décrivez les leçons apprises et les bonnes pratiques à diffuser à l'ensemble des équipes…"
        className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-strong)] text-[var(--text-primary)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)] resize-none"
      />
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface DossierDetailProps {
  dossier: DossierAccident;
  onBack: () => void;
  onUpdate: (dossier: DossierAccident) => void;
}

const WORKFLOW: DossierAccident['statut'][] = [
  'SIGNALE', 'DECLARE', 'EN_INVESTIGATION', 'PLAN_ACTIONS', 'CLOTURE',
];

export function DossierDetail({ dossier, onBack, onUpdate }: DossierDetailProps) {
  const [local, setLocal] = useState<DossierAccident>(dossier);

  function update(patch: Partial<DossierAccident>) {
    const next = { ...local, ...patch };
    setLocal(next);
    onUpdate(next);
  }

  function avancerStatut() {
    const idx = WORKFLOW.indexOf(local.statut);
    if (idx < WORKFLOW.length - 1) update({ statut: WORKFLOW[idx + 1] });
  }

  const peutAvancer = local.statut !== 'CLOTURE';
  const statutSuivant = WORKFLOW[WORKFLOW.indexOf(local.statut) + 1];

  const useArbre =
    local.type_evenement === 'FATAL' ||
    local.type_evenement === 'GRAVE' ||
    local.arbre_causes.length > 0;

  return (
    <div className="min-h-screen">
      {/* Topbar */}
      <header className="bg-[#0077aa] shadow-lg sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button type="button" onClick={onBack}
            className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0">
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-xs font-mono">{local.numero}</p>
            <h1 className="text-white font-bold text-sm leading-tight truncate">{local.titre}</h1>
          </div>
          <BadgeStatut statut={local.statut} variant="header" />
        </div>

        {/* Stepper statut */}
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-0">
            {WORKFLOW.map((s, i) => {
              const done    = WORKFLOW.indexOf(local.statut) > i;
              const current = local.statut === s;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={clsx(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 transition-all',
                      done    ? 'bg-white border-white text-[#4de6ff]' :
                      current ? 'bg-white/20 border-white text-white' :
                      'bg-transparent border-white/30 text-white/30',
                    )}>
                      {done ? <Check size={11} /> : i + 1}
                    </div>
                    <span className={clsx(
                      'text-xs mt-1 whitespace-nowrap hidden sm:block',
                      current ? 'text-white font-semibold' : done ? 'text-white/70' : 'text-white/30',
                    )}>
                      {LABELS_STATUT[s]}
                    </span>
                  </div>
                  {i < WORKFLOW.length - 1 && (
                    <div className={clsx('flex-1 h-px mx-1 mb-4', done ? 'bg-white' : 'bg-white/20')} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4 pb-24">

        <InfoGenerales dossier={local} />
        <VictimesTemoins dossier={local} />

        {/* Investigation */}
        <Section title="Investigation & Analyse des causes" icon={Network}
          badge={
            useArbre
              ? <span className="text-xs bg-navy-100 text-[color:var(--badge-navy-text)] px-2 py-0.5 rounded-full">Arbre des causes</span>
              : <span className="text-xs bg-amber-100 text-[color:var(--badge-amber-text)] px-2 py-0.5 rounded-full">5 Pourquoi</span>
          }>
          {local.investigateur && (
            <div className="flex items-center gap-2 mb-4 text-xs text-[color:var(--text-secondary)]">
              <User size={12} />
              <span>Investigateur : <strong>{local.investigateur}</strong></span>
            </div>
          )}
          {useArbre ? (
            <ArbreDesCauses
              nœuds={local.arbre_causes}
              onChange={arbre_causes => update({ arbre_causes })}
            />
          ) : (
            <CinqPourquoi
              pourquois={local.cinq_pourquoi || []}
              onChange={cinq_pourquoi => update({ cinq_pourquoi })}
            />
          )}
          {/* Bouton pour basculer */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                if (useArbre) update({ arbre_causes: [], cinq_pourquoi: [] });
                else update({ cinq_pourquoi: [], arbre_causes: [] });
              }}
              className="text-xs text-[color:var(--text-muted)] hover:text-[color:var(--badge-navy-text)] underline"
            >
              Basculer vers {useArbre ? '5 Pourquoi' : "l'arbre des causes"}
            </button>
          </div>
        </Section>

        {/* Plan d'actions */}
        <Section title="Plan d'actions correctives" icon={ClipboardList}
          badge={
            <span className={clsx(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              local.actions.filter(a => a.statut === 'REALISEE').length === local.actions.length && local.actions.length > 0
                ? 'bg-success-100 text-[color:var(--badge-success-text)]'
                : 'bg-[var(--bg-hover)] text-[color:var(--text-secondary)]',
            )}>
              {local.actions.filter(a => a.statut === 'REALISEE').length}/{local.actions.length}
            </span>
          }>
          <PlanActions
            actions={local.actions}
            onChange={actions => update({ actions })}
          />
        </Section>

        {/* Leçons retenues */}
        <Section title="Leçons retenues & Diffusion" icon={Lightbulb} defaultOpen={false}>
          <LeconsRetenues
            lecons={local.lecons_retenues || ''}
            onChange={lecons_retenues => update({ lecons_retenues })}
          />
        </Section>

        {/* Bouton avancer statut */}
        {peutAvancer && (
          <div className="sticky bottom-20 flex justify-end">
            <button
              type="button"
              onClick={avancerStatut}
              className="flex items-center gap-2 px-5 py-3 bg-[#0077aa] text-white font-semibold text-sm rounded-xl shadow-lg hover:bg-[#005f88] transition-colors"
            >
              <Edit3 size={15} />
              Passer à : {LABELS_STATUT[statutSuivant]}
              {statutSuivant === 'CLOTURE' && <CheckCircle2 size={15} />}
            </button>
          </div>
        )}

        {local.statut === 'CLOTURE' && (
          <div className="bg-success-50 border border-success-200 rounded-2xl p-5 text-center">
            <CheckCircle2 size={28} className="text-green-500 mx-auto mb-2" />
            <p className="font-bold text-[color:var(--badge-success-text)]">Dossier clôturé</p>
            {local.date_cloture && (
              <p className="text-xs text-green-500 mt-1">
                Le {format(new Date(local.date_cloture), 'dd MMM yyyy', { locale: fr })} · {local.validateur_cloture}
              </p>
            )}
            {local.lecons_retenues && (
              <div className="mt-3 text-left bg-[var(--bg-hover)] rounded-xl p-4 border border-success-100">
                <p className="text-xs font-semibold text-[color:var(--text-secondary)] mb-1">Leçons retenues</p>
                <p className="text-sm text-[color:var(--text-primary)]">{local.lecons_retenues}</p>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
