import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import {
  Shield, AlertTriangle, ClipboardCheck, Building2, Database,
  ChevronRight, ChevronLeft, Menu, X, Sun, Moon, LogOut,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState, type ElementType } from 'react';
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
        roles: [RoleUtilisateur.ADMIN, RoleUtilisateur.HSE_MANAGER],
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
  const initiales = profile
    ? `${profile.prenom.charAt(0)}${profile.nom.charAt(0)}`.toUpperCase()
    : '··';
  const nomComplet = profile ? `${profile.prenom} ${profile.nom.charAt(0)}.` : 'Chargement…';
  const roleLabel = profile?.roles?.[0]?.replace(/_/g, ' ') ?? '';

  // Filtre les entrées de navigation dont l'accès est restreint à certains
  // rôles (ex. "Base de données" → ADMIN/HSE_MANAGER) puis retire les groupes
  // qui se retrouveraient vides. Tant que le profil n'est pas encore chargé,
  // les entrées restreintes restent masquées par défaut (fail-closed).
  const groupesVisibles = NAV_GROUPS
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        !item.roles || item.roles.some(r => profile?.roles?.includes(r)),
      ),
    }))
    .filter(group => group.items.length > 0);

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen flex flex-col z-40 select-none shadow-sidebar',
        'w-[240px]',
        collapsed ? 'lg:w-[72px]' : 'lg:w-[240px]',
        'transform transition-all duration-200 ease-out lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
      style={{ background: 'linear-gradient(180deg, #050e1f 0%, #020817 100%)' }}
    >

      {/* ── Bouton réduire/agrandir (desktop uniquement) ── */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
        className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full items-center justify-center
                   bg-[#0c1c33] border border-white/[0.12] text-white/50 hover:text-white hover:border-white/25
                   transition-colors shadow-md z-10"
      >
        {collapsed ? <ChevronRight size={12} aria-hidden="true" /> : <ChevronLeft size={12} aria-hidden="true" />}
      </button>

      {/* ── Logo ── */}
      <div className={clsx('pt-5 pb-4 border-b border-white/[0.08]', collapsed ? 'px-0' : 'px-5')}>
        <div className={clsx('flex items-center gap-3', collapsed && 'justify-center')}>
          {/* Logo icon */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #0077aa)', boxShadow: '0 0 20px rgba(0,212,255,0.35)' }}
          >
            <Shield size={18} className="text-[#02101f]" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm leading-none tracking-tight">HSE 365</p>
              <p className="text-white/40 text-[10px] mt-0.5 font-medium tracking-wide uppercase">Industriel</p>
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className={clsx(
              'lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors flex-shrink-0',
              collapsed && 'hidden',
            )}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto overflow-x-hidden no-scrollbar">
        {groupesVisibles.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold text-white/25 uppercase tracking-widest truncate">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label, end, badge, description }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onClose}
                  aria-label={collapsed ? label : undefined}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) => clsx(
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full border-l-[3px]',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-[rgba(0,212,255,0.12)] text-white border-[#00d4ff] shadow-[0_0_0_1px_rgba(0,212,255,0.2)]'
                      : 'border-transparent text-white/60 hover:text-white hover:bg-[rgba(0,212,255,0.06)]',
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {/* Icon */}
                      <div className={clsx(
                        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150',
                        isActive
                          ? 'bg-[rgba(0,212,255,0.16)]'
                          : 'bg-white/[0.06] group-hover:bg-white/[0.10]',
                      )}>
                        <Icon
                          size={14}
                          strokeWidth={isActive ? 2.5 : 1.75}
                          className={isActive ? 'text-[#00d4ff]' : 'text-white/70'}
                        />
                      </div>

                      {!collapsed && (
                        <>
                          {/* Label + description */}
                          <div className="flex-1 min-w-0">
                            <p className="leading-none truncate">{label}</p>
                            {description && !isActive && (
                              <p className="text-[10px] text-white/30 mt-0.5 truncate font-normal">{description}</p>
                            )}
                          </div>

                          {/* Badge */}
                          {badge !== undefined && badge > 0 && (
                            <span className={clsx(
                              'flex-shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center',
                              isActive
                                ? 'bg-[#00d4ff] text-[#02101f]'
                                : 'bg-[#ffb300]/80 text-[#02101f]',
                            )}>
                              {badge}
                            </span>
                          )}

                          {/* Arrow hint on active */}
                          {isActive && (
                            <ChevronRight size={13} className="text-[#4de6ff] flex-shrink-0" />
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Pied — user + actions ── */}
      <div className={clsx('py-4 border-t border-white/[0.08] space-y-1', collapsed ? 'px-2' : 'px-3')}>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          title={collapsed ? (theme === 'dark' ? 'Mode clair' : 'Mode sombre') : undefined}
          className={clsx(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-150 text-xs font-medium',
            collapsed && 'justify-center px-0',
          )}
        >
          {theme === 'dark' ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
          {!collapsed && <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>}
        </button>

        {/* User avatar */}
        <div className={clsx(
          'mt-2 pt-3 border-t border-white/[0.08] flex items-center gap-3',
          collapsed ? 'justify-center' : 'px-1',
        )}>
          <div className="w-8 h-8 rounded-xl bg-[rgba(0,212,255,0.14)] border border-[rgba(0,212,255,0.3)] flex items-center justify-center flex-shrink-0">
            <span className="text-[#4de6ff] text-xs font-bold">{initiales}</span>
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-semibold leading-none truncate">{nomComplet}</p>
                <p className="text-white/30 text-[10px] mt-0.5 truncate capitalize">{roleLabel}</p>
              </div>
              <div className="w-1.5 h-1.5 bg-[#00e676] rounded-full flex-shrink-0" />
              <button
                type="button"
                onClick={() => void signOut()}
                aria-label="Se déconnecter"
                title="Se déconnecter"
                className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.08] transition-colors flex-shrink-0"
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
  // Le wizard de création d'AT a son propre header + stepper immersif —
  // pas besoin (et pas de place) pour la sidebar principale à côté.
  const hideSidebar = pathname.startsWith('/permis/') || pathname === '/at/nouvelle';
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
            <Route path="/at/nouvelle"   element={<ProtectedRoute><ATCreationWizard /></ProtectedRoute>} />
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
        <div className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-[#050e1f]/95 backdrop-blur-md border-b border-white/[0.08]">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            className="p-2 rounded-lg bg-white/[0.06] hover:bg-[rgba(0,212,255,0.10)] transition-colors text-white/70 hover:text-white"
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <span className="text-white font-bold text-sm tracking-tight">HSE 365</span>
        </div>

        <ErrorBoundary key={pathname} moduleLabel="ce module">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"              element={<Navigate to="/at" replace />} />
              <Route path="/at"            element={<ProtectedRoute><DashboardAT /></ProtectedRoute>} />
              <Route path="/accidentologie" element={<ProtectedRoute><DashboardAccidentologie /></ProtectedRoute>} />
              <Route path="/audit"          element={<ProtectedRoute><DashboardAudit /></ProtectedRoute>} />
              <Route path="/prestataires"   element={<ProtectedRoute><DashboardPrestataires /></ProtectedRoute>} />
              <Route
                path="/base-donnees"
                element={
                  <ProtectedRoute roles={[RoleUtilisateur.ADMIN, RoleUtilisateur.HSE_MANAGER]}>
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
