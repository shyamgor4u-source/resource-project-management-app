import { useState } from 'react';
import { BarChart3, Settings, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetPowerBIEmbedUrl } from '@/hooks/useQueries';
import { useGetCallerUserProfile } from '@/hooks/useQueries';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import PowerBIConfigModal from '@/components/PowerBIConfigModal';
import AccessDeniedScreen from '@/components/AccessDeniedScreen';
import { UserRole } from '../backend';
import { useDemoAuthContext } from '../App';
import { getDefaultRoute } from '../App';

const ALLOWED_ROLES: UserRole[] = [UserRole.admin, UserRole.management];
const ADMIN_ROLES: UserRole[] = [UserRole.admin];

export default function ReportsPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: embedUrl, isLoading: urlLoading, refetch } = useGetPowerBIEmbedUrl();
  const [configOpen, setConfigOpen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const { isDemoMode, demoProfile } = useDemoAuthContext();
  const activeProfile = isDemoMode ? demoProfile : userProfile;

  if (!isDemoMode && !identity) return null;

  if (!isDemoMode && profileLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-sidebar-primary" />
      </div>
    );
  }

  const role = activeProfile?.appRole;

  if (!role || !ALLOWED_ROLES.includes(role)) {
    return (
      <AccessDeniedScreen
        role={role ?? ''}
        defaultRoute={role ? getDefaultRoute(role) : '/dashboard'}
      />
    );
  }

  const isAdmin = ADMIN_ROLES.includes(role);

  const handleRefresh = () => {
    setIframeKey((k) => k + 1);
    refetch();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary/10 flex items-center justify-center">
            <BarChart3 size={20} className="text-sidebar-primary" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Reports</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Power BI embedded analytics dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2 text-muted-foreground"
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfigOpen(true)}
              className="gap-2"
            >
              <Settings size={14} />
              Configure
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {urlLoading ? (
        <Skeleton className="h-[600px] rounded-xl" />
      ) : embedUrl ? (
        <div className="rounded-xl overflow-hidden border border-border shadow-sm">
          <iframe
            key={iframeKey}
            src={embedUrl}
            className="w-full h-[600px]"
            title="Power BI Report"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            No Report Configured
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            {isAdmin
              ? 'Configure a Power BI embed URL to display your analytics dashboard here.'
              : 'The analytics dashboard has not been configured yet. Please contact your administrator.'}
          </p>
          {isAdmin && (
            <Button onClick={() => setConfigOpen(true)} className="gap-2">
              <Settings size={14} />
              Configure Power BI URL
            </Button>
          )}
        </div>
      )}

      {isAdmin && (
        <PowerBIConfigModal
          open={configOpen}
          onClose={() => setConfigOpen(false)}
          currentUrl={embedUrl ?? null}
        />
      )}
    </div>
  );
}
