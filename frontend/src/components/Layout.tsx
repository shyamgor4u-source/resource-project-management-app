import { ReactNode, useState } from 'react';
import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Users,
  Clock,
  FolderKanban,
  Menu,
  X,
  ChevronRight,
  LogOut,
  UserCircle,
  BarChart3,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { UserProfile, UserRole } from '../backend';
import { useDemoAuthContext } from '../App';
import { ROLE_ACCESS } from '../App';

interface LayoutProps {
  children: ReactNode;
  userProfile: UserProfile;
  isDemoMode?: boolean;
}

const ALL_NAV_ITEMS = [
  {
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.admin, UserRole.management],
  },
  {
    path: '/resources',
    label: 'Resources',
    icon: Users,
    roles: [UserRole.admin, UserRole.pmo, UserRole.deliveryHead],
  },
  {
    path: '/timesheets',
    label: 'Timesheets',
    icon: Clock,
    roles: [UserRole.admin, UserRole.pm, UserRole.employee],
  },
  {
    path: '/projects',
    label: 'Projects',
    icon: FolderKanban,
    roles: [UserRole.admin, UserRole.pmo, UserRole.pm, UserRole.deliveryHead],
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: BarChart3,
    roles: [UserRole.admin, UserRole.management],
  },
];

// Human-readable role labels
const ROLE_LABELS: Record<string, string> = {
  [UserRole.admin]: 'Admin',
  [UserRole.pmo]: 'PMO',
  [UserRole.pm]: 'Manager / PM',
  [UserRole.deliveryHead]: 'Delivery Head',
  [UserRole.management]: 'Management',
  [UserRole.employee]: 'Employee',
};

export default function Layout({ children, userProfile, isDemoMode = false }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { logoutDemo } = useDemoAuthContext();

  const allowedPaths = ROLE_ACCESS[userProfile.appRole] ?? Object.values(ROLE_ACCESS).flat();
  const navItems = ALL_NAV_ITEMS.filter((item) =>
    allowedPaths.some((p) => (p === '/' ? item.path === '/' : item.path.startsWith(p)))
  );

  const handleLogout = async () => {
    if (isDemoMode) {
      logoutDemo();
      navigate({ to: '/' });
    } else {
      await clear();
      queryClient.clear();
    }
  };

  const roleLabel = ROLE_LABELS[userProfile.appRole] ?? userProfile.appRole;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 z-30 relative',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border min-h-[72px]">
          <img
            src="/assets/RL%20Logo.svg"
            alt="Relevance Lab Logo"
            className={cn(
              'flex-shrink-0 object-contain',
              sidebarOpen ? 'h-10 w-auto max-w-[160px]' : 'h-9 w-9'
            )}
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          {/* Fallback if logo fails to load */}
          <div
            className="hidden flex-shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/10"
            style={{ width: sidebarOpen ? 'auto' : '36px', height: '36px', padding: sidebarOpen ? '0 8px' : '0' }}
          >
            <span className="text-sidebar-primary font-bold text-sm">RL</span>
          </div>
          {sidebarOpen && (
            <span className="font-display font-bold text-sidebar-foreground text-sm truncate">
              TeamTrack
            </span>
          )}
        </div>

        {/* Demo mode badge */}
        {isDemoMode && sidebarOpen && (
          <div className="mx-3 mt-2 px-2 py-1 rounded-md bg-amber-100 border border-amber-300 flex items-center gap-1.5">
            <FlaskConical size={12} className="text-amber-600 flex-shrink-0" />
            <span className="text-xs font-medium text-amber-700">Demo Mode</span>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = path === '/' ? currentPath === '/' : currentPath.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                  isActive
                    ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-sidebar-primary rounded-r-full" />
                )}
                <Icon
                  size={20}
                  className={cn(
                    'flex-shrink-0',
                    isActive
                      ? 'text-sidebar-primary'
                      : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground'
                  )}
                />
                {sidebarOpen && (
                  <span className="text-sm truncate">{label}</span>
                )}
                {sidebarOpen && isActive && (
                  <ChevronRight size={14} className="ml-auto text-sidebar-primary/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-sidebar-border space-y-1">
          {sidebarOpen && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50">
              <UserCircle size={18} className="text-sidebar-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">{userProfile.name}</p>
                <p className="text-xs text-sidebar-foreground/50 truncate">{roleLabel}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-red-50 hover:text-red-600 transition-colors',
              !sidebarOpen && 'justify-center'
            )}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">{isDemoMode ? 'Exit Demo' : 'Logout'}</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="absolute top-5 -right-3 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center shadow-sm hover:bg-sidebar-accent transition-colors z-40"
        >
          {sidebarOpen ? <X size={12} /> : <Menu size={12} />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-[72px] border-b border-border bg-background/95 backdrop-blur-sm flex items-center px-6 gap-4 flex-shrink-0">
          <div className="flex-1">
            <h1 className="font-display font-bold text-foreground text-base">
              {navItems.find((n) =>
                n.path === '/' ? currentPath === '/' : currentPath.startsWith(n.path)
              )?.label ?? 'TeamTrack'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-300 font-medium">
                Demo
              </span>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
              <UserCircle size={16} className="text-sidebar-primary" />
              <span className="text-sm font-medium text-foreground">{userProfile.name}</span>
              <span className="text-xs text-muted-foreground">· {roleLabel}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-background/80 px-6 py-3 flex items-center justify-between text-xs text-muted-foreground flex-shrink-0">
          <span>© {new Date().getFullYear()} TeamTrack · Relevance Lab</span>
          <span className="flex items-center gap-1">
            Built with <span className="text-red-500">♥</span> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'teamtrack-rmg')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sidebar-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}
