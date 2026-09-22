import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { ArrowLeft, ArrowRight, Check, Plus, X, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { RisqueIndustriel, PhaseRisque, MoyenProtection, TypeMesureHierarchie } from '../types';
import {
  LABELS_PHASE, LABELS_TYPE_MESURE, ORDRE_TYPE_MESURE,
  calculerNiveau, suggererMoyensProtection,
} from '../types';
import { BadgeNiveauRisque } from './BadgeNiveauRisque';
import * as risqueService from '../services/risqueService';

interface ZoneOption { id: string; nom: string; code_zone: string; }

const ETAPES = ['Identification', 'Danger', 'Cotation & protection', 'Revue'] as const;

interface Props {
  registreExistant: RisqueIndustriel[];
  onCancel: () => void;
  onCree: (risque: RisqueIndustriel) => void;
}

export function RisqueWizard({ registreExistant, onCancel, onCree }: Props) {
  const { profile } = useAuth();
  const [etape, setEtape] = useState(0);
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  // Étape 1
  const [phase, setPhase] = useState<PhaseRisque>('OPERATION');
  const [zoneId, setZoneId] = useState('');
  const [activite, setActivite] = useState('');

  // Étape 2
  const [danger, setDanger] = useState('');
  const [situationDangereuse, setSituationDangereuse] = useState('');
  const [evenementRedoute, setEvenementRedoute] = useState('');
  const [consequencePotentielle, setConsequencePotentielle] = useState('');

  // Étape 3
  const [frequence, setFrequence] = useState(3);
  const [gravite, setGravite] = useState(3);
  const [moyens, setMoyens] = useState<MoyenProtection[]>([]);
  const [nouveauMoyen, setNouveauMoyen] = useState('');
  const [nouveauMoyenHierarchie, setNouveauMoyenHierarchie] = useState<TypeMesureHierarchie>('CONTROLE_TECHNIQUE');

  useEffect(() => {
    if (!profile?.site_id) return;
    supabase.from('zones').select('id, nom, code_zone').eq('site_id', profile.site_id).order('nom')
      .then(({ data }) => { if (data) setZones(data as ZoneOption[]); });
  }, [profile?.site_id]);

  const suggestions = useMemo(
    () => suggererMoyensProtection(danger, registreExistant),
    [danger, registreExistant],
  );

  const score = frequence * gravite;
  const niveau = calculerNiveau(score)!;

  function ajouterMoyen(m: MoyenProtection) {
    if (moyens.some(x => x.description.toLowerCase() === m.description.toLowerCase())) return;
    setMoyens(prev => [...prev, m]);
  }

  function ajouterMoyenManuel() {
    if (!nouveauMoyen.trim()) return;
    ajouterMoyen({ description: nouveauMoyen.trim(), hierarchie: nouveauMoyenHierarchie });
    setNouveauMoyen('');
  }

  function retirerMoyen(description: string) {
    setMoyens(prev => prev.filter(m => m.description !== description));
  }

  function etapeValide(i: number): boolean {
    if (i === 0) return !!activite.trim();
    if (i === 1) return !!(danger.trim() && situationDangereuse.trim() && evenementRedoute.trim() && consequencePotentielle.trim());
    return true;
  }

  async function handleSubmit() {
    if (!profile?.site_id) { setErreur('Profil utilisateur introuvable.'); return; }
    setEnvoi(true);
    setErreur('');
    const { data, error } = await risqueService.creerRisque({
      site_id: profile.site_id,
      zone_id: zoneId || null,
      phase,
      activite: activite.trim(),
      danger: danger.trim(),
      situation_dangereuse: situationDangereuse.trim(),
      evenement_redoute: evenementRedoute.trim(),
      consequence_potentielle: consequencePotentielle.trim(),
      frequence_initiale: frequence,
      gravite_initiale: gravite,
      moyens_protection: moyens,
      responsable_id: profile.id,
    });
    setEnvoi(false);
    if (error || !data) { setErreur(error?.message ?? 'Erreur lors de la création du risque.'); return; }
    onCree(data);
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="no-print" style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] flex-shrink-0">
              <ArrowLeft size={16} className="text-[color:var(--text-secondary)]" />
            </button>
            <p className="font-bold text-[color:var(--text-primary)] text-base">Nouveau risque industriel</p>
          </div>
          <div className="flex items-center gap-1.5">
            {ETAPES.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5 flex-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                  style={{
                    background: i < etape ? 'var(--color-brand)' : i === etape ? 'var(--color-accent)' : 'var(--bg-hover-strong)',
                    color: i <= etape ? '#06101f' : 'var(--text-muted)',
                  }}
                >
                  {i < etape ? <Check size={12} /> : i + 1}
                </div>
                <span className={clsx('text-[11px] font-medium hidden sm:inline truncate', i === etape ? 'text-[color:var(--text-primary)]' : 'text-[color:var(--text-muted)]')}>
                  {label}
                </span>
                {i < ETAPES.length - 1 && <span className="flex-1 h-px" style={{ background: i < etape ? 'var(--color-brand)' : 'var(--border)' }} />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-5">

        {etape === 0 && (
          <div className="card p-5 space-y-4">
            <p className="text-sm font-semibold text-[color:var(--text-primary)]">Identification</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setPhase('INSTALLATION')}
                className={clsx('p-3 rounded-xl border text-sm font-medium text-left', phase === 'INSTALLATION' ? 'border-[var(--color-accent)] bg-[rgba(0,212,255,0.08)] text-[color:var(--text-primary)]' : 'border-[var(--border)] text-[color:var(--text-secondary)]')}>
                🏗️ {LABELS_PHASE.INSTALLATION}
                <p className="text-[11px] font-normal text-[color:var(--text-muted)] mt-0.5">Montage, mise en service</p>
              </button>
              <button type="button" onClick={() => setPhase('OPERATION')}
                className={clsx('p-3 rounded-xl border text-sm font-medium text-left', phase === 'OPERATION' ? 'border-[var(--color-accent)] bg-[rgba(0,212,255,0.08)] text-[color:var(--text-primary)]' : 'border-[var(--border)] text-[color:var(--text-secondary)]')}>
                ⚙️ {LABELS_PHASE.OPERATION}
                <p className="text-[11px] font-normal text-[color:var(--text-muted)] mt-0.5">Exploitation, maintenance, arrêts</p>
              </button>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wide">Zone</label>
              <select value={zoneId} onChange={e => setZoneId(e.target.value)} className="form-select w-full mt-1 text-sm px-3 py-2 rounded-xl">
                <option value="">— Zone non spécifiée —</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.nom} ({z.code_zone})</option>)}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wide">Activité *</label>
              <input
                type="text"
                className="w-full mt-1 border border-[var(--border-strong)] rounded-xl px-3 py-2 text-sm bg-[var(--bg-input)] text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
                placeholder="Ex. Montage échafaudage, maintenance ligne 3…"
                value={activite}
                onChange={e => setActivite(e.target.value)}
              />
            </div>
          </div>
        )}

        {etape === 1 && (
          <div className="card p-5 space-y-4">
            <p className="text-sm font-semibold text-[color:var(--text-primary)]">Analyse du danger</p>
            {[
              { label: 'Danger *', value: danger, set: setDanger, placeholder: 'Ex. Chute de hauteur, exposition chimique…' },
              { label: 'Situation dangereuse *', value: situationDangereuse, set: setSituationDangereuse, placeholder: 'Contexte d\'exposition au danger' },
              { label: 'Événement redouté *', value: evenementRedoute, set: setEvenementRedoute, placeholder: 'Ce qui pourrait se produire' },
              { label: 'Conséquence potentielle *', value: consequencePotentielle, set: setConsequencePotentielle, placeholder: 'Impact sur les personnes/biens/environnement' },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wide">{f.label}</label>
                <textarea
                  className="w-full mt-1 border border-[var(--border-strong)] rounded-xl px-3 py-2 text-sm bg-[var(--bg-input)] text-[color:var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
                  rows={2}
                  placeholder={f.placeholder}
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        {etape === 2 && (
          <div className="space-y-4">
            <div className="card p-5 space-y-3">
              <p className="text-sm font-semibold text-[color:var(--text-primary)]">Cotation initiale</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wide">Fréquence</label>
                  <select value={frequence} onChange={e => setFrequence(Number(e.target.value))} className="form-select w-full mt-1 text-sm px-3 py-2 rounded-xl">
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wide">Gravité</label>
                  <select value={gravite} onChange={e => setGravite(Number(e.target.value))} className="form-select w-full mt-1 text-sm px-3 py-2 rounded-xl">
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[color:var(--text-secondary)]">Score : <strong>{score}</strong></span>
                <BadgeNiveauRisque niveau={niveau} taille="sm" />
              </div>
            </div>

            <div className="card p-5 space-y-3">
              <p className="text-sm font-semibold text-[color:var(--text-primary)]">Moyens de protection existants</p>

              {suggestions.length > 0 && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] p-3 space-y-1.5">
                  <p className="text-[11px] font-semibold text-[color:var(--badge-navy-text)] flex items-center gap-1.5">
                    <Sparkles size={11} /> Suggestions pour un danger similaire
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => ajouterMoyen(s)}
                        className="text-xs px-2 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[color:var(--text-secondary)] hover:border-[var(--color-accent)] transition-colors"
                      >
                        + {s.description}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                {moyens.map(m => (
                  <div key={m.description} className="flex items-center gap-2 text-xs bg-[var(--bg-hover)] rounded-lg px-2.5 py-1.5">
                    <span className="flex-1 text-[color:var(--text-secondary)]">{m.description}</span>
                    <span className="text-[10px] text-[color:var(--text-muted)]">{LABELS_TYPE_MESURE[m.hierarchie]}</span>
                    <button type="button" onClick={() => retirerMoyen(m.description)} className="text-[color:var(--text-muted)] hover:text-danger-500">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 text-xs bg-[var(--bg-input)] text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,212,255,0.35)]"
                  placeholder="Ex. Garde-corps, EPI, procédure…"
                  value={nouveauMoyen}
                  onChange={e => setNouveauMoyen(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); ajouterMoyenManuel(); } }}
                />
                <select value={nouveauMoyenHierarchie} onChange={e => setNouveauMoyenHierarchie(e.target.value as TypeMesureHierarchie)} className="form-select text-xs px-2 py-1.5 rounded-lg">
                  {ORDRE_TYPE_MESURE.map(t => <option key={t} value={t}>{LABELS_TYPE_MESURE[t]}</option>)}
                </select>
                <button type="button" onClick={ajouterMoyenManuel} className="p-1.5 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-hover-strong)]">
                  <Plus size={14} className="text-[color:var(--text-secondary)]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {etape === 3 && (
          <div className="card p-5 space-y-4">
            <p className="text-sm font-semibold text-[color:var(--text-primary)]">Revue avant enregistrement</p>
            <div className="space-y-2 text-sm text-[color:var(--text-secondary)]">
              <p><span className="font-semibold text-[color:var(--text-primary)]">Phase :</span> {LABELS_PHASE[phase]}</p>
              <p><span className="font-semibold text-[color:var(--text-primary)]">Activité :</span> {activite}</p>
              <p><span className="font-semibold text-[color:var(--text-primary)]">Danger :</span> {danger}</p>
              <p><span className="font-semibold text-[color:var(--text-primary)]">Événement redouté :</span> {evenementRedoute}</p>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[color:var(--text-primary)]">Cotation initiale :</span>
                <span>F{frequence} × G{gravite} = {score}</span>
                <BadgeNiveauRisque niveau={niveau} taille="sm" />
              </div>
              <p><span className="font-semibold text-[color:var(--text-primary)]">Moyens de protection :</span> {moyens.length > 0 ? moyens.map(m => m.description).join(', ') : 'Aucun'}</p>
            </div>
            {erreur && <p className="text-danger-400 text-xs">{erreur}</p>}
          </div>
        )}

      </main>

      <div className="no-print sticky bottom-0 border-t border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button type="button" onClick={() => (etape === 0 ? onCancel() : setEtape(e => e - 1))} className="btn-ghost text-sm px-4 py-2">
            {etape === 0 ? 'Annuler' : 'Précédent'}
          </button>
          {etape < ETAPES.length - 1 ? (
            <button
              type="button"
              onClick={() => etapeValide(etape) && setEtape(e => e + 1)}
              disabled={!etapeValide(etape)}
              className="btn-primary text-sm px-5 py-2 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant <ArrowRight size={14} />
            </button>
          ) : (
            <button type="button" onClick={() => void handleSubmit()} disabled={envoi} className="btn-primary text-sm px-5 py-2 disabled:opacity-50">
              {envoi ? 'Création…' : 'Créer le risque'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
