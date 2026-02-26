import { useNavigate } from '@tanstack/react-router';
import { ShieldX, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useDemoAuthContext } from '../App';
import { UserRole } from '../backend';

interface AccessDeniedScreenProps {
  role: string;
  defaultRoute: string;
}

const ROLE_LABELS: Record<string, string> = {
  [UserRole.admin]: 'Admin',
  [UserRole.pmo]: 'PMO',
  [UserRole.pm]: 'Manager / PM',
  [UserRole.deliveryHead]: 'Delivery Head',
  [UserRole.management]: 'Management',
  [UserRole.employee]: 'Employee',
};

export default function AccessDeniedScreen({ role, defaultRoute }: AccessDeniedScreenProps) {
  const navigate = useNavigate();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { isDemoMode, logoutDemo } = useDemoAuthContext();

  const handleGoBack = () => {
    navigate({ to: defaultRoute as '/' });
  };

  const handleLogout = async () => {
    if (isDemoMode) {
      logoutDemo();
      navigate({ to: '/' });
    } else {
      await clear();
      queryClient.clear();
    }
  };

  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <ShieldX size={32} className="text-destructive" />
      </div>
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">Access Denied</h2>
      <p className="text-muted-foreground text-sm max-w-sm mb-1">
        You don't have permission to view this page.
      </p>
      {role && (
        <p className="text-xs text-muted-foreground mb-6">
          Your current role:{' '}
          <span className="font-semibold text-foreground">{roleLabel}</span>
        </p>
      )}
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleGoBack} className="gap-2">
          <ArrowLeft size={16} />
          Go to My Dashboard
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="gap-2 text-muted-foreground hover:text-destructive"
        >
          <LogOut size={16} />
          {isDemoMode ? 'Exit Demo' : 'Logout'}
        </Button>
      </div>
    </div>
  );
}
