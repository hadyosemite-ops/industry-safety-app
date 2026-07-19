// ─────────────────────────────────────────────────────────────────────────────
// Module Audit HSE — Formulaire d'audit terrain
// 9 sections accordéon · Scoring temps réel · Alertes NC majeure
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
  MinusCircle, XCircle, HelpCircle, ArrowLeft, Send,
  Lock, Zap, Shield, Camera, X,
} from 'lucide-react';

import { CHECKLIST_STANDARD } from '../data/checklist.data';
import {
  calculerScore, niveauConformite,
  LABELS_SECTION, ICONES_SECTION, COULEURS_SECTION, SECTIONS_ORDRE,
  type ReponseItem, type ReponseCL, type SectionId,
} from '../types';
import { ZONES_SITE } from '../types';

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onBack:   () => void;
  onSubmit: () => void;
}

// ── Boutons réponse ───────────────────────────────────────────────────────────

type ReponseOption = Exclude<ReponseItem, null>;

interface ReponseBtn {
  value: ReponseOption;
  label: string;
  icon:  ReactNode;
  bg:    string;
  text:  string;
  ring:  string;
}

const REPONSE_BTNS: ReponseBtn[] = [
  { value: 'CONFORME',       label: 'C',    icon: <CheckCircle2 size={13} />, bg: 'bg-success-50', text: 'text-[color:var(--badge-success-text)]', ring: 'ring-success-400' },
  { value: 'PARTIELLEMENT',  label: 'P',    icon: <MinusCircle  size={13} />, bg: 'bg-amber-50',   text: 'text-[color:var(--badge-amber-text)]',  ring: 'ring-amber-400' },
  { value: 'NON_CONFORME',   label: 'NC',   icon: <XCircle      size={13} />, bg: 'bg-danger-50',  text: 'text-[color:var(--badge-danger-text)]', ring: 'ring-danger-400' },
  { value: 'NA',             label: 'N/A',  icon: <HelpCircle   size={13} />, bg: 'bg-[var(--bg-hover)]', text: 'text-[color:var(--text-secondary)]', ring: 'ring-white/30' },
];

// ── Item checklist ────────────────────────────────────────────────────────────

interface ChecklistItemRowProps {
  itemId:    string;
  question:  string;
  ponderation: 1 | 2 | 3;
  reglementaire: boolean;
  sous_type?: string;
  reponse:   ReponseItem;
  commentaire: string;
  photoUrl?: string;
  onReponse: (v: ReponseOption) => void;
  onComment: (c: string) => void;
  onPhoto:   (url: string | undefined) => void;
}

function PonderationDots({ n }: { n: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map(i => (
        <div key={i} className={clsx('w-1.5 h-1.5 rounded-full', i <= n ? 'bg-[#0077aa]' : 'bg-[var(--bg-hover)]')} />
      ))}
    </div>
  );
}

// ── Photo à l'appui d'un écart ────────────────────────────────────────────────

function PhotoPicker({
  photoUrl, onChange, dangerStyle,
}: {
  photoUrl?: string;
  onChange: (url: string | undefined) => void;
  dangerStyle?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(URL.createObjectURL(file));
    e.target.value = '';
  }

  if (photoUrl) {
    return (
      <div className="relative mt-2 inline-block">
        <img src={photoUrl} alt="Photo de l'écart" className="h-16 w-16 rounded-lg object-cover border border-[var(--border)]" />
        <button
          type="button"
          onClick={() => onChange(undefined)}
          aria-label="Supprimer la photo"
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#02101f] border border-white/20 text-white flex items-center justify-center hover:bg-danger-600 transition-colors"
        >
          <X size={11} />
        </button>
      </div>
    );
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors',
          dangerStyle
            ? 'border-danger-200 text-[color:var(--badge-danger-text)] hover:bg-danger-100'
            : 'border-[var(--border-strong)] text-[color:var(--text-secondary)] hover:bg-[var(--bg-hover)]',
        )}
      >
        <Camera size={12} />
        Ajouter une photo
      </button>
    </>
  );
}

function ChecklistItemRow({
  itemId, question, ponderation, reglementaire, sous_type,
  reponse, commentaire, photoUrl, onReponse, onComment, onPhoto,
}: ChecklistItemRowProps) {
  const [showComment, setShowComment] = useState(!!commentaire);
  const isNcMajeur = reponse === 'NON_CONFORME' && reglementaire;
  const isNcMineur = reponse === 'NON_CONFORME' && !reglementaire;
  const isPartiel  = reponse === 'PARTIELLEMENT';

  return (
    <div className={clsx(
      'border rounded-xl p-3 transition-all duration-150',
      isNcMajeur ? 'border-danger-200 bg-danger-50'  :
      isNcMineur ? 'border-orange-500/30 bg-orange-500/10' :
      isPartiel  ? 'border-amber-200 bg-amber-50/40'   :
      reponse === 'CONFORME' ? 'border-success-100 bg-[var(--bg-hover)]' :
      'border-[var(--border)] bg-[var(--bg-hover)]',
    )}>
      <div className="flex items-start gap-3">
        {/* Alerte réglementaire NC */}
        {isNcMajeur && (
          <div className="flex-shrink-0 mt-0.5">
            <AlertTriangle size={14} className="text-danger-500" />
          </div>
        )}

        {/* Question */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono text-[color:var(--text-muted)]">{itemId}</span>
            <PonderationDots n={ponderation} />
            {reglementaire && (
              <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-300 font-medium">
                <Lock size={8} /> Régl.
              </span>
            )}
            {sous_type === 'ATEX' && (
              <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 font-medium">
                <Zap size={8} /> ATEX
              </span>
            )}
            {sous_type === 'CMR' && (
              <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-medium">
                <Shield size={8} /> CMR
              </span>
            )}
            {sous_type === 'LEVAGE' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-500/10 text-[color:var(--badge-teal-text)] font-medium">Levage</span>
            )}
          </div>
          <p className="text-xs text-[color:var(--text-primary)] leading-relaxed">{question}</p>

          {/* Commentaire */}
          {(showComment || reponse === 'NON_CONFORME' || reponse === 'PARTIELLEMENT') && (
            <textarea
              value={commentaire}
              onChange={e => onComment(e.target.value)}
              placeholder={isNcMajeur ? '⚠️ NC réglementaire — décrivez l\'écart observé...' : 'Commentaire / observation...'}
              className={clsx(
                'mt-2 w-full text-xs rounded-lg border px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1',
                isNcMajeur ? 'border-danger-200 bg-danger-50 focus:ring-danger-400 placeholder-danger-400' :
                'border-[var(--border-strong)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:ring-[rgba(0,212,255,0.35)]',
              )}
              rows={2}
            />
          )}

          {/* Photo à l'appui — uniquement en cas de non-conformité */}
          {reponse === 'NON_CONFORME' && (
            <PhotoPicker photoUrl={photoUrl} onChange={onPhoto} dangerStyle={isNcMajeur} />
          )}
        </div>

        {/* Boutons réponse */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {REPONSE_BTNS.map(btn => (
            <button
              key={btn.value}
              onClick={() => {
                onReponse(btn.value);
                if (btn.value === 'NON_CONFORME' || btn.value === 'PARTIELLEMENT') {
                  setShowComment(true);
                }
              }}
              className={clsx(
                'flex items-center justify-center gap-0.5 text-[11px] font-bold rounded-lg transition-all duration-100',
                'w-9 h-8',
                reponse === btn.value
                  ? `${btn.bg} ${btn.text} ring-2 ${btn.ring} shadow-sm scale-105`
                  : 'bg-[var(--bg-hover)] text-[color:var(--text-muted)] hover:bg-[var(--bg-hover)]',
              )}
              title={btn.value.replace('_', ' ')}
            >
              {btn.label}
            </button>
          ))}
          {!showComment && reponse !== 'NON_CONFORME' && reponse !== 'PARTIELLEMENT' && (
            <button
              onClick={() => setShowComment(v => !v)}
              className="w-7 h-8 flex items-center justify-center text-[color:var(--text-secondary)] hover:text-[color:var(--text-secondary)] transition-colors"
            >
              <ChevronDown size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Alerte NC majeure */}
      {isNcMajeur && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[color:var(--badge-danger-text)] font-semibold bg-danger-100 rounded-lg px-2.5 py-1.5">
          <AlertTriangle size={10} />
          NC réglementaire = Écart MAJEUR — Action corrective obligatoire
        </div>
      )}
    </div>
  );
}

// ── Section accordéon ─────────────────────────────────────────────────────────

interface SectionProps {
  sectionId:  SectionId;
  reponses:   Record<string, { reponse: ReponseItem; commentaire: string; photoUrl?: string }>;
  onChange:   (itemId: string, reponse: ReponseOption, commentaire: string) => void;
  onPhoto:    (itemId: string, url: string | undefined) => void;
  isOpen:     boolean;
  onToggle:   () => void;
}

function SectionAccordion({ sectionId, reponses, onChange, onPhoto, isOpen, onToggle }: SectionProps) {
  const items = CHECKLIST_STANDARD.filter(i => i.section === sectionId);
  const col   = COULEURS_SECTION[sectionId];

  // Score de la section
  const repsArray: ReponseCL[] = items.map(item => ({
    item_id:    item.id,
    reponse:    reponses[item.id]?.reponse ?? null,
  }));
  const score    = calculerScore(repsArray, items);
  const answered = items.filter(i => reponses[i.id]?.reponse && reponses[i.id].reponse !== null).length;
  const ncCount  = items.filter(i => reponses[i.id]?.reponse === 'NON_CONFORME').length;
  const ncMajeurs = items.filter(i =>
    reponses[i.id]?.reponse === 'NON_CONFORME' && i.reglementaire
  ).length;
  const nc = niveauConformite(score);

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: col.border }}>
      {/* En-tête section */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:brightness-95 transition-all"
        style={{ backgroundColor: col.bg }}
      >
        <span className="text-xl flex-shrink-0">{ICONES_SECTION[sectionId]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: col.text }}>
            {LABELS_SECTION[sectionId]}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px]" style={{ color: col.text, opacity: 0.75 }}>
              {answered}/{items.length} répondu{answered > 1 ? 's' : ''}
            </span>
            {ncMajeurs > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-danger-100 text-[color:var(--badge-danger-text)] font-bold">
                <AlertTriangle size={9} /> {ncMajeurs} NC MAJEUR{ncMajeurs > 1 ? 'S' : ''}
              </span>
            )}
            {ncCount > ncMajeurs && (
              <span className="text-[10px] text-orange-600">{ncCount - ncMajeurs} NC mineur{ncCount - ncMajeurs > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Score */}
        {answered > 0 && (
          <div className={clsx('text-center px-3 py-1 rounded-xl border flex-shrink-0', nc.bg, nc.border)}>
            <p className={clsx('text-base font-bold', nc.color)}>{score}%</p>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-20 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden flex-shrink-0">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(answered / items.length) * 100}%`,
              backgroundColor: col.border,
            }}
          />
        </div>

        {isOpen ? <ChevronUp size={16} style={{ color: col.text }} className="flex-shrink-0" />
                : <ChevronDown size={16} style={{ color: col.text }} className="flex-shrink-0" />}
      </button>

      {/* Corps section */}
      {isOpen && (
        <div className="p-4 space-y-2 bg-[var(--bg-elevated)]">
          {items.map(item => (
            <ChecklistItemRow
              key={item.id}
              itemId={item.id}
              question={item.question}
              ponderation={item.ponderation}
              reglementaire={item.reglementaire}
              sous_type={item.sous_type}
              reponse={reponses[item.id]?.reponse ?? null}
              commentaire={reponses[item.id]?.commentaire ?? ''}
              photoUrl={reponses[item.id]?.photoUrl}
              onReponse={v => onChange(item.id, v, reponses[item.id]?.commentaire ?? '')}
              onComment={c => onChange(item.id, reponses[item.id]?.reponse as ReponseOption ?? 'CONFORME', c)}
              onPhoto={url => onPhoto(item.id, url)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Barre de score global (sticky) ────────────────────────────────────────────

function ScoreBar({ reponses }: { reponses: Record<string, { reponse: ReponseItem; commentaire: string }> }) {
  const repsArray: ReponseCL[] = CHECKLIST_STANDARD.map(item => ({
    item_id: item.id,
    reponse: reponses[item.id]?.reponse ?? null,
  }));
  const score    = calculerScore(repsArray, CHECKLIST_STANDARD);
  const answered = Object.values(reponses).filter(r => r.reponse !== null).length;
  const total    = CHECKLIST_STANDARD.length;
  const nc       = niveauConformite(score);
  const ncMaj    = CHECKLIST_STANDARD.filter(i =>
    reponses[i.id]?.reponse === 'NON_CONFORME' && i.reglementaire
  ).length;

  return (
    <div className="bg-[var(--bg-elevated)] border-b border-[var(--border)] px-8 py-3 sticky top-[57px] z-10 flex items-center gap-6">
      {/* Score global */}
      <div className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl border', nc.bg, nc.border)}>
        <span className={clsx('text-lg font-bold', nc.color)}>{answered > 0 ? score : '—'}%</span>
        <span className={clsx('text-xs font-medium', nc.color)}>{nc.label}</span>
      </div>

      {/* Progression */}
      <div className="flex-1">
        <div className="flex justify-between text-[10px] text-[color:var(--text-muted)] mb-1">
          <span>{answered}/{total} items répondus</span>
          <span>{Math.round((answered / total) * 100)}%</span>
        </div>
        <div className="h-2 bg-[var(--bg-hover)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0077aa] rounded-full transition-all duration-500"
            style={{ width: `${(answered / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Alertes NC */}
      {ncMaj > 0 && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-[color:var(--badge-danger-text)] bg-danger-50 border border-danger-200 px-3 py-1.5 rounded-xl">
          <AlertTriangle size={13} />
          {ncMaj} NC MAJEUR{ncMaj > 1 ? 'ES' : 'E'}
        </div>
      )}
    </div>
  );
}

// ── Formulaire principal ──────────────────────────────────────────────────────

export function FormulaireAudit({ onBack, onSubmit }: Props) {
  // Infos audit
  const [zone,         setZone]         = useState('');
  const [auditeur,     setAuditeur]     = useState('');
  const [accompagnateur, setAccomp]     = useState('');
  const [dateAudit,    setDateAudit]    = useState(new Date().toISOString().slice(0,16));
  const [typeAudit,    setTypeAudit]    = useState<'TERRAIN' | 'SYSTEME'>('TERRAIN');

  // Réponses
  const [reponses, setReponses] = useState<Record<string, { reponse: ReponseItem; commentaire: string; photoUrl?: string }>>({});

  // Sections ouvertes
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>(
    Object.fromEntries(SECTIONS_ORDRE.map((s, i) => [s, i === 0])) as Record<SectionId, boolean>
  );

  // Soumission
  const [submitted, setSubmitted] = useState(false);

  function handleChange(itemId: string, reponse: ReponseOption, commentaire: string) {
    setReponses(prev => ({ ...prev, [itemId]: { ...prev[itemId], reponse, commentaire } }));
  }

  function handlePhoto(itemId: string, photoUrl: string | undefined) {
    setReponses(prev => ({
      ...prev,
      [itemId]: { reponse: prev[itemId]?.reponse ?? null, commentaire: prev[itemId]?.commentaire ?? '', photoUrl },
    }));
  }

  function toggleSection(sec: SectionId) {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  }

  function expandAll()   { setOpenSections(Object.fromEntries(SECTIONS_ORDRE.map(s => [s, true]))  as Record<SectionId, boolean>); }
  function collapseAll() { setOpenSections(Object.fromEntries(SECTIONS_ORDRE.map(s => [s, false])) as Record<SectionId, boolean>); }

  const repsArray: ReponseCL[] = CHECKLIST_STANDARD.map(item => ({
    item_id: item.id,
    reponse: reponses[item.id]?.reponse ?? null,
  }));
  const scoreGlobal = calculerScore(repsArray, CHECKLIST_STANDARD);
  const answered    = Object.values(reponses).filter(r => r.reponse !== null).length;
  const canSubmit   = zone && auditeur && answered >= 10;

  function handleSubmit() {
    setSubmitted(true);
    setTimeout(() => onSubmit(), 1200);
  }

  if (submitted) {
    const nc = niveauConformite(scoreGlobal);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card shadow-lg p-8 text-center max-w-sm">
          <div className={clsx('w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4', nc.bg)}>
            <CheckCircle2 size={32} className={nc.color} />
          </div>
          <h2 className="text-xl font-bold text-[color:var(--text-primary)] mb-1">Audit soumis</h2>
          <p className={clsx('text-3xl font-bold my-2', nc.color)}>{scoreGlobal}%</p>
          <p className={clsx('text-sm font-medium mb-3', nc.color)}>{nc.label}</p>
          <p className="text-xs text-[color:var(--text-muted)]">Génération du rapport en cours…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="bg-[var(--bg-elevated)] border-b border-[var(--border)] px-8 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-[var(--bg-hover)] text-[color:var(--text-secondary)] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base font-bold text-[color:var(--text-primary)] leading-none">Audit terrain</h1>
            <p className="text-[11px] text-[color:var(--text-muted)] mt-0.5">Formulaire ISO 45001 · MASE 2022</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={expandAll}   className="text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] px-2 py-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">Tout ouvrir</button>
          <button onClick={collapseAll} className="text-xs text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] px-2 py-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">Tout fermer</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
              canSubmit
                ? 'bg-[#0077aa] text-white hover:bg-[#0088cc] shadow-sm'
                : 'bg-[var(--bg-hover)] text-[color:var(--text-muted)] cursor-not-allowed',
            )}
          >
            <Send size={14} />
            Soumettre l'audit
          </button>
        </div>
      </header>

      {/* ── Score bar ── */}
      <ScoreBar reponses={reponses} />

      {/* ── Corps ── */}
      <main className="px-8 py-6 space-y-6">
        {/* Infos générales */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-[color:var(--text-primary)] mb-4">Informations générales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1">Zone auditée *</label>
              <select
                value={zone}
                onChange={e => setZone(e.target.value)}
                className="w-full text-sm bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-strong)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
              >
                <option value="">Sélectionner une zone…</option>
                {ZONES_SITE.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1">Auditeur *</label>
              <input
                value={auditeur}
                onChange={e => setAuditeur(e.target.value)}
                placeholder="Nom et prénom"
                className="w-full text-sm bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-strong)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1">Date de l'audit</label>
              <input
                type="datetime-local"
                value={dateAudit}
                onChange={e => setDateAudit(e.target.value)}
                className="w-full text-sm bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-strong)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1">Type d'audit</label>
              <select
                value={typeAudit}
                onChange={e => setTypeAudit(e.target.value as 'TERRAIN' | 'SYSTEME')}
                className="w-full text-sm bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-strong)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
              >
                <option value="TERRAIN">🚶 Terrain</option>
                <option value="SYSTEME">⚙️ Système</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1">Accompagnateur</label>
              <input
                value={accompagnateur}
                onChange={e => setAccomp(e.target.value)}
                placeholder="Responsable de zone présent"
                className="w-full text-sm bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-strong)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
              />
            </div>
          </div>
        </div>

        {/* Légende */}
        <div className="flex items-center gap-4 flex-wrap text-[11px] text-[color:var(--text-secondary)] px-1">
          {REPONSE_BTNS.map(btn => (
            <div key={btn.value} className={clsx('flex items-center gap-1 px-2 py-1 rounded-lg', btn.bg, btn.text)}>
              {btn.icon}
              <span className="font-medium">{btn.label}</span>
              <span className="text-[color:var(--text-secondary)]">= {btn.value.replace('_', ' ').toLowerCase()}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 text-[color:var(--text-muted)]">
            <div className="flex gap-0.5">{[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#0077aa]" />)}</div>
            <span>= criticité (1-3)</span>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {SECTIONS_ORDRE.map(sec => (
            <SectionAccordion
              key={sec}
              sectionId={sec}
              reponses={reponses}
              onChange={handleChange}
              onPhoto={handlePhoto}
              isOpen={openSections[sec]}
              onToggle={() => toggleSection(sec)}
            />
          ))}
        </div>

        {/* Points positifs / synthèse */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-bold text-[color:var(--text-primary)]">Synthèse de l'audit</h2>
          <div>
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1">Points positifs observés</label>
            <textarea
              placeholder="Bonnes pratiques, améliorations notables depuis le dernier audit…"
              className="w-full text-sm bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-strong)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)] resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[color:var(--text-secondary)] mb-1">Synthèse générale</label>
            <textarea
              placeholder="Bilan global de l'audit, priorités d'action, tendance depuis le dernier audit…"
              className="w-full text-sm bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-strong)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)] resize-none"
              rows={4}
            />
          </div>
        </div>

        {/* Bouton soumettre */}
        <div className="flex items-center justify-between pt-2">
          {!canSubmit && (
            <p className="text-xs text-[color:var(--text-muted)]">
              {!zone ? '⚠️ Zone requise · ' : ''}
              {!auditeur ? '⚠️ Auditeur requis · ' : ''}
              {answered < 10 ? `⚠️ Minimum 10 items ({${answered}}/72)` : ''}
            </p>
          )}
          <div className="ml-auto">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={clsx(
                'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                canSubmit
                  ? 'bg-[#0077aa] text-white hover:bg-[#0088cc] shadow-sm'
                  : 'bg-[var(--bg-hover)] text-[color:var(--text-muted)] cursor-not-allowed',
              )}
            >
              <Send size={15} />
              Soumettre l'audit
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
