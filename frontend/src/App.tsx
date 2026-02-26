import {
  RouterProvider,
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  useRouterState,
  useNavigate,
} from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ResourcesPage from './pages/ResourcesPage';
import ProjectsPage from './pages/ProjectsPage';
import TimesheetsPage from './pages/TimesheetsPage';
import ReportsPage from './pages/ReportsPage';
import AccessDeniedScreen from './components/AccessDeniedScreen';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { UserRole, UserProfile } from './backend';
import { useDemoAuth } from './hooks/useDemoAuth';
import { Loader2 } from 'lucide-react';

// ─── Demo Auth Context ────────────────────────────────────────────────────────
interface DemoAuthContextValue {
  isDemoMode: boolean;
  demoProfile: UserProfile | null;
  loginAsDemo: (role: UserRole) => void;
  logoutDemo: () => void;
}

export const DemoAuthContext = createContext<DemoAuthContextValue>({
  isDemoMode: false,
  demoProfile: null,
  loginAsDemo: () => {},
  logoutDemo: () => {},
});

export function useDemoAuthContext() {
  return useContext(DemoAuthContext);
}

// ─── Role Access Config ───────────────────────────────────────────────────────
export const ROLE_ACCESS: Record<UserRole, string[]> = {
  [UserRole.admin]: ['/dashboard', '/resources', '/projects', '/timesheets', '/reports'],
  [UserRole.pmo]: ['/dashboard', '/resources', '/projects', '/timesheets', '/reports'],
  [UserRole.pm]: ['/dashboard', '/resources', '/projects', '/timesheets'],
  [UserRole.deliveryHead]: ['/dashboard', '/resources', '/projects', '/timesheets', '/reports'],
  [UserRole.management]: ['/dashboard', '/reports'],
  [UserRole.employee]: ['/dashboard', '/timesheets'],
};

export function getDefaultRoute(role: UserRole): string {
  return ROLE_ACCESS[role]?.[0] ?? '/dashboard';
}

// ─── Global Loading Bar ───────────────────────────────────────────────────────
function GlobalLoadingBar() {
  const routerState = useRouterState();
  const isLoading = routerState.status === 'pending';

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-primary/20 overflow-hidden">
      <div className="h-full bg-primary animate-[loading-bar_1.5s_ease-in-out_infinite]" />
    </div>
  );
}

// ─── Route Guard ─────────────────────────────────────────────────────────────
function RouteGuard({ path, children }: { path: string; children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const { isDemoMode, demoProfile } = useDemoAuthContext();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();

  const isAuthenticated = !!identity || isDemoMode;
  const activeProfile = isDemoMode ? demoProfile : userProfile;
  const isProfileLoading = isDemoMode ? false : isInitializing || profileLoading;

  if (!isAuthenticated && !isInitializing) {
    return null;
  }

  if (isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeProfile) return null;

  const allowedPaths = ROLE_ACCESS[activeProfile.appRole] ?? [];
  if (!allowedPaths.includes(path)) {
    return (
      <AccessDeniedScreen
        role={activeProfile.appRole}
        defaultRoute={getDefaultRoute(activeProfile.appRole)}
      />
    );
  }

  return <>{children}</>;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
function RootLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isDemoMode, demoProfile } = useDemoAuthContext();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity || isDemoMode;
  const activeProfile = isDemoMode ? demoProfile : userProfile;
  const isProfileLoading = isDemoMode ? false : isInitializing || profileLoading;
  const isProfileFetched = isDemoMode ? true : isFetched;

  const showProfileSetup =
    isAuthenticated &&
    !isProfileLoading &&
    isProfileFetched &&
    !isDemoMode &&
    userProfile === null;

  if (isInitializing && !isDemoMode) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (showProfileSetup) {
    return <LoginPage initialShowProfileSetup />;
  }

  if (!activeProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <GlobalLoadingBar />
      <Layout userProfile={activeProfile}>
        <Outlet />
      </Layout>
    </>
  );
}

// ─── Index Redirect ───────────────────────────────────────────────────────────
function IndexRedirect() {
  const { identity } = useInternetIdentity();
  const { isDemoMode, demoProfile } = useDemoAuthContext();
  const { data: userProfile } = useGetCallerUserProfile();
  const navigate = useNavigate();

  const activeProfile = isDemoMode ? demoProfile : userProfile;

  useEffect(() => {
    if (!identity && !isDemoMode) return;
    const role = activeProfile?.appRole;
    if (!role) return;
    const defaultPath = getDefaultRoute(role);
    navigate({ to: defaultPath, replace: true });
  }, [identity, isDemoMode, activeProfile, navigate]);

  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

// ─── Route Components ─────────────────────────────────────────────────────────
function DashboardRoute() {
  return (
    <RouteGuard path="/dashboard">
      <DashboardPage />
    </RouteGuard>
  );
}

function ResourcesRoute() {
  return (
    <RouteGuard path="/resources">
      <ResourcesPage />
    </RouteGuard>
  );
}

function ProjectsRoute() {
  return (
    <RouteGuard path="/projects">
      <ProjectsPage />
    </RouteGuard>
  );
}

function TimesheetsRoute() {
  return (
    <RouteGuard path="/timesheets">
      <TimesheetsPage />
    </RouteGuard>
  );
}

function ReportsRoute() {
  return (
    <RouteGuard path="/reports">
      <ReportsPage />
    </RouteGuard>
  );
}

// ─── Router Setup ─────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRedirect,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardRoute,
});

const resourcesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/resources',
  component: ResourcesRoute,
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/projects',
  component: ProjectsRoute,
});

const timesheetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/timesheets',
  component: TimesheetsRoute,
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsRoute,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  resourcesRoute,
  projectsRoute,
  timesheetsRoute,
  reportsRoute,
]);

const router = createRouter({ routeTree });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const demoAuth = useDemoAuth();

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <DemoAuthContext.Provider value={demoAuth}>
          <RouterProvider router={router} />
          <Toaster richColors position="top-right" />
        </DemoAuthContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
