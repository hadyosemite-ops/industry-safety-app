import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Shield, MapPin, Building2, Calendar,
  ChevronDown, ChevronUp, CheckCircle2, LogIn, LogOut,
  UserCheck, Clock, ArrowLeft, QrCode, Ban,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AT_DEMO, PermisDemo, ATDemo, LABELS_PERMIS, ICONES_PERMIS } from '../dashboard/demo.data';

// ── Helpers ───────────────────────────────────────────────────────────────────

function findPermisParToken(token: string): { permis: PermisDemo; at: ATDemo } | null {
  for (const at of AT_DEMO) {
    const permis = at.permis.find(p => p.qr_code_token === token);
    if (permis) return { permis, at };
  }
  return null;
}

const LABELS_CATEGORIE: Record<string, string> = {
  ZONE:          'Zone & Balisage',
  SECURITE:      'Sécurité',
  EPI:           'EPI',
  ISOLATION:     'Consignation / Isolation',
  HABILITATION:  'Habilitations',
  ATMOSPHERIQUE: 'Atmosphère',
  ORGANISATION:  'Organisation',
  URGENCE:       'Urgence / Secours',
  COMMUNICATION: 'Communication',
  DOCUMENTATION: 'Documentation',
  EQUIPEMENT:    'Équipements',
  METEO:         'Météo',
};

const STATUT_PERMIS_CFG: Record<PermisDemo['statut'], { label: string; cls: string; icon: React.ReactNode }> = {
  EN_ATTENTE: { label: 'En attente de validation',  cls: 'bg-navy-100 text-navy-300',    icon: <Clock size={14} /> },
  VALIDE:     { label: 'Validé — Accès autorisé',   cls: 'bg-success-100 text-success-700',  icon: <CheckCircle2 size={14} /> },
  REJETE:     { label: 'Rejeté',                    cls: 'bg-danger-100 text-danger-700',      icon: <Ban size={14} /> },
  SUSPENDU:   { label: 'Suspendu — Travaux arrêtés',cls: 'bg-amber-100 text-amber-700',icon: <AlertTriangle size={14} /> },
  CLOS:       { label: 'Clôturé',                   cls: 'bg-white/[0.08] text-slate-400',    icon: <CheckCircle2 size={14} /> },
};

// ── Section accordéon ─────────────────────────────────────────────────────────

function Section({
  title, icon: Icon, badge, children, defaultOpen = true,
}: {
  title: string; icon: React.ElementType; badge?: string | number;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
      >
        <Icon size={16} className="text-slate-400 flex-shrink-0" />
        <span className="font-semibold text-slate-200 text-sm flex-1 text-left">{title}</span>
        {badge !== undefined && (
          <span className="bg-white/[0.06] border border-white/[0.12] text-slate-300 text-xs px-2 py-0.5 rounded-full font-medium">
            {badge}
          </span>
        )}
        {open ? <ChevronUp size={15} className="text-slate-500" /> : <ChevronDown size={15} className="text-slate-500" />}
      </button>
      {open && <div className="px-4 py-4">{children}</div>}
    </div>
  );
}

// ── Page 404 ──────────────────────────────────────────────────────────────────

function PageIntrouvable({ token }: { token: string }) {
  return (
    <div className="theme-force-dark min-h-screen bg-[#020817] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-danger-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <QrCode size={28} className="text-danger-500" />
      </div>
      <h1 className="text-xl font-bold text-slate-50">QR Code invalide</h1>
      <p className="text-slate-400 text-sm mt-2 max-w-xs">
        Le permis associé à ce QR code est introuvable.
        <br />
        <span className="font-mono text-xs text-slate-500 mt-1 block">{token}</span>
      </p>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function PermisQRPage() {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // Recherche le permis
  const result = useMemo(() => findPermisParToken(token), [token]);

  // État local intervenants (simulation check-in/out)
  const [checkIns, setCheckIns] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    if (result) {
      result.permis.intervenants.forEach(iv => {
        init[iv.id] = iv.check_in_at ?? null;
      });
    }
    return init;
  });

  const [intervenantSelectionne, setIntervenantSelectionne] = useState<string | null>(null);
  const [confirmationAffichee, setConfirmationAffichee]     = useState<'checkin' | 'checkout' | null>(null);

  if (!result) return <PageIntrouvable token={token} />;

  const { permis, at } = result;
  const statutCfg = STATUT_PERMIS_CFG[permis.statut];
  const atSuspendue = at.statut === 'SUSPENDUE';
  const permisActif = permis.statut === 'VALIDE' && at.statut === 'ACTIVE';
  const canCheckInOut = permisActif;

  // Grouper la checklist par catégorie
  const categoriesChecklist = useMemo(() => {
    const map = new Map<string, typeof permis.checklist_reponses>();
    for (const item of permis.checklist_reponses) {
      if (!map.has(item.categorie)) map.set(item.categorie, []);
      map.get(item.categorie)!.push(item);
    }
    return map;
  }, [permis.checklist_reponses]);

  const anomalies = permis.checklist_reponses.filter(r => r.reponse === 'NON' && r.obligatoire);

  // Formatage dates
  const dateDebut = (() => {
    try { return format(new Date(at.date_debut_prevue), "dd MMM yyyy 'à' HH:mm", { locale: fr }); }
    catch { return at.date_debut_prevue; }
  })();
  const dateFin = (() => {
    try { return format(new Date(at.date_fin_prevue), "dd MMM yyyy 'à' HH:mm", { locale: fr }); }
    catch { return at.date_fin_prevue; }
  })();

  // Check-in / Check-out
  function handleCheckIn() {
    if (!intervenantSelectionne) return;
    const now = new Date().toISOString();
    setCheckIns(prev => ({ ...prev, [intervenantSelectionne]: now }));
    setConfirmationAffichee('checkin');
    setTimeout(() => setConfirmationAffichee(null), 3000);
  }

  function handleCheckOut() {
    if (!intervenantSelectionne) return;
    setCheckIns(prev => ({ ...prev, [intervenantSelectionne]: null }));
    setConfirmationAffichee('checkout');
    setTimeout(() => setConfirmationAffichee(null), 3000);
    setIntervenantSelectionne(null);
  }

  const ivSelectionne = permis.intervenants.find(iv => iv.id === intervenantSelectionne);
  const estCheckedIn  = intervenantSelectionne ? !!checkIns[intervenantSelectionne] : false;

  return (
    <div className="theme-force-dark min-h-screen bg-[#020817] pb-32">

      {/* ── Header ── */}
      <header className="bg-[#0077aa] sticky top-0 z-20 shadow-lg">
        <div className="max-w-sm mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-white/50 text-xs truncate">{at.numero_at}</p>
              <p className="text-white text-xs font-medium truncate">{at.zone}</p>
            </div>
            <span className="text-2xl leading-none flex-shrink-0">{ICONES_PERMIS[permis.type_permis]}</span>
          </div>

          <h1 className="text-white font-bold text-lg leading-tight">
            {LABELS_PERMIS[permis.type_permis]}
          </h1>

          {/* Badge statut permis */}
          <div className={clsx(
            'inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full text-xs font-semibold',
            statutCfg.cls,
          )}>
            {statutCfg.icon}
            {statutCfg.label}
          </div>
        </div>
      </header>

      <div className="max-w-sm mx-auto px-4 py-4 space-y-3">

        {/* ── Bannière AT suspendue ── */}
        {atSuspendue && (
          <div className="bg-orange-500 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle size={22} className="text-white flex-shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-white font-bold text-base">Travaux suspendus</p>
              <p className="text-orange-100 text-sm mt-1 leading-snug">
                Cette autorisation de travail est suspendue. Aucune activité n'est autorisée.
                Contactez l'Animateur de Sécurité.
              </p>
              {at.suspensions[0] && (
                <p className="text-orange-200 text-xs mt-2 font-medium">
                  Motif : {at.suspensions[0].motif_suspension}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Bannière permis non valide ── */}
        {!atSuspendue && permis.statut === 'EN_ATTENTE' && (
          <div className="bg-navy-50 border border-navy-200 rounded-2xl p-4 flex items-start gap-3">
            <Clock size={18} className="text-navy-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-navy-300 font-semibold text-sm">Permis en attente de validation</p>
              <p className="text-navy-400 text-xs mt-1">Ce permis n'a pas encore été validé par l'Animateur de Sécurité. Le check-in n'est pas autorisé.</p>
            </div>
          </div>
        )}

        {!atSuspendue && permis.statut === 'REJETE' && (
          <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 flex items-start gap-3">
            <Ban size={18} className="text-danger-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-danger-700 font-semibold text-sm">Permis rejeté</p>
              {permis.motif_rejet && <p className="text-danger-400 text-xs mt-1">{permis.motif_rejet}</p>}
            </div>
          </div>
        )}

        {/* ── Infos AT ── */}
        <div className="card p-4 shadow-sm space-y-2.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Autorisation de travail</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Building2 size={13} className="text-slate-500 flex-shrink-0" />
              <span className="font-medium">{at.entreprise_intervenante}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin size={13} className="text-slate-500 flex-shrink-0" />
              <span>[{at.code_zone}] {at.zone}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-300">
              <Calendar size={13} className="text-slate-500 flex-shrink-0 mt-0.5" />
              <span>{dateDebut} → {dateFin}</span>
            </div>
          </div>

          {/* Niveau de risque */}
          <div className={clsx(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mt-1',
            at.niveau_risque === 'CRITIQUE' ? 'bg-danger-100 text-danger-700'    :
            at.niveau_risque === 'ELEVE'    ? 'bg-amber-100 text-amber-700':
            'bg-success-100 text-success-700',
          )}>
            <AlertTriangle size={11} />
            Risque {at.niveau_risque.toLowerCase()}
          </div>
        </div>

        {/* ── Anomalies checklist ── */}
        {anomalies.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 text-sm font-semibold">
                {anomalies.length} point{anomalies.length > 1 ? 's' : ''} NON validé{anomalies.length > 1 ? 's' : ''} sur ce permis
              </p>
              <ul className="mt-1 space-y-0.5">
                {anomalies.map(a => (
                  <li key={a.question_id} className="text-red-600 text-xs">• {a.question_libelle}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── EPI obligatoires ── */}
        <Section icon={Shield} title="EPI obligatoires" badge={permis.epi_requis.length}>
          <div className="flex flex-wrap gap-2">
            {permis.epi_requis.map(epi => (
              <span key={epi} className="bg-navy-100 text-navy-300 border border-navy-200 text-sm px-3 py-1.5 rounded-xl font-medium">
                {epi}
              </span>
            ))}
          </div>
        </Section>

        {/* ── Mesures de prévention ── */}
        <Section icon={ShieldCheckIcon} title="Mesures de prévention" badge={permis.mesures_prevention.length}>
          <ul className="space-y-2">
            {permis.mesures_prevention.map(m => (
              <li key={m} className="flex items-start gap-2.5 text-sm text-slate-300">
                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 mt-1.5" />
                {m}
              </li>
            ))}
          </ul>
        </Section>

        {/* ── Checklist ── */}
        <Section icon={ClipboardIcon} title="Checklist terrain" badge={`${permis.checklist_reponses.length} points`} defaultOpen={false}>
          <div className="space-y-4">
            {Array.from(categoriesChecklist.entries()).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {LABELS_CATEGORIE[cat] ?? cat}
                </p>
                <div className="space-y-1.5">
                  {items.map(item => (
                    <div
                      key={item.question_id}
                      className={clsx(
                        'flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-sm',
                        item.reponse === 'NON' && item.obligatoire
                          ? 'bg-danger-50 border border-danger-100'
                          : 'bg-white/[0.04]',
                      )}
                    >
                      <span className={clsx(
                        'flex-1 text-sm leading-snug',
                        item.reponse === 'NON' && item.obligatoire ? 'text-danger-700 font-medium' : 'text-slate-300',
                      )}>
                        {item.obligatoire && <span className="text-danger-400 mr-1">*</span>}
                        {item.question_libelle}
                      </span>
                      <span className={clsx(
                        'px-2 py-0.5 rounded-lg text-xs font-bold flex-shrink-0',
                        item.reponse === 'OUI' ? 'bg-success-100 text-success-700' :
                        item.reponse === 'NON' ? 'bg-danger-100 text-danger-700'     :
                        'bg-white/[0.08] text-slate-400',
                      )}>
                        {item.reponse === 'N_A' ? 'N/A' : item.reponse}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Intervenants — sélection pour check-in/out ── */}
        <Section icon={UserCheck} title="Intervenants" badge={permis.intervenants.length}>
          <div className="space-y-2">
            {canCheckInOut && (
              <p className="text-xs text-slate-400 mb-3">
                Appuyez sur votre nom pour sélectionner votre profil.
              </p>
            )}
            {permis.intervenants.map(iv => {
              const checkInTime = checkIns[iv.id];
              const estPresent  = !!checkInTime;
              const estSelectionne = intervenantSelectionne === iv.id;

              return (
                <button
                  key={iv.id}
                  type="button"
                  disabled={!canCheckInOut}
                  onClick={() => setIntervenantSelectionne(estSelectionne ? null : iv.id)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all duration-150',
                    !canCheckInOut ? 'cursor-default' : 'cursor-pointer',
                    estSelectionne
                      ? 'border-[#00d4ff] bg-[#00d4ff]/5 shadow-sm'
                      : estPresent
                      ? 'border-success-200 bg-success-50/60 hover:bg-success-100'
                      : 'border-white/[0.12] bg-white/[0.03] hover:bg-white/[0.06]',
                  )}
                >
                  {/* Avatar */}
                  <div className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                    estPresent ? 'bg-success-500 text-white' : 'bg-white/[0.08] text-slate-400',
                  )}>
                    {iv.nom_complet.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className={clsx(
                      'font-semibold text-sm',
                      estSelectionne ? 'text-[#4de6ff]' : 'text-slate-200',
                    )}>
                      {iv.nom_complet}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{iv.entreprise}</p>
                    {iv.habilitations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {iv.habilitations.map(h => (
                          <span key={h} className="text-xs bg-violet-500/10 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded-md">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Statut */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {estPresent ? (
                      <>
                        <span className="flex items-center gap-1 text-xs text-success-700 font-semibold">
                          <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                          Présent
                        </span>
                        {checkInTime && (
                          <span className="text-xs text-slate-500">
                            {format(new Date(checkInTime), 'HH:mm', { locale: fr })}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">Absent</span>
                    )}
                    {estSelectionne && (
                      <span className="w-5 h-5 bg-[#0077aa] rounded-full flex items-center justify-center mt-0.5">
                        <span className="w-2 h-2 bg-white rounded-full" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Validation animateur ── */}
        {permis.valide_par && (
          <div className="bg-success-50 border border-success-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-success-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-success-700 font-semibold text-sm">Validé par {permis.valide_par}</p>
              {permis.valide_le && (
                <p className="text-success-400 text-xs mt-0.5">
                  {format(new Date(permis.valide_le), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              )}
              {permis.commentaire_validation && (
                <p className="text-success-500 text-xs mt-1 italic">« {permis.commentaire_validation} »</p>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Footer sticky : bouton check-in/out ── */}
      {canCheckInOut && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0a1628]/95 backdrop-blur border-t border-white/[0.12] shadow-lg">
          <div className="max-w-sm mx-auto px-4 py-4">

            {/* Confirmation toast */}
            {confirmationAffichee && (
              <div className={clsx(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mb-3 text-center justify-center',
                confirmationAffichee === 'checkin'
                  ? 'bg-success-100 text-success-700'
                  : 'bg-safety-100 text-safety-700',
              )}>
                <CheckCircle2 size={16} />
                {confirmationAffichee === 'checkin'
                  ? `Check-in enregistré — ${format(new Date(), 'HH:mm', { locale: fr })}`
                  : 'Check-out enregistré'}
              </div>
            )}

            {!intervenantSelectionne ? (
              <div className="text-center py-1">
                <p className="text-sm text-slate-400">
                  Sélectionnez votre nom dans la liste pour effectuer votre check-in ou check-out.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-center text-xs text-slate-400">
                  Intervenant sélectionné : <strong className="text-slate-200">{ivSelectionne?.nom_complet}</strong>
                </p>
                {!estCheckedIn ? (
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-success-600 text-white font-bold text-base shadow-lg hover:bg-success-700 transition-colors active:scale-95"
                  >
                    <LogIn size={22} />
                    Check-in — Entrée sur chantier
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCheckOut}
                    className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-safety-600 text-white font-bold text-base shadow-lg hover:bg-safety-500 transition-colors active:scale-95"
                  >
                    <LogOut size={22} />
                    Check-out — Sortie du chantier
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Icônes helpers ────────────────────────────────────────────────────────────

function ShieldCheckIcon({ size, className }: { size: number; className?: string }) {
  return <Shield size={size} className={className} />;
}

function ClipboardIcon({ size, className }: { size: number; className?: string }) {
  return <CheckCircle2 size={size} className={className} />;
}
