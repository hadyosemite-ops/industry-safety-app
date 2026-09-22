import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import {
  Shield, AlertTriangle, ClipboardCheck, Building2, Database, Radar,
  ChevronRight, ChevronLeft, Menu, X, Sun, Moon, LogOut, Search,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ElementType } from 'react';
import { clsx } from 'clsx';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { PageLoader } from '@/components/ui/PageLoader';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/components/auth/LoginPage';
import { UpdatePasswordPage } from '@/components/auth/UpdatePasswordPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleUtilisateur } from '@/modules/ptw/types';
import { ChatAssistant } from '@/modules/assistant/components/ChatAssistant';

// ── Modules chargés à la demande (code-splitting par route) ────────────────────
// Chaque module HSE (PTW, audit, accidentologie, prestataires) est volumineux
// (formulaires, wizards, graphiques). On ne les charge que lorsque la route
// correspondante est visitée, ce qui réduit le bundle initial.

const ATCreationWizard = lazy(() =>
  import('@/modules/ptw/components/creation/ATCreationWizard').then(m => ({ default: m.ATCreationWizard })),
);
const DashboardAT = lazy(() =>
  import('@/modules/ptw/components/dashboard/DashboardAT').then(m => ({ default: m.DashboardAT })),
);
const PermisQRPage = lazy(() =>
  import('@/modules/ptw/components/terrain/PermisQRPage').then(m => ({ default: m.PermisQRPage })),
);
const DashboardAccidentologie = lazy(() =>
  import('@/modules/accidentologie/components/DashboardAccidentologie').then(m => ({ default: m.DashboardAccidentologie })),
);
const DashboardAudit = lazy(() =>
  import('@/modules/audit/components/DashboardAudit').then(m => ({ default: m.DashboardAudit })),
);
const DashboardAnalyseRisques = lazy(() =>
  import('@/modules/analyse-risques/components/DashboardAnalyseRisques').then(m => ({ default: m.DashboardAnalyseRisques })),
);
const DashboardPrestataires = lazy(() =>
  import('@/modules/prestataires/components/DashboardPrestataires').then(m => ({ default: m.DashboardPrestataires })),
);
const DashboardAdmin = lazy(() =>
  import('@/modules/admin/components/DashboardAdmin').then(m => ({ default: m.DashboardAdmin })),
);

// ── Config navigation ─────────────────────────────────────────────────────────

interface NavEntry {
  to: string;
  icon: ElementType;
  label: string;
  end?: boolean;
  badge?: number;
  description?: string;
  /** Si fourni, l'entrée n'est visible que pour les utilisateurs ayant au moins un de ces rôles */
  roles?: RoleUtilisateur[];
}

interface NavGroup {
  label: string;
  items: NavEntry[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Opérations & Audit terrain',
    items: [
      {
        to: '/at',
        icon: Shield,
        label: 'Autorisations de travail',
        end: true,
        description: 'PTW & permis',
        badge: 3,
      },
      {
        to: '/audit',
        icon: ClipboardCheck,
        label: 'Audit HSE',
        end: true,
        description: 'Planning & rapports',
      },
    ],
  },
  {
    label: 'Prévention & Maîtrise des risques',
    items: [
      {
        to: '/analyse-risques',
        icon: Radar,
        label: 'Analyse des risques',
        end: true,
        description: 'Installation & Opération',
      },
    ],
  },
  {
    label: 'Résolution & Amélioration',
    items: [
      {
        to: '/accidentologie',
        icon: AlertTriangle,
        label: 'Accidentologie',
        end: true,
        description: 'Accidents & incidents',
      },
    ],
  },
  {
    label: 'Gestion',
    items: [
      {
        to: '/prestataires',
        icon: Building2,
        label: 'Prestataires',
        end: true,
        description: 'Évaluations & docs',
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        to: '/base-donnees',
        icon: Database,
        label: 'Base de données',
        end: true,
        description: 'Sites, zones, intervenants',
      },
    ],
  },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

function Sidebar({ open, onClose, collapsed, onToggleCollapsed }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const nomComplet = profile ? `${profile.prenom} ${profile.nom.charAt(0)}.` : 'Chargement…';
  const roleLabel = profile?.roles?.[0]?.replace(/_/g, ' ') ?? '';

  // ── Recherche rapide (⌘K) ────────────────────────────────────────────────
  const [recherche, setRecherche] = useState('');
  const rechercheRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        rechercheRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === rechercheRef.current) {
        setRecherche('');
        rechercheRef.current?.blur();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Filtre les entrées de navigation dont l'accès est restreint à certains
  // rôles (ex. "Base de données" → ADMIN/HSE_MANAGER) puis retire les groupes
  // qui se retrouveraient vides. Tant que le profil n'est pas encore chargé,
  // les entrées restreintes restent masquées par défaut (fail-closed).
  const groupesVisibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return NAV_GROUPS
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          (!item.roles || item.roles.some(r => profile?.roles?.includes(r))) &&
          (q === '' || item.label.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)),
        ),
      }))
      .filter(group => group.items.length > 0);
  }, [profile, recherche]);

  const aucunResultat = recherche.trim() !== '' && groupesVisibles.length === 0;

  // Initiales de l'utilisateur pour l'avatar en dégradé du pied de sidebar
  // (dégradé accent → accent-2, exactement comme dans la maquette — thème-réactif).
  const initiales = profile
    ? `${profile.prenom.charAt(0)}${profile.nom.charAt(0)}`.toUpperCase()
    : '··';

  return (
    <aside
      className={clsx(
        'no-print fixed left-0 top-0 h-screen flex flex-col z-40 select-none border-r',
        'w-[240px]',
        collapsed ? 'lg:w-[72px]' : 'lg:w-[240px]',
        'transform transition-all duration-200 ease-out lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
      style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
    >

      {/* ── Bouton réduire/agrandir (desktop uniquement) ── */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
        className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full items-center justify-center
                   transition-colors shadow-md z-10"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}
      >
        {collapsed ? <ChevronRight size={12} aria-hidden="true" /> : <ChevronLeft size={12} aria-hidden="true" />}
      </button>

      {/* ── Logo ── */}
      <div className={clsx('pt-5 pb-4 border-b', collapsed ? 'px-0' : 'px-5')} style={{ borderColor: 'var(--border)' }}>
        <div className={clsx('flex items-center gap-3', collapsed && 'justify-center')}>
          {/* Logo icon */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-2))', boxShadow: '0 0 20px rgba(0,212,255,0.35)' }}
          >
            <Shield size={18} className="text-[#06101f]" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>HSE 365</p>
              <p className="text-[10px] mt-0.5 font-medium tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Industriel</p>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className={clsx('lg:hidden p-1.5 rounded-lg transition-colors flex-shrink-0', collapsed && 'hidden')}
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Recherche rapide ── */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors focus-within:border-[var(--color-accent)]"
            style={{ background: 'var(--bg-hover)', borderColor: 'var(--border)' }}
          >
            <Search size={13} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
            <input
              ref={rechercheRef}
              type="text"
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher..."
              aria-label="Rechercher dans la navigation"
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-xs"
              style={{ color: 'var(--text-primary)' }}
            />
            {recherche === '' ? (
              <kbd
                className="hidden sm:inline-block text-[9px] font-semibold rounded px-1.5 py-0.5 flex-shrink-0 border"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)', borderColor: 'var(--border-strong)' }}
              >
                ⌘K
              </kbd>
            ) : (
              <button
                type="button"
                onClick={() => setRecherche('')}
                aria-label="Effacer la recherche"
                className="transition-colors flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 min-h-0 px-3 py-4 space-y-3.5 overflow-y-auto overflow-x-hidden no-scrollbar">
        {aucunResultat && (
          <p className="px-3 py-4 text-xs text-center italic" style={{ color: 'var(--text-muted)' }}>
            Aucun résultat pour « {recherche} »
          </p>
        )}
        {groupesVisibles.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2.5 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-widest truncate" style={{ color: 'var(--text-muted)' }}>
                {group.label}
              </p>
            )}
            <div>
              {group.items.map(({ to, icon: Icon, label, end, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onClose}
                  aria-label={collapsed ? label : undefined}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) => clsx(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[13.2px] mb-px transition-all duration-150 w-full border-l-[3px] border-transparent',
                    collapsed && 'justify-center px-0',
                    isActive ? 'font-semibold' : 'font-medium',
                  )}
                  style={({ isActive }) => isActive
                    ? {
                        background: 'linear-gradient(135deg, rgba(0,212,255,0.14), rgba(139,123,255,0.08))',
                        boxShadow: 'inset 0 0 0 1px rgba(0,212,255,0.25)',
                        borderLeftColor: 'var(--color-accent)',
                        color: 'var(--text-primary)',
                      }
                    : { color: 'var(--text-secondary)' }
                  }
                  onMouseEnter={e => {
                    if (!e.currentTarget.classList.contains('font-semibold')) {
                      e.currentTarget.style.background = 'var(--bg-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!e.currentTarget.classList.contains('font-semibold')) {
                      e.currentTarget.style.background = '';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <Icon size={16} className="flex-shrink-0" style={{ opacity: 0.85 }} strokeWidth={1.9} />

                  {!collapsed && (
                    <>
                      <span className="flex-1 min-w-0 truncate">{label}</span>

                      {badge !== undefined && badge > 0 && (
                        <span
                          className="flex-shrink-0 text-[10.5px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: 'var(--warning-bg, rgba(255,179,0,0.16))', color: 'var(--badge-amber-text)' }}
                        >
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Pied — thème + user ── */}
      <div className={clsx('py-3 border-t space-y-1', collapsed ? 'px-2' : 'px-3')} style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          title={collapsed ? (theme === 'dark' ? 'Mode sombre' : 'Mode clair') : undefined}
          className={clsx(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-[9px] transition-colors duration-150 text-[12.5px] font-medium',
            collapsed && 'justify-center px-0',
          )}
          style={{ color: 'var(--text-secondary)' }}
        >
          {theme === 'dark' ? <Moon size={14} aria-hidden="true" /> : <Sun size={14} aria-hidden="true" />}
          {!collapsed && (
            <>
              <span>{theme === 'dark' ? 'Mode sombre' : 'Mode clair'}</span>
              <span
                className="ml-auto relative w-[30px] h-[17px] rounded-full flex-shrink-0 transition-colors duration-200"
                style={{ background: theme === 'dark' ? 'var(--color-accent)' : 'var(--border-strong)' }}
              >
                <span
                  className="absolute top-[2px] left-[2px] w-[13px] h-[13px] rounded-full bg-white transition-transform duration-200"
                  style={{ transform: theme === 'dark' ? 'translateX(13px)' : 'translateX(0)', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}
                />
              </span>
            </>
          )}
        </button>

        {/* User card */}
        <div className={clsx('mt-1.5 pt-2.5 border-t flex items-center gap-2.5', collapsed ? 'justify-center' : 'px-1')} style={{ borderColor: 'var(--border)' }}>
          <div
            className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center flex-shrink-0 font-bold text-[12px] text-white"
            style={{ background: 'linear-gradient(135deg, var(--color-accent-2), var(--color-accent))' }}
          >
            {initiales}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold leading-none truncate" style={{ color: 'var(--text-primary)' }}>{nomComplet}</p>
                <p className="text-[10.5px] mt-0.5 truncate capitalize" style={{ color: 'var(--text-muted)' }}>{roleLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                aria-label="Se déconnecter"
                title="Se déconnecter"
                className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                <LogOut size={13} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

// ── Layout principal ──────────────────────────────────────────────────────────

const SIDEBAR_COLLAPSED_KEY = 'hse-sidebar-collapsed';

function Layout() {
  const { pathname } = useLocation();
  const { session } = useAuth();
  // Seule la page terrain (QR code, accès hors navigation principale) reste
  // en plein écran sans la sidebar. Le wizard de création d'AT (/at/nouvelle)
  // reste dans le Layout normal : la navigation principale doit rester
  // accessible même en cours de création d'une AT.
  const hideSidebar = pathname.startsWith('/permis/');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1',
  );

  // Referme le menu mobile à chaque changement de page.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed(prev => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  }

  if (hideSidebar) {
    return (
      <ErrorBoundary moduleLabel="ce module">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/permis/:token" element={<PermisQRPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-app)]">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      {/* Overlay mobile — ferme le menu au clic en dehors */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className={clsx(
        'flex-1 min-h-screen overflow-x-hidden transition-[margin] duration-200 ease-out',
        collapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]',
      )}>
        {/* Barre mobile — hamburger, visible uniquement sous 1024px */}
        <div
          className="no-print lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 backdrop-blur-md border-b"
          style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            className="p-2 rounded-lg transition-colors"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>HSE 365</span>
        </div>

        <ErrorBoundary key={pathname} moduleLabel="ce module">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"              element={<Navigate to="/at" replace />} />
              <Route path="/at"            element={<ProtectedRoute><DashboardAT /></ProtectedRoute>} />
              <Route path="/at/nouvelle"   element={<ProtectedRoute><ATCreationWizard /></ProtectedRoute>} />
              <Route path="/accidentologie" element={<ProtectedRoute><DashboardAccidentologie /></ProtectedRoute>} />
              <Route path="/audit"          element={<ProtectedRoute><DashboardAudit /></ProtectedRoute>} />
              <Route path="/analyse-risques" element={<ProtectedRoute><DashboardAnalyseRisques /></ProtectedRoute>} />
              <Route path="/prestataires"   element={<ProtectedRoute><DashboardPrestataires /></ProtectedRoute>} />
              <Route
                path="/base-donnees"
                element={
                  <ProtectedRoute>
                    <DashboardAdmin />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Assistant HSE — widget flottant, visible sur toutes les pages
          authentifiées (hors /login, /update-password, /permis/:token et le
          wizard de création d'AT, gérés par la branche hideSidebar ci-dessus). */}
      {session && <ChatAssistant />}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <ErrorBoundary moduleLabel="l'application">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/update-password" element={<UpdatePasswordPage />} />
                  <Route path="/permis/:token" element={<PermisQRPage />} />
                  <Route path="*" element={<Layout />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
