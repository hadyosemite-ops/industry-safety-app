import { useState } from 'react';
import {
  Building2, Calendar, MapPin, Users,
  ClipboardCheck, AlertTriangle, Activity,
  UserCheck, UserX, CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ATDemo } from './demo.data';
import { BadgeRisque } from './DashboardAnimateur';
import { PermisChip } from './DashboardAnimateur';
import { SuspensionModal, SuspensionFormData } from './SuspensionModal';
import { AuditModal, AuditFormData } from './AuditModal';

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  at: ATDemo;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function ATActiveCard({ at }: Props) {
  const [modalOuvert, setModalOuvert] = useState<'audit' | 'suspension' | null>(null);
  const [suspendue, setSuspendue] = useState(false);
  const [auditEnregistre, setAuditEnregistre] = useState<AuditFormData | null>(null);

  // Calcul check-in temps réel
  const tousIntervenants = at.permis.flatMap(p => p.intervenants);
  const intervenantsUniques = tousIntervenants.reduce((acc, iv) => {
    if (!acc.find(x => x.id === iv.id)) acc.push(iv);
    return acc;
  }, [] as typeof tousIntervenants);

  const presentCount = intervenantsUniques.filter(
    iv => iv.check_in_at && !iv.check_out_at,
  ).length;
  const totalCount = at.nombre_intervenants_prevu;
  const tauxPresence = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

  const dateDebut = (() => {
    try { return format(new Date(at.date_debut_prevue), 'dd MMM', { locale: fr }); }
    catch { return at.date_debut_prevue; }
  })();
  const dateFin = (() => {
    try { return format(new Date(at.date_fin_prevue), 'dd MMM yyyy', { locale: fr }); }
    catch { return at.date_fin_prevue; }
  })();

  function handleSuspension(data: SuspensionFormData) {
    console.log('Suspension AT :', at.numero_at, data);
    setSuspendue(true);
    setModalOuvert(null);
  }

  function handleAudit(data: AuditFormData) {
    console.log('Audit AT :', at.numero_at, data);
    setAuditEnregistre(data);
    setModalOuvert(null);
  }

  if (suspendue) {
    return (
      <div className="bg-safety-50 border border-safety-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
        <AlertTriangle size={20} className="text-safety-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-[color:var(--badge-safety-text)]">{at.titre}</p>
          <p className="text-xs text-[color:var(--badge-safety-text)] mt-0.5">{at.numero_at} · AT suspendue — en attente de levée</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card overflow-hidden transition-all duration-200 hover:shadow-md">

        {/* ── Header ── */}
        <div className="px-5 pt-4 pb-3 border-b border-[var(--border)]">
          <div className="flex items-start gap-3">
            <div className={clsx(
              'w-1 self-stretch rounded-full flex-shrink-0',
              at.niveau_risque === 'CRITIQUE' ? 'bg-danger-400' :
              at.niveau_risque === 'ELEVE'    ? 'bg-amber-400' : 'bg-success-400',
            )} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-xs font-mono text-[color:var(--text-muted)] bg-[var(--bg-hover)] border border-[var(--border)] px-2 py-0.5 rounded-md">
                  {at.numero_at}
                </span>
                <BadgeRisque niveau={at.niveau_risque} />
                <span className="inline-flex items-center gap-1 text-xs bg-success-50 text-[color:var(--badge-success-text)] border border-success-200 px-2 py-0.5 rounded-full font-semibold">
                  <Activity size={10} />
                  Active
                </span>
              </div>
              <h3 className="font-bold text-[color:var(--text-primary)] text-sm leading-snug">{at.titre}</h3>
            </div>
          </div>

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
              <span>{dateDebut} → {dateFin}</span>
            </div>
          </div>
        </div>

        {/* ── Jauge check-in ── */}
        <div className="px-5 py-3 bg-[var(--bg-hover)] border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--text-secondary)]">
              <Users size={12} />
              Intervenants présents
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-[color:var(--badge-success-text)] font-medium">
                <UserCheck size={11} />
                {presentCount} présent{presentCount > 1 ? 's' : ''}
              </span>
              {totalCount - presentCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-[color:var(--text-muted)]">
                  <UserX size={11} />
                  {totalCount - presentCount} absent{totalCount - presentCount > 1 ? 's' : ''}
                </span>
              )}
              <span className="text-xs font-bold text-[color:var(--text-secondary)]">
                {presentCount}/{totalCount}
              </span>
            </div>
          </div>
          <div className="h-2.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-500',
                tauxPresence === 100 ? 'bg-success-500' :
                tauxPresence >= 50   ? 'bg-navy-400' : 'bg-[var(--bg-hover)]',
              )}
              style={{ width: `${tauxPresence}%` }}
            />
          </div>

          {/* Liste intervenants mini */}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {intervenantsUniques.map(iv => {
              const present = iv.check_in_at && !iv.check_out_at;
              const sorti   = iv.check_in_at && iv.check_out_at;
              return (
                <span
                  key={iv.id}
                  title={`${iv.nom_complet} — ${present ? 'En cours' : sorti ? 'Sorti' : 'Pas encore arrivé'}`}
                  className={clsx(
                    'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg border font-medium',
                    present ? 'bg-success-50 text-[color:var(--badge-success-text)] border-success-200' :
                    sorti   ? 'bg-[var(--bg-hover)] text-[color:var(--text-muted)] border-[var(--border)] line-through' :
                    'bg-[var(--bg-hover)] text-[color:var(--text-muted)] border-[var(--border)]',
                  )}
                >
                  {present && <span className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse" />}
                  {iv.nom_complet.split(' ')[0]}
                </span>
              );
            })}
          </div>
        </div>

        {/* ── Permis actifs ── */}
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <p className="text-xs font-semibold text-[color:var(--text-muted)] uppercase tracking-wider mb-2">Permis actifs</p>
          <div className="space-y-1.5">
            {at.permis.map(permis => (
              <PermisChip key={permis.id} permis={permis} clickable={false} />
            ))}
          </div>
        </div>

        {/* ── Audit récent ── */}
        {(at.audits.length > 0 || auditEnregistre) && (
          <div className="px-5 py-3 bg-[var(--bg-hover)] border-b border-[var(--border)]">
            {auditEnregistre ? (
              <div className={clsx(
                'flex items-center gap-2 text-sm rounded-lg px-3 py-2 border',
                auditEnregistre.resultat === 'CONFORME'          ? 'bg-success-50 border-success-200 text-[color:var(--badge-success-text)]' :
                auditEnregistre.resultat === 'CONFORME_RESERVES' ? 'bg-amber-50 border-amber-200 text-[color:var(--badge-amber-text)]' :
                'bg-danger-50 border-danger-200 text-[color:var(--badge-danger-text)]',
              )}>
                <CheckCircle2 size={14} className="flex-shrink-0" />
                <span className="font-medium">Audit enregistré</span>
                <span className="opacity-70">·</span>
                <span className="truncate">{auditEnregistre.observations}</span>
              </div>
            ) : at.audits.length > 0 ? (
              <div className="flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
                <ClipboardCheck size={13} className="text-[color:var(--text-muted)] flex-shrink-0" />
                <span>
                  Dernier audit : <strong className="text-[color:var(--text-secondary)]">{at.audits[at.audits.length - 1].resultat}</strong>
                  {' '}· {at.audits[at.audits.length - 1].auditeur_nom}
                </span>
              </div>
            ) : null}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="px-5 py-4 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalOuvert('audit')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#00d4ff] text-[color:var(--badge-navy-text)] bg-[var(--bg-hover)] text-sm font-semibold hover:bg-navy-50 transition-colors"
          >
            <ClipboardCheck size={15} />
            Audit terrain
          </button>
          <button
            type="button"
            onClick={() => setModalOuvert('suspension')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-safety-300 text-[color:var(--badge-safety-text)] bg-safety-50 text-sm font-semibold hover:bg-safety-100 transition-colors ml-auto"
          >
            <AlertTriangle size={15} />
            Suspendre
          </button>
        </div>
      </div>

      {/* Modals */}
      {modalOuvert === 'suspension' && (
        <SuspensionModal at={at} onClose={() => setModalOuvert(null)} onConfirmer={handleSuspension} />
      )}
      {modalOuvert === 'audit' && (
        <AuditModal at={at} onClose={() => setModalOuvert(null)} onConfirmer={handleAudit} />
      )}
    </>
  );
}
